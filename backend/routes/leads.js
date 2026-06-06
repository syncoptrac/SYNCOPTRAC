const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const { requireAdmin } = require('../middleware/auth');

// ─── Helper: send notification email ─────────────────────────────────────────
async function sendLeadEmail(lead) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
    console.warn('Email env vars not set — skipping notification email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  await transporter.sendMail({
    from: `"SYNCOPTRAC" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Lead: ${lead.instituteName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:#11245d;padding:24px;text-align:center">
          <h2 style="color:#5ce1e6;margin:0">SYNCOPTRAC</h2>
          <p style="color:#aaa;margin:4px 0 0;font-size:13px">New Enquiry Received</p>
        </div>
        <div style="padding:24px">
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600;width:40%">Institute Name</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.instituteName}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Owner Name</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.ownerName}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Phone</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.phone}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Email</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.email}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Institute Type</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.instituteType || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Number of Students</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.numberOfStudents || 'Not specified'}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Message</td>
              <td style="padding:10px 12px;border:1px solid #eee">${lead.message || 'None'}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eee;font-weight:600">Submitted At</td>
              <td style="padding:10px 12px;border:1px solid #eee">${new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
            </tr>
          </table>
          <div style="margin-top:20px;text-align:center">
            <a href="${process.env.FRONTEND_URL}/admin/leads"
              style="background:#5ce1e6;color:#11245d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
              View in Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  });
}

// ─── POST /api/leads — Submit enquiry (public) ────────────────────────────────
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
    const lead = new Lead(req.body);
    await lead.save();

    // 2. Send email in background — failure NEVER breaks the response
    sendLeadEmail(lead).catch(err =>
      console.error('Email notification failed (lead still saved):', err.message)
    );

    // 3. Always return success
    res.status(201).json({ message: 'Enquiry submitted successfully! We will contact you soon.' });
  } catch (err) {
    console.error('Lead save error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── GET /api/leads — Get all leads (admin) ───────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/leads/:id — Update lead status (admin) ───────────────────────
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/leads/:id — Delete lead (admin) ─────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;