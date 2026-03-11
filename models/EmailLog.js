// models/EmailLog.js - Store email logs with auto-delete after 1 year

const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['volunteer-bulk', 'volunteer-single', 'donor', 'contact-reply', 'report'],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// SINGLE TTL index to auto-delete logs after 1 year (31536000 seconds)
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('EmailLog', emailLogSchema);