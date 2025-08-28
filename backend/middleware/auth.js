const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporary-secret-key-change-this');

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isBanned) {
        return res.status(403).json({ 
          message: 'Your account has been banned',
          reason: req.user.banReason 
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to make user optional (for guest access)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporary-secret-key-change-this');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (req.user && req.user.isBanned) {
        return res.status(403).json({ 
          message: 'Your account has been banned',
          reason: req.user.banReason 
        });
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.error('Optional auth error:', error);
    }
  }

  next();
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to check if user is moderator or admin
const moderator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Moderator privileges required.' });
  }
};

// Middleware to check if user can perform action
const canPerformAction = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.canPerformAction(action)) {
      return res.status(403).json({ 
        message: `Access denied. You need ${action} permission.` 
      });
    }

    next();
  };
};

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Allow connection without token (guest access)
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporary-secret-key-change-this');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.isBanned) {
      return next(new Error('Account banned'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Middleware to check ownership
const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const item = await Model.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ message: `${modelName} not found` });
      }

      // Allow if user is admin
      if (req.user.role === 'admin') {
        req.item = item;
        return next();
      }

      // Check if user owns the item
      if (item.author.toString() === req.user._id.toString()) {
        req.item = item;
        next();
      } else {
        return res.status(403).json({ message: 'Access denied. You can only modify your own content.' });
      }
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

// Middleware to check if user can vote
const canVote = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required to vote' });
  }

  // Check if user has enough reputation to vote
  if (req.user.reputation < 15) {
    return res.status(403).json({ 
      message: 'You need at least 15 reputation points to vote' 
    });
  }

  next();
};

// Middleware to check if user can downvote
const canDownvote = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required to downvote' });
  }

  // Check if user has enough reputation to downvote
  if (req.user.reputation < 125) {
    return res.status(403).json({ 
      message: 'You need at least 125 reputation points to downvote' 
    });
  }

  next();
};

// Middleware to check if user can comment
const canComment = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required to comment' });
  }

  // Check if user has enough reputation to comment
  if (req.user.reputation < 50) {
    return res.status(403).json({ 
      message: 'You need at least 50 reputation points to comment' 
    });
  }

  next();
};

// Middleware to rate limit by user
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for guests
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      requests.set(userId, requests.get(userId).filter(time => time > windowStart));
    }

    const userRequests = requests.get(userId) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.' 
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  admin,
  moderator,
  canPerformAction,
  authenticateSocket,
  checkOwnership,
  canVote,
  canDownvote,
  canComment,
  rateLimitByUser
}; 