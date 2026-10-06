const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/me (Protected)
router.get('/me', protect, getMe);

// PUT /api/auth/me (Protected)
router.put('/me', protect, updateProfile);
router.put('/profile', protect, updateProfile);

// POST /api/auth/logout
router.post('/logout', logoutUser);

module.exports = router;

