// server.js - Complete with Admin Panel, Gallery, Hope Tree, Email Notifications, Volunteer Registration, Prayer Wall, WhatsApp Broadcast, and Birthday Wisher!

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

// Import routes
const adminRoutes = require('./routes/admin');

// 📧 Import email service
const emailService = require('./utils/emailService');

// Import models
const Volunteer = require('./models/Volunteer');
const Prayer = require('./models/Prayer');
const WhatsAppSubscriber = require('./models/WhatsAppSubscriber'); // NEW
const BirthdayReminder = require('./models/BirthdayReminder'); // NEW

// Import Prayer Wall routes
const prayerRoutes = require('./routes/prayer');

// Import the public WhatsApp routes
const whatsappRoutes = require('./routes/whatsapp');

// MongoDB connection string
const MONGODB_URI = 'mongodb://ajaybijukumar308_db_user:73HpqSFTQmAo84jH@ac-yow4amz-shard-00-00.peiimob.mongodb.net:27017,ac-yow4amz-shard-00-01.peiimob.mongodb.net:27017,ac-yow4amz-shard-00-02.peiimob.mongodb.net:27017/charity_db?ssl=true&replicaSet=atlas-iujpzd-shard-0&authSource=admin&appName=Cluster0n';

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
app.use('/prayer', prayerRoutes);

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

const PORT = 5000;
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
});