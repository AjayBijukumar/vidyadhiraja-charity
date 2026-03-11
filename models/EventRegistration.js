// models/EventRegistration.js - Track volunteer event signups with TTL

const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  volunteerName: {
    type: String,
    required: true
  },
  volunteerEmail: {
    type: String,
    required: true
  },
  volunteerPhone: String,
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled', 'no-show'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  attendedAt: Date,
  cancelledAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  }
});

// Prevent duplicate registrations
eventRegistrationSchema.index({ eventId: 1, volunteerId: 1 }, { unique: true });

// TTL index for old registrations (keep 2 years)
eventRegistrationSchema.index({ registeredAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);