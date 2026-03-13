// routes/prayer.js - Public Prayer Wall for Website

const express = require('express');
const router = express.Router();
const Prayer = require('../models/Prayer');
const nodemailer = require('nodemailer'); // Added for email notifications

// ========== API ENDPOINTS ==========

// Get approved prayers (for displaying on the wall)
router.get('/api/prayers', async (req, res) => {
  try {
    const prayers = await Prayer.find({ 
      status: { $in: ['approved', 'featured'] } 
    })
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(50)
    .select('name prayer isAnonymous blessCount status');
    
    res.json(prayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

// Submit a new prayer
router.post('/api/prayers', async (req, res) => {
  try {
    const { name, email, prayer, isAnonymous } = req.body;
    
    console.log('📝 Prayer submission received:', { name, email });
    
    // Validate required fields
    if (!name || !email || !prayer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email and prayer are required' 
      });
    }
    
    // Create new prayer
    const newPrayer = new Prayer({
      name,
      email,
      prayer,
      isAnonymous: isAnonymous || false,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Save to database
    await newPrayer.save();
    console.log('✅ Prayer saved with ID:', newPrayer._id);
    
    // ===== NEW: Send email notification to admin =====
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"Prayer Wall" <${process.env.EMAIL_USER}>`,
        to: 'ramcatering2011@gmail.com', // Admin email
        subject: '🙏 New Prayer Submitted for Approval',
        html: `
          <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 16px; border: 1px solid #f0d6ac;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #7c2d12; font-family: 'Playfair Display', serif; margin: 0;">Sree Vidyadhiraja Charity</h2>
              <p style="color: #d97706; margin: 5px 0 0;">New Prayer Needs Approval</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #f0d6ac;">
              <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">From:</strong> ${isAnonymous ? 'Anonymous' : name} (${email})</p>
              
              <div style="background: #fff0d9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #2b1810; font-style: italic;">"${prayer}"</p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://vidyadhiraja-charity.onrender.com/admin/prayers" 
                   style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 40px; display: inline-block; font-weight: 500;">
                  Review in Admin Dashboard
                </a>
              </div>
              
              <p style="color: #7c6a5a; font-size: 0.9rem; margin-top: 20px; text-align: center;">
                This prayer is pending approval and will appear on the prayer wall once approved.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #f0d6ac;">
              <p style="color: #7c6a5a; font-size: 0.8rem; margin: 0;">
                © 2025 Sree Vidyadhiraja Charity
              </p>
            </div>
          </div>
        `
      });
      console.log('✅ Email notification sent to admin');
    } catch (emailError) {
      // Log but don't fail - prayer is still saved
      console.log('⚠️ Email notification failed (non-critical):', emailError.message);
    }
    // ===== END NEW CODE =====
    
    // Return success
    res.json({ 
      success: true, 
      message: 'Prayer submitted for approval' 
    });
    
  } catch (error) {
    console.error('❌ Prayer submission error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit prayer: ' + error.message 
    });
  }
});

// Bless a prayer
router.post('/api/prayers/:id/bless', async (req, res) => {
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
    
    // Check if already blessed
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

// ========== MAIN PRAYER WALL PAGE ==========

// Serve the prayer wall page
router.get('/', async (req, res) => {
  try {
    const prayers = await Prayer.find({ 
      status: { $in: ['approved', 'featured'] } 
    })
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(50);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prayer Wall - Sree Vidyadhiraja Charity</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
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
          .site-header {
            background: #7c2d12;
            color: white;
            padding: 20px 0;
          }
          .site-header .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .site-header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: white;
          }
          .nav-links {
            display: flex;
            gap: 20px;
          }
          .nav-links a {
            color: white;
            text-decoration: none;
          }
          .prayer-hero {
            background: linear-gradient(135deg, #7c2d12, #d97706);
            color: white;
            padding: 80px 0;
            text-align: center;
          }
          .prayer-hero h1 {
            font-size: 3rem;
            margin-bottom: 20px;
          }
          .prayer-hero p {
            font-size: 1.2rem;
            opacity: 0.9;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .prayer-form-container {
            background: white;
            border-radius: 24px;
            padding: 40px;
            max-width: 600px;
            margin: -50px auto 50px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border: 1px solid #f0d6ac;
          }
          .prayer-form h2 {
            color: #7c2d12;
            margin-bottom: 30px;
            font-family: 'Playfair Display', serif;
            text-align: center;
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
            padding: 12px;
            border: 1px solid #f0d6ac;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
          }
          .form-group textarea {
            min-height: 120px;
            resize: vertical;
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .checkbox-group input {
            width: auto;
          }
          .btn-submit {
            background: #d97706;
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 40px;
            font-size: 1rem;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
          }
          .btn-submit:hover {
            background: #b85e00;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(217, 119, 6, 0.3);
          }
          .prayers-wall {
            padding: 60px 0;
            background: #fffaf2;
          }
          .prayers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 40px;
          }
          .prayer-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 8px 20px rgba(124, 45, 18, 0.08);
            border: 1px solid #f0d6ac;
            transition: transform 0.3s ease;
          }
          .prayer-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(124, 45, 18, 0.15);
          }
          .prayer-card.featured {
            border: 2px solid #d97706;
            background: linear-gradient(135deg, #fff0d9, white);
          }
          .prayer-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #7c2d12;
            margin-bottom: 10px;
          }
          .prayer-text {
            font-style: italic;
            margin: 15px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            color: #2b1810;
          }
          .prayer-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
          }
          .bless-btn {
            background: none;
            border: 1px solid #d97706;
            color: #d97706;
            padding: 8px 16px;
            border-radius: 40px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .bless-btn:hover {
            background: #d97706;
            color: white;
          }
          .bless-count {
            color: #7c6a5a;
            font-size: 0.9rem;
          }
          .featured-badge {
            background: #d97706;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            display: inline-block;
            margin-bottom: 10px;
          }
          .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
          }
          .success {
            background: #dcfce7;
            color: #166534;
            display: block;
          }
          .error {
            background: #fee2e2;
            color: #b91c1c;
            display: block;
          }
          .site-footer {
            background: #7c2d12;
            color: white;
            padding: 40px 0;
            text-align: center;
          }
          .footer-quote {
            font-family: 'Playfair Display', serif;
            font-size: 1.2rem;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <header class="site-header">
          <div class="container">
            <h1>Sree Vidyadhiraja Charity</h1>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/#mission">Our Mission</a>
              <a href="/#donate">Donate</a>
              <a href="/#contact">Contact</a>
            </div>
          </div>
        </header>

        <div class="prayer-hero">
          <div class="container">
            <h1>🙏 Prayer Wall</h1>
            <p>Share your prayers for our elderly residents. Every prayer is a blessing.</p>
          </div>
        </div>

        <div class="container">
          <div class="prayer-form-container">
            <h2>Light a Prayer</h2>
            <div id="formMessage" class="message"></div>
            <form id="prayerForm" class="prayer-form">
              <div class="form-group">
                <label for="name">Your Name *</label>
                <input type="text" id="name" name="name" required>
              </div>
              <div class="form-group">
                <label for="email">Your Email *</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-group">
                <label for="prayer">Your Prayer *</label>
                <textarea id="prayer" name="prayer" required placeholder="Write your prayer here..."></textarea>
              </div>
              <div class="form-group checkbox-group">
                <input type="checkbox" id="anonymous" name="anonymous">
                <label for="anonymous">Post anonymously</label>
              </div>
              <button type="submit" class="btn-submit">Submit Prayer</button>
            </form>
          </div>
        </div>

        <div class="prayers-wall">
          <div class="container">
            <h2 style="text-align: center; color: #7c2d12; font-family: 'Playfair Display'; font-size: 2rem;">Community Prayers</h2>
            <div id="prayersGrid" class="prayers-grid">
              <div style="text-align: center; grid-column: 1/-1;">Loading prayers...</div>
            </div>
          </div>
        </div>

        <footer class="site-footer">
          <div class="container">
            <p class="footer-quote">"ജീവകാരുണ്യം ജീവിതത്തിലൂടെ"</p>
            <p>Charity through Life</p>
            <p style="margin-top: 20px;">© 2025 Sree Vidyadhiraja Charity</p>
          </div>
        </footer>

        <script>
          // Load prayers
          async function loadPrayers() {
            try {
              const response = await fetch('/prayer/api/prayers');
              const prayers = await response.json();
              
              const grid = document.getElementById('prayersGrid');
              
              if (prayers.length === 0) {
                grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #7c6a5a; padding: 40px;">No prayers yet. Be the first to pray!</p>';
                return;
              }
              
              grid.innerHTML = prayers.map(prayer => \`
                <div class="prayer-card \${prayer.status === 'featured' ? 'featured' : ''}">
                  \${prayer.status === 'featured' ? '<div class="featured-badge">Featured Prayer</div>' : ''}
                  <div class="prayer-name">\${prayer.isAnonymous ? 'Anonymous' : prayer.name}</div>
                  <div class="prayer-text">"\${prayer.prayer}"</div>
                  <div class="prayer-footer">
                    <button class="bless-btn" onclick="blessPrayer('\${prayer._id}')">🙏 Bless</button>
                    <span class="bless-count">\${prayer.blessCount} blessings</span>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('Error loading prayers:', error);
              document.getElementById('prayersGrid').innerHTML = '<p style="text-align: center; color: #b91c1c;">Error loading prayers</p>';
            }
          }

          // Submit prayer
          document.getElementById('prayerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              prayer: document.getElementById('prayer').value,
              isAnonymous: document.getElementById('anonymous').checked
            };
            
            const messageDiv = document.getElementById('formMessage');
            messageDiv.className = 'message';
            messageDiv.textContent = 'Submitting...';
            messageDiv.style.display = 'block';
            
            try {
              const response = await fetch('/prayer/api/prayers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              
              const data = await response.json();
              
              if (data.success) {
                messageDiv.className = 'message success';
                messageDiv.textContent = 'Your prayer has been submitted for approval. Thank you!';
                document.getElementById('prayerForm').reset();
                loadPrayers();
              } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.error || 'Failed to submit prayer';
              }
            } catch (error) {
              messageDiv.className = 'message error';
              messageDiv.textContent = 'Error submitting prayer';
            }
          });

          // Bless a prayer
          async function blessPrayer(id) {
            const email = prompt('Please enter your email to bless this prayer:');
            if (!email) return;
            
            try {
              const response = await fetch('/prayer/api/prayers/' + id + '/bless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              
              const data = await response.json();
              
              if (data.success) {
                alert('Thank you for blessing this prayer!');
                loadPrayers(); // Reload to show updated count
              } else {
                alert(data.error || 'Failed to bless prayer');
              }
            } catch (error) {
              alert('Error blessing prayer');
            }
          }

          // Load prayers on page load
          loadPrayers();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading prayer wall:', error);
    res.status(500).send('Error loading prayer wall');
  }
});

module.exports = router;