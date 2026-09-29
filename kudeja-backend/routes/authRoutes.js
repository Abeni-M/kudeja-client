const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { Op } = require('sequelize');
const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const User = require('../models/user');
const { protect } = require('../middleware/authMiddleware');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
}

function isValidPasswordStrength(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const ok = await user.isValidPassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    if (!isValidPasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.'
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use another one.`
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, token, idToken } = req.body;
    const tokenToVerify = credential || token || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenToVerify,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const secureRandomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      user = await User.create({
        username: name || email.split('@')[0],
        email: email,
        password: secureRandomPassword,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const jwtToken = signToken(user);
    return res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid Google credential', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// Backward-compatible alias
router.get('/profile', protect, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, address, profilePicture, password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) user.username = username;
    if (address !== undefined) user.address = address;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    if (password) {
      if (!isValidPasswordStrength(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character.'
        });
      }
      user.password = password; // Hook will handle hashing
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
// Generates a reset token and returns it (and a reset URL).
// In production you would email this link; here it is returned in the response
// so admin can copy it from the API response or browser console.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Generic message for security (don't reveal if email exists)
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset token has been generated.',
      });
    }

    // Generate secure random token (64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Expires in 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'https://market.kudeja.et'}/reset-password?token=${resetToken}`;

    return res.json({
      success: true,
      message: 'Password reset token generated. Use the resetUrl to reset your password.',
      resetToken,
      resetUrl,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    if (!isValidPasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character (@$!%*?&).'
      });
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.password = newPassword; // beforeUpdate hook will bcrypt this
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;