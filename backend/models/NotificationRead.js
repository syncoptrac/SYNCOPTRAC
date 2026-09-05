const mongoose = require('mongoose');

// ============================================================================
// READ STATE - one small row per (announcement, institute) that has been read.
//
// Absence of a row means unread, so nothing has to be written when an
// announcement is created: sending to 500 institutes inserts ONE notification
// document and zero read documents.
//
// The compound unique index makes "mark as read" idempotent - repeated taps
// upsert the same row instead of stacking duplicates.
// ============================================================================

const notificationReadSchema = new mongoose.Schema({
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
  },
  // SECURITY: always written from the authenticated session (req.user.id).
  // No route accepts an instituteId from the client for this field, so one
  // institute cannot mark another institute's announcement as read.
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
  },
  readAt: { type: Date, default: Date.now },
});

notificationReadSchema.index({ notification: 1, institute: 1 }, { unique: true });
// Covers "which of these announcements has my institute read?" - the query
// behind both the drawer list and the unread badge.
notificationReadSchema.index({ institute: 1, notification: 1 });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);
