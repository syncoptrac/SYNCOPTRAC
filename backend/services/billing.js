// ============================================================================
// Monthly website-service billing automation
// ----------------------------------------------------------------------------
// At the start of every month, each active institute is emailed an automated
// reminder of the amount (planAmount) they owe for the SYNCOPTRAC website
// service. Sends are recorded in BillingLog and are idempotent per month.
// Email is sent via the Brevo HTTP API (port 443) so it works on hosts that
// block outbound SMTP (e.g. Render).
// ============================================================================
const https = require('https');
const Institute = require('../models/Institute');
const BillingLog = require('../models/BillingLog');

const TZ = 'Asia/Kolkata';

// Returns { key: 'YYYY-MM', label: 'Month YYYY' } for a date, in IST.
function monthInfo(date) {
  const d = date || new Date();
  const key = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).format(d).slice(0, 7); // en-CA gives YYYY-MM-DD
  const label = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ, month: 'long', year: 'numeric',
  }).format(d);
  return { key, label };
}

function inr(n) {
  return Number(n || 0).toLocaleString('en-IN');
}

// Friendly due date = the institute's billing day of the billing month, in IST.
// The day is clamped to the last day of the month for short months.
function dueDateLabel(date, day) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).format(date || new Date()).split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]); // 1-12
  const lastDay = new Date(year, month, 0).getDate();
  const d = Math.min(Math.max(Number(day) || 1, 1), lastDay);
  const due = new Date(Date.UTC(year, month - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }).format(due);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// True when the HTTP email provider (Brevo) is configured.
function emailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

// Low-level HTTPS JSON POST over port 443 — works on hosts (like Render) that
// block outbound SMTP. Rejects on non-2xx responses.
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

// Sends one email through the Brevo HTTP API.
async function sendEmail(mail) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'SYNCOPTRAC Billing';
  return postJson(
    'api.brevo.com',
    '/v3/smtp/email',
    {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
    }
  );
}

// Retries a send so a transient network hiccup doesn't fail it outright.
async function sendWithRetry(mail, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await sendEmail(mail);
    } catch (err) {
      lastErr = err;
      console.warn(`[billing] send attempt ${i}/${attempts} failed: ${err.message}`);
      if (i < attempts) await sleep(3000 * i);
    }
  }
  throw lastErr;
}

