// models/Prayer.js - Virtual Prayer Wall Schema with TTL

const mongoose = require('mongoose');

const prayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  prayer: {
    type: String,
    required: true,
    maxlength: 500
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'featured', 'rejected'],
    default: 'pending'
  },
  blessCount: {
    type: Number,
    default: 0
  },
  blessedBy: [{
    email: String,
    ip: String,
    blessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  featuredAt: Date
});

// SINGLE TTL index to auto-delete prayers after 30 days
prayerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Prevent duplicate blessings from same email per prayer
prayerSchema.index({ 'blessedBy.email': 1, _id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Prayer', prayerSchema);