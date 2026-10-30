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

    // Try sending email if SMTP / Gmail is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s+/g, ''), // Strip spaces in 16-char Gmail app password
          },
        });

        const senderFrom = process.env.EMAIL_FROM || `SmartSphere <${process.env.EMAIL_USER}>`;
        const replyTo = process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER;

        await transporter.sendMail({
          from: senderFrom,
          replyTo: replyTo,
          to: user.email,
          subject: 'SmartSphere - Reset Your Password',
          html: `
            <div style="background-color: #0b0f1a; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
              <div style="max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #60a5fa;">
                    SmartSphere
                  </h1>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">AI Workspace Password Reset</p>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px;">
                  Hello ${user.name || 'there'},
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px;">
                  We received a request to reset the password for your SmartSphere account associated with <strong>${user.email}</strong>. Click the button below to set a new password:
                </p>
                
                <div style="text-align: center; margin-bottom: 28px;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
                    Reset Password
                  </a>
                </div>
                
                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 16px;">
                  ⏰ This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.
                </p>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px;">
                  <p style="font-size: 11px; color: #64748b; word-break: break-all;">
                    Button not working? Copy and paste this URL into your browser:<br/>
                    <a href="${resetUrl}" style="color: #60a5fa; text-decoration: underline;">${resetUrl}</a>
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
                © SmartSphere AI Workspace • <a href="https://ialksng.me" style="color: #64748b; text-decoration: none;">ialksng.me</a>
              </div>
            </div>
          `,
        });
        console.log(`✅ Password reset email sent to ${user.email} via ${process.env.EMAIL_USER}`);
      } catch (mailErr) {
        console.error('❌ Nodemailer Error sending password reset email:', mailErr);
        console.log(`\n========================================`);
        console.log(`[FALLBACK RESET LINK for ${user.email}]:`);
        console.log(resetUrl);
        console.log(`========================================\n`);
      }
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
    scope: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
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
      // Only save drive tokens if drive scope was granted
      if (tokens.scope && tokens.scope.includes('drive')) {
        user.googleDriveTokens = tokens;
      }
      await user.save();
    } else {
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: picture || '',
        googleDriveTokens: tokens.scope && tokens.scope.includes('drive') ? tokens : undefined,
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
