// routes/admin.js - Enhanced Admin Dashboard with Charts, Export, Reply, Volunteers, Donation Reports, Volunteer Analytics, Event Calendar, Prayer Wall, WhatsApp Broadcast, and Birthday Wisher

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Donation = require('../models/Donation');
const Volunteer = require('../models/Volunteer');
const EmailLog = require('../models/EmailLog');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Prayer = require('../models/Prayer');
const WhatsAppSubscriber = require('../models/WhatsAppSubscriber');
const BirthdayReminder = require('../models/BirthdayReminder');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Simple admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('charity123', 10); // Password: charity123

// Email transporter for replies
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware to check if admin is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Login page
router.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Login - Charity Foundation</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #fff0e0, #fffaf2);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background: white;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(124, 45, 18, 0.15);
          width: 100%;
          max-width: 400px;
          border: 1px solid #f0d6ac;
        }
        h1 {
          font-family: 'Playfair Display', serif;
          color: #7c2d12;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          color: #7c6a5a;
          text-align: center;
          margin-bottom: 30px;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #2b1810;
          font-weight: 500;
          font-size: 0.9rem;
        }
        input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #f0d6ac;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
        button {
          width: 100%;
          padding: 14px;
          background: #d97706;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        button:hover {
          background: #b85e00;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(217, 119, 6, 0.3);
        }
        .error {
          background: #fee2e2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 0.9rem;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #7c6a5a;
          font-size: 0.8rem;
        }
        .footer a {
          color: #d97706;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>Admin Login</h1>
        <p class="subtitle">Sree Vidyadhiraja Charity</p>
        ${req.query.error ? '<div class="error">Invalid username or password</div>' : ''}
        <form method="POST" action="/admin/login">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Login to Dashboard</button>
        </form>
        <div class="footer">
          <p>Default credentials: <strong>admin / charity123</strong></p>
          <p><a href="/">← Back to Website</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Login form submission
router.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    req.session.admin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ========== EXPORT TO EXCEL ==========
router.get('/export/messages', isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    
    const data = messages.map(m => ({
      Date: new Date(m.createdAt).toLocaleDateString(),
      Name: m.name,
      Email: m.email,
      Phone: m.phone || '-',
      Message: m.message,
      Status: m.read ? 'Read' : 'Unread'
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Messages');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=messages.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.redirect('/admin/dashboard?error=Export failed');
  }
});

router.get('/export/donations', isAuthenticated, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    const data = donations.map(d => ({
      Date: new Date(d.createdAt).toLocaleDateString(),
      Donor: d.donorName,
      Email: d.donorEmail,
      Phone: d.donorPhone || '-',
      Amount: d.amount,
      'Payment ID': d.razorpayPaymentId || '-'
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=donations.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.redirect('/admin/dashboard?error=Export failed');
  }
});

// ========== EXPORT VOLUNTEERS TO EXCEL ==========
router.get('/export/volunteers', isAuthenticated, async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    
    const data = volunteers.map(v => ({
      Date: new Date(v.createdAt).toLocaleDateString(),
      Name: v.name,
      Phone: v.phone,
      Email: v.email,
      Type: v.type,
      Message: v.message || '-',
      Status: v.status
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.redirect('/admin/dashboard?error=Export failed');
  }
});

// ========== EXPORT DONATION REPORT AS PDF ==========
router.get('/export/donation-report', isAuthenticated, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    // Calculate monthly totals
    const monthlyData = {};
    donations.forEach(d => {
      const month = d.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthlyData[month] = (monthlyData[month] || 0) + d.amount;
    });
    
    // Create PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=donation-report.pdf');
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Donation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Monthly summary
    doc.fontSize(16).text('Monthly Summary');
    doc.moveDown();
    
    Object.entries(monthlyData).forEach(([month, total]) => {
      doc.fontSize(12).text(`${month}: ₹${total.toLocaleString()}`);
    });
    
    doc.moveDown();
    doc.fontSize(14).text(`Total Donations: ₹${donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text(`Number of Donations: ${donations.length}`);
    
    doc.end();
    
    // Log the export with TTL
    await EmailLog.create({
      recipient: 'admin',
      subject: 'Donation Report Downloaded',
      type: 'report',
      metadata: { reportType: 'donation-pdf', count: donations.length }
    });
    
  } catch (error) {
    console.error('PDF export error:', error);
    res.redirect('/admin/dashboard?error=PDF export failed');
  }
});

// ========== BULK EMAIL TO VOLUNTEERS ==========

// Serve bulk email page
router.get('/bulk-email', isAuthenticated, async (req, res) => {
  try {
    // Get filter counts for display
    const volunteers = await Volunteer.find();
    const types = {
      all: volunteers.length,
      volunteer: volunteers.filter(v => v.type === 'volunteer').length,
      partner: volunteers.filter(v => v.type === 'partner').length,
      fundraising: volunteers.filter(v => v.type === 'fundraising').length
    };
    const statuses = {
      all: volunteers.length,
      new: volunteers.filter(v => v.status === 'new').length,
      contacted: volunteers.filter(v => v.status === 'contacted').length,
      approved: volunteers.filter(v => v.status === 'approved').length
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Email - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 15px;
          }
          .nav-link {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.2s;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .form-container {
            background: white;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
          }
          .form-title {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            color: #7c2d12;
            margin-bottom: 30px;
          }
          .filter-section {
            background: #f9f9f9;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .filter-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #7c2d12;
            margin-bottom: 15px;
          }
          .filter-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .filter-group label {
            font-weight: 500;
            color: #2b1810;
          }
          .filter-select {
            padding: 10px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
          }
          .stats-badge {
            display: inline-block;
            background: #fff0d9;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #7c2d12;
            margin-left: 10px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2b1810;
          }
          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #f0d6ac;
            border-radius: 12px;
            font-size: 1rem;
            font-family: 'Poppins', sans-serif;
          }
          .form-group textarea {
            min-height: 150px;
            resize: vertical;
          }
          .btn {
            background: #d97706;
            color: white;
            padding: 12px 28px;
            border: none;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #b85e00;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(217, 119, 6, 0.3);
          }
          .btn-secondary {
            background: #7c2d12;
            margin-left: 10px;
          }
          .btn-secondary:hover {
            background: #5f230e;
          }
          .progress-container {
            margin-top: 30px;
            display: none;
          }
          .progress-bar {
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #d97706, #7c2d12);
            width: 0%;
            transition: width 0.3s ease;
          }
          .progress-text {
            text-align: center;
            color: #7c6a5a;
          }
          .result-message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 12px;
            display: none;
          }
          .success {
            background: #dcfce7;
            color: #166534;
          }
          .error {
            background: #fee2e2;
            color: #b91c1c;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>Bulk Email to Volunteers</h1>
            <div class="nav-links">
              <a href="/admin/dashboard" class="nav-link">Dashboard</a>
              <a href="/admin/logout" class="nav-link">Logout</a>
            </div>
          </div>
        </div>

        <div class="container">
          <div class="form-container">
            <h2 class="form-title">Send Bulk Email</h2>
            
            <form id="bulkEmailForm">
              <div class="filter-section">
                <div class="filter-title">Filter Volunteers</div>
                <div class="filter-grid">
                  <div class="filter-group">
                    <label>Type <span class="stats-badge" id="typeAllCount">${types.all}</span></label>
                    <select id="typeFilter" class="filter-select">
                      <option value="all">All Types</option>
                      <option value="volunteer">Volunteers (${types.volunteer})</option>
                      <option value="partner">Partners (${types.partner})</option>
                      <option value="fundraising">Fundraising (${types.fundraising})</option>
                    </select>
                  </div>
                  <div class="filter-group">
                    <label>Status <span class="stats-badge" id="statusAllCount">${statuses.all}</span></label>
                    <select id="statusFilter" class="filter-select">
                      <option value="all">All Statuses</option>
                      <option value="new">New (${statuses.new})</option>
                      <option value="contacted">Contacted (${statuses.contacted})</option>
                      <option value="approved">Approved (${statuses.approved})</option>
                    </select>
                  </div>
                </div>
                <div style="text-align: right; margin-top: 10px;">
                  <span id="recipientCount" style="font-weight: 600; color: #d97706;">${types.all}</span> recipients selected
                </div>
              </div>

              <div class="form-group">
                <label for="subject">Email Subject</label>
                <input type="text" id="subject" name="subject" required placeholder="e.g., Upcoming Volunteer Opportunity">
              </div>

              <div class="form-group">
                <label for="message">Email Message</label>
                <textarea id="message" name="message" required placeholder="Write your message here..."></textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <button type="submit" class="btn">📧 Send Emails</button>
                <a href="/admin/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
              </div>
            </form>

            <div id="progressContainer" class="progress-container">
              <div class="progress-bar">
                <div id="progressFill" class="progress-fill"></div>
              </div>
              <div id="progressText" class="progress-text">Sending 0/0 emails...</div>
            </div>

            <div id="resultMessage" class="result-message"></div>
          </div>
        </div>

        <script>
          const typeFilter = document.getElementById('typeFilter');
          const statusFilter = document.getElementById('statusFilter');
          const recipientCountSpan = document.getElementById('recipientCount');
          
          // Update recipient count when filters change
          async function updateRecipientCount() {
            const type = typeFilter.value;
            const status = statusFilter.value;
            try {
              const response = await fetch('/admin/api/volunteer-count?type=' + type + '&status=' + status);
              const data = await response.json();
              recipientCountSpan.textContent = data.count;
            } catch (error) {
              console.error('Error fetching count:', error);
            }
          }
          
          typeFilter.addEventListener('change', updateRecipientCount);
          statusFilter.addEventListener('change', updateRecipientCount);
          
          // Form submission
          document.getElementById('bulkEmailForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            const type = typeFilter.value;
            const status = statusFilter.value;
            
            if (!subject || !message) {
              alert('Please fill subject and message');
              return;
            }
            
            // Show progress
            const progressContainer = document.getElementById('progressContainer');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const resultMessage = document.getElementById('resultMessage');
            
            progressContainer.style.display = 'block';
            resultMessage.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = 'Starting...';
            
            try {
              const response = await fetch('/admin/send-bulk-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message, type, status })
              });
              
              const data = await response.json();
              
              if (data.success) {
                resultMessage.className = 'result-message success';
                resultMessage.innerHTML = \`✅ \${data.message}\`;
              } else {
                resultMessage.className = 'result-message error';
                resultMessage.innerHTML = \`❌ \${data.message}\`;
              }
              resultMessage.style.display = 'block';
              progressContainer.style.display = 'none';
            } catch (error) {
              resultMessage.className = 'result-message error';
              resultMessage.innerHTML = '❌ Failed to send emails. Please try again.';
              resultMessage.style.display = 'block';
              progressContainer.style.display = 'none';
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Bulk email page error:', error);
    res.status(500).send('Error loading bulk email page');
  }
});

// API endpoint to get volunteer count based on filters
router.get('/api/volunteer-count', isAuthenticated, async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    
    const count = await Volunteer.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Error counting volunteers:', error);
    res.status(500).json({ error: 'Failed to count volunteers' });
  }
});

// Handle bulk email sending
router.post('/send-bulk-email', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { subject, message, type, status } = req.body;
    
    // Build query based on filters
    let query = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    
    const volunteers = await Volunteer.find(query).select('name email');
    
    if (volunteers.length === 0) {
      return res.json({ success: false, message: 'No volunteers match the selected filters.' });
    }
    
    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < volunteers.length; i += batchSize) {
      const batch = volunteers.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (volunteer) => {
        try {
          await transporter.sendMail({
            from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
            to: volunteer.email,
            subject: subject,
            html: `
              <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c2d12;">${subject}</h2>
                <p>Dear <strong>${volunteer.name}</strong>,</p>
                <div style="background: #fff0d9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <p>With gratitude,<br><strong>The Sree Vidyadhiraja Charity Team</strong></p>
              </div>
            `
          });
          
          // Log success
          await EmailLog.create({
            recipient: volunteer.email,
            subject: subject,
            type: 'volunteer-bulk',
            metadata: { volunteerName: volunteer.name }
          });
          
          results.success++;
        } catch (error) {
          console.error(`Failed to send to ${volunteer.email}:`, error);
          results.failed++;
        }
      }));
      
      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    res.json({
      success: true,
      message: `Emails sent: ${results.success} successful, ${results.failed} failed.`
    });
    
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending emails.' });
  }
});

// ========== EVENT CALENDAR MANAGEMENT ==========

// Get all events (for calendar display)
router.get('/api/events', isAuthenticated, async (req, res) => {
  try {
    const { start, end, type, status } = req.query;
    let query = {};
    
    if (start && end) {
      query.startDate = { $gte: new Date(start), $lte: new Date(end) };
    }
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    
    const events = await Event.find(query).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event details with registrations
router.get('/api/events/:id', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const registrations = await EventRegistration.find({ eventId: event._id })
      .sort({ registeredAt: -1 });
    
    res.json({ event, registrations });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
router.post('/api/events', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, capacity, type } = req.body;
    
    const event = new Event({
      title,
      description,
      startDate,
      endDate,
      location,
      capacity: capacity || 0,
      type: type || 'volunteer'
    });
    
    await event.save();
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/api/events/:id', isAuthenticated, express.json(), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/api/events/:id', isAuthenticated, async (req, res) => {
  try {
    // Delete all registrations first
    await EventRegistration.deleteMany({ eventId: req.params.id });
    // Delete event
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get registrations for an event
router.get('/api/events/:id/registrations', isAuthenticated, async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ eventId: req.params.id })
      .sort({ registeredAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Update registration status (attended/cancelled)
router.put('/api/registrations/:id', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    
    if (status === 'attended') {
      update.attendedAt = new Date();
    } else if (status === 'cancelled') {
      update.cancelledAt = new Date();
    }
    
    const registration = await EventRegistration.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    res.json({ success: true, registration });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

// Event Calendar Management Page
router.get('/events', isAuthenticated, async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: -1 });
    const volunteers = await Volunteer.find().select('name email');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Calendar - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css">
        <script src="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 15px;
          }
          .nav-link {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .event-form {
            background: white;
            border-radius: 24px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .event-form h2 {
            font-family: 'Playfair Display', serif;
            color: #7c2d12;
            margin-bottom: 20px;
          }
          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 15px;
          }
          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #2b1810;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
          }
          .form-group textarea {
            min-height: 100px;
          }
          .btn {
            background: #d97706;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            text-decoration: none;
            display: inline-block;
          }
          .btn:hover {
            background: #b85e00;
          }
          .btn-secondary {
            background: #7c2d12;
          }
          .btn-secondary:hover {
            background: #5f230e;
          }
          #calendar {
            background: white;
            border-radius: 24px;
            padding: 20px;
            border: 1px solid #f0d6ac;
            margin-bottom: 30px;
          }
          .events-list {
            background: white;
            border-radius: 24px;
            padding: 30px;
            border: 1px solid #f0d6ac;
          }
          .events-list h2 {
            font-family: 'Playfair Display', serif;
            color: #7c2d12;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #fff0d9;
            color: #7c2d12;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f0d6ac;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .status-upcoming {
            background: #fff0d9;
            color: #d97706;
          }
          .status-ongoing {
            background: #dcfce7;
            color: #166534;
          }
          .status-completed {
            background: #e0e0e0;
            color: #666;
          }
          .status-cancelled {
            background: #fee2e2;
            color: #b91c1c;
          }
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
          }
          .modal-content {
            background: white;
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            border-radius: 24px;
            max-height: 80vh;
            overflow-y: auto;
          }
          .registrations-list {
            margin-top: 20px;
          }
          .registration-item {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>Event Calendar</h1>
            <div class="nav-links">
              <a href="/admin/dashboard" class="nav-link">Dashboard</a>
              <a href="/admin/events" class="nav-link">Events</a>
              <a href="/admin/bulk-email" class="nav-link">Bulk Email</a>
              <a href="/admin/logout" class="nav-link">Logout</a>
            </div>
          </div>
        </div>

        <div class="container">
          <!-- Create Event Form -->
          <div class="event-form">
            <h2>Create New Event</h2>
            <form id="eventForm">
              <div class="form-grid">
                <div class="form-group">
                  <label>Title *</label>
                  <input type="text" id="eventTitle" required>
                </div>
                <div class="form-group">
                  <label>Location *</label>
                  <input type="text" id="eventLocation" required>
                </div>
                <div class="form-group">
                  <label>Start Date *</label>
                  <input type="datetime-local" id="eventStartDate" required>
                </div>
                <div class="form-group">
                  <label>End Date *</label>
                  <input type="datetime-local" id="eventEndDate" required>
                </div>
                <div class="form-group">
                  <label>Capacity (0 for unlimited)</label>
                  <input type="number" id="eventCapacity" value="0">
                </div>
                <div class="form-group">
                  <label>Type</label>
                  <select id="eventType">
                    <option value="volunteer">Volunteer</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="outreach">Outreach</option>
                    <option value="meeting">Meeting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea id="eventDescription" required></textarea>
              </div>
              <button type="submit" class="btn">Create Event</button>
            </form>
          </div>

          <!-- Calendar View -->
          <div id="calendar"></div>

          <!-- Events List -->
          <div class="events-list">
            <h2>All Events</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="eventsTableBody">
                ${events.map(event => `
                  <tr>
                    <td>${new Date(event.startDate).toLocaleDateString()}</td>
                    <td>${event.title}</td>
                    <td>${event.location}</td>
                    <td>${event.type}</td>
                    <td><span class="status-badge status-${event.status}">${event.status}</span></td>
                    <td><span id="reg-count-${event._id}">0</span>/${event.capacity || '∞'}</td>
                    <td>
                      <button onclick="viewEvent('${event._id}')" class="btn" style="padding: 5px 10px; font-size: 0.8rem;">View</button>
                      <button onclick="deleteEvent('${event._id}')" class="btn" style="background:#b91c1c; padding: 5px 10px; font-size: 0.8rem;">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Event Details Modal -->
        <div id="eventModal" class="modal">
          <div class="modal-content">
            <h2 id="modalTitle" style="font-family: 'Playfair Display'; color: #7c2d12;"></h2>
            <div id="modalDetails"></div>
            <div id="modalRegistrations" class="registrations-list"></div>
            <button onclick="closeModal()" class="btn btn-secondary" style="margin-top: 20px;">Close</button>
          </div>
        </div>

        <script>
          // Initialize calendar
          document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
              initialView: 'dayGridMonth',
              headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              },
              events: '/admin/api/events',
              eventClick: function(info) {
                viewEvent(info.event.id);
              }
            });
            calendar.render();
          });

          // Load registration counts
          async function loadRegistrationCounts() {
            const events = ${JSON.stringify(events.map(e => e._id))};
            for (const eventId of events) {
              try {
                const response = await fetch('/admin/api/events/' + eventId + '/registrations');
                const registrations = await response.json();
                document.getElementById('reg-count-' + eventId).textContent = registrations.length;
              } catch (error) {
                console.error('Error loading registrations:', error);
              }
            }
          }
          loadRegistrationCounts();

          // Create event
          document.getElementById('eventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const eventData = {
              title: document.getElementById('eventTitle').value,
              description: document.getElementById('eventDescription').value,
              startDate: document.getElementById('eventStartDate').value,
              endDate: document.getElementById('eventEndDate').value,
              location: document.getElementById('eventLocation').value,
              capacity: parseInt(document.getElementById('eventCapacity').value),
              type: document.getElementById('eventType').value
            };
            
            try {
              const response = await fetch('/admin/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
              });
              
              if (response.ok) {
                location.reload();
              } else {
                alert('Failed to create event');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error creating event');
            }
          });

          // View event details
          async function viewEvent(eventId) {
            try {
              const response = await fetch('/admin/api/events/' + eventId);
              const data = await response.json();
              
              document.getElementById('modalTitle').textContent = data.event.title;
              
              let registrationsHtml = '<h3>Registrations</h3>';
              if (data.registrations.length === 0) {
                registrationsHtml += '<p>No registrations yet</p>';
              } else {
                registrationsHtml += data.registrations.map(reg => {
                  return \`
                    <div class="registration-item">
                      <div>
                        <strong>\${reg.volunteerName}</strong><br>
                        \${reg.volunteerEmail}<br>
                        <small>Registered: \${new Date(reg.registeredAt).toLocaleDateString()}</small>
                      </div>
                      <div>
                        <span class="status-badge status-\${reg.status}">\${reg.status}</span>
                      </div>
                    </div>
                  \`;
                }).join('');
              }
              
              document.getElementById('modalDetails').innerHTML = \`
                <p><strong>Date:</strong> \${new Date(data.event.startDate).toLocaleString()}</p>
                <p><strong>Location:</strong> \${data.event.location}</p>
                <p><strong>Type:</strong> \${data.event.type}</p>
                <p><strong>Capacity:</strong> \${data.registrations.length}/\${data.event.capacity || 'Unlimited'}</p>
                <p><strong>Description:</strong> \${data.event.description}</p>
              \`;
              
              document.getElementById('modalRegistrations').innerHTML = registrationsHtml;
              document.getElementById('eventModal').style.display = 'block';
            } catch (error) {
              console.error('Error:', error);
            }
          }

          // Delete event
          async function deleteEvent(eventId) {
            if (!confirm('Are you sure you want to delete this event? All registrations will also be deleted.')) {
              return;
            }
            
            try {
              const response = await fetch('/admin/api/events/' + eventId, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                location.reload();
              } else {
                alert('Failed to delete event');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error deleting event');
            }
          }

          function closeModal() {
            document.getElementById('eventModal').style.display = 'none';
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading events page:', error);
    res.status(500).send('Error loading events');
  }
});

// ========== PRAYER WALL ADMIN ==========

// Get all prayers for admin
router.get('/api/prayers/all', isAuthenticated, async (req, res) => {
  try {
    const prayers = await Prayer.find().sort({ createdAt: -1 });
    res.json(prayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

// Update prayer status (approve/reject/feature)
router.put('/api/prayers/:id/status', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    
    if (status === 'approved') {
      update.approvedAt = new Date();
    } else if (status === 'featured') {
      update.featuredAt = new Date();
      update.approvedAt = new Date();
    }
    
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    
    res.json({ success: true, prayer });
  } catch (error) {
    console.error('Error updating prayer:', error);
    res.status(500).json({ error: 'Failed to update prayer' });
  }
});

// Delete prayer
router.delete('/api/prayers/:id', isAuthenticated, async (req, res) => {
  try {
    await Prayer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prayer:', error);
    res.status(500).json({ error: 'Failed to delete prayer' });
  }
});

// Prayer Wall Admin Page
router.get('/prayers', isAuthenticated, async (req, res) => {
  try {
    const prayers = await Prayer.find().sort({ createdAt: -1 });
    
    const counts = {
      pending: prayers.filter(p => p.status === 'pending').length,
      approved: prayers.filter(p => p.status === 'approved').length,
      featured: prayers.filter(p => p.status === 'featured').length,
      total: prayers.length
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prayer Wall Admin - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 15px;
          }
          .nav-link {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #7c2d12;
          }
          .stat-label {
            color: #7c6a5a;
            font-size: 0.9rem;
          }
          .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .filter-btn {
            background: white;
            border: 1px solid #f0d6ac;
            padding: 8px 16px;
            border-radius: 40px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          }
          .filter-btn:hover {
            background: #fff0d9;
          }
          .filter-btn.active {
            background: #d97706;
            color: white;
            border-color: #d97706;
          }
          .prayers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }
          .prayer-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 20px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
            transition: transform 0.3s ease;
          }
          .prayer-card:hover {
            transform: translateY(-3px);
          }
          .prayer-card.featured {
            border: 2px solid #d97706;
            background: linear-gradient(135deg, #fff0d9, white);
          }
          .prayer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .prayer-name {
            font-weight: 600;
            color: #7c2d12;
          }
          .prayer-status {
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .status-pending {
            background: #fee2e2;
            color: #b91c1c;
          }
          .status-approved {
            background: #dcfce7;
            color: #166534;
          }
          .status-featured {
            background: #d97706;
            color: white;
          }
          .status-rejected {
            background: #e0e0e0;
            color: #666;
          }
          .prayer-text {
            font-style: italic;
            margin: 15px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 12px;
          }
          .prayer-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #7c6a5a;
            margin-bottom: 15px;
          }
          .prayer-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
          }
          .btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
          .btn-approve {
            background: #166534;
            color: white;
          }
          .btn-feature {
            background: #d97706;
            color: white;
          }
          .btn-reject {
            background: #b91c1c;
            color: white;
          }
          .btn-delete {
            background: #7c6a5a;
            color: white;
          }
          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }
            .prayers-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>Prayer Wall Admin</h1>
            <div class="nav-links">
              <a href="/admin/dashboard" class="nav-link">Dashboard</a>
              <a href="/admin/prayers" class="nav-link">Prayers</a>
              <a href="/admin/events" class="nav-link">Events</a>
              <a href="/admin/bulk-email" class="nav-link">Bulk Email</a>
              <a href="/admin/logout" class="nav-link">Logout</a>
            </div>
          </div>
        </div>

        <div class="container">
          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${counts.pending}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${counts.approved}</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${counts.featured}</div>
              <div class="stat-label">Featured</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${counts.total}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters">
            <button class="filter-btn active" onclick="filterPrayers('all')">All</button>
            <button class="filter-btn" onclick="filterPrayers('pending')">Pending <span style="background: #b91c1c; color: white; padding: 2px 8px; border-radius: 20px; margin-left: 5px;">${counts.pending}</span></button>
            <button class="filter-btn" onclick="filterPrayers('approved')">Approved <span style="background: #166534; color: white; padding: 2px 8px; border-radius: 20px; margin-left: 5px;">${counts.approved}</span></button>
            <button class="filter-btn" onclick="filterPrayers('featured')">Featured <span style="background: #d97706; color: white; padding: 2px 8px; border-radius: 20px; margin-left: 5px;">${counts.featured}</span></button>
          </div>

          <!-- Prayers Grid -->
          <div id="prayersGrid" class="prayers-grid">
            ${prayers.map(prayer => `
              <div class="prayer-card ${prayer.status === 'featured' ? 'featured' : ''}" data-status="${prayer.status}">
                <div class="prayer-header">
                  <span class="prayer-name">${prayer.isAnonymous ? 'Anonymous' : prayer.name}</span>
                  <span class="prayer-status status-${prayer.status}">${prayer.status}</span>
                </div>
                <div class="prayer-text">"${prayer.prayer}"</div>
                <div class="prayer-meta">
                  <span>🙏 ${prayer.blessCount} blessings</span>
                  <span>📅 ${new Date(prayer.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="prayer-actions">
                  ${prayer.status === 'pending' ? `
                    <button onclick="updateStatus('${prayer._id}', 'approved')" class="btn btn-approve">✓ Approve</button>
                    <button onclick="updateStatus('${prayer._id}', 'rejected')" class="btn btn-reject">✗ Reject</button>
                  ` : ''}
                  ${prayer.status === 'approved' ? `
                    <button onclick="updateStatus('${prayer._id}', 'featured')" class="btn btn-feature">⭐ Feature</button>
                    <button onclick="updateStatus('${prayer._id}', 'rejected')" class="btn btn-reject">✗ Reject</button>
                  ` : ''}
                  ${prayer.status === 'featured' ? `
                    <button onclick="updateStatus('${prayer._id}', 'approved')" class="btn btn-approve">✓ Unfeature</button>
                  ` : ''}
                  <button onclick="deletePrayer('${prayer._id}')" class="btn btn-delete">🗑️ Delete</button>
                </div>
                <div style="margin-top: 10px; font-size: 0.8rem; color: #7c6a5a;">
                  <small>Email: ${prayer.email}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <script>
          function filterPrayers(status) {
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Filter cards
            const cards = document.querySelectorAll('.prayer-card');
            cards.forEach(card => {
              if (status === 'all' || card.dataset.status === status) {
                card.style.display = 'block';
              } else {
                card.style.display = 'none';
              }
            });
          }

          async function updateStatus(id, status) {
            try {
              const response = await fetch('/admin/api/prayers/' + id + '/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
              });
              
              if (response.ok) {
                location.reload();
              } else {
                alert('Failed to update status');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error updating status');
            }
          }

          async function deletePrayer(id) {
            if (!confirm('Are you sure you want to delete this prayer?')) return;
            
            try {
              const response = await fetch('/admin/api/prayers/' + id, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                location.reload();
              } else {
                alert('Failed to delete prayer');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error deleting prayer');
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading prayer admin:', error);
    res.status(500).send('Error loading prayer admin');
  }
});

// ========== GET MONTHLY DONATION DATA FOR CHARTS ==========
router.get('/api/donations/monthly', isAuthenticated, async (req, res) => {
  try {
    const donations = await Donation.find();
    
    // Get last 12 months
    const months = [];
    const monthlyTotals = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      months.push(`${monthName} ${year}`);
      
      // Calculate total for this month
      const total = donations
        .filter(don => {
          const donDate = new Date(don.createdAt);
          return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, don) => sum + don.amount, 0);
      
      monthlyTotals.push(total);
    }
    
    res.json({ months, totals: monthlyTotals });
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// ========== GET YEAR-OVER-YEAR COMPARISON ==========
router.get('/api/donations/yoy', isAuthenticated, async (req, res) => {
  try {
    const donations = await Donation.find();
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    
    // Current year total
    const currentYearTotal = donations
      .filter(d => new Date(d.createdAt).getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.amount, 0);
    
    // Last year total
    const lastYearTotal = donations
      .filter(d => new Date(d.createdAt).getFullYear() === lastYear)
      .reduce((sum, d) => sum + d.amount, 0);
    
    // Percentage change
    const change = lastYearTotal === 0 ? 100 : ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1);
    
    res.json({
      currentYear,
      lastYear,
      currentYearTotal,
      lastYearTotal,
      change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    });
  } catch (error) {
    console.error('Error fetching YoY data:', error);
    res.status(500).json({ error: 'Failed to fetch YoY data' });
  }
});

// ========== UPDATE VOLUNTEER STATUS ==========
router.post('/update-volunteer-status/:id', isAuthenticated, express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await Volunteer.findByIdAndUpdate(id, { status });
    res.redirect('/admin/dashboard?success=Volunteer status updated');
  } catch (error) {
    console.error('Status update error:', error);
    res.redirect('/admin/dashboard?error=Failed to update status');
  }
});

// ========== REPLY TO MESSAGE ==========
router.post('/reply-message/:id', isAuthenticated, express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;
    
    const message = await Message.findById(id);
    if (!message) {
      return res.redirect('/admin/dashboard?error=Message not found');
    }
    
    await transporter.sendMail({
      from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
      to: message.email,
      subject: `Re: Your message to Sree Vidyadhiraja Charity`,
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c2d12;">Reply from Sree Vidyadhiraja Charity</h2>
          <p>Dear <strong>${message.name}</strong>,</p>
          <div style="background: #fff0d9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>
          <p>With gratitude,<br><strong>The Sree Vidyadhiraja Charity Team</strong></p>
          <hr>
          <p style="color: #7c6a5a; font-size: 0.9rem;">Your original message:</p>
          <p style="color: #7c6a5a; font-style: italic;">"${message.message}"</p>
        </div>
      `
    });
    
    // Log the email with TTL (auto-delete after 1 year)
    await EmailLog.create({
      recipient: message.email,
      subject: `Reply to ${message.name}`,
      type: 'contact-reply',
      metadata: { messageId: id, messagePreview: message.message.substring(0, 50) }
    });
    
    await Message.findByIdAndUpdate(id, { read: true });
    
    res.redirect('/admin/dashboard?success=Reply sent successfully');
  } catch (error) {
    console.error('Reply error:', error);
    res.redirect('/admin/dashboard?error=Failed to send reply');
  }
});

// ========== DASHBOARD (ENHANCED WITH DONATION REPORTS AND VOLUNTEER ANALYTICS) ==========
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    const donations = await Donation.find().sort({ createdAt: -1 });
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    
    // Prepare chart data
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();
    
    const dailyDonations = last7Days.map(date => {
      return donations.filter(d => 
        new Date(d.createdAt).toLocaleDateString() === date
      ).reduce((sum, d) => sum + d.amount, 0);
    });
    
    // Get monthly data for chart
    const monthlyData = {};
    donations.forEach(d => {
      const month = d.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[month] = (monthlyData[month] || 0) + d.amount;
    });
    
    const monthlyLabels = Object.keys(monthlyData).slice(-12);
    const monthlyValues = Object.values(monthlyData).slice(-12);
    
    // Get year-over-year data
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearTotal = donations
      .filter(d => new Date(d.createdAt).getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.amount, 0);
    
    const lastYearTotal = donations
      .filter(d => new Date(d.createdAt).getFullYear() === lastYear)
      .reduce((sum, d) => sum + d.amount, 0);
    
    const yoyChange = lastYearTotal === 0 ? 100 : ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1);
    
    // ========== VOLUNTEER ANALYTICS ==========
    
    // Volunteer trends over last 12 months
    const volunteerMonthlyData = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      volunteerMonthlyData[monthName] = 0;
    }
    
    volunteers.forEach(v => {
      const month = v.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (volunteerMonthlyData.hasOwnProperty(month)) {
        volunteerMonthlyData[month]++;
      }
    });
    
    const volunteerMonthlyLabels = Object.keys(volunteerMonthlyData);
    const volunteerMonthlyValues = Object.values(volunteerMonthlyData);
    
    // Type distribution
    const volunteerTypes = {
      volunteer: volunteers.filter(v => v.type === 'volunteer').length,
      partner: volunteers.filter(v => v.type === 'partner').length,
      fundraising: volunteers.filter(v => v.type === 'fundraising').length
    };
    
    // Status funnel
    const statusFunnel = {
      new: volunteers.filter(v => v.status === 'new').length,
      contacted: volunteers.filter(v => v.status === 'contacted').length,
      approved: volunteers.filter(v => v.status === 'approved').length
    };
    
    // Conversion rates
    const totalVolunteers = volunteers.length;
    const conversionRates = {
      newToContacted: totalVolunteers > 0 ? ((statusFunnel.contacted / totalVolunteers) * 100).toFixed(1) : 0,
      contactedToApproved: statusFunnel.contacted > 0 ? ((statusFunnel.approved / statusFunnel.contacted) * 100).toFixed(1) : 0,
      overall: totalVolunteers > 0 ? ((statusFunnel.approved / totalVolunteers) * 100).toFixed(1) : 0
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Dashboard - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.2s;
          }
          .logout-btn:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .success-message {
            background: #dcfce7;
            color: #166534;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .error-message {
            background: #fee2e2;
            color: #b91c1c;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
          }
          .stat-card h3 {
            color: #7c6a5a;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 600;
            color: #7c2d12;
            font-family: 'Playfair Display', serif;
          }
          .chart-container {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .chart-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .chart-row-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .report-section {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .yoy-card {
            background: linear-gradient(135deg, #fff0d9, white);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid #d97706;
          }
          .yoy-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: ${yoyChange >= 0 ? '#166534' : '#b91c1c'};
          }
          .yoy-label {
            color: #7c6a5a;
            font-size: 0.9rem;
          }
          .action-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .btn {
            background: #d97706;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
          .btn:hover {
            background: #b85e00;
          }
          .btn-secondary {
            background: #7c2d12;
          }
          .btn-secondary:hover {
            background: #5f230e;
          }
          .btn-success {
            background: #166534;
          }
          .btn-success:hover {
            background: #0f4224;
          }
          .btn-pdf {
            background: #b91c1c;
          }
          .btn-pdf:hover {
            background: #7f1d1d;
          }
          .funnel-card {
            background: linear-gradient(135deg, #fff0d9, white);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            border: 1px solid #d97706;
          }
          .funnel-value {
            font-size: 2rem;
            font-weight: 700;
            color: #7c2d12;
          }
          .funnel-label {
            color: #7c6a5a;
            font-size: 0.9rem;
            margin-top: 5px;
          }
          .funnel-percent {
            font-size: 1.2rem;
            color: #d97706;
            font-weight: 600;
          }
          .section {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .section h2 {
            font-family: 'Playfair Display', serif;
            color: #7c2d12;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0d6ac;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            padding: 12px;
            background: #fff0d9;
            color: #7c2d12;
            font-weight: 600;
            font-size: 0.9rem;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f0d6ac;
            color: #2b1810;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .badge.unread {
            background: #fee2e2;
            color: #b91c1c;
          }
          .badge.read {
            background: #dcfce7;
            color: #166534;
          }
          .badge.new {
            background: #fee2e2;
            color: #b91c1c;
          }
          .badge.contacted {
            background: #fff0d9;
            color: #d97706;
          }
          .badge.approved {
            background: #dcfce7;
            color: #166534;
          }
          .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            background: #f0f9f0;
            color: #2d5a2d;
            text-transform: capitalize;
          }
          .reply-form {
            display: none;
            margin-top: 10px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
          }
          .reply-form textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            margin-bottom: 10px;
            font-family: 'Poppins', sans-serif;
          }
          .reply-btn {
            background: #d97706;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            text-decoration: none;
            display: inline-block;
            margin: 2px;
          }
          .status-form {
            display: inline-block;
          }
          .status-select {
            padding: 4px 8px;
            border: 1px solid #f0d6ac;
            border-radius: 20px;
            font-size: 0.8rem;
            font-family: 'Poppins', sans-serif;
            background: white;
          }
          .stats-mini-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .stats-mini-card {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
          }
          .stats-mini-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #7c2d12;
          }
          .stats-mini-label {
            font-size: 0.8rem;
            color: #7c6a5a;
          }
          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }
            .chart-row,
            .chart-row-3 {
              grid-template-columns: 1fr;
            }
            table {
              display: block;
              overflow-x: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>Admin Dashboard <span>Sree Vidyadhiraja Charity</span></h1>
            <a href="/admin/logout" class="logout-btn">Logout</a>
          </div>
        </div>
        
        <div class="container">
          ${req.query.success ? `<div class="success-message">✅ ${req.query.success}</div>` : ''}
          ${req.query.error ? `<div class="error-message">❌ ${req.query.error}</div>` : ''}
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <a href="/admin/export/messages" class="btn">📥 Export Messages</a>
            <a href="/admin/export/donations" class="btn btn-secondary">📥 Export Donations</a>
            <a href="/admin/export/volunteers" class="btn btn-success">📥 Export Volunteers</a>
            <a href="/admin/export/donation-report" class="btn btn-pdf">📄 Download PDF Report</a>
            <a href="/admin/bulk-email" class="btn" style="background: #7c2d12;">📧 Bulk Email</a>
            <a href="/admin/events" class="btn" style="background: #2d5a2d;">📅 Event Calendar</a>
            <a href="/admin/prayers" class="btn" style="background: #d97706;">🙏 Prayer Wall</a>
            <a href="/admin/whatsapp" class="btn" style="background: #25D366;">📱 WhatsApp</a>
            <a href="/admin/birthdays" class="btn" style="background: #d4a017;">🎂 Birthdays</a>
          </div>
          
          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Messages</h3>
              <div class="stat-number">${messages.length}</div>
              <div class="stat-label">Contact form</div>
            </div>
            <div class="stat-card">
              <h3>Unread Messages</h3>
              <div class="stat-number">${messages.filter(m => !m.read).length}</div>
              <div class="stat-label">Need attention</div>
            </div>
            <div class="stat-card">
              <h3>Total Donations</h3>
              <div class="stat-number">${donations.length}</div>
              <div class="stat-label">Number of donations</div>
            </div>
            <div class="stat-card">
              <h3>Total Amount</h3>
              <div class="stat-number">₹${totalDonations.toLocaleString()}</div>
              <div class="stat-label">From donations</div>
            </div>
            <div class="stat-card">
              <h3>Total Volunteers</h3>
              <div class="stat-number">${volunteers.length}</div>
              <div class="stat-label">New registrations</div>
            </div>
          </div>
          
          <!-- Donation Reports Section -->
          <div class="report-section">
            <div class="report-header">
              <h2 style="font-family: 'Playfair Display'; color: #7c2d12;">📊 Donation Reports</h2>
              <div class="yoy-card">
                <div class="yoy-label">Year-over-Year Growth</div>
                <div class="yoy-value">${yoyChange >= 0 ? '+' : ''}${yoyChange}%</div>
                <div class="yoy-label">${currentYear} vs ${lastYear}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="background: #fff0d9; padding: 15px; border-radius: 12px;">
                <div style="color: #7c6a5a; font-size: 0.9rem;">${currentYear} Total</div>
                <div style="font-size: 2rem; font-weight: 700; color: #7c2d12;">₹${currentYearTotal.toLocaleString()}</div>
              </div>
              <div style="background: #f0f9f0; padding: 15px; border-radius: 12px;">
                <div style="color: #7c6a5a; font-size: 0.9rem;">${lastYear} Total</div>
                <div style="font-size: 2rem; font-weight: 700; color: #2d5a2d;">₹${lastYearTotal.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <!-- Chart Row 1: Donation Charts -->
          <div class="chart-row">
            <!-- Daily Chart -->
            <div class="chart-container">
              <h2 style="font-family: 'Playfair Display'; color: #7c2d12; margin-bottom: 20px;">📊 Donations (Last 7 Days)</h2>
              <canvas id="donationChart"></canvas>
            </div>
            
            <!-- Monthly Chart -->
            <div class="chart-container">
              <h2 style="font-family: 'Playfair Display'; color: #7c2d12; margin-bottom: 20px;">📈 Monthly Donations</h2>
              <canvas id="monthlyChart"></canvas>
            </div>
          </div>
          
          <!-- ========== VOLUNTEER ANALYTICS SECTION ========== -->
          <div class="report-section">
            <h2 style="font-family: 'Playfair Display'; color: #7c2d12; margin-bottom: 20px;">🙌 Volunteer Analytics</h2>
            
            <!-- Conversion Funnel -->
            <div class="chart-row-3" style="margin-bottom: 30px;">
              <div class="funnel-card">
                <div class="funnel-value">${statusFunnel.new}</div>
                <div class="funnel-label">New Registrations</div>
                <div class="funnel-percent">100%</div>
              </div>
              <div class="funnel-card">
                <div class="funnel-value">${statusFunnel.contacted}</div>
                <div class="funnel-label">Contacted</div>
                <div class="funnel-percent">${conversionRates.newToContacted}%</div>
              </div>
              <div class="funnel-card">
                <div class="funnel-value">${statusFunnel.approved}</div>
                <div class="funnel-label">Approved</div>
                <div class="funnel-percent">${conversionRates.overall}%</div>
              </div>
            </div>
            
            <!-- Type Distribution Stats -->
            <div class="stats-mini-grid">
              <div class="stats-mini-card">
                <div class="stats-mini-value">${volunteerTypes.volunteer}</div>
                <div class="stats-mini-label">Volunteers</div>
              </div>
              <div class="stats-mini-card">
                <div class="stats-mini-value">${volunteerTypes.partner}</div>
                <div class="stats-mini-label">Partners</div>
              </div>
              <div class="stats-mini-card">
                <div class="stats-mini-value">${volunteerTypes.fundraising}</div>
                <div class="stats-mini-label">Fundraising</div>
              </div>
            </div>
          </div>
          
          <!-- Chart Row 2: Volunteer Charts -->
          <div class="chart-row">
            <!-- Volunteer Trends Chart -->
            <div class="chart-container">
              <h2 style="font-family: 'Playfair Display'; color: #7c2d12; margin-bottom: 20px;">📈 Volunteer Trends (12 Months)</h2>
              <canvas id="volunteerTrendChart"></canvas>
            </div>
            
            <!-- Volunteer Types Chart -->
            <div class="chart-container">
              <h2 style="font-family: 'Playfair Display'; color: #7c2d12; margin-bottom: 20px;">🥧 Volunteer Types</h2>
              <canvas id="volunteerTypeChart"></canvas>
            </div>
          </div>
          
          <!-- Messages Section -->
          <div class="section">
            <h2>📬 Contact Messages</h2>
            ${messages.length === 0 ? 
              '<div style="text-align: center; color: #7c6a5a; padding: 40px;">No messages yet</div>' : 
              '<table><tr><th>Date</th><th>Name</th><th>Email</th><th>Message</th><th>Status</th><th>Actions</th></tr>' + 
              messages.map((m, index) => `
                <tr>
                  <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>${m.name}</td>
                  <td>${m.email}</td>
                  <td>${m.message.substring(0, 50)}${m.message.length > 50 ? '...' : ''}</td>
                  <td><span class="badge ${m.read ? 'read' : 'unread'}">${m.read ? 'Read' : 'Unread'}</span></td>
                  <td>
                    <button onclick="toggleReplyForm('reply-${index}')" class="reply-btn">✉️ Reply</button>
                    ${!m.read ? `<a href="/admin/mark-read/${m._id}" class="reply-btn">✓ Mark Read</a>` : ''}
                    <a href="/admin/delete-message/${m._id}" class="reply-btn" style="background:#b91c1c;" onclick="return confirm('Delete this message?')">🗑️ Delete</a>
                    
                    <div id="reply-${index}" class="reply-form">
                      <form method="POST" action="/admin/reply-message/${m._id}">
                        <textarea name="replyMessage" rows="3" placeholder="Type your reply..." required></textarea>
                        <button type="submit" class="reply-btn">Send Reply</button>
                        <button type="button" onclick="toggleReplyForm('reply-${index}')" class="reply-btn" style="background:#7c6a5a;">Cancel</button>
                      </form>
                    </div>
                  </td>
                </tr>
              `).join('') + '</table>'
            }
          </div>
          
          <!-- Donations Section -->
          <div class="section">
            <h2>💰 Donations</h2>
            ${donations.length === 0 ? 
              '<div style="text-align: center; color: #7c6a5a; padding: 40px;">No donations yet</div>' : 
              '<table><tr><th>Date</th><th>Donor</th><th>Email</th><th>Amount</th><th>Payment ID</th></tr>' + 
              donations.map(d => `
                <tr>
                  <td>${new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>${d.donorName}</td>
                  <td>${d.donorEmail}</td>
                  <td style="font-weight: 600; color: #d97706;">₹${d.amount}</td>
                  <td><small>${d.razorpayPaymentId ? d.razorpayPaymentId.substring(0, 10) + '...' : '-'}</small></td>
                </tr>
              `).join('') + '</table>'
            }
          </div>
          
          <!-- Volunteers Section -->
          <div class="section">
            <h2>🙌 Volunteer Registrations</h2>
            ${volunteers.length === 0 ? 
              '<div style="text-align: center; color: #7c6a5a; padding: 40px;">No volunteers yet</div>' : 
              '<table><tr><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Type</th><th>Message</th><th>Status</th><th>Actions</th></tr>' + 
              volunteers.map(v => `
                <tr>
                  <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                  <td>${v.name}</td>
                  <td>${v.phone}</td>
                  <td><a href="mailto:${v.email}">${v.email}</a></td>
                  <td><span class="type-badge">${v.type}</span></td>
                  <td>${v.message ? v.message.substring(0, 30) + (v.message.length > 30 ? '...' : '') : '-'}</td>
                  <td><span class="badge ${v.status}">${v.status}</span></td>
                  <td>
                    <form method="POST" action="/admin/update-volunteer-status/${v._id}" class="status-form">
                      <select name="status" class="status-select" onchange="this.form.submit()">
                        <option value="new" ${v.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${v.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="approved" ${v.status === 'approved' ? 'selected' : ''}>Approved</option>
                      </select>
                    </form>
                  </td>
                </tr>
              `).join('') + '</table>'
            }
          </div>
        </div>
        
        <script>
          // Toggle reply form
          function toggleReplyForm(id) {
            const form = document.getElementById(id);
            form.style.display = form.style.display === 'block' ? 'none' : 'block';
          }
          
          // Daily donation chart
          const ctx = document.getElementById('donationChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(last7Days)},
              datasets: [{
                label: 'Donations (₹)',
                data: ${JSON.stringify(dailyDonations)},
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
          
          // Monthly donation chart
          const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
          new Chart(monthlyCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(monthlyLabels)},
              datasets: [{
                label: 'Monthly Donations (₹)',
                data: ${JSON.stringify(monthlyValues)},
                backgroundColor: '#d97706',
                borderRadius: 8
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
          
          // Volunteer trend chart
          const volunteerCtx = document.getElementById('volunteerTrendChart').getContext('2d');
          new Chart(volunteerCtx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(volunteerMonthlyLabels)},
              datasets: [{
                label: 'New Volunteers',
                data: ${JSON.stringify(volunteerMonthlyValues)},
                borderColor: '#7c2d12',
                backgroundColor: 'rgba(124, 45, 18, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
          
          // Volunteer type pie chart
          const typeCtx = document.getElementById('volunteerTypeChart').getContext('2d');
          new Chart(typeCtx, {
            type: 'doughnut',
            data: {
              labels: ['Volunteers', 'Partners', 'Fundraising'],
              datasets: [{
                data: [${volunteerTypes.volunteer}, ${volunteerTypes.partner}, ${volunteerTypes.fundraising}],
                backgroundColor: ['#d97706', '#7c2d12', '#2d5a2d'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Mark message as read
router.get('/mark-read/:id', isAuthenticated, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Delete message
router.get('/delete-message/:id', isAuthenticated, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// ========== WHATSAPP BROADCAST ADMIN ==========

// ========== WHATSAPP BROADCAST ADMIN ==========

// Get all WhatsApp subscribers
router.get('/api/whatsapp/subscribers', isAuthenticated, async (req, res) => {
  try {
    const subscribers = await WhatsAppSubscriber.find().sort({ subscribedAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching WhatsApp subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Send WhatsApp broadcast (admin only) - SIMPLIFIED VERSION
router.post('/api/whatsapp/broadcast', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { message, filter } = req.body;
    
    console.log('📢 Broadcast request received:', { message, filter });
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build query based on filter
    let query = {};
    if (filter === 'active') {
      query = { consent: true };
    }
    
    // Get subscribers
    const subscribers = await WhatsAppSubscriber.find(query);
    console.log(`📱 Found ${subscribers.length} subscribers`);
    
    // Log each subscriber (simulate sending)
    subscribers.forEach(sub => {
      console.log(`📤 Would send to: ${sub.name} (${sub.phone})`);
    });
    
    // Return success WITHOUT any email logging
    res.json({ 
      success: true, 
      message: `Broadcast would be sent to ${subscribers.length} subscribers` 
    });
    
  } catch (error) {
    console.error('❌ Error sending broadcast:', error);
    res.status(500).json({ 
      error: 'Failed to send broadcast: ' + error.message 
    });
  }
});

// Delete subscriber
router.delete('/api/whatsapp/subscriber/:id', isAuthenticated, async (req, res) => {
  try {
    await WhatsAppSubscriber.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

// WhatsApp Broadcast Admin Page
router.get('/whatsapp', isAuthenticated, async (req, res) => {
  try {
    const subscribers = await WhatsAppSubscriber.find().sort({ subscribedAt: -1 });
    
    const stats = {
      total: subscribers.length,
      consented: subscribers.filter(s => s.consent).length
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Broadcast - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 15px;
          }
          .nav-link {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #7c2d12;
          }
          .stat-label {
            color: #7c6a5a;
            font-size: 0.9rem;
          }
          .broadcast-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .broadcast-section h2 {
            font-family: 'Playfair Display', serif;
            color: #7c2d12;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .form-group textarea,
          .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
          }
          .form-group textarea {
            min-height: 120px;
          }
          .btn {
            background: #d97706;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
          }
          .btn:hover {
            background: #b85e00;
          }
          .subscribers-table {
            background: white;
            border-radius: 16px;
            padding: 30px;
            border: 1px solid #f0d6ac;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #fff0d9;
            color: #7c2d12;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f0d6ac;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            background: #dcfce7;
            color: #166534;
          }
          .badge.inactive {
            background: #fee2e2;
            color: #b91c1c;
          }
          .delete-btn {
            background: #b91c1c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>WhatsApp Broadcast</h1>
            <div class="nav-links">
              <a href="/admin/dashboard" class="nav-link">Dashboard</a>
              <a href="/admin/whatsapp" class="nav-link">WhatsApp</a>
              <a href="/admin/birthdays" class="nav-link">Birthdays</a>
              <a href="/admin/logout" class="nav-link">Logout</a>
            </div>
          </div>
        </div>

        <div class="container">
          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${stats.total}</div>
              <div class="stat-label">Total Subscribers</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.consented}</div>
              <div class="stat-label">Consented</div>
            </div>
          </div>

          <!-- Broadcast Form -->
          <div class="broadcast-section">
            <h2>📱 Send WhatsApp Broadcast</h2>
            <form id="broadcastForm">
              <div class="form-group">
                <label>Filter Recipients</label>
                <select id="filterSelect">
                  <option value="all">All Subscribers (${stats.total})</option>
                  <option value="active">Consented Only (${stats.consented})</option>
                </select>
              </div>
              <div class="form-group">
                <label>Message *</label>
                <textarea id="messageInput" required placeholder="Type your message here..."></textarea>
              </div>
              <button type="submit" class="btn">📤 Send Broadcast</button>
              <div id="resultMessage" style="margin-top: 15px;"></div>
            </form>
          </div>

          <!-- Subscribers List -->
          <div class="subscribers-table">
            <h2>📋 Subscribers</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${subscribers.map(sub => `
                  <tr>
                    <td>${new Date(sub.subscribedAt).toLocaleDateString()}</td>
                    <td>${sub.name}</td>
                    <td>${sub.phone}</td>
                    <td><span class="badge ${!sub.consent ? 'inactive' : ''}">${sub.consent ? 'Active' : 'No Consent'}</span></td>
                    <td>
                      <button onclick="deleteSubscriber('${sub._id}')" class="delete-btn">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const message = document.getElementById('messageInput').value;
            const filter = document.getElementById('filterSelect').value;
            const resultDiv = document.getElementById('resultMessage');
            
            resultDiv.innerHTML = 'Sending...';
            
            try {
              const response = await fetch('/admin/api/whatsapp/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, filter })
              });
              
              const data = await response.json();
              
              if (data.success) {
                resultDiv.innerHTML = '<span style="color: #166534;">✅ ' + data.message + '</span>';
                document.getElementById('messageInput').value = '';
              } else {
                resultDiv.innerHTML = '<span style="color: #b91c1c;">❌ ' + data.error + '</span>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<span style="color: #b91c1c;">❌ Error sending broadcast</span>';
            }
          });

          async function deleteSubscriber(id) {
            if (!confirm('Delete this subscriber?')) return;
            
            try {
              const response = await fetch('/admin/api/whatsapp/subscriber/' + id, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                location.reload();
              }
            } catch (error) {
              alert('Error deleting subscriber');
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading WhatsApp page:', error);
    res.status(500).send('Error loading WhatsApp page');
  }
});

// ========== BIRTHDAY WISHER ADMIN ==========

// Get all birthday reminders
router.get('/api/birthdays/all', isAuthenticated, async (req, res) => {
  try {
    const birthdays = await BirthdayReminder.find().sort({ birthDate: 1 });
    res.json(birthdays);
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    res.status(500).json({ error: 'Failed to fetch birthdays' });
  }
});

// Add birthday reminder (admin)
router.post('/api/birthdays/add', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { name, email, birthDate, relationship, sendReminder } = req.body;
    
    if (!name || !email || !birthDate) {
      return res.status(400).json({ error: 'Name, email and birth date required' });
    }
    
    const reminder = new BirthdayReminder({
      name,
      email,
      birthDate: new Date(birthDate),
      relationship: relationship || 'donor',
      sendReminder: sendReminder !== false
    });
    
    await reminder.save();
    
    res.json({ success: true, message: 'Birthday reminder added!' });
    
  } catch (error) {
    console.error('Error adding birthday:', error);
    res.status(500).json({ error: 'Failed to add birthday' });
  }
});

// Delete birthday reminder
router.delete('/api/birthdays/:id', isAuthenticated, async (req, res) => {
  try {
    await BirthdayReminder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting birthday:', error);
    res.status(500).json({ error: 'Failed to delete birthday' });
  }
});

// Toggle reminder status
router.put('/api/birthdays/:id/toggle', isAuthenticated, express.json(), async (req, res) => {
  try {
    const { sendReminder } = req.body;
    
    await BirthdayReminder.findByIdAndUpdate(req.params.id, { sendReminder });
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
});

// Birthday Wisher Admin Page
router.get('/birthdays', isAuthenticated, async (req, res) => {
  try {
    const birthdays = await BirthdayReminder.find().sort({ birthDate: 1 });
    
    const today = new Date();
    const upcoming = birthdays.filter(b => {
      const bDate = new Date(b.birthDate);
      bDate.setFullYear(today.getFullYear());
      return bDate >= today && b.sendReminder;
    }).length;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Birthday Wisher - Charity Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', sans-serif;
            background: #fffaf2;
            color: #2b1810;
          }
          .header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 15px;
          }
          .nav-link {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 40px;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.3);
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .add-form {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #f0d6ac;
          }
          .add-form h2 {
            font-family: 'Playfair Display', serif;
            color: #7c2d12;
            margin-bottom: 20px;
          }
          .form-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 15px;
          }
          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          .form-group input,
          .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .btn {
            background: #d97706;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
          }
          .btn:hover {
            background: #b85e00;
          }
          .birthdays-table {
            background: white;
            border-radius: 16px;
            padding: 30px;
            border: 1px solid #f0d6ac;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #fff0d9;
            color: #7c2d12;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f0d6ac;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
          }
          .badge.active {
            background: #dcfce7;
            color: #166534;
          }
          .badge.inactive {
            background: #fee2e2;
            color: #b91c1c;
          }
          .toggle-btn {
            background: #166534;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 5px;
          }
          .delete-btn {
            background: #b91c1c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          }
          .upcoming-badge {
            background: #d97706;
            color: white;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            display: inline-block;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <h1>Birthday Wisher</h1>
            <div class="nav-links">
              <a href="/admin/dashboard" class="nav-link">Dashboard</a>
              <a href="/admin/whatsapp" class="nav-link">WhatsApp</a>
              <a href="/admin/birthdays" class="nav-link">Birthdays</a>
              <a href="/admin/logout" class="nav-link">Logout</a>
            </div>
          </div>
        </div>

        <div class="container">
          <!-- Add Birthday Form -->
          <div class="add-form">
            <h2>🎂 Add Birthday Reminder <span class="upcoming-badge">${upcoming} upcoming</span></h2>
            <form id="birthdayForm">
              <div class="form-grid">
                <div class="form-group">
                  <label>Name *</label>
                  <input type="text" id="name" required>
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" id="email" required>
                </div>
                <div class="form-group">
                  <label>Birth Date *</label>
                  <input type="date" id="birthDate" required>
                </div>
                <div class="form-group">
                  <label>Relationship</label>
                  <select id="relationship">
                    <option value="donor">Donor</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="partner">Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="sendReminder" checked>
                  <label>Send Birthday Wishes</label>
                </div>
              </div>
              <button type="submit" class="btn">Add Birthday Reminder</button>
              <div id="formResult" style="margin-top: 15px;"></div>
            </form>
          </div>

          <!-- Birthdays List -->
          <div class="birthdays-table">
            <h2>📅 Birthday Reminders</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Birth Date</th>
                  <th>Relationship</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${birthdays.map(b => {
                  const birthDate = new Date(b.birthDate);
                  const today = new Date();
                  const nextBirthday = new Date(birthDate);
                  nextBirthday.setFullYear(today.getFullYear());
                  if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                  }
                  const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                  
                  return `
                    <tr>
                      <td>${b.name}</td>
                      <td>${b.email}</td>
                      <td>${birthDate.toLocaleDateString()}</td>
                      <td>${b.relationship}</td>
                      <td>
                        <span class="badge ${b.sendReminder ? 'active' : 'inactive'}">
                          ${b.sendReminder ? 'Active' : 'Paused'}
                        </span>
                        ${daysUntil <= 30 ? `<br><small>${daysUntil} days left</small>` : ''}
                      </td>
                      <td>
                        <button onclick="toggleReminder('${b._id}', ${!b.sendReminder})" class="toggle-btn">
                          ${b.sendReminder ? 'Pause' : 'Activate'}
                        </button>
                        <button onclick="deleteBirthday('${b._id}')" class="delete-btn">Delete</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          document.getElementById('birthdayForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              birthDate: document.getElementById('birthDate').value,
              relationship: document.getElementById('relationship').value,
              sendReminder: document.getElementById('sendReminder').checked
            };
            
            const resultDiv = document.getElementById('formResult');
            
            try {
              const response = await fetch('/admin/api/birthdays/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              
              const result = await response.json();
              
              if (result.success) {
                resultDiv.innerHTML = '<span style="color: #166534;">✅ Birthday reminder added!</span>';
                setTimeout(() => location.reload(), 1000);
              } else {
                resultDiv.innerHTML = '<span style="color: #b91c1c;">❌ ' + result.error + '</span>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<span style="color: #b91c1c;">❌ Error adding reminder</span>';
            }
          });

          async function toggleReminder(id, newState) {
            try {
              const response = await fetch('/admin/api/birthdays/' + id + '/toggle', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sendReminder: newState })
              });
              
              if (response.ok) {
                location.reload();
              }
            } catch (error) {
              alert('Error toggling reminder');
            }
          }

          async function deleteBirthday(id) {
            if (!confirm('Delete this birthday reminder?')) return;
            
            try {
              const response = await fetch('/admin/api/birthdays/' + id, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                location.reload();
              }
            } catch (error) {
              alert('Error deleting reminder');
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading birthdays page:', error);
    res.status(500).send('Error loading birthdays page');
  }
});

module.exports = router;