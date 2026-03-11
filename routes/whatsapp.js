// routes/whatsapp.js - Public WhatsApp subscription routes

const express = require('express');
const router = express.Router();
const WhatsAppSubscriber = require('../models/WhatsAppSubscriber');

// Subscribe to WhatsApp updates
router.post('/subscribe', async (req, res) => {
  try {
    const { name, phone, consent } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone number are required' 
      });
    }
    
    let subscriber = await WhatsAppSubscriber.findOne({ phone });
    
    if (subscriber) {
      subscriber.name = name;
      subscriber.consent = consent || false;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = null;
      await subscriber.save();
      
      return res.json({ 
        success: true, 
        message: 'Subscription updated successfully!' 
      });
    }
    
    subscriber = new WhatsAppSubscriber({
      name,
      phone,
      consent: consent || false
    });
    
    await subscriber.save();
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to WhatsApp updates!' 
    });
    
  } catch (error) {
    console.error('WhatsApp subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to subscribe. Please try again.' 
    });
  }
});

// Unsubscribe from WhatsApp
router.post('/unsubscribe', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    const subscriber = await WhatsAppSubscriber.findOne({ phone });
    
    if (subscriber) {
      subscriber.consent = false;
      subscriber.unsubscribedAt = new Date();
      await subscriber.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Successfully unsubscribed from WhatsApp updates' 
    });
    
  } catch (error) {
    console.error('WhatsApp unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unsubscribe. Please try again.' 
    });
  }
});

module.exports = router;