const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validatePasswordChange,
  validateEmail 
} = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

const router = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    return sendErrorResponse(res, { 
      message: 'User already exists with this email or username',
      statusCode: 400 
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  // Generate JWT token
  const token = user.generateAuthToken();

  // Send welcome email (optional - won't fail registration if email fails)
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail registration if email fails
    }
  }

  sendSuccessResponse(res, {
    user: user.getPublicProfile(),
    token
  }, 'User registered successfully', 201);
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  // Find user by email or username
  const user = await User.findByEmailOrUsername(identifier).select('+password');
  if (!user) {
    return sendErrorResponse(res, { 
      message: 'Invalid credentials',
      statusCode: 401 
    });
  }

  // Check if user is banned
  if (user.isBanned) {
    return sendErrorResponse(res, { 
      message: 'Your account has been banned',
      statusCode: 403,
      reason: user.banReason 
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendErrorResponse(res, { 
      message: 'Invalid credentials',
      statusCode: 401 
    });
  }

  // Update last active
  user.lastActive = new Date();
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  sendSuccessResponse(res, {
    user: user.getPublicProfile(),
    token
  }, 'Login successful');
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  sendSuccessResponse(res, {
    user: req.user.getPublicProfile()
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
  // Update last active time
  req.user.lastActive = new Date();
  await req.user.save();

  sendSuccessResponse(res, {}, 'Logout successful');
}));

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', protect, asyncHandler(async (req, res) => {
  // Generate new token
  const token = req.user.generateAuthToken();

  sendSuccessResponse(res, {
    user: req.user.getPublicProfile(),
    token
  }, 'Token refreshed successfully');
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validateEmail, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists or not for security
    return sendSuccessResponse(res, {}, 'If an account with that email exists, a password reset link has been sent');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken, user.username);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return sendErrorResponse(res, { 
      message: 'Error sending password reset email',
      statusCode: 500 
    });
  }

  sendSuccessResponse(res, {}, 'Password reset email sent');
}));

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return sendErrorResponse(res, { 
      message: 'Password must be at least 6 characters long',
      statusCode: 400 
    });
  }

  // Hash the token
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendErrorResponse(res, { 
      message: 'Invalid or expired reset token',
      statusCode: 400 
    });
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new token
  const authToken = user.generateAuthToken();

  sendSuccessResponse(res, {
    user: user.getPublicProfile(),
    token: authToken
  }, 'Password reset successfully');
}));

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change-password', protect, validatePasswordChange, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Verify current password
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    return sendErrorResponse(res, { 
      message: 'Current password is incorrect',
      statusCode: 400 
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateAuthToken();

  sendSuccessResponse(res, {
    user: user.getPublicProfile(),
    token
  }, 'Password changed successfully');
}));

// @route   POST /api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.post('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendErrorResponse(res, { 
      message: 'Invalid or expired verification token',
      statusCode: 400 
    });
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Generate token
  const authToken = user.generateAuthToken();

  sendSuccessResponse(res, {
    user: user.getPublicProfile(),
    token: authToken
  }, 'Email verified successfully');
}));

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', protect, asyncHandler(async (req, res) => {
  if (req.user.emailVerified) {
    return sendErrorResponse(res, { 
      message: 'Email is already verified',
      statusCode: 400 
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  req.user.emailVerificationToken = verificationToken;
  req.user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await req.user.save();

  // Send verification email
  try {
    await sendVerificationEmail(req.user.email, verificationToken, req.user.username);
  } catch (error) {
    console.error('Error sending verification email:', error);
    return sendErrorResponse(res, { 
      message: 'Error sending verification email',
      statusCode: 500 
    });
  }

  sendSuccessResponse(res, {}, 'Verification email sent');
}));

// @route   GET /api/auth/check-username/:username
// @desc    Check if username is available
// @access  Public
router.get('/check-username/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  const available = !user;

  sendSuccessResponse(res, { available });
}));

// @route   GET /api/auth/check-email/:email
// @desc    Check if email is available
// @access  Public
router.get('/check-email/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });
  const available = !user;

  sendSuccessResponse(res, { available });
}));

// Email helper functions
const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to StackIt!',
    html: `
      <h1>Welcome to StackIt, ${username}!</h1>
      <p>Thank you for joining our community of knowledge seekers and sharers.</p>
      <p>You can now:</p>
      <ul>
        <li>Ask questions</li>
        <li>Answer questions</li>
        <li>Vote on content</li>
        <li>Earn reputation</li>
      </ul>
      <p>Happy learning!</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - StackIt',
    html: `
      <h1>Hello ${username},</h1>
      <p>You requested a password reset for your StackIt account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, token, username) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - StackIt',
    html: `
      <h1>Hello ${username},</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = router; 