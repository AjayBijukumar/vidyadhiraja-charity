// models/Donation.js - Updated with complete donor information

const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Personal Information (from modal form)
  title: {
    type: String,
    enum: ['Mr', 'Ms', 'Mrs', 'Dr'],
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  donorEmail: {
    type: String,
    required: true
  },
  donorPhone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  pan: {
    type: String,
    default: ''
  },
  
  // Donation Details
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking'],
    default: 'upi'
  },
  taxExemption: {
    type: Boolean,
    default: false
  },
  existingDonor: {
    type: Boolean,
    default: false
  },
  
  // Razorpay Details
  razorpayPaymentId: {
    type: String,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
donationSchema.index({ donorEmail: 1 });
donationSchema.index({ donorPhone: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);