const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create user if not exists.
      // We must satisfy the strict password validation, so generate a secure random password.
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

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid Google credential' });
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

module.exports = router;