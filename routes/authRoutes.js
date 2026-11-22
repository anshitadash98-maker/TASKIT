const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Public config: Only expose Google Auth if strictly enabled & client ID exists
router.get('/config', (req, res) => {
  const isGoogleAuthEnabled = process.env.ENABLE_GOOGLE_AUTH === 'true' && Boolean(process.env.GOOGLE_CLIENT_ID);
  res.json({
    googleAuthEnabled: isGoogleAuthEnabled,
    googleClientId: isGoogleAuthEnabled ? process.env.GOOGLE_CLIENT_ID : null
  });
});

// Register new user
router.post('/register', (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = bcrypt.hashSync(password, 10);
    const displayName = fullName && fullName.trim() ? fullName.trim() : email.split('@')[0];

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name)
      VALUES (?, ?, ?, ?)
    `).run(userId, email.toLowerCase().trim(), passwordHash, displayName);

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), name: displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        name: displayName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.full_name },
      JWT_SECRET,
      { expiresIn }
    );

    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAgeMs
    });

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// Current user profile
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
