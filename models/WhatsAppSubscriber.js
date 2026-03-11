// models/WhatsAppSubscriber.js - WhatsApp broadcast subscribers

const mongoose = require('mongoose');

const whatsAppSubscriberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true  // This already creates an index, no need for duplicate
  },
  consent: {
    type: Boolean,
    default: false
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  lastBroadcastAt: Date,
  unsubscribedAt: Date
});

// Only keep the index you actually need for sorting queries
// Remove the phone index since it's already created by unique:true
whatsAppSubscriberSchema.index({ subscribedAt: -1 }); // Keep this for sorting by date

module.exports = mongoose.model('WhatsAppSubscriber', whatsAppSubscriberSchema);