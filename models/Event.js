// models/Event.js - Event Calendar Schema with TTL cleanup

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  type: {
    type: String,
    enum: ['volunteer', 'fundraising', 'outreach', 'meeting', 'other'],
    default: 'volunteer'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update status based on dates
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'completed';
  } else if (this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else if (this.startDate > now) {
    this.status = 'upcoming';
  }
  next();
});

// Index for faster queries
eventSchema.index({ startDate: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);