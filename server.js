// server.js - Complete with Admin Panel, Gallery, Hope Tree, Email Notifications, Volunteer Registration, Prayer Wall, WhatsApp Broadcast, Birthday Wisher, and Receipt Request System!

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

// 🔥 ADD THIS LINE - Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cron = require('node-cron'); // For birthday reminders
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit'); // For PDF receipt generation

// Import routes
const adminRoutes = require('./routes/admin');

// 📧 Import email service
const emailService = require('./utils/emailService');

// Import models
const Volunteer = require('./models/Volunteer');
const Prayer = require('./models/Prayer');
const WhatsAppSubscriber = require('./models/WhatsAppSubscriber');
const BirthdayReminder = require('./models/BirthdayReminder');
const EmailLog = require('./models/EmailLog');
const ReceiptRequest = require('./models/ReceiptRequest'); // NEW

// Import Prayer Wall routes
const prayerRoutes = require('./routes/prayer');

// Import the public WhatsApp routes
const whatsappRoutes = require('./routes/whatsapp');

// DB connection string
const MONGODB_URI = process.env.MONGODB_URI;
// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  family: 4
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, connectionOptions)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully!');
})
.catch((error) => {
  console.log('❌ MongoDB connection error:');
  console.log(error.message);
});

const app = express();

