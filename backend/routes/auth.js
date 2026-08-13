const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Institute = require('../models/Institute');

// Admin Login
router.post('/admin/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password } = req.body;

    // Check env credentials first — no MongoDB needed
    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (envUsername && envPassword) {
      if (username === envUsername && password === envPassword) {
        const token = jwt.sign(
          { id: 'env-admin', username: envUsername, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          token,
          user: { id: 'env-admin', username: envUsername, role: 'admin' }
        });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Fallback: MongoDB
    const admin = await Admin.findOne({ $or: [{ username }, { email: username }] });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: admin._id, username: admin.username, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Institute Login
router.post('/institute/login', [
  body('loginId').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { loginId, password } = req.body;
    const institute = await Institute.findOne({ loginId, isActive: true });

    if (!institute || !(await institute.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a new session ID — invalidates any existing session on another device
    const sessionId = crypto.randomUUID();
    institute.currentSessionId = sessionId;
    await institute.save();

    const token = jwt.sign(
      {
        id: institute._id,
        loginId: institute.loginId,
        instituteName: institute.instituteName,
        googleSheetId: institute.googleSheetId,
        appsScriptUrl: institute.appsScriptUrl,
        role: 'institute',
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: institute._id,
        loginId: institute.loginId,
        instituteName: institute.instituteName,
        ownerName: institute.ownerName,
        role: 'institute'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token — works for both env-admin and MongoDB admin
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If env-admin token, just return valid without hitting MongoDB
    if (decoded.id === 'env-admin') {
      return res.json({ valid: true, user: decoded });
    }

    // BUGFIX: this returned valid:true for ANY signature-valid token, so a
    // DEACTIVATED institute - or one whose session had been displaced by a login
    // on another device - stayed logged in until the 7-day token expired.
    // Mirrors the checks /api/auth/verify-session already performs.
    if (decoded.role === 'institute' && decoded.id) {
      if (!decoded.sessionId) {
        return res.status(401).json({ valid: false, error: 'SESSION_DISPLACED' });
      }
      let institute;
      try {
        institute = await Institute.findById(decoded.id)
          .select('currentSessionId isActive')
          .lean();
      } catch {
        // If the database is briefly unreachable, do NOT mass-log-out every
        // user. Real enforcement still happens in requireInstitute on each
        // data request; this endpoint is only a soft check.
        return res.json({ valid: true, user: decoded });
      }
      if (!institute || !institute.isActive || institute.currentSessionId !== decoded.sessionId) {
        return res.status(401).json({ valid: false, error: 'SESSION_DISPLACED' });
      }
    }

    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;