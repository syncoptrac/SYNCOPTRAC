const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const Institute = require('../models/Institute');
const Lead = require('../models/Lead');
const Admin = require('../models/Admin');
const BillingLog = require('../models/BillingLog');
const { sendMonthlyBills } = require('../services/billing');

// ─── SHORT-LIVED AGGREGATE CACHE ─────────────────────────────────────────────
// PERF: the admin dashboard recomputed the same totals from a full collection
// scan on every load, and the page also requests the whole institute list in
// parallel - two scans per visit. Results are memoised briefly, and ANY admin
// write clears the cache immediately, so the UI never shows stale data after a
// change.
const adminCache = new Map();
const ADMIN_CACHE_TTL = 15 * 1000;

async function memo(key, producer) {
  const hit = adminCache.get(key);
  if (hit && Date.now() - hit.ts < ADMIN_CACHE_TTL) return hit.value;
  const value = await producer();
  adminCache.set(key, { value, ts: Date.now() });
  return value;
}

router.use((req, res, next) => {
  if (req.method !== 'GET') adminCache.clear();
  next();
});

// Generate unique login ID
function generateLoginId(instituteName) {
  const prefix = instituteName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

// Generate random password
function generatePassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// GET /api/admin/revenue?month=2026-06
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    let start, end;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end   = new Date(y, m, 1);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    // PERF: .lean() skips Mongoose document hydration - plain objects only.
    const institutes = await Institute.find({
      paymentStatus: 'paid',
      updatedAt: { $gte: start, $lt: end },
    }, 'planAmount').lean();
    const revenue = institutes.reduce((s, i) => s + (i.planAmount || 0), 0);
    res.json({ revenue, paidCount: institutes.length, month });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalInstitutes, activeInstitutes, institutes, newLeads, newInstitutesThisMonth] =
      await memo('dashboard', () => Promise.all([
        Institute.countDocuments(),
        Institute.countDocuments({ isActive: true }),
        // PERF: .lean() avoids hydrating every institute into a Mongoose doc.
        Institute.find({}, 'planAmount paymentStatus createdAt').lean(),
        Lead.countDocuments({ status: 'new' }),
        Institute.countDocuments({ createdAt: { $gte: startOfMonth } })
      ]));

    const monthlyRevenue = institutes
      .filter(i => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + (i.planAmount || 0), 0);

    const overduePayments = institutes
      .filter(i => i.paymentStatus === 'overdue')
      .reduce((sum, i) => sum + (i.planAmount || 0), 0);

    // Total lifetime revenue = all institutes that have ever paid (planAmount sum of all paid ones)
    const totalRevenue = institutes.reduce((sum, i) => sum + (i.planAmount || 0), 0);

    res.json({
      totalInstitutes,
      activeInstitutes,
      newLeads,
      monthlyRevenue,
      overduePayments,
      totalRevenue,
      newInstitutesThisMonth,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/institutes
router.get('/institutes', requireAdmin, async (req, res) => {
  try {
    const institutes = await memo('institutes', () =>
      Institute.find().select('-password').sort({ createdAt: -1 }).lean()
    );
    res.json(institutes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/institutes - Create institute
router.post('/institutes', requireAdmin, [
  body('instituteName').trim().notEmpty(),
  body('ownerName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty(),
  body('googleSheetId').trim().notEmpty(),
  body('appsScriptUrl').trim().notEmpty(),
  body('planAmount').isNumeric(),
  body('billingDay').optional().isInt({ min: 1, max: 31 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const {
      instituteName, ownerName, email, phone, instituteType,
      googleSheetId, appsScriptUrl, planAmount, paymentStatus, dueDate, billingDay
    } = req.body;

    // Check duplicate email
    const existing = await Institute.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // Generate login ID
    let loginId = generateLoginId(instituteName);
    while (await Institute.findOne({ loginId })) {
      loginId = generateLoginId(instituteName);
    }
    // Use admin-provided password if given, otherwise auto-generate
    const rawPassword = (req.body.password && req.body.password.trim().length >= 6)
      ? req.body.password.trim()
      : generatePassword();

    const institute = new Institute({
      instituteName, ownerName, email, phone,
      instituteType: instituteType || 'Coaching Centre',
      loginId,
      password: rawPassword, // Will be hashed by pre-save hook
      googleSheetId,
      appsScriptUrl,
      planAmount: parseFloat(planAmount),
      paymentStatus: paymentStatus || 'overdue',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      billingDay: billingDay ? Math.min(Math.max(parseInt(billingDay, 10), 1), 31) : 1
    });

    await institute.save();

    res.status(201).json({
      message: 'Institute created successfully',
      institute: {
        id: institute._id,
        instituteName: institute.instituteName,
        loginId: institute.loginId,
        email: institute.email,
        paymentStatus: institute.paymentStatus
      },
      credentials: { loginId, password: rawPassword }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/institutes/:id
router.put('/institutes/:id', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't update password through this route
    delete updates.loginId;  // Don't change loginId
    if (updates.billingDay !== undefined) {
      updates.billingDay = Math.min(Math.max(parseInt(updates.billingDay, 10) || 1, 1), 31);
    }

    const institute = await Institute.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    res.json(institute);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/institutes/:id  (activate/deactivate / payment status updates)
router.patch('/institutes/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['isActive', 'paymentStatus', 'planAmount', 'dueDate', 'billingDay'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updatedAt = new Date();
    const institute = await Institute.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    res.json(institute);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/institutes/:id
router.delete('/institutes/:id', requireAdmin, async (req, res) => {
  try {
    const institute = await Institute.findByIdAndDelete(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    res.json({ message: 'Institute deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/institutes/:id/reset-password
router.patch('/institutes/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    // Use admin-provided password if given, otherwise auto-generate
    const newPassword = (req.body.password && req.body.password.trim().length >= 6)
      ? req.body.password.trim()
      : generatePassword();
    const institute = await Institute.findById(req.params.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    
    institute.password = newPassword; // Will be re-hashed
    await institute.save();
    
    res.json({ message: 'Password reset', newPassword });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/leads
router.get('/leads', requireAdmin, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/leads/:id
router.patch('/leads/:id', requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/leads/:id
router.delete('/leads/:id', requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/billing/run - Manually trigger the monthly website-service
// billing emails (same routine the scheduler runs on the 1st of each month).
// Idempotent: institutes already billed this month are skipped.
router.post('/billing/run', requireAdmin, async (req, res) => {
  try {
    const summary = await sendMonthlyBills({ trigger: 'manual' });
    res.json({ message: 'Monthly billing run complete', ...summary });
  } catch (err) {
    console.error('Manual billing run failed:', err.message);
    res.status(500).json({ error: 'Billing run failed' });
  }
});

// GET /api/admin/billing/logs - Recent billing history (most recent first)
router.get('/billing/logs', requireAdmin, async (req, res) => {
  try {
    const logs = await BillingLog.find().sort({ sentAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/setup - Create initial admin (run once)
router.post('/setup', async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) return res.status(400).json({ error: 'Admin already exists' });

    const { username, email, password } = req.body;
    const admin = new Admin({ username, email, password });
    await admin.save();
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;