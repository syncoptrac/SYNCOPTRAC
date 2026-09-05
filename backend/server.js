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
// Platform announcements. Two routers: one for institutes, one for admins.
const {
  instituteRouter: notificationRoutes,
  adminRouter: adminNotificationRoutes,
} = require('./routes/notifications');

const app = express();

// ─── Trust the reverse proxy (Render/Vercel) ─────────────────────────────────
// Render terminates TLS at its load balancer and forwards requests with an
// X-Forwarded-For header. Trusting the first proxy hop lets express-rate-limit
// read the real client IP instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

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
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // SECURITY: an unset FRONTEND_URL previously allowed EVERY origin, which in
    // production is an open CORS policy. Local development stays permissive.
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // prevent huge payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Response compression ─────────────────────────────────────────────────────
// PERF: student/fee/attendance lists are large JSON payloads that were sent
// uncompressed - slow on mobile data. gzip typically cuts them by ~80%.
// Implemented with Node's built-in zlib so no new dependency is introduced.
const zlib = require('zlib');
app.use((req, res, next) => {
  if (!/\bgzip\b/i.test(String(req.headers['accept-encoding'] || ''))) return next();
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    let payload;
    try {
      payload = JSON.stringify(body);
    } catch {
      return sendJson(body);
    }
    // Below ~1KB, compression costs more than it saves.
    if (!payload || Buffer.byteLength(payload) < 1024) return sendJson(body);
    zlib.gzip(payload, (err, buf) => {
      if (err) return sendJson(body);
      if (res.headersSent) return;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.removeHeader('Content-Length');
      res.end(buf);
    });
    return res;
  };
  next();
});

// ─── Sanitize MongoDB operators in req.body / req.query / req.params ──────────
// Prevents NoSQL injection: { "$gt": "" } attacks
app.use(mongoSanitize());

// ─── Prevent HTTP parameter pollution ─────────────────────────────────────────
app.use(hpp());

// ─── Global rate limiter — 200 req / 15 min per IP ────────────────────────────
// BUGFIX (random "server timed out" failures): 200 requests / 15 min is BELOW
// what one active user generates. The institute portal polls verify-session
// continuously, which on its own consumed the entire allowance in ~13 minutes -
// after which EVERY request, including ordinary page loads, was answered with
// HTTP 429. That is precisely the "sometimes things load, sometimes they don't"
// behaviour. The poll has its own dedicated limiter (60/min) so it is excluded
// here, and the cap is raised to a level that still stops abuse but cannot
// throttle legitimate single-user traffic.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/auth/verify-session',
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
// Institute-facing announcement reads/read-state (requireInstitute inside).
app.use('/api/notifications', notificationRoutes);
// Admin-only announcement management (requireAdmin inside). Mounted under
// /api/admin/* to match the existing admin surface.
app.use('/api/admin/notifications', adminNotificationRoutes);

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
const { startBillingScheduler } = require('./services/billingScheduler');

// RELIABILITY: with no options the driver waits its DEFAULT 30 SECONDS to
// select a server, so a brief Atlas hiccup left requests hanging until the
// client gave up - indistinguishable to the user from "the server took too long
// to respond". Failing fast surfaces a real error instead. The pool is sized
// for Render's single web worker rather than the default 100 sockets.
mongoose.connection.on('error', (e) => console.error('MongoDB error:', e.message));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected - driver will retry'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
  minPoolSize: 2,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    // Start the monthly website-service billing automation (1st of month, 09:00 IST)
    startBillingScheduler();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

module.exports = app;