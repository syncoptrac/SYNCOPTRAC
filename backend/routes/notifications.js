const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAdmin, requireInstitute } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');
const Institute = require('../models/Institute');

// ============================================================================
// PLATFORM ANNOUNCEMENTS
//
// Two routers are exported and mounted separately in server.js:
//   /api/notifications        -> institute-facing, requireInstitute
//   /api/admin/notifications  -> admin-facing,     requireAdmin
//
// Mounting them on different paths (rather than one router with an /admin
// prefix) means an institute token can never reach an admin handler even if a
// path were mistyped, and it matches the existing /api/admin/* convention.
// ============================================================================

// A malformed :id reaching Mongoose throws a CastError that the catch blocks
// would report as a 500 instead of 404 - same guard the admin routes use.
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v || ''));

const MAX_LIST = 50;
const DEFAULT_LIST = 20;

function parseLimit(raw, fallback) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_LIST);
}

// Admin-facing display status. The stored `status` records admin INTENT;
// what an institute actually sees is derived from publishedAt/expiresAt, so
// this collapses both into one label for the admin table.
function effectiveStatus(n, now) {
  if (n.status === 'cancelled') return 'cancelled';
  if (!n.publishedAt) return 'draft';
  if (new Date(n.publishedAt).getTime() > now.getTime()) return 'scheduled';
  if (n.expiresAt && new Date(n.expiresAt).getTime() <= now.getTime()) return 'expired';
  return 'published';
}

function publicShape(n) {
  return {
    _id: n._id,
    title: n.title,
    message: n.message,
    type: n.type,
    priority: n.priority,
    publishedAt: n.publishedAt,
    expiresAt: n.expiresAt,
  };
}

/* ==========================================================================
   INSTITUTE ROUTER  -  mounted at /api/notifications

   Every handler resolves the institute from req.user.id, which comes from the
   verified JWT via requireInstitute (which additionally enforces the existing
   single-session rule). No handler reads an institute id from the body, query
   or URL, so there is no parameter for a caller to tamper with.
   ========================================================================== */
const instituteRouter = express.Router();

