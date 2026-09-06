const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true, lowercase: true },
  instituteType: { type: String },
  numberOfStudents: { type: String },
  message: { type: String },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'converted', 'lost'], 
    default: 'new' 
  },
  notes: { type: String },
  // ─── Confirmation-email tracking (additive) ──────────────────────────────
  // confirmationSentAt doubles as the exactly-once lock for the applicant
  // confirmation email: the send is claimed with a conditional atomic update on
  // { confirmationSentAt: null }, which in MongoDB also matches documents where
  // the field is ABSENT — so leads created before this feature need no backfill
  // or migration, and no existing field is touched.
  confirmationSentAt: { type: Date, default: null },
  confirmationStatus: {
    type: String,
    enum: ['sent', 'failed', 'skipped', 'suppressed_duplicate'],
    default: undefined,
  },
  createdAt: { type: Date, default: Date.now }
});

// INDEXES (additive - no existing data is modified):
//  - the admin Leads page always sorts by createdAt descending
//  - the admin dashboard counts { status: 'new' } on every single load
// Without these, both operations are full collection scans that degrade as
// leads accumulate.
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);