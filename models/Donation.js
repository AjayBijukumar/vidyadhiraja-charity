const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  donorPhone: String,
  amount: { type: Number, required: true },
  razorpayPaymentId: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);