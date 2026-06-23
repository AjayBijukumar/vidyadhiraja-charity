// models/ReceiptRequest.js - Store donation receipt requests from users

const mongoose = require('mongoose');

const receiptRequestSchema = new mongoose.Schema({
  // Donor Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  
  // Donation Details
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  utr: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  donationDate: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['upi', 'netbanking', 'card', 'cash', 'cheque'],
    required: true
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'verified', 'receipt_sent', 'rejected'],
    default: 'pending'
  },
  
  // Receipt Details (generated after verification)
  receiptNumber: {
    type: String,
    default: ''
  },
  receiptSentAt: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Admin Notes
  notes: {
    type: String,
    default: ''
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update updatedAt
receiptRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for faster queries
receiptRequestSchema.index({ status: 1 });
receiptRequestSchema.index({ createdAt: -1 });
receiptRequestSchema.index({ utr: 1 });

module.exports = mongoose.model('ReceiptRequest', receiptRequestSchema);