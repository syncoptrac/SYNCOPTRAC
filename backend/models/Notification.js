const mongoose = require('mongoose');

// ============================================================================
// PLATFORM ANNOUNCEMENT / NOTIFICATION
//
// One document per announcement - NOT one per institute. Who receives it is
// expressed by targetType + targetInstituteIds, and who has read it lives in
// the separate NotificationRead collection. That keeps a "send to all 500
// institutes" announcement a single row instead of 500 copies.
//
// Lives in MongoDB alongside Institute/Admin/Lead because announcements are
// platform-level data owned by the admin. The per-institute Google Sheets are
// deliberately untouched: an announcement is not institute operational data,
// and writing to every institute's spreadsheet would be the duplication this
// model exists to avoid.
// ============================================================================

const TYPES = ['maintenance', 'system_update', 'important', 'announcement', 'feature_update'];
const PRIORITIES = ['normal', 'important', 'urgent'];
const TARGET_TYPES = ['all', 'specific'];
const STATUSES = ['scheduled', 'published', 'cancelled'];

const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true, maxlength: 140 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },

  type:     { type: String, enum: TYPES, default: 'announcement' },
  priority: { type: String, enum: PRIORITIES, default: 'normal' },

  // 'all'      -> every institute
  // 'specific' -> only the institutes listed in targetInstituteIds
  targetType:         { type: String, enum: TARGET_TYPES, default: 'all' },
  targetInstituteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Institute' }],

  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },

  // When the announcement becomes visible to institutes.
  //  - Send Now  -> set to the moment of creation
  //  - Schedule  -> set to a future timestamp
  // Visibility is derived from this value at QUERY time (see visibilityFilter),
  // so scheduled publishing needs no cron, no worker and no background job:
  // the announcement simply starts matching the filter once the clock passes.
  publishedAt: { type: Date, default: null },

  // Optional. Once passed, the announcement stops appearing for institutes.
  // Nothing is deleted - the record is kept for admin history.
  expiresAt: { type: Date, default: null },

  status: { type: String, enum: STATUSES, default: 'published' },
});

// INDEXES (additive - no existing collection is touched).
// The institute-facing query filters on status + publishedAt and matches
// either targetType 'all' or its own id inside targetInstituteIds.
notificationSchema.index({ status: 1, publishedAt: -1 });
notificationSchema.index({ targetType: 1, publishedAt: -1 });
notificationSchema.index({ targetInstituteIds: 1, publishedAt: -1 });
notificationSchema.index({ createdAt: -1 });

// ---------------------------------------------------------------------------
// THE SINGLE SOURCE OF TRUTH FOR "CAN THIS INSTITUTE SEE THIS ANNOUNCEMENT?"
//
// SECURITY: every institute-facing route composes this filter - the list, the
// unread count, the detail view and both mark-as-read routes. Because the
// detail route applies it too, guessing another institute's notification id
// returns 404 rather than the document. There is deliberately no code path
// that loads a notification for an institute without going through here.
//
// instituteId is ALWAYS taken from the verified JWT (req.user.id), never from
// the request body, query string or URL.
// ---------------------------------------------------------------------------
notificationSchema.statics.visibilityFilter = function visibilityFilter(instituteId, now) {
  const at = now || new Date();
  return {
    // 'cancelled' is excluded. 'scheduled' is included on purpose: the
    // publishedAt clause below is what actually gates a scheduled item, so it
    // goes live by itself at the right moment.
    status: { $in: ['scheduled', 'published'] },
    publishedAt: { $ne: null, $lte: at },
    $and: [
      // Not expired. { expiresAt: null } also matches documents where the
      // field is absent, so legacy/never-set rows never expire.
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: at } }] },
      // Targeting.
      { $or: [{ targetType: 'all' }, { targetInstituteIds: instituteId }] },
    ],
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

Notification.TYPES = TYPES;
Notification.PRIORITIES = PRIORITIES;
Notification.TARGET_TYPES = TARGET_TYPES;
Notification.STATUSES = STATUSES;

module.exports = Notification;
