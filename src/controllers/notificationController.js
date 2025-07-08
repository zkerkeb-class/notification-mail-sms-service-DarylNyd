const emailService = require('../services/emailService');
const nodemailerService = require('../services/nodemailerService');

// Password reset email notification controller
const sendPasswordResetEmail = async (req, res) => {
  const { email, resetToken } = req.body;

  // Validate required fields
  if (!email || !resetToken) {
    return res.status(400).json({
      success: false,
      message: 'Email and resetToken are required'
    });
  }

  try {
    // Try Nodemailer first, fallback to SendGrid if Nodemailer is not configured
    let result;
    
    if (nodemailerService.isInitialized) {
      console.log('Using Nodemailer for email sending');
      result = await nodemailerService.sendPasswordResetEmail(email, resetToken);
    } else if (emailService.isInitialized) {
      console.log('Using SendGrid for email sending');
      result = await emailService.sendPasswordResetEmail(email, resetToken);
    } else {
      console.warn('No email service configured. Returning test response.');
      result = {
        success: true,
        message: 'Password reset email would be sent (no email service configured)',
        data: {
          email,
          sentAt: new Date().toISOString(),
          note: 'This is a test response. Configure Nodemailer or SendGrid to send actual emails.'
        }
      };
    }
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in sendPasswordResetEmail controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
};

// Health check controller
const healthCheck = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'notification-mail-sms-service',
    emailServices: {
      nodemailer: nodemailerService.isInitialized ? 'configured' : 'not configured',
      sendgrid: emailService.isInitialized ? 'configured' : 'not configured'
    }
  });
};

// Test email service endpoint
const testEmailService = async (req, res) => {
  try {
    let result;
    
    if (nodemailerService.isInitialized) {
      result = await nodemailerService.testConnection();
    } else if (emailService.isInitialized) {
      result = await emailService.testConnection();
    } else {
      result = {
        success: false,
        message: 'No email service configured',
        error: 'Neither Nodemailer nor SendGrid is configured'
      };
    }
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email service test failed',
      error: error.message
    });
  }
};

// Send test email endpoint
const sendTestEmail = async (req, res) => {
  try {
    let result;
    
    if (nodemailerService.isInitialized) {
      result = await nodemailerService.sendTestEmail();
    } else if (emailService.isInitialized) {
      result = await emailService.testConnection();
    } else {
      result = {
        success: false,
        message: 'No email service configured',
        error: 'Neither Nodemailer nor SendGrid is configured'
      };
    }
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
};

// Send welcome email to new users
const sendWelcomeEmail = async (req, res) => {
  try {
    const { email, username, loginLink } = req.body;

    // Validate required fields
    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email and username are required'
      });
    }

    // Use loginLink if provided, otherwise use a default
    const finalLoginLink = loginLink || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    console.log(`📧 Sending welcome email to: ${email}`);

    // Try Nodemailer first
    if (nodemailerService.isInitialized) {
      const mailOptions = {
        from: `"${nodemailerService.emailConfig.fromName}" <${nodemailerService.emailConfig.from}>`,
        to: email,
        subject: nodemailerService.emailConfig.welcomeTemplate.subject,
        html: nodemailerService.emailConfig.welcomeTemplate.html(username, finalLoginLink),
        text: nodemailerService.emailConfig.welcomeTemplate.text(username, finalLoginLink)
      };

      const info = await nodemailerService.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully via Nodemailer: ${info.messageId}`);

      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: info.messageId,
        method: 'nodemailer'
      });
    }

    // Fallback to SendGrid if configured
    if (emailService.isInitialized && process.env.SENDGRID_API_KEY) {
      const msg = {
        to: email,
        from: nodemailerService.emailConfig.from,
        subject: nodemailerService.emailConfig.welcomeTemplate.subject,
        html: nodemailerService.emailConfig.welcomeTemplate.html(username, finalLoginLink),
        text: nodemailerService.emailConfig.welcomeTemplate.text(username, finalLoginLink)
      };

      const response = await emailService.sgMail.send(msg);
      console.log(`✅ Welcome email sent successfully via SendGrid: ${response[0].headers['x-message-id']}`);

      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: response[0].headers['x-message-id'],
        method: 'sendgrid'
      });
    }

    // Mock response if no email service configured
    console.log(`📧 [MOCK] Welcome email would be sent to: ${email}`);
    console.log(`�� [MOCK] Subject: ${nodemailerService.emailConfig.welcomeTemplate.subject}`);
    console.log(`📧 [MOCK] Username: ${username}`);
    console.log(`📧 [MOCK] Login Link: ${finalLoginLink}`);

    return res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully (mock)',
      method: 'mock',
      details: {
        to: email,
        subject: nodemailerService.emailConfig.welcomeTemplate.subject,
        username: username,
        loginLink: finalLoginLink
      }
    });

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
};

module.exports = {
  sendPasswordResetEmail,
  healthCheck,
  testEmailService,
  sendTestEmail,
  sendWelcomeEmail
}; 