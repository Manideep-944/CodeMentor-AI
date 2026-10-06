const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/storageService');

/**
 * Protect routes - requires valid JWT authentication
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token.trim() === '') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token is required.',
        });
      }

      const secret = process.env.JWT_SECRET || 'codementor_dev_secret_key_phase1';
      const decoded = jwt.verify(token, secret);

      const user = await findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error(`[Auth Middleware Error] ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
          isExpired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in.',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. No authentication token provided.',
  });
};

/**
 * Optional Auth - extracts user if token provided, but allows guest access
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token.trim() !== '') {
        const secret = process.env.JWT_SECRET || 'codementor_dev_secret_key_phase1';
        const decoded = jwt.verify(token, secret);
        req.user = await findUserById(decoded.id);
      }
    } catch (error) {
      // If token is invalid or expired, continue as guest
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = { protect, optionalAuth };
