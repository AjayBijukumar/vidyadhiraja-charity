// models/Gallery.js - Schema for gallery images

const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: Number,
  caption: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['construction', 'events', 'team', 'other'],
    default: 'construction'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Gallery', gallerySchema);