function buildEmail(institute, monthLabel, due) {
  const amount = inr(institute.planAmount);
  const subject = `Website Service Invoice \u2013 ${monthLabel}`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:14px;overflow:hidden;background:#fff">
    <div style="background:linear-gradient(135deg,#11245d,#1c2f6e);padding:28px 24px;text-align:center">
      <h2 style="color:#5ce1e6;margin:0;letter-spacing:1px">SYNCOPTRAC</h2>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">Monthly Service Invoice</p>
    </div>
    <div style="padding:28px 24px;color:#0f172a">
      <p style="font-size:15px;margin:0 0 14px">Dear ${institute.ownerName || institute.instituteName},</p>
      <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 20px">
        This is a friendly reminder for the <strong>${monthLabel}</strong> subscription of your
        <strong>SYNCOPTRAC</strong> website &amp; management service for
        <strong>${institute.instituteName}</strong>.
      </p>
      <div style="background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:20px;margin:0 0 20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:6px 0;color:#64748b">Billing Period</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${monthLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b">Due By</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${due}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;color:#64748b;border-top:1px solid #e2e8f0">Amount Payable</td>
            <td style="padding:12px 0 0;text-align:right;border-top:1px solid #e2e8f0">
              <span style="font-size:22px;font-weight:800;color:#059669">\u20b9${amount}</span>
            </td>
          </tr>
        </table>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 18px">
        Kindly arrange the payment by the due date to ensure uninterrupted access to your dashboard,
        student management, attendance, fees and enquiry tools. If you have already paid, please ignore this message.
      </p>
      <p style="font-size:13px;color:#94a3b8;margin:0">
        For any billing questions, simply reply to this email and our team will be happy to help.
      </p>
    </div>
    <div style="background:#0a1330;padding:16px 24px;text-align:center">
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">\u00a9 ${new Date().getFullYear()} SYNCOPTRAC \u2014 Coaching Centre Management</p>
    </div>
  </div>`;
  return { subject, html };
}

// Core routine. Emails every active institute its monthly service fee.
// Idempotent: skips any institute already SUCCESSFULLY billed for the monthKey.
// Returns a summary object.
async function sendMonthlyBills(options) {
  const opts = options || {};
  const trigger = opts.trigger || 'scheduled';
  const now = opts.now || new Date();
  const { key: monthKey, label: monthLabel } = monthInfo(now);

  const summary = { monthKey, monthLabel, trigger, total: 0, sent: 0, skipped: 0, failed: 0, results: [] };

  if (!emailConfigured()) {
    console.warn('[billing] BREVO_API_KEY not set \u2014 skipping monthly billing emails.');
    summary.error = 'Email provider not configured';
    return summary;
  }

  const institutes = await Institute.find({ isActive: true });

  // Determine "today" in IST and this month's last calendar day.
  const istYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now).split('-').map(Number); // [YYYY, MM, DD]
  const todayDay = istYmd[2];
  const lastDayOfMonth = new Date(istYmd[0], istYmd[1], 0).getDate();

  // Bill only institutes whose configured billing day is today. Last-day safety:
  // a day-29/30/31 institute still bills on the final day of a shorter month.
  const dueInstitutes = institutes.filter((inst) => {
    const day = Math.min(Math.max(Number(inst.billingDay) || 1, 1), 31);
    return day === todayDay || (todayDay === lastDayOfMonth && day > lastDayOfMonth);
  });

  summary.total = dueInstitutes.length;

  for (const inst of dueInstitutes) {
    // Idempotency guard: only a SUCCESSFUL prior send blocks a re-send.
    // A previous FAILED attempt should be retried, not skipped.
    const already = await BillingLog.findOne({ institute: inst._id, monthKey });
    if (already && already.status === 'sent') {
      summary.skipped += 1;
      summary.results.push({ institute: inst.instituteName, status: 'skipped', reason: 'already billed' });
      continue;
    }
    if (!inst.email) {
      summary.skipped += 1;
      summary.results.push({ institute: inst.instituteName, status: 'skipped', reason: 'no email' });
      continue;
    }

    const instituteDay = Math.min(Math.max(Number(inst.billingDay) || 1, 1), 31);
    const due = dueDateLabel(now, instituteDay);
    const { subject, html } = buildEmail(inst, monthLabel, due);
    try {
      await sendWithRetry({
        to: inst.email,
        subject,
        html,
      });
      // Upsert so a previously failed attempt for this month is overwritten.
      await BillingLog.findOneAndUpdate(
        { institute: inst._id, monthKey },
        {
          institute: inst._id,
          instituteName: inst.instituteName,
          email: inst.email,
          monthKey, monthLabel,
          amount: inst.planAmount,
          status: 'sent',
          error: null,
          trigger,
          sentAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      summary.sent += 1;
      summary.results.push({ institute: inst.instituteName, status: 'sent' });
    } catch (err) {
      summary.failed += 1;
      summary.results.push({ institute: inst.instituteName, status: 'failed', reason: err.message });
      // Record the failure via upsert so a later successful retry can overwrite it.
      await BillingLog.findOneAndUpdate(
        { institute: inst._id, monthKey },
        {
          institute: inst._id,
          instituteName: inst.instituteName,
          email: inst.email,
          monthKey, monthLabel,
          amount: inst.planAmount,
          status: 'failed',
          error: err.message,
          trigger,
          sentAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.error(`[billing] Failed to email ${inst.instituteName}:`, err.message);
    }
  }

  console.log(`[billing] ${monthLabel} (${trigger}) \u2014 sent ${summary.sent}, skipped ${summary.skipped}, failed ${summary.failed} of ${summary.total}.`);
  return summary;
}

module.exports = { sendMonthlyBills, monthInfo };