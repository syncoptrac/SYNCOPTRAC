const mongoose = require('mongoose');

// Records every monthly website-service billing message sent to an institute.
// The unique (institute, monthKey) index makes monthly billing idempotent:
// re-running the job in the same month will never email an institute twice.
const billingLogSchema = new mongoose.Schema({
  institute:     { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  instituteName: { type: String },
  email:         { type: String },
  monthKey:      { type: String, required: true }, // format: YYYY-MM (IST)
  monthLabel:    { type: String },                 // e.g. "July 2026"
  amount:        { type: Number, default: 0 },
  status:        { type: String, enum: ['sent', 'skipped', 'failed'], default: 'sent' },
  error:         { type: String },
  trigger:       { type: String, enum: ['scheduled', 'manual'], default: 'scheduled' },
  sentAt:        { type: Date, default: Date.now },
});

billingLogSchema.index({ institute: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('BillingLog', billingLogSchema);
