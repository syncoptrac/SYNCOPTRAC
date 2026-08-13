const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const instituteSchema = new mongoose.Schema({
  instituteName: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  instituteType: { type: String, default: 'General' },
  
  // Login credentials
  loginId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Google Sheets
  googleSheetId: { type: String, required: true },
  appsScriptUrl: { type: String, required: true },
  
  // Billing
  planAmount: { type: Number, required: true },
  // Billing day of month (1-31) this institute is charged on, every month
  billingDay: { type: Number, min: 1, max: 31, default: 1 },
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'overdue'], 
    default: 'overdue' 
  },
  dueDate: { type: Date },
  lastPaymentDate: { type: Date },
  
  // Student range (from get-started form)
  numberOfStudents: { type: String },

  // Fee Collection Cycle — controls how the Institute's own student fee
  // module (Fees sheet / fees.js) calculates due dates, periods, and status.
  // Independent per institute. Does NOT affect the admin-side SaaS billing
  // (planAmount/billingDay above), which stays monthly regardless.
  feeCollectionCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
    default: 'monthly'
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  totalStudents: { type: Number, default: 0 },
  
  // Single-session enforcement
  // Updated every login — old tokens with a different sessionId are rejected
  currentSessionId: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before save
instituteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
instituteSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp
instituteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// INDEXES (additive - no existing data is modified). loginId and email already
// have unique indexes from their field definitions. These cover the admin
// dashboard's per-load counts and the institute list ordering:
//  - countDocuments({ isActive: true })
//  - countDocuments({ createdAt: { $gte: startOfMonth } }) and .sort({ createdAt: -1 })
//  - the paid-in-period revenue query
instituteSchema.index({ isActive: 1 });
instituteSchema.index({ createdAt: -1 });
instituteSchema.index({ paymentStatus: 1, lastPaymentDate: -1 });

module.exports = mongoose.model('Institute', instituteSchema);