// GET /api/notifications/unread-count
// The only notification request the portal makes on load. Two indexed
// queries, no message bodies transferred.
// NOTE: declared before '/:id' so "unread-count" is never read as an id.
instituteRouter.get('/unread-count', requireInstitute, async (req, res) => {
  try {
    const me = req.user.id;
    const visible = await Notification.find(Notification.visibilityFilter(me), '_id').lean();
    if (!visible.length) return res.json({ count: 0, total: 0 });

    const ids = visible.map((n) => n._id);
    const readCount = await NotificationRead.countDocuments({
      institute: me,
      notification: { $in: ids },
    });

    res.json({ count: Math.max(0, ids.length - readCount), total: ids.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications?limit=20
// Loaded only when the drawer is opened.
instituteRouter.get('/', requireInstitute, async (req, res) => {
  try {
    const me = req.user.id;
    const limit = parseLimit(req.query.limit, DEFAULT_LIST);

    const items = await Notification.find(Notification.visibilityFilter(me))
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    if (!items.length) return res.json({ notifications: [], unreadCount: 0 });

    const reads = await NotificationRead.find(
      { institute: me, notification: { $in: items.map((n) => n._id) } },
      'notification'
    ).lean();
    const readSet = new Set(reads.map((r) => String(r.notification)));

    const notifications = items.map((n) => ({
      ...publicShape(n),
      read: readSet.has(String(n._id)),
    }));

    res.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notifications/read-all
// Declared before '/:id/read' for clarity; upserts are idempotent.
instituteRouter.post('/read-all', requireInstitute, async (req, res) => {
  try {
    const me = req.user.id;
    const visible = await Notification.find(Notification.visibilityFilter(me), '_id').lean();
    if (!visible.length) return res.json({ message: 'Nothing to mark', marked: 0 });

    // $setOnInsert only: an already-read announcement keeps its original
    // readAt rather than being restamped.
    const ops = visible.map((n) => ({
      updateOne: {
        filter: { notification: n._id, institute: me },
        update: { $setOnInsert: { notification: n._id, institute: me, readAt: new Date() } },
        upsert: true,
      },
    }));

    try {
      await NotificationRead.bulkWrite(ops, { ordered: false });
    } catch (err) {
      // Concurrent taps can race the unique index. That means the row now
      // exists, which is exactly the desired end state.
      if (err && err.code !== 11000) throw err;
    }

    res.json({ message: 'All notifications marked as read', marked: visible.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications/:id
// SECURITY BOUNDARY: the visibility filter is part of the query, so an id
// belonging to another institute's targeted announcement returns 404 - the
// document is never loaded, let alone returned.
instituteRouter.get('/:id', requireInstitute, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const me = req.user.id;

    const n = await Notification.findOne({
      _id: req.params.id,
      ...Notification.visibilityFilter(me),
    }).lean();
    if (!n) return res.status(404).json({ error: 'Notification not found' });

    const read = await NotificationRead.exists({ notification: n._id, institute: me });
    res.json({ ...publicShape(n), read: !!read });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notifications/:id/read
instituteRouter.post('/:id/read', requireInstitute, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const me = req.user.id;

    // Confirm the announcement is genuinely visible to THIS institute before
    // writing any read state, so a guessed id cannot create a read row.
    const n = await Notification.findOne(
      { _id: req.params.id, ...Notification.visibilityFilter(me) },
      '_id'
    ).lean();
    if (!n) return res.status(404).json({ error: 'Notification not found' });

    try {
      await NotificationRead.updateOne(
        { notification: n._id, institute: me },
        { $setOnInsert: { notification: n._id, institute: me, readAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      if (err && err.code !== 11000) throw err;
    }

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ==========================================================================
   ADMIN ROUTER  -  mounted at /api/admin/notifications
   ========================================================================== */
const adminRouter = express.Router();

// GET /api/admin/notifications/meta
// Enum values plus the institute picker list, so the compose form needs one
// request instead of hard-coding options in the frontend.
// NOTE: declared before '/:id'.
adminRouter.get('/meta', requireAdmin, async (req, res) => {
  try {
    const institutes = await Institute.find({}, 'instituteName loginId isActive')
      .sort({ instituteName: 1 })
      .lean();
    res.json({
      types: Notification.TYPES,
      priorities: Notification.PRIORITIES,
      targetTypes: Notification.TARGET_TYPES,
      institutes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/notifications?limit=50 - history with delivery stats
adminRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const limit = parseLimit(req.query.limit, MAX_LIST);

    const items = await Notification.find().sort({ createdAt: -1 }).limit(limit).lean();
    if (!items.length) return res.json({ notifications: [], totalInstitutes: 0 });

    const ids = items.map((n) => n._id);

    // One aggregate for every read count, rather than a query per row.
    const readAgg = await NotificationRead.aggregate([
      { $match: { notification: { $in: ids } } },
      { $group: { _id: '$notification', count: { $sum: 1 } } },
    ]);
    const readMap = new Map(readAgg.map((r) => [String(r._id), r.count]));

    // Resolve the names behind targetInstituteIds for display.
    const targetIds = [];
    items.forEach((n) => (n.targetInstituteIds || []).forEach((id) => targetIds.push(id)));
    const nameMap = new Map();
    if (targetIds.length) {
      const named = await Institute.find({ _id: { $in: targetIds } }, 'instituteName').lean();
      named.forEach((i) => nameMap.set(String(i._id), i.instituteName));
    }

    const totalInstitutes = await Institute.countDocuments({ isActive: true });

    const notifications = items.map((n) => {
      const recipients =
        n.targetType === 'all' ? totalInstitutes : (n.targetInstituteIds || []).length;
      return {
        ...n,
        effectiveStatus: effectiveStatus(n, now),
        recipients,
        readCount: readMap.get(String(n._id)) || 0,
        targetNames: (n.targetInstituteIds || [])
          .map((id) => nameMap.get(String(id)))
          .filter(Boolean),
      };
    });

    res.json({ notifications, totalInstitutes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Shared validation for create and update.
const validateBody = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 140 }).withMessage('Title must be 140 characters or fewer'),
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 4000 }).withMessage('Message must be 4000 characters or fewer'),
  body('type').optional().isIn(Notification.TYPES).withMessage('Unknown notification type'),
  body('priority').optional().isIn(Notification.PRIORITIES).withMessage('Unknown priority'),
  body('targetType').optional().isIn(Notification.TARGET_TYPES).withMessage('Unknown target type'),
];

// Resolves targeting + timing from a request body, or returns { error }.
async function resolvePayload(reqBody) {
  const targetType = reqBody.targetType === 'specific' ? 'specific' : 'all';
  let targetInstituteIds = [];

  if (targetType === 'specific') {
    const raw = Array.isArray(reqBody.targetInstituteIds) ? reqBody.targetInstituteIds : [];
    const ids = Array.from(new Set(raw.map(String))).filter(isObjectId);
    if (!ids.length) {
      return { error: 'Select at least one institute, or send to all institutes' };
    }
    // Reject ids that do not exist, so a typo cannot silently target nobody.
    const found = await Institute.find({ _id: { $in: ids } }, '_id').lean();
    if (found.length !== ids.length) {
      return { error: 'One or more selected institutes no longer exist' };
    }
    targetInstituteIds = found.map((i) => i._id);
  }

  const now = new Date();
  let publishedAt = now;
  let status = 'published';

  const rawSchedule = (reqBody.scheduleAt || '').toString().trim();
  if (rawSchedule) {
    const when = new Date(rawSchedule);
    if (Number.isNaN(when.getTime())) {
      return { error: 'Scheduled publish time is not a valid date' };
    }
    // A schedule in the past is treated as "send now" rather than an error,
    // which is what an admin means when the clock ticks past while typing.
    if (when.getTime() > now.getTime()) {
      publishedAt = when;
      status = 'scheduled';
    }
  }

  let expiresAt = null;
  const rawExpiry = (reqBody.expiresAt || '').toString().trim();
  if (rawExpiry) {
    const exp = new Date(rawExpiry);
    if (Number.isNaN(exp.getTime())) {
      return { error: 'Expiry time is not a valid date' };
    }
    if (exp.getTime() <= publishedAt.getTime()) {
      return { error: 'Expiry time must be after the publish time' };
    }
    expiresAt = exp;
  }

  return { targetType, targetInstituteIds, publishedAt, status, expiresAt };
}

// POST /api/admin/notifications - create and publish (now or scheduled)
adminRouter.post('/', requireAdmin, validateBody, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const resolved = await resolvePayload(req.body);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    const doc = await Notification.create({
      title: String(req.body.title).trim(),
      message: String(req.body.message).trim(),
      type: req.body.type || 'announcement',
      priority: req.body.priority || 'normal',
      targetType: resolved.targetType,
      targetInstituteIds: resolved.targetInstituteIds,
      createdBy: req.user.username || req.user.id || 'admin',
      publishedAt: resolved.publishedAt,
      expiresAt: resolved.expiresAt,
      status: resolved.status,
    });

    res.status(201).json({
      message: resolved.status === 'scheduled' ? 'Notification scheduled' : 'Notification sent',
      notification: { ...doc.toObject(), effectiveStatus: effectiveStatus(doc, new Date()) },
    });
  } catch (err) {
    console.error('create notification failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/notifications/:id
adminRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const n = await Notification.findById(req.params.id).lean();
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ...n, effectiveStatus: effectiveStatus(n, new Date()) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/notifications/:id
// Editing is allowed while an announcement has NOT yet reached institutes.
// Once it is live, its content is frozen - institutes may already have read
// it, so silently rewriting history would be wrong. Cancel and re-send
// instead.
adminRouter.put('/:id', requireAdmin, validateBody, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const existing = await Notification.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Notification not found' });

    const now = new Date();
    const live = effectiveStatus(existing, now);
    if (live === 'published' || live === 'expired') {
      return res.status(409).json({
        error: 'This notification is already live and cannot be edited. Cancel it and send a new one.',
      });
    }

    const resolved = await resolvePayload(req.body);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    existing.title = String(req.body.title).trim();
    existing.message = String(req.body.message).trim();
    existing.type = req.body.type || existing.type;
    existing.priority = req.body.priority || existing.priority;
    existing.targetType = resolved.targetType;
    existing.targetInstituteIds = resolved.targetInstituteIds;
    existing.publishedAt = resolved.publishedAt;
    existing.expiresAt = resolved.expiresAt;
    // A cancelled item being edited returns to its resolved state.
    existing.status = resolved.status;
    await existing.save();

    res.json({
      message: 'Notification updated',
      notification: { ...existing.toObject(), effectiveStatus: effectiveStatus(existing, now) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/notifications/:id/publish - send a scheduled item immediately
adminRouter.patch('/:id/publish', requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'Notification not found' });

    const now = new Date();
    if (n.expiresAt && new Date(n.expiresAt).getTime() <= now.getTime()) {
      return res.status(400).json({ error: 'This notification has already expired' });
    }

    n.status = 'published';
    n.publishedAt = now;
    await n.save();

    res.json({
      message: 'Notification published',
      notification: { ...n.toObject(), effectiveStatus: effectiveStatus(n, now) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/notifications/:id/cancel
// Withdraws it from every institute immediately. The record and its read
// history are preserved - nothing is destroyed.
adminRouter.patch('/:id/cancel', requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const n = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).lean();
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({
      message: 'Notification cancelled',
      notification: { ...n, effectiveStatus: effectiveStatus(n, new Date()) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/notifications/:id - removes the announcement and its read rows
adminRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const n = await Notification.findByIdAndDelete(req.params.id);
    if (!n) return res.status(404).json({ error: 'Notification not found' });

    // Leaving orphaned read rows behind would slowly grow the collection.
    await NotificationRead.deleteMany({ notification: req.params.id });

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { instituteRouter, adminRouter };
