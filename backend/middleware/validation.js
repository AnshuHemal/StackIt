const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      fields: formattedErrors
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Question creation validation
const validateQuestion = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 10000 })
    .withMessage('Description must be between 20 and 10000 characters'),
  
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Please provide between 1 and 5 tags'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Each tag must be between 2 and 20 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Tags can only contain lowercase letters, numbers, and hyphens'),
  
  handleValidationErrors
];

// Answer creation validation
const validateAnswer = [
  body('content')
    .trim()
    .isLength({ min: 20, max: 15000 })
    .withMessage('Answer must be between 20 and 15000 characters'),
  
  body('questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),
  
  handleValidationErrors
];

// Comment creation validation
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 15, max: 1000 })
    .withMessage('Comment must be between 15 and 1000 characters'),
  
  body('questionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid question ID'),
  
  body('answerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid answer ID'),
  
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
  
  handleValidationErrors
];

// Vote validation
const validateVote = [
  body('voteType')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either upvote or downvote'),
  
  handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('preferences.pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['relevance', 'newest', 'votes', 'views'])
    .withMessage('Sort must be relevance, newest, votes, or views'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Tag validation
const validateTag = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Tag name must be between 2 and 20 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Tag name can only contain lowercase letters, numbers, and hyphens'),
  
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Display name must be between 2 and 30 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn(['programming', 'technology', 'science', 'business', 'education', 'other'])
    .withMessage('Invalid category'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  
  handleValidationErrors
];

// Admin user management validation
const validateUserManagement = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('action')
    .isIn(['ban', 'unban', 'promote', 'demote', 'delete'])
    .withMessage('Invalid action'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Notification validation
const validateNotification = [
  body('recipientId')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  
  body('type')
    .isIn([
      'answer_posted',
      'answer_accepted',
      'question_voted',
      'answer_voted',
      'comment_posted',
      'user_mentioned',
      'question_closed',
      'question_featured',
      'bounty_added',
      'bounty_expired',
      'admin_message',
      'user_banned',
      'content_flagged'
    ])
    .withMessage('Invalid notification type'),
  
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Email validation
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// Username validation
const validateUsername = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  handleValidationErrors
];

const validateQuestionId = [
  param('questionId').isMongoId().withMessage('Invalid question ID'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateQuestion,
  validateAnswer,
  validateComment,
  validateVote,
  validateProfileUpdate,
  validatePasswordChange,
  validateSearch,
  validatePagination,
  validateId,
  validateQuestionId,
  validateTag,
  validateUserManagement,
  validateNotification,
  validateFileUpload,
  validateEmail,
  validateUsername
}; 