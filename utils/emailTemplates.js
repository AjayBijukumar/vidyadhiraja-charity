// utils/emailTemplates.js

/**
 * Email templates for different notification types
 */

// Template for admin new message alert
const newMessageAlert = (data) => ({
  subject: `📬 New Contact Form Message from ${data.name}`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 16px; border: 1px solid #f0d6ac;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #7c2d12; font-family: 'Playfair Display', serif; margin: 0;">Sree Vidyadhiraja Charity</h2>
        <p style="color: #d97706; margin: 5px 0 0;">New Contact Form Submission</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #f0d6ac;">
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Name:</strong> ${data.name}</p>
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Email:</strong> <a href="mailto:${data.email}" style="color: #d97706; text-decoration: none;">${data.email}</a></p>
        ${data.phone ? `<p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Phone:</strong> ${data.phone}</p>` : ''}
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Message:</strong></p>
        <div style="background: #fff0d9; padding: 15px; border-radius: 8px; color: #2b1810; line-height: 1.6;">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #f0d6ac;">
        <p style="color: #7c6a5a; font-size: 0.9rem; margin: 0;">
          View all messages in your <a href="http://localhost:5000/admin/dashboard" style="color: #d97706; text-decoration: none;">Admin Dashboard</a>
        </p>
        <p style="color: #7c6a5a; font-size: 0.8rem; margin: 10px 0 0;">
          © 2025 Sree Vidyadhiraja Charity 
        </p>
      </div>
    </div>
  `
});

// Template for auto-reply to user
const autoReplyToUser = (data) => ({
  subject: `🙏 Thank You for Contacting Us, ${data.name}!`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 16px; border: 1px solid #f0d6ac;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #7c2d12; font-family: 'Playfair Display', serif; margin: 0;">Sree Vidyadhiraja Charity</h2>
        <p style="color: #d97706; margin: 5px 0 0;">We Received Your Message</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #f0d6ac;">
        <p style="margin: 0 0 20px 0; color: #2b1810;">Dear <strong style="color: #7c2d12;">${data.name}</strong>,</p>
        
        <p style="margin: 0 0 15px 0; color: #2b1810;">Thank you for reaching out to Sree Vidyadhiraja Charity. We have received your message and will get back to you as soon as possible.</p>
        
        <div style="background: #fff0d9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #7c2d12; font-weight: 600;">Your Message:</p>
          <p style="margin: 0; color: #2b1810; font-style: italic;">"${data.message}"</p>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #2b1810;">Your kindness and support mean the world to us. Together, we can build a home for elderly people in need.</p>
        
        <p style="margin: 0; color: #2b1810;">With gratitude,<br><strong style="color: #7c2d12;">The Sree Vidyadhiraja Charity Team</strong></p>
      </div>
      
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #f0d6ac;">
        <p style="color: #7c6a5a; font-size: 0.9rem; margin: 0;">
          "ജീവകാരുണ്യം ജീവിതത്തിലൂടെ — Charity through Life"
        </p>
        <p style="color: #7c6a5a; font-size: 0.8rem; margin: 10px 0 0;">
          © 2025 Sree Vidyadhiraja Charity 
        </p>
      </div>
    </div>
  `
});

// ========== VOLUNTEER EMAIL TEMPLATES ==========

// Template for admin volunteer alert
const newVolunteerAlert = (data) => ({
  subject: `🙌 New Volunteer Registration: ${data.name}`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 16px; border: 1px solid #f0d6ac;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #7c2d12; font-family: 'Playfair Display', serif; margin: 0;">Sree Vidyadhiraja Charity</h2>
        <p style="color: #d97706; margin: 5px 0 0;">New Volunteer Registration</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #f0d6ac;">
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Name:</strong> ${data.name}</p>
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Phone:</strong> ${data.phone}</p>
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Email:</strong> <a href="mailto:${data.email}" style="color: #d97706; text-decoration: none;">${data.email}</a></p>
        <p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Type of Joining:</strong> 
          <span style="background: #fff0d9; padding: 4px 12px; border-radius: 20px; color: #7c2d12; font-weight: 600; text-transform: capitalize;">${data.type}</span>
        </p>
        ${data.message ? `<p style="margin: 0 0 15px 0; color: #2b1810;"><strong style="color: #7c2d12;">Message:</strong> ${data.message}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #f0d6ac;">
        <p style="color: #7c6a5a; font-size: 0.9rem; margin: 0;">
          View all volunteers in your <a href="http://localhost:5000/admin/volunteers" style="color: #d97706; text-decoration: none;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `
});

// Template for auto-reply to volunteer
const volunteerAutoReply = (data) => ({
  subject: `🙏 Thank You for Joining Us, ${data.name}!`,
  html: `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffaf2; padding: 30px; border-radius: 16px; border: 1px solid #f0d6ac;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #7c2d12; font-family: 'Playfair Display', serif; margin: 0;">Sree Vidyadhiraja Charity</h2>
        <p style="color: #d97706; margin: 5px 0 0;">Welcome to Our Family!</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #f0d6ac;">
        <p style="margin: 0 0 20px 0; color: #2b1810;">Dear <strong style="color: #7c2d12;">${data.name}</strong>,</p>
        
        <p style="margin: 0 0 15px 0; color: #2b1810;">Thank you for expressing interest in joining our mission as a <strong style="color: #d97706; text-transform: capitalize;">${data.type}</strong>!</p>
        
        <p style="margin: 0 0 15px 0; color: #2b1810;">We have received your registration and our team will contact you shortly to discuss how you can contribute to our cause of serving elderly people in need.</p>
        
        <div style="background: #fff0d9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #7c2d12; font-weight: 600;">Your Registration Details:</p>
          <p style="margin: 5px 0; color: #2b1810;"><strong>Name:</strong> ${data.name}</p>
          <p style="margin: 5px 0; color: #2b1810;"><strong>Phone:</strong> ${data.phone}</p>
          <p style="margin: 5px 0; color: #2b1810;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 5px 0; color: #2b1810;"><strong>Type:</strong> <span style="text-transform: capitalize;">${data.type}</span></p>
        </div>
        
        <p style="margin: 0 0 15px 0; color: #2b1810;">Together, we can build a home filled with compassion, dignity, and love for our elderly.</p>
        
        <p style="margin: 0; color: #2b1810;">With gratitude,<br><strong style="color: #7c2d12;">The Sree Vidyadhiraja Charity Team</strong></p>
      </div>
      
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #f0d6ac;">
        <p style="color: #7c6a5a; font-size: 0.9rem; margin: 0;">
          "ജീവകാരുണ്യം ജീവിതത്തിലൂടെ — Charity through Life"
        </p>
      </div>
    </div>
  `
});

// Export all functions
module.exports = {
  newMessageAlert,
  autoReplyToUser,
  newVolunteerAlert,
  volunteerAutoReply
};