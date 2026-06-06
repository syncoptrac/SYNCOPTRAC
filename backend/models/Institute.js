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
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'overdue'], 
    default: 'overdue' 
  },
  dueDate: { type: Date },
  lastPaymentDate: { type: Date },
  
  // Student range (from get-started form)
  numberOfStudents: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  totalStudents: { type: Number, default: 0 },
  
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

module.exports = mongoose.model('Institute', instituteSchema);