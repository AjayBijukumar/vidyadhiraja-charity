// models/ReceiptRequest.js - Store donation receipt requests from users

const mongoose = require('mongoose');

const receiptRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least ₹1']
  },
  utr: {
    type: String,
    required: [true, 'UTR number is required'],
    trim: true,
    uppercase: true
  },
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required']
  },
  paymentMode: {
    type: String,
    enum: ['upi', 'netbanking', 'card', 'cash', 'cheque'],
    required: [true, 'Payment mode is required']
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'receipt_sent', 'rejected'],
    default: 'pending'
  },
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
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Indexes for faster queries
receiptRequestSchema.index({ status: 1 });
receiptRequestSchema.index({ createdAt: -1 });
receiptRequestSchema.index({ utr: 1 });
receiptRequestSchema.index({ mobile: 1 });

// Ensure model is not re-compiled
module.exports = mongoose.models.ReceiptRequest || mongoose.model('ReceiptRequest', receiptRequestSchema);