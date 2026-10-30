import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';
import { createOAuth2Client } from '../services/googleDriveService.js';

const router = express.Router();

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || 'https://ialksng.me/work/projects/smartsphere/app';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

// @desc    Forgot Password - send reset token / email
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak user existence for security
      return res.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const frontendUrl = getFrontendUrl();
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Try sending email if SMTP is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"SmartSphere" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'SmartSphere Password Reset Request',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password on SmartSphere.</p>
            <p>Click the link below to set a new password (valid for 15 minutes):</p>
            <p><a href="${resetUrl}" style="background-color: #2563eb; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`\n========================================`);
      console.log(`[PASSWORD RESET LINK for ${user.email}]:`);
      console.log(resetUrl);
      console.log(`========================================\n`);
    }

    return res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: error.message || 'Error processing request' });
  }
});

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    return res.json({
      message: 'Password reset successful!',
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: error.message || 'Error resetting password' });
  }
});

// @desc    Google OAuth Login Redirect
// @route   GET /api/auth/google
router.get('/google', (req, res) => {
  const redirectUri =
    process.env.GOOGLE_AUTH_REDIRECT_URI ||
    'https://ialksng.me/work/projects/smartsphere/app/api/auth/google/callback';

  const oauth2Client = createOAuth2Client(redirectUri);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return res.redirect(url);
});

// @desc    Google OAuth Callback for Login
// @route   GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = getFrontendUrl();

  if (!code) {
    return res.redirect(`${frontendUrl}/auth?error=google_auth_failed`);
  }

  try {
    const redirectUri =
      process.env.GOOGLE_AUTH_REDIRECT_URI ||
      'https://ialksng.me/work/projects/smartsphere/app/api/auth/google/callback';

    const oauth2Client = createOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const { id: googleId, email, name, picture } = userInfo.data;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      // Also save drive tokens
      user.googleDriveTokens = tokens;
      await user.save();
    } else {
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: picture || '',
        googleDriveTokens: tokens,
      });
    }

    const token = generateToken(user._id);

    // Redirect to frontend with token
    return res.redirect(
      `${frontendUrl}/auth?token=${token}&userId=${user._id}&name=${encodeURIComponent(
        user.name
      )}&email=${encodeURIComponent(user.email)}`
    );
  } catch (error) {
    console.error('Google Auth callback error:', error);
    return res.redirect(`${frontendUrl}/auth?error=google_auth_failed`);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  return res.json(req.user);
});

export default router;
