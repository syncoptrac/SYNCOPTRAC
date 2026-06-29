// ============================================================================
// Monthly website-service billing automation
// ----------------------------------------------------------------------------
// At the start of every month, each active institute is emailed an automated
// reminder of the amount (planAmount) they owe for the SYNCOPTRAC website
// service. Sends are recorded in BillingLog and are idempotent per month.
// ============================================================================
const nodemailer = require('nodemailer');
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

// Friendly due date = 7th of the billing month, formatted in IST.
function dueDateLabel(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).format(date || new Date()).split('-');
  const due = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 7));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }).format(due);
}

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
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
// Idempotent: skips any institute already logged for the given monthKey.
// Returns a summary object.
async function sendMonthlyBills(options) {
  const opts = options || {};
  const trigger = opts.trigger || 'scheduled';
  const now = opts.now || new Date();
  const { key: monthKey, label: monthLabel } = monthInfo(now);
  const due = dueDateLabel(now);

  const transporter = getTransporter();
  const summary = { monthKey, monthLabel, trigger, total: 0, sent: 0, skipped: 0, failed: 0, results: [] };

  if (!transporter) {
    console.warn('[billing] SMTP env vars not set \u2014 skipping monthly billing emails.');
    summary.error = 'SMTP not configured';
    return summary;
  }

  const institutes = await Institute.find({ isActive: true });
  summary.total = institutes.length;

  for (const inst of institutes) {
    // Idempotency guard \u2014 already billed this month?
    const already = await BillingLog.findOne({ institute: inst._id, monthKey });
    if (already) {
      summary.skipped += 1;
      summary.results.push({ institute: inst.instituteName, status: 'skipped' });
      continue;
    }
    if (!inst.email) {
      summary.skipped += 1;
      summary.results.push({ institute: inst.instituteName, status: 'skipped', reason: 'no email' });
      continue;
    }

    const { subject, html } = buildEmail(inst, monthLabel, due);
    try {
      await transporter.sendMail({
        from: `"SYNCOPTRAC Billing" <${process.env.SMTP_USER}>`,
        to: inst.email,
        subject,
        html,
      });
      await BillingLog.create({
        institute: inst._id,
        instituteName: inst.instituteName,
        email: inst.email,
        monthKey, monthLabel,
        amount: inst.planAmount,
        status: 'sent',
        trigger,
      });
      summary.sent += 1;
      summary.results.push({ institute: inst.instituteName, status: 'sent' });
    } catch (err) {
      summary.failed += 1;
      summary.results.push({ institute: inst.instituteName, status: 'failed', reason: err.message });
      // Record failure (best-effort) without breaking idempotency for retries.
      try {
        await BillingLog.create({
          institute: inst._id,
          instituteName: inst.instituteName,
          email: inst.email,
          monthKey, monthLabel,
          amount: inst.planAmount,
          status: 'failed',
          error: err.message,
          trigger,
        });
      } catch (_) { /* duplicate key on retry \u2014 ignore */ }
      console.error(`[billing] Failed to email ${inst.instituteName}:`, err.message);
    }
  }

  console.log(`[billing] ${monthLabel} (${trigger}) \u2014 sent ${summary.sent}, skipped ${summary.skipped}, failed ${summary.failed} of ${summary.total}.`);
  return summary;
}

module.exports = { sendMonthlyBills, monthInfo };
