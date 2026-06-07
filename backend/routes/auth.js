const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Institute = require('../models/Institute');

// ─── Rate limiter for institute login only ────────────────────────────────────
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes

function getRateLimit(loginId) {
  const key = loginId.toLowerCase();
  if (!loginAttempts.has(key)) return { attempts: 0, lockedUntil: null };
  return loginAttempts.get(key);
}

function recordFailedAttempt(loginId) {
  const key = loginId.toLowerCase();
  const current = getRateLimit(loginId);
  const attempts = current.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : current.lockedUntil;
  loginAttempts.set(key, { attempts, lockedUntil });
}

function clearAttempts(loginId) {
  loginAttempts.delete(loginId.toLowerCase());
}

function isLocked(loginId) {
  const { attempts, lockedUntil } = getRateLimit(loginId);
  if (attempts < MAX_ATTEMPTS) return false;
  if (lockedUntil && Date.now() < lockedUntil) return true;
  clearAttempts(loginId); // lockout expired
  return false;
}

function secondsRemaining(loginId) {
  const { lockedUntil } = getRateLimit(loginId);
  if (!lockedUntil) return 0;
  return Math.ceil((lockedUntil - Date.now()) / 1000);
}

// ─── Admin Login (completely unchanged — no rate limit, no session) ───────────
router.post('/admin/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password } = req.body;

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

// ─── Institute Login (rate limited + single-session enforcement) ──────────────
router.post('/institute/login', [
  body('loginId').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { loginId, password } = req.body;

    // Check lockout BEFORE hitting the DB
    if (isLocked(loginId)) {
      const secs = secondsRemaining(loginId);
      const mins = Math.ceil(secs / 60);
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: `Too many failed attempts. Please wait ${secs < 60 ? `${secs} seconds` : `${mins} minute${mins > 1 ? 's' : ''}`} before trying again.`,
        retryAfterSeconds: secs,
      });
    }

    const institute = await Institute.findOne({ loginId, isActive: true });

    if (!institute || !(await institute.comparePassword(password))) {
      recordFailedAttempt(loginId);
      const { attempts } = getRateLimit(loginId);
      const attemptsLeft = MAX_ATTEMPTS - attempts;

      if (attemptsLeft <= 0) {
        return res.status(429).json({
          error: 'TOO_MANY_ATTEMPTS',
          message: 'Too many failed attempts. Please wait 2 minutes before trying again.',
          retryAfterSeconds: LOCKOUT_MS / 1000,
        });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        ...(attemptsLeft <= 2 && {
          warning: `${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining before 2-minute lockout.`
        }),
      });
    }

    // Successful login — clear failed attempts and generate new session ID
    clearAttempts(loginId);

    // Single-session: new login invalidates any existing session on another device
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

// ─── Verify token ─────────────────────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id === 'env-admin') {
      return res.json({ valid: true, user: decoded });
    }

    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// ─── verify-session (institute single-session check, admin always valid) ──────
router.get('/verify-session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin — no session enforcement, always valid
    if (decoded.role !== 'institute') {
      return res.json({ valid: true });
    }

    if (!decoded.sessionId) {
      return res.status(401).json({ error: 'SESSION_DISPLACED', message: 'Please log in again.' });
    }

    const institute = await Institute.findById(decoded.id).select('currentSessionId isActive');
    if (!institute || !institute.isActive) {
      return res.status(401).json({ error: 'SESSION_DISPLACED', message: 'Account not found.' });
    }
    if (institute.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: 'SESSION_DISPLACED',
        message: 'Your session was ended because someone logged into this account on another device.',
      });
    }

    res.json({ valid: true });
  } catch {
    res.status(401).json({ error: 'SESSION_DISPLACED', message: 'Session invalid.' });
  }
});

module.exports = router;