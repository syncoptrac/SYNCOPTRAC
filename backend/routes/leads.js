const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const https = require('https');
const Lead = require('../models/Lead');
const { requireAdmin } = require('../middleware/auth');

// ─── Helper: HTTPS JSON POST over port 443 (works where SMTP is blocked) ─────
function postJson(hostname, path, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bodyObj);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: Object.assign({ 'Content-Length': Buffer.byteLength(data) }, headers),
        timeout: 30000,
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => { chunks += c; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: chunks });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

// SECURITY: lead fields are attacker-controlled (public form) and were
// interpolated raw into the notification email's HTML. Escaping prevents markup
// or script from being injected into the admin's inbox.
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// ─── Helper: send new-lead notification via Brevo HTTP API ───────────────
async function sendLeadEmail(lead) {
  if (!process.env.BREVO_API_KEY || !process.env.ADMIN_EMAIL) {
    console.warn('Email env vars not set (BREVO_API_KEY / ADMIN_EMAIL) — skipping notification email.');
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'SYNCOPTRAC';
  const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:#11245d;padding:24px;text-align:center">
          <h2 style="color:#5ce1e6;margin:0">SYNCOPTRAC</h2>
          <p style="color:#aaa;margin:4px 0 0;font-size:13px">New Enquiry Received</p>
        </div>
        <div style="padding:24px">
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600;width:40%">Institute Name</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.instituteName)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Owner Name</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.ownerName)}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Phone</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.phone)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Email</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.email)}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Institute Type</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.instituteType || 'Not specified')}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Number of Students</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.numberOfStudents || 'Not specified')}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Message</td>
              <td style="padding:10px 12px;border:1px solid #eee">${esc(lead.message || 'None')}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Submitted At</td>
              <td style="padding:10px 12px;border:1px solid #eee">${new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
            </tr>
          </table>
        </div>
      </div>
    `;

  await postJson(
    'api.brevo.com',
    '/v3/smtp/email',
    {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: process.env.ADMIN_EMAIL }],
      replyTo: { email: lead.email, name: lead.ownerName },
      subject: `New Lead: ${lead.instituteName}`,
      htmlContent: html,
    }
  );
}

// ─── Applicant confirmation email ────────────────────────────────────────
// Sent to the address submitted in the Get Started form, only AFTER the lead
// has been persisted. Reuses the Brevo HTTP API and the postJson()/esc()
// helpers already defined above, so this adds no provider, no dependency and
// no new environment variable.

// A repeat submission of the same address inside this window (double-click,
// client retry after the frontend's 15s abort, duplicate API call) reuses the
// first confirmation instead of sending a second one.
const CONFIRM_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

// Defence in depth. express-validator has already run isEmail() +
// normalizeEmail() on this address; this also refuses CR/LF and the quoting
// characters used for header injection before anything reaches the provider.
const SAFE_EMAIL = /^[^\s@<>",;:\\]+@[^\s@<>",;:\\]+\.[^\s@<>",;:\\]{2,}$/;

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Collapse CR/LF and control characters out of attacker-controlled free text.
// Brevo takes JSON rather than raw SMTP headers, so header injection is already
// unreachable, but the display name is still user-supplied. Angle brackets are
// dropped too: they are the RFC 5322 address delimiter, and no real name
// contains them, so removing them costs nothing and prevents a submitted name
// from rendering as an address in a mail client.
function oneLine(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\r\n\t\u0000-\u001f\u007f<>]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max || 120);
}

// Records the outcome without ever throwing — status bookkeeping must not be
// able to affect the lead or the HTTP response.
async function markConfirmation(id, status, sentAt) {
  try {
    const set = { confirmationStatus: status };
    if (sentAt) set.confirmationSentAt = sentAt;
    await Lead.findByIdAndUpdate(id, { $set: set });
  } catch (err) {
    console.error('Could not record confirmation status:', err.message);
  }
}

function confirmationContent(lead) {
  const name = oneLine(lead.ownerName, 80);
  const greeting = name ? 'Hi ' + name + ',' : 'Hello,';
  const institute = oneLine(lead.instituteName, 100);

  const text = [
    greeting,
    '',
    'Thank you for your interest in Syncoptrac.',
    '',
    'We have successfully received your request and your details have been',
    'submitted to our team.',
    '',
    'Our team will review your request and get in touch with you shortly.',
    '',
    'Regards,',
    'Syncoptrac Team',
    '',
    '---',
    'This is an automated confirmation that your request was received.',
    'No action is needed from your side.',
  ].join('\n');

  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>We received your request</title></head>' +
    '<body style="margin:0;padding:0;background:#f4f6fb;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' +
    'We have received your request and our team will be in touch shortly.</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="background:#f4f6fb;padding:24px 12px;"><tr><td align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="600" ' +
    'style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;' +
    'overflow:hidden;border:1px solid #e5e7eb;font-family:' + FONT_STACK + ';">' +
    '<tr><td style="background:#11245d;padding:28px 24px;text-align:center;">' +
    '<div style="color:#5ce1e6;font-size:22px;font-weight:700;letter-spacing:0.14em;">' +
    'SYNCOPTRAC</div>' +
    '<div style="color:rgba(255,255,255,0.72);font-size:13px;margin-top:6px;">' +
    'Request received</div></td></tr>' +
    '<tr><td style="padding:32px 28px 8px;">' +
    '<p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:#111827;">' +
    esc(greeting) + '</p>' +
    '<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">' +
    'Thank you for your interest in Syncoptrac.</p>' +
    '<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">' +
    'We have successfully received your request and your details have been ' +
    'submitted to our team.</p>' +
    '<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#374151;">' +
    'Our team will review your request and get in touch with you shortly.</p>' +
    (institute
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
        'style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;' +
        'margin:0 0 22px;"><tr><td style="padding:14px 16px;">' +
        '<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;' +
        'color:#6b7280;margin-bottom:4px;">Submitted for</div>' +
        '<div style="font-size:15px;font-weight:600;color:#111827;">' +
        esc(institute) + '</div></td></tr></table>'
      : '') +
    '<p style="margin:0 0 4px;font-size:15px;line-height:1.65;color:#374151;">' +
    'Regards,<br><strong style="color:#11245d;">Syncoptrac Team</strong></p>' +
    '</td></tr>' +
    '<tr><td style="padding:20px 28px 26px;">' +
    '<div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;' +
    'line-height:1.6;color:#6b7280;">' +
    'This is an automated confirmation that your request was received. ' +
    'No action is needed from your side.</div></td></tr>' +
    '</table></td></tr></table></body></html>';

  return { subject: 'We received your request — Syncoptrac', text: text, html: html };
}

async function sendLeadConfirmationEmail(lead) {
  const email = String(lead.email == null ? '' : lead.email).trim();

  // Rule: only attempt when the submitted address is valid.
  if (email.length > 254 || !SAFE_EMAIL.test(email)) {
    await markConfirmation(lead._id, 'skipped');
    return;
  }

  // Sender identity comes from the server environment ONLY — never from the
  // request body. Same resolution order as the admin notification above.
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'Syncoptrac';
  if (!process.env.BREVO_API_KEY || !senderEmail) {
    console.warn(
      'Confirmation email skipped — BREVO_API_KEY / sender address not configured.'
    );
    return; // deliberately unclaimed: nothing was attempted
  }

  // Step 1 — atomic exactly-once claim on THIS lead. A conditional
  // single-document update is atomic in MongoDB, so if two attempts ever race
  // for the same lead (client retry, duplicate request, two server instances)
  // exactly one of them matches { confirmationSentAt: null } and proceeds.
  const claimAt = new Date();
  const claimed = await Lead.findOneAndUpdate(
    { _id: lead._id, confirmationSentAt: null },
    { $set: { confirmationSentAt: claimAt, confirmationStatus: 'sent' } }
  );
  if (!claimed) return;

  // Step 2 — arbitrate against OTHER leads carrying the same address.
  //
  // Two concurrent submissions produce two different lead documents, so the
  // per-lead claim above cannot deduplicate them on its own. Claiming BEFORE
  // reading is what makes this safe: this lead's claim is already durable, so
  // any competitor either sees it or was itself claimed first. Both sides then
  // apply the same total order (earliest claim wins, _id breaks exact ties),
  // so exactly one competitor concludes it is the winner and sends.
  const competitors = await Lead.find({
    _id: { $ne: lead._id },
    email: email,
    confirmationStatus: 'sent',
    confirmationSentAt: {
      $gte: new Date(claimAt.getTime() - CONFIRM_DEDUPE_WINDOW_MS),
      $lte: claimAt,
    },
  })
    .select('_id confirmationSentAt')
    .lean();

  const mine = String(lead._id);
  const lost = competitors.some(function (c) {
    const t = new Date(c.confirmationSentAt).getTime();
    if (t < claimAt.getTime()) return true;
    return t === claimAt.getTime() && String(c._id) < mine;
  });
  if (lost) {
    await markConfirmation(lead._id, 'suppressed_duplicate');
    console.warn('Duplicate lead submission — confirmation email already sent for this address.');
    return;
  }

  const content = confirmationContent(lead);

  try {
    await postJson(
      'api.brevo.com',
      '/v3/smtp/email',
      {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      {
        sender: { name: oneLine(senderName, 60), email: senderEmail },
        to: [{ email: email, name: oneLine(lead.ownerName, 80) || undefined }],
        replyTo: { email: process.env.ADMIN_EMAIL || senderEmail },
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.text,
        tags: ['lead-confirmation'],
      }
    );
  } catch (err) {
    await markConfirmation(lead._id, 'failed');
    throw err; // logged by the caller; the lead stays saved
  }
}

// ─── POST /api/leads — Submit enquiry (public) ───────────────────────────
router.post('/', [
  body('instituteName').trim().notEmpty().withMessage('Institute name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    // 1. Save to MongoDB FIRST — always works
    // The confirmation-tracking fields are server-owned: strip them from the
    // public payload so a crafted request cannot pre-set or suppress its own
    // confirmation state. Every pre-existing lead field keeps its behaviour.
    const payload = Object.assign({}, req.body);
    delete payload.confirmationSentAt;
    delete payload.confirmationStatus;

    const lead = new Lead(payload);
    await lead.save();

    // 2. Send email in background — failure NEVER breaks the response
    sendLeadEmail(lead).catch(err =>
      console.error('Email notification failed (lead still saved):', err.message)
    );

    // 2b. Confirmation to the applicant — independent failure domain, also
    // fire-and-forget. The lead is already persisted here, so a provider
    // outage can never turn a saved lead into a failed submission.
    sendLeadConfirmationEmail(lead).catch(err =>
      console.error('Lead confirmation email failed (lead still saved):', err.message)
    );

    // 3. Always return success
    res.status(201).json({ message: 'Enquiry submitted successfully! We will contact you soon.' });
  } catch (err) {
    console.error('Lead save error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── GET /api/leads — Get all leads (admin) ────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/leads/:id — Update lead status (admin) ───────────────
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/leads/:id — Delete lead (admin) ─────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;