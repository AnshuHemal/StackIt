const rateLimit = require('express-rate-limit');

// Rate limiting by user ID (for authenticated users)
const rateLimitByUser = (maxRequests, windowMs) => {
  return rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: 'Too many requests from this user, please try again later.',
      statusCode: 429
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user ? req.user._id.toString() : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user && req.user.role === 'admin';
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiting by IP address (for unauthenticated users)
const rateLimitByIP = (maxRequests, windowMs) => {
  return rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters for different actions
const authRateLimit = rateLimitByIP(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const commentRateLimit = rateLimitByUser(20, 60 * 60 * 1000); // 20 comments per hour
const questionRateLimit = rateLimitByUser(10, 60 * 60 * 1000); // 10 questions per hour
const answerRateLimit = rateLimitByUser(15, 60 * 60 * 1000); // 15 answers per hour
const voteRateLimit = rateLimitByUser(50, 60 * 60 * 1000); // 50 votes per hour

module.exports = {
  rateLimitByUser,
  rateLimitByIP,
  authRateLimit,
  commentRateLimit,
  questionRateLimit,
  answerRateLimit,
  voteRateLimit
}; 