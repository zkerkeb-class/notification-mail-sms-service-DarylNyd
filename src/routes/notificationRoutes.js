const express = require('express');
const router = express.Router();
const { 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  healthCheck, 
  testEmailService, 
  sendTestEmail 
} = require('../controllers/notificationController');

// Health check endpoint
router.get('/health', healthCheck);

// Test email service configuration
router.get('/test-config', testEmailService);

// Send test email
router.post('/test-email', sendTestEmail);

// Send password reset email
router.post('/password-reset', sendPasswordResetEmail);

// Send welcome email to new users
router.post('/welcome', sendWelcomeEmail);

module.exports = router; 