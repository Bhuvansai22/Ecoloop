/**
 * Auth Controller
 * Handles user registration and login
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

/** Generate JWT token */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName, industryType } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Validate role
    const allowedRoles = ['buyer', 'seller'];
    const userRole = allowedRoles.includes(role) ? role : 'buyer';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      companyName,
      industryType,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        companyName: user.companyName,
        verified:    user.verified,
        avatar:      user.avatar,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 * Login with email & password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        companyName: user.companyName,
        verified:    user.verified,
        avatar:      user.avatar,
        carbonStats: user.carbonStats,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 * Get currently authenticated user
 */
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * POST /api/auth/forgot-password
 * Request a password reset link
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return a success message even if email wasn't found to prevent user enumeration
      return res.status(200).json({
        message: 'If an account exists for that email, a password reset link has been sent.',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database with 10-minute expiry
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send email
    const origin = req.get('origin');
    const clientUrl = origin || (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid rgba(255,255,255,0.08); background-color: #0f130f; color: #e8f5e9; border-radius: 12px;">
        <h2 style="color: #22c55e; text-align: center; margin-bottom: 24px;">EcoLoop Password Reset</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Please click the button below to reset your password. This link is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" style="background-color: #22c55e; color: #0f130f; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #81c784;">If you are having trouble with the button, copy and paste the URL below into your browser:</p>
        <p style="font-size: 12px; word-break: break-all; color: #a5d6a7;">${resetUrl}</p>
        <p style="font-size: 13px; color: #888; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">EcoLoop Circular Economy Network</p>
      </div>
    `;

    const text = `Hello,\n\nYou requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'EcoLoop Password Reset Link',
        html,
        text,
      });

      res.status(200).json({
        message: 'If an account exists for that email, a password reset link has been sent.',
      });
    } catch (emailErr) {
      console.log('\n==================================================');
      console.log('⚠️  [EMAIL SEND FAILURE - DEVELOPMENT LINK FALLBACK]');
      console.log(`To:      ${user.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Error:   ${emailErr.message}`);
      console.log('==================================================\n');

      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          message: `Email delivery failed (${emailErr.message}), but a development fallback link is available below.`,
          devLink: resetUrl,
        });
      }
      return res.status(500).json({ message: 'Error sending password reset email.' });
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Reset password using the verification token sent via email
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash URL token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and verify token hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    // Set new password (will be hashed in pre-save middleware)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