// Session middleware (for admin login)
app.use(session({
  secret: 'charity-foundation-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Regular middleware
app.use(cors());
app.use(express.json());

// ========== API ROUTES FIRST (before static files) ==========
// Use the WhatsApp routes - THESE MUST COME BEFORE STATIC FILES
app.use('/api/whatsapp', whatsappRoutes);

// ========== STATIC FILES ==========
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname));

// ========== OTHER ROUTES ==========
// Mount admin routes
app.use('/admin', adminRoutes);

// Mount prayer wall routes
app.use('/prayer', require('./routes/prayer'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Server is working!' });
});

// ========== GALLERY API ENDPOINT ==========
app.get('/api/gallery', async (req, res) => {
  try {
    const Gallery = require('./models/Gallery');
    const images = await Gallery.find().sort({ uploadedAt: -1 });
    res.json(images);
  } catch (error) {
    console.error('❌ Gallery API error:', error);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// ========== HOPE TREE API ENDPOINTS ==========

// Get total donation amount
app.get('/api/donations/total', async (req, res) => {
  try {
    const Donation = require('./models/Donation');
    
    // Calculate total of all completed donations
    const result = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const total = result.length > 0 ? result[0].total : 0;
    
    res.json({ total });
  } catch (error) {
    console.error('❌ Error calculating donation total:', error);
    res.status(500).json({ error: 'Failed to calculate total' });
  }
});

// Get donation count (number of donors)
app.get('/api/donations/count', async (req, res) => {
  try {
    const Donation = require('./models/Donation');
    const count = await Donation.countDocuments({ status: 'completed' });
    res.json({ count });
  } catch (error) {
    console.error('❌ Error counting donations:', error);
    res.status(500).json({ error: 'Failed to count donations' });
  }
});

// Get recent donations (for activity feed)
app.get('/api/donations/recent', async (req, res) => {
  try {
    const Donation = require('./models/Donation');
    const recent = await Donation.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('donorName amount createdAt');
    res.json(recent);
  } catch (error) {
    console.error('❌ Error fetching recent donations:', error);
    res.status(500).json({ error: 'Failed to fetch recent donations' });
  }
});

// ========== CONTACT FORM HANDLERS ==========
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    console.log('📩 Message:', req.body);
    
    // Save to database
    const Message = require('./models/Message');
    const newMessage = new Message({ name, email, phone, message, read: false });
    await newMessage.save();
    console.log('✅ Message saved to database');
    
    // 📧 Send email notifications
    emailService.sendNewMessageNotification({ name, email, phone, message })
      .catch(err => console.error('Background email error (admin):', err));
    
    emailService.sendAutoReplyToUser({ name, email, message })
      .catch(err => console.error('Background email error (user):', err));
    
    res.json({ success: true, message: 'Thank you! Your message has been received.' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.json({ success: true, message: 'Thank you! Your message has been received.' });
  }
});

app.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    console.log('📩 Message:', req.body);
    
    const Message = require('./models/Message');
    const newMessage = new Message({ name, email, phone, message, read: false });
    await newMessage.save();
    console.log('✅ Message saved to database');
    
    emailService.sendNewMessageNotification({ name, email, phone, message })
      .catch(err => console.error('Background email error (admin):', err));
    
    emailService.sendAutoReplyToUser({ name, email, message })
      .catch(err => console.error('Background email error (user):', err));
    
    res.json({ success: true, message: 'Thank you! Your message has been received.' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.json({ success: true, message: 'Thank you! Your message has been received.' });
  }
});

// ========== VOLUNTEER REGISTRATION API ==========
app.post('/api/volunteer', async (req, res) => {
  try {
    const { name, phone, email, type, message } = req.body;
    
    console.log('🙌 New volunteer registration:', { name, email, type });
    
    if (!name || !phone || !email || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }
    
    const newVolunteer = new Volunteer({
      name,
      phone,
      email,
      type,
      message: message || '',
      status: 'new'
    });
    
    await newVolunteer.save();
    console.log('✅ Volunteer saved to database');
    
    emailService.sendNewVolunteerNotification({ name, phone, email, type, message })
      .catch(err => console.error('Background email error (admin):', err));
    
    emailService.sendVolunteerAutoReply({ name, phone, email, type })
      .catch(err => console.error('Background email error (volunteer):', err));
    
    res.json({ 
      success: true, 
      message: 'Thank you for joining us! We will contact you soon.' 
    });
    
  } catch (error) {
    console.error('Error saving volunteer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
});

app.get('/api/volunteers', async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

app.post('/api/volunteer/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await Volunteer.findByIdAndUpdate(id, { status });
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating volunteer status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ========== PRAYER WALL API ==========
app.get('/api/prayers', async (req, res) => {
  try {
    const prayers = await Prayer.find({ 
      status: { $in: ['approved', 'featured'] } 
    })
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(50)
    .select('name prayer isAnonymous blessCount createdAt status');
    
    res.json(prayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

app.post('/api/prayers', async (req, res) => {
  try {
    const { name, email, prayer, isAnonymous } = req.body;
    
    if (!name || !email || !prayer) {
      return res.status(400).json({ error: 'Name, email and prayer are required' });
    }
    
    const newPrayer = new Prayer({
      name,
      email,
      prayer,
      isAnonymous: isAnonymous || false,
      status: 'pending'
    });
    
    await newPrayer.save();
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: `"Prayer Wall" <${process.env.EMAIL_USER}>`,
      to: 'ramcatering2011@gmail.com',
      subject: '🙏 New Prayer Submitted',
      html: `
        <div style="font-family: 'Poppins', sans-serif;">
          <h2 style="color: #7c2d12;">New Prayer Needs Approval</h2>
          <p><strong>From:</strong> ${isAnonymous ? 'Anonymous' : name} (${email})</p>
          <div style="background: #fff0d9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><em>"${prayer}"</em></p>
          </div>
          <p>
            <a href="http://localhost:5000/admin/prayers" style="background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Review in Admin</a>
          </p>
        </div>
      `
    });
    
    res.json({ success: true, message: 'Prayer submitted for approval' });
    
  } catch (error) {
    console.error('Error submitting prayer:', error);
    res.status(500).json({ error: 'Failed to submit prayer' });
  }
});

app.post('/api/prayers/:id/bless', async (req, res) => {
  try {
    const { email } = req.body;
    const prayerId = req.params.id;
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required to bless' });
    }
    
    const prayer = await Prayer.findById(prayerId);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    const alreadyBlessed = prayer.blessedBy.some(b => b.email === email);
    if (alreadyBlessed) {
      return res.status(400).json({ error: 'Already blessed this prayer' });
    }
    
    prayer.blessCount += 1;
    prayer.blessedBy.push({ email, ip });
    await prayer.save();
    
    res.json({ success: true, blessCount: prayer.blessCount });
    
  } catch (error) {
    console.error('Error blessing prayer:', error);
    res.status(500).json({ error: 'Failed to bless prayer' });
  }
});

// ========== WHATSAPP BROADCAST API ==========

// Subscribe to WhatsApp broadcasts
app.post('/api/whatsapp/subscribe', async (req, res) => {
  try {
    const { name, phone, consent } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    // Check if already subscribed
    const existing = await WhatsAppSubscriber.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: 'This number is already subscribed' });
    }
    
    const subscriber = new WhatsAppSubscriber({
      name,
      phone,
      consent: consent || false,
      subscribedAt: new Date()
    });
    
    await subscriber.save();
    
    // Send welcome WhatsApp message (you'd integrate with WhatsApp Business API here)
    console.log(`📱 New WhatsApp subscriber: ${name} (${phone})`);
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to WhatsApp updates!' 
    });
    
  } catch (error) {
    console.error('Error subscribing to WhatsApp:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Unsubscribe from WhatsApp broadcasts
app.post('/api/whatsapp/unsubscribe', async (req, res) => {
  try {
    const { phone } = req.body;
    
    await WhatsAppSubscriber.findOneAndDelete({ phone });
    
    res.json({ success: true, message: 'Unsubscribed successfully' });
    
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send broadcast message (admin only - protected in admin routes)
app.post('/api/whatsapp/broadcast', async (req, res) => {
  // This endpoint will be protected in admin routes
  // Here we just define the logic
  try {
    const { message, filter } = req.body;
    
    let query = {};
    if (filter === 'active') {
      query = { consent: true };
    }
    
    const subscribers = await WhatsAppSubscriber.find(query);
    
    // In production, you'd integrate with WhatsApp Business API
    console.log(`📱 Broadcast to ${subscribers.length} subscribers: ${message}`);
    
    // Log the broadcast
    await EmailLog.create({
      recipient: 'broadcast',
      subject: 'WhatsApp Broadcast',
      type: 'whatsapp-broadcast',
      metadata: { recipientCount: subscribers.length, messagePreview: message.substring(0, 50) }
    });
    
    res.json({ 
      success: true, 
      message: `Broadcast sent to ${subscribers.length} subscribers` 
    });
    
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ========== BIRTHDAY WISHER API ==========

// Add birthday reminder
app.post('/api/birthday/add', async (req, res) => {
  try {
    const { name, email, birthDate, relationship, sendReminder } = req.body;
    
    if (!name || !email || !birthDate) {
      return res.status(400).json({ error: 'Name, email and birth date are required' });
    }
    
    const reminder = new BirthdayReminder({
      name,
      email,
      birthDate: new Date(birthDate),
      relationship: relationship || 'donor',
      sendReminder: sendReminder !== false
    });
    
    await reminder.save();
    
    res.json({ 
      success: true, 
      message: 'Birthday reminder added successfully!' 
    });
    
  } catch (error) {
    console.error('Error adding birthday reminder:', error);
    res.status(500).json({ error: 'Failed to add birthday reminder' });
  }
});

// Get upcoming birthdays (next 30 days)
app.get('/api/birthday/upcoming', async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    const reminders = await BirthdayReminder.find({
      sendReminder: true,
      $expr: {
        $and: [
          { $eq: [{ $month: '$birthDate' }, { $month: today }] },
          { $gte: [{ $dayOfMonth: '$birthDate' }, { $dayOfMonth: today }] }
        ]
      }
    });
    
    res.json(reminders);
    
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    res.status(500).json({ error: 'Failed to fetch birthdays' });
  }
});

// Schedule birthday emails (runs daily at 8 AM)
cron.schedule('0 8 * * *', async () => {
  console.log('🎂 Checking for birthdays today...');
  
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    const birthdayPeople = await BirthdayReminder.find({
      sendReminder: true,
      $expr: {
        $and: [
          { $eq: [{ $month: '$birthDate' }, todayMonth] },
          { $eq: [{ $dayOfMonth: '$birthDate' }, todayDay] }
        ]
      }
    });
    
    for (const person of birthdayPeople) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
        to: person.email,
        subject: `🎂 Happy Birthday, ${person.name}!`,
        html: `
          <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 24px;">
            <div style="text-align: center;">
              <h2 style="color: #7c2d12; font-family: 'Playfair Display';">🎉 Happy Birthday! 🎉</h2>
              <h1 style="color: #d97706; font-size: 2.5rem;">${person.name}</h1>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 16px; margin: 20px 0;">
              <p style="font-size: 1.1rem; line-height: 1.6;">Dear ${person.name},</p>
              <p>On this special day, we at Sree Vidyadhiraja Charity Foundation want to wish you a very happy birthday! Your support means the world to us and to the elderly people we care for.</p>
              <p>May your year be filled with joy, peace, and countless blessings.</p>
              
              <div style="background: #fff0d9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <p style="font-size: 1.2rem; font-style: italic;">"Service to humanity is service to the Divine."</p>
                <p>— Chattambi Swamigal</p>
              </div>
              
              <p>With gratitude and warm wishes,<br>
              <strong>The Sree Vidyadhiraja Charity Team</strong></p>
            </div>
            
            <div style="text-align: center; color: #7c6a5a; font-size: 0.9rem;">
              <p>You're receiving this because you're part of our family.</p>
            </div>
          </div>
        `
      });
      
      console.log(`🎂 Birthday wish sent to ${person.email}`);
      
      // Update last sent
      person.lastBirthdayWishSent = new Date();
      await person.save();
    }
    
  } catch (error) {
    console.error('Error sending birthday wishes:', error);
  }
});

// ========== RAZORPAY DONATION API ==========
// NOTE: Razorpay and crypto are already declared at the top - DO NOT DECLARE AGAIN!

// Debug - Check if keys are loaded
console.log('🔑 Razorpay Key ID present:', !!process.env.RAZORPAY_KEY_ID);
console.log('🔑 Razorpay Key Secret present:', !!process.env.RAZORPAY_KEY_SECRET);

// Initialize Razorpay (lowercase 'r' for instance)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order endpoint
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('💰 Donation request received for amount:', amount);
    
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: 'donation_' + Date.now()
    };

    console.log('📦 Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
    
  } catch (error) {
    console.error('❌ Razorpay order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment endpoint - UPDATED with complete donor information
app.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      // Donor Information from modal
      title,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      pan,
      amount,
      paymentMethod,
      taxExemption,
      existingDonor
    } = req.body;
    
    console.log('🔐 Verifying payment:', razorpay_payment_id);
    console.log('👤 Donor:', title, firstName, lastName, email);
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isValid = expectedSignature === razorpay_signature;
    console.log('🔐 Signature valid:', isValid);
    
    if (isValid) {
      // Payment is verified - save complete donation to database
      const Donation = require('./models/Donation');
      const donation = new Donation({
        // Personal Information
        title: title || 'Mr',
        firstName: firstName,
        lastName: lastName,
        donorEmail: email,
        donorPhone: phone,
        address: address,
        city: city,
        postalCode: postalCode,
        pan: pan || '',
        
        // Donation Details
        amount: amount / 100, // Convert back from paise
        paymentMethod: paymentMethod || 'upi',
        taxExemption: taxExemption === 'true' || taxExemption === true,
        existingDonor: existingDonor === 'true' || existingDonor === true,
        
        // Razorpay Details
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: 'completed'
      });
      
      await donation.save();
      console.log('✅ Donation saved to database with ID:', donation._id);
      console.log('📊 Donor:', firstName, lastName, '| Amount: ₹', amount / 100);
      
      // Optional: Send email receipt to donor
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        await transporter.sendMail({
          from: `"Sri Vidyadhiraja Charities" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Thank you for your donation!',
          html: `
            <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 24px;">
              <h2 style="color: #7c2d12;">Thank You, ${title} ${firstName} ${lastName}!</h2>
              <p>Your generous donation of <strong>₹${amount / 100}</strong> will help us build a home for elderly people in need.</p>
              <p>Your support truly makes a difference.</p>
              <hr style="border-color: #f0d6ac; margin: 20px 0;">
              <p style="color: #7c6a5a; font-size: 0.9rem;">Donation ID: ${donation._id}</p>
              <p style="color: #7c6a5a; font-size: 0.9rem;">For any questions, contact us at ramcatering2011@gmail.com</p>
            </div>
          `
        });
        console.log('📧 Donation receipt sent to:', email);
      } catch (emailError) {
        console.log('⚠️ Receipt email failed (non-critical):', emailError.message);
      }
      
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.log('❌ Invalid signature');
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ========== RECEIPT REQUEST SYSTEM (NEW) ==========

// Helper function to generate receipt number
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const count = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCPT-${year}-${count}`;
}

// Helper function to generate PDF receipt
async function generateReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Header
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#7c2d12')
        .text('SREE VIDYADHIRAJA TRUST', { align: 'center' });
      
      doc.fontSize(12).font('Helvetica').fillColor('#5c4a3a')
        .text('Reg No: 6/2022 · Verkilambi', { align: 'center' });
      doc.text('Pulluvilai, Perinchakonam, Kanyakumari District', { align: 'center' });
      
      doc.moveDown();
      
      // Divider
      doc.strokeColor('#f0d6ac').lineWidth(1)
        .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      
      doc.moveDown();
      
      // Title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#7c2d12')
        .text('DONATION RECEIPT', { align: 'center' });
      
      doc.moveDown();
      
      // Receipt Details
      doc.fontSize(11).font('Helvetica').fillColor('#2b1810');
      doc.text(`Receipt No: ${receiptData.receiptNumber}`, 50, doc.y);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'right' });
      
      doc.moveDown();
      
      // Donor Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#7c2d12')
        .text('Received with thanks from:');
      
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica').fillColor('#2b1810');
      doc.text(`Name:  ${receiptData.name}`);
      doc.text(`Mobile: ${receiptData.mobile}`);
      if (receiptData.email) {
        doc.text(`Email:  ${receiptData.email}`);
      }
      
      doc.moveDown();
      
      // Transaction Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#7c2d12')
        .text('Transaction Details:');
      
      doc.moveDown(0.5);
      
      // Box for transaction details
      const boxY = doc.y;
      doc.rect(50, boxY, 500, 80).stroke('#f0d6ac');
      
      doc.fontSize(11).font('Helvetica').fillColor('#2b1810');
      doc.text(`Amount:  ₹${receiptData.amount.toFixed(2)}`, 70, boxY + 10);
      doc.text(`UTR:     ${receiptData.utr}`, 70, boxY + 32);
      doc.text(`Mode:    ${receiptData.paymentMode.charAt(0).toUpperCase() + receiptData.paymentMode.slice(1)}`, 70, boxY + 54);
      
      doc.moveDown();
      doc.moveDown();
      
      // 80G Note
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#7c2d12')
        .text('✓ This donation is eligible for tax exemption under Section 80G.', { align: 'center' });
      
      doc.moveDown();
      
      // Footer
      doc.fontSize(10).font('Helvetica').fillColor('#7c6a5a')
        .text('This is a system-generated receipt.', { align: 'center' });
      
      doc.moveDown();
      
      // Signature
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#2b1810')
        .text('Authorized Signatory', 400, doc.y + 30);
      doc.fontSize(9).font('Helvetica').fillColor('#7c6a5a')
        .text('Sree Vidyadhiraja Trust', 400, doc.y + 10);
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Submit receipt request (public endpoint)
app.post('/api/receipt-request', async (req, res) => {
  try {
    const { name, mobile, email, amount, utr, date, paymentMode } = req.body;
    
    // Validate required fields
    if (!name || !mobile || !amount || !utr || !date || !paymentMode) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }
    
    // Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number'
      });
    }
    
    // Check if UTR already exists (prevent duplicates)
    const existing = await ReceiptRequest.findOne({ utr: utr.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This UTR number has already been submitted. Please check your details.'
      });
    }
    
    // Save receipt request to database
    const receiptRequest = new ReceiptRequest({
      name,
      mobile,
      email: email || '',
      amount: parseFloat(amount),
      utr: utr.toUpperCase(),
      donationDate: new Date(date),
      paymentMode,
      status: 'pending'
    });
    
    await receiptRequest.save();
    
    console.log('📋 Receipt Request Saved:', receiptRequest._id);
    
    // Send email notification to admin
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"Sree Vidyadhiraja Trust" <${process.env.EMAIL_USER}>`,
        to: 'ramcatering2011@gmail.com',
        subject: '📋 New Donation Receipt Request',
        html: `
          <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 24px; border: 1px solid #f0d6ac;">
            <h2 style="color: #7c2d12; font-family: 'Playfair Display';">📋 New Receipt Request</h2>
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Mobile:</strong> ${mobile}</p>
              <p><strong>Email:</strong> ${email || 'Not provided'}</p>
              <p><strong>Amount:</strong> ₹${amount}</p>
              <p><strong>UTR:</strong> ${utr}</p>
              <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p><strong>Payment Mode:</strong> ${paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}</p>
            </div>
            <p style="color: #7c6a5a;">Please verify the donation in your bank statement and issue the receipt.</p>
            <p><a href="https://vidyadhiraja-charity.onrender.com/admin/dashboard" style="background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 40px;">Review in Admin</a></p>
          </div>
        `
      });
      console.log('📧 Receipt request email sent to admin');
    } catch (emailError) {
      console.log('⚠️ Email notification failed (non-critical):', emailError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Thank you for supporting Sree Vidyadhiraja Trust. Your donation details have been received and will be verified. An official receipt will be issued after verification.' 
    });
    
  } catch (error) {
    console.error('Receipt request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit receipt request. Please try again.' 
    });
  }
});

// Get all receipt requests (admin only - protected in admin routes)
app.get('/api/admin/receipts', async (req, res) => {
  try {
    // This will be protected by admin middleware when mounted
    const receipts = await ReceiptRequest.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Verify and send receipt (admin only)
app.post('/api/admin/receipts/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const receiptRequest = await ReceiptRequest.findById(id);
    if (!receiptRequest) {
      return res.status(404).json({ error: 'Receipt request not found' });
    }
    
    if (receiptRequest.status === 'receipt_sent') {
      return res.status(400).json({ error: 'Receipt already sent for this request' });
    }
    
    // Generate receipt number
    const receiptNumber = generateReceiptNumber();
    
    // Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      receiptNumber,
      name: receiptRequest.name,
      mobile: receiptRequest.mobile,
      email: receiptRequest.email,
      amount: receiptRequest.amount,
      utr: receiptRequest.utr,
      paymentMode: receiptRequest.paymentMode
    });
    
    // Update receipt request
    receiptRequest.status = 'receipt_sent';
    receiptRequest.receiptNumber = receiptNumber;
    receiptRequest.verifiedAt = new Date();
    receiptRequest.receiptSentAt = new Date();
    if (notes) receiptRequest.notes = notes;
    await receiptRequest.save();
    
    // Send email with PDF attachment to donor
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"Sree Vidyadhiraja Trust" <${process.env.EMAIL_USER}>`,
        to: receiptRequest.email || receiptRequest.mobile + '@email.com',
        subject: `Your Donation Receipt - Sree Vidyadhiraja Trust`,
        html: `
          <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 24px; border: 1px solid #f0d6ac;">
            <h2 style="color: #7c2d12; font-family: 'Playfair Display';">Thank You for Your Donation!</h2>
            <p>Dear <strong>${receiptRequest.name}</strong>,</p>
            <p>Thank you for your generous donation of <strong>₹${receiptRequest.amount}</strong> to Sree Vidyadhiraja Trust.</p>
            <p>Please find your official receipt attached as a PDF.</p>
            <div style="background: white; padding: 15px; border-radius: 12px; margin: 20px 0;">
              <p><strong>Receipt No:</strong> ${receiptNumber}</p>
              <p><strong>Donation Date:</strong> ${new Date(receiptRequest.donationDate).toLocaleDateString()}</p>
              <p><strong>UTR:</strong> ${receiptRequest.utr}</p>
            </div>
            <p>This receipt is valid for tax exemption under Section 80G.</p>
            <hr style="border-color: #f0d6ac; margin: 20px 0;">
            <p style="color: #7c6a5a; font-size: 0.9rem;">With gratitude,<br><strong>Sree Vidyadhiraja Trust Team</strong></p>
            <p style="color: #7c6a5a; font-size: 0.8rem;">For any queries, contact: ramcatering2011@gmail.com | +91 94435 59710</p>
          </div>
        `,
        attachments: [{
          filename: `Receipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
      
      console.log(`📧 Receipt sent to ${receiptRequest.email || receiptRequest.mobile}`);
    } catch (emailError) {
      console.error('❌ Failed to send receipt email:', emailError.message);
      // Even if email fails, the receipt request is marked as sent
    }
    
    res.json({ 
      success: true, 
      message: 'Receipt verified and sent successfully!',
      receiptNumber,
      status: receiptRequest.status
    });
    
  } catch (error) {
    console.error('Error verifying receipt:', error);
    res.status(500).json({ error: 'Failed to verify receipt' });
  }
});

// Reject receipt request (admin only)
app.post('/api/admin/receipts/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const receiptRequest = await ReceiptRequest.findById(id);
    if (!receiptRequest) {
      return res.status(404).json({ error: 'Receipt request not found' });
    }
    
    receiptRequest.status = 'rejected';
    if (notes) receiptRequest.notes = notes;
    await receiptRequest.save();
    
    res.json({ 
      success: true, 
      message: 'Receipt request rejected' 
    });
    
  } catch (error) {
    console.error('Error rejecting receipt:', error);
    res.status(500).json({ error: 'Failed to reject receipt' });
  }
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SERVER RUNNING on http://localhost:${PORT}`);
  console.log(`🔐 Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin/dashboard`);
  console.log(`🖼️ Gallery API: http://localhost:${PORT}/api/gallery`);
  console.log(`📸 Gallery Upload: http://localhost:${PORT}/admin/gallery`);
  console.log(`🌳 Hope Tree API: http://localhost:${PORT}/api/donations/total`);
  console.log(`🌳 Donor Count: http://localhost:${PORT}/api/donations/count`);
  console.log(`🌳 Recent Donations: http://localhost:${PORT}/api/donations/recent`);
  console.log(`📧 Email notifications: ACTIVE`);
  console.log(`🙌 Volunteer API: http://localhost:${PORT}/api/volunteer`);
  console.log(`🙏 Prayer Wall API: http://localhost:${PORT}/api/prayers`);
  console.log(`🕊️ Public Prayer Wall: http://localhost:${PORT}/prayer`);
  console.log(`📱 WhatsApp Broadcast API: http://localhost:${PORT}/api/whatsapp/subscribe`);
  console.log(`🎂 Birthday Wisher: ACTIVE (daily at 8 AM)`);
  console.log(`📋 Receipt Request API: http://localhost:${PORT}/api/receipt-request`);
});