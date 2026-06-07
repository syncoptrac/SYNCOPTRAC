const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Institute = require('../models/Institute');

// Verify any authenticated user (admin or institute)
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin only middleware
const requireAdmin = async (req, res, next) => {
  await authenticate(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Institute only middleware — also validates single-session enforcement
const requireInstitute = async (req, res, next) => {
  await authenticate(req, res, async () => {
    if (req.user.role !== 'institute') {
      return res.status(403).json({ error: 'Institute access required' });
    }

    // Single-session check: verify this token's sessionId matches what's in DB
    // If someone logged in on another device, the DB sessionId will be different
    try {
      const institute = await Institute.findById(req.user.id).select('currentSessionId isActive');
      if (!institute || !institute.isActive) {
        return res.status(401).json({ error: 'Account not found or inactive' });
      }
      if (institute.currentSessionId !== req.user.sessionId) {
        return res.status(401).json({
          error: 'SESSION_DISPLACED',
          message: 'Your session was ended because someone logged into this account on another device.',
        });
      }
    } catch {
      return res.status(500).json({ error: 'Session validation failed' });
    }

    next();
  });
};

module.exports = { authenticate, requireAdmin, requireInstitute };