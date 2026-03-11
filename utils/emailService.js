// utils/emailService.js

const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

// Create transporter using your Gmail settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Send email notification for new contact form submission
 */
const sendNewMessageNotification = async (formData) => {
  try {
    const { subject, html } = templates.newMessageAlert(formData);
    
    const mailOptions = {
      from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
      to: 'ramcatering2011@gmail.com',
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 New message notification sent to admin');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send message notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send auto-reply to user who submitted contact form
 */
const sendAutoReplyToUser = async (formData) => {
  try {
    const { subject, html } = templates.autoReplyToUser(formData);
    
    const mailOptions = {
      from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
      to: formData.email,
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Auto-reply sent to:', formData.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send auto-reply:', error);
    return { success: false, error: error.message };
  }
};

// ========== VOLUNTEER EMAIL FUNCTIONS ==========

/**
 * Send email notification for new volunteer registration (to admin)
 */
const sendNewVolunteerNotification = async (volunteerData) => {
  try {
    const { subject, html } = templates.newVolunteerAlert(volunteerData);
    
    const mailOptions = {
      from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
      to: 'ramcatering2011@gmail.com',
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Volunteer notification sent to admin');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send volunteer notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send auto-reply to volunteer who registered
 */
const sendVolunteerAutoReply = async (volunteerData) => {
  try {
    const { subject, html } = templates.volunteerAutoReply(volunteerData);
    
    const mailOptions = {
      from: `"Sree Vidyadhiraja Charity" <${process.env.EMAIL_USER}>`,
      to: volunteerData.email,
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Volunteer auto-reply sent to:', volunteerData.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send volunteer auto-reply:', error);
    return { success: false, error: error.message };
  }
};

// Export all functions
module.exports = {
  sendNewMessageNotification,
  sendAutoReplyToUser,
  sendNewVolunteerNotification,
  sendVolunteerAutoReply
};