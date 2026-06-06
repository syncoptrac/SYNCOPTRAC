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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);