require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const instituteRoutes = require('./routes/institute');
const sheetsRoutes = require('./routes/sheets');
const leadsRoutes = require('./routes/leads');

const app = express();

// ─── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // keep false — API only, no HTML served
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // prevent huge payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Sanitize MongoDB operators in req.body / req.query / req.params ──────────
// Prevents NoSQL injection: { "$gt": "" } attacks
app.use(mongoSanitize());

// ─── Prevent HTTP parameter pollution ─────────────────────────────────────────
app.use(hpp());

// ─── Global rate limiter — 200 req / 15 min per IP ────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const Institute = require('./models/Institute');

// ─── Stricter limiter for auth endpoints (login only) ─────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

// ─── Generous limiter for session polling (every 4s per user) ─────────────────
const sessionPollLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session checks.' },
});

// ─── Stricter limiter for public lead submissions ─────────────────────────────
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP, please try again later.' },
});

// ─── verify-session: direct route BEFORE auth router ──────────────────────────
// Mounted here so it bypasses authLimiter (20/15min) — poll fires every 4s
app.get('/api/auth/verify-session', sessionPollLimiter, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'SESSION_DISPLACED', message: 'No token.' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'institute') return res.json({ valid: true });

    if (!decoded.sessionId) {
      return res.status(401).json({ error: 'SESSION_DISPLACED', message: 'Please log in again.' });
    }

    const institute = await Institute.findById(decoded.id).select('currentSessionId isActive');
    if (!institute || !institute.isActive) {
      return res.status(401).json({ error: 'SESSION_DISPLACED', message: 'Account inactive.' });
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

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/leads', leadLimiter, leadsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler (never leak stack traces in production) ──────────────
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message,
  });
});

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

module.exports = app;