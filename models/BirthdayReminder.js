// models/BirthdayReminder.js - Birthday wishes for donors and volunteers

const mongoose = require('mongoose');

const birthdayReminderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  relationship: {
    type: String,
    enum: ['donor', 'volunteer', 'partner', 'other'],
    default: 'donor'
  },
  sendReminder: {
    type: Boolean,
    default: true
  },
  lastBirthdayWishSent: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for birthday queries
birthdayReminderSchema.index({ birthDate: 1 });
birthdayReminderSchema.index({ email: 1 });

module.exports = mongoose.model('BirthdayReminder', birthdayReminderSchema);