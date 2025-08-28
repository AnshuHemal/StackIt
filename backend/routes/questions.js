const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Tag = require('../models/Tag');
const User = require('../models/User');
const { 
  protect, 
  optionalAuth, 
  canVote, 
  canDownvote,
  checkOwnership,
  rateLimitByUser 
} = require('../middleware/auth');
const { 
  validateQuestion, 
  validateSearch, 
  validatePagination,
  validateId 
} = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const { sendNotificationToUser, broadcastToQuestion } = require('../socket/socketHandlers');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/questions
// @desc    Get all questions with filtering and pagination
// @access  Public
router.get('/', optionalAuth, validatePagination, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'newest';
  const filter = req.query.filter || 'all';
  const tags = req.query.tags ? req.query.tags.split(',') : [];
  const author = req.query.author;

  const skip = (page - 1) * limit;
  const query = { status: 'active' };

  // Apply filters
  if (filter === 'unanswered') {
    query.answerCount = 0;
  } else if (filter === 'answered') {
    query.answerCount = { $gt: 0 };
  } else if (filter === 'featured') {
    query.isFeatured = true;
  } else if (filter === 'bounty') {
    query['bounty.amount'] = { $gt: 0 };
  }

  // Filter by tags
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Filter by author
  if (author) {
    const authorUser = await User.findOne({ username: author });
    if (authorUser) {
      query.author = authorUser._id;
    }
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'votes':
      sortObj = { voteCount: -1, createdAt: -1 };
      break;
    case 'views':
      sortObj = { views: -1, createdAt: -1 };
      break;
    case 'activity':
      sortObj = { lastActivity: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const questions = await Question.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar reputation badges')
    .populate('closedBy', 'username')
    .populate('featuredBy', 'username');

  const total = await Question.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  // Add user vote status if authenticated
  if (req.user) {
    for (let question of questions) {
      question.userVote = question.hasUserVoted(req.user._id);
    }
  }

  sendSuccessResponse(res, {
    questions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/questions/trending
// @desc    Get trending questions
// @access  Public
router.get('/trending', optionalAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const days = parseInt(req.query.days) || 7;

  const questions = await Question.getTrendingQuestions(limit, days);

  // Add user vote status if authenticated
  if (req.user) {
    for (let question of questions) {
      question.userVote = question.hasUserVoted(req.user._id);
    }
  }

  sendSuccessResponse(res, { questions });
}));

// @route   GET /api/questions/search
// @desc    Search questions
// @access  Public
router.get('/search', optionalAuth, validateSearch, asyncHandler(async (req, res) => {
  const { q: query, tags, status, author, page = 1, limit = 10 } = req.query;

  const filters = { tags, status, author, limit };
  const questions = await Question.searchQuestions(query, filters);

  // Add user vote status if authenticated
  if (req.user) {
    for (let question of questions) {
      question.userVote = question.hasUserVoted(req.user._id);
    }
  }

  sendSuccessResponse(res, { questions });
}));

// @route   GET /api/questions/:id/answers
// @desc    Get all answers for a question
// @access  Public
router.get('/:id/answers', asyncHandler(async (req, res) => {
  const questionId = req.params.id;
  const question = await Question.findById(questionId);
  if (!question) {
    return sendErrorResponse(res, {
      message: 'Question not found',
      statusCode: 404
    });
  }
  const answers = await Answer.find({ question: questionId })
    .sort({ voteCount: -1, createdAt: 1 })
    .populate('author', 'username avatar reputation');
  sendSuccessResponse(res, { answers });
}));

// @route   GET /api/questions/:id
// @desc    Get single question by ID
// @access  Public
router.get('/:id', optionalAuth, validateId, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('author', 'username avatar reputation badges bio')
    .populate('closedBy', 'username')
    .populate('featuredBy', 'username')
    .populate('bounty.offeredBy', 'username');

  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  // Add view if user is authenticated
  if (req.user) {
    await question.addView(req.user._id);
  } else {
    await question.addView();
  }

  // Add user vote status if authenticated
  if (req.user) {
    question.userVote = question.hasUserVoted(req.user._id);
  }

  // Get answers for this question
  const answers = await Answer.getAnswersForQuestion(question._id, 'votes', 1, 50);

  // Add user vote status to answers if authenticated
  if (req.user) {
    for (let answer of answers) {
      answer.userVote = answer.hasUserVoted(req.user._id);
    }
  }

  sendSuccessResponse(res, { question, answers });
}));

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', protect, validateQuestion, rateLimitByUser(10, 60 * 60 * 1000), asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;

  // Process tags - create if they don't exist
  const processedTags = [];
  for (const tagName of tags) {
    let tag = await Tag.findOne({ name: tagName.toLowerCase() });
    if (!tag) {
      tag = await Tag.create({
        name: tagName.toLowerCase(),
        displayName: tagName,
        createdBy: req.user._id
      });
    }
    processedTags.push(tag.name);
    await tag.incrementUsage();
  }

  // Create question
  const question = await Question.create({
    title,
    description,
    tags: processedTags,
    author: req.user._id
  });

  // Populate author info
  await question.populate('author', 'username avatar reputation badges');

  sendSuccessResponse(res, { question }, 'Question created successfully', 201);
}));

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', protect, validateId, validateQuestion, checkOwnership('Question'), asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;

  // Process tags
  const processedTags = [];
  for (const tagName of tags) {
    let tag = await Tag.findOne({ name: tagName.toLowerCase() });
    if (!tag) {
      tag = await Tag.create({
        name: tagName.toLowerCase(),
        displayName: tagName,
        createdBy: req.user._id
      });
    }
    processedTags.push(tag.name);
  }

  // Update question
  req.item.title = title;
  req.item.description = description;
  req.item.tags = processedTags;
  await req.item.save();

  await req.item.populate('author', 'username avatar reputation badges');

  // Broadcast update to connected users
  broadcastToQuestion(req.item._id, 'question-updated', {
    questionId: req.item._id,
    updates: { title, description, tags: processedTags }
  });

  sendSuccessResponse(res, { question: req.item }, 'Question updated successfully');
}));

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', protect, validateId, checkOwnership('Question'), asyncHandler(async (req, res) => {
  // Soft delete - mark as deleted
  req.item.status = 'deleted';
  await req.item.save();

  sendSuccessResponse(res, {}, 'Question deleted successfully');
}));

// @route   POST /api/questions/:id/vote
// @desc    Vote on a question
// @access  Private
router.post('/:id/vote', protect, validateId, canVote, asyncHandler(async (req, res) => {
  const { voteType } = req.body;

  // Check if user can downvote
  if (voteType === 'downvote' && req.user.reputation < 125) {
    return sendErrorResponse(res, { 
      message: 'You need at least 125 reputation points to downvote',
      statusCode: 403 
    });
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  // Check if user is voting on their own content
  if (question.author.toString() === req.user._id.toString()) {
    return sendErrorResponse(res, { 
      message: 'You cannot vote on your own content',
      statusCode: 400 
    });
  }

  // Add vote
  await question.addVote(req.user._id, voteType);

  // Update author reputation
  const reputationChange = voteType === 'upvote' ? 10 : -2;
  await question.author.updateReputation(reputationChange);

  // Send notification to question author
  if (question.author.toString() !== req.user._id.toString()) {
    await sendNotificationToUser(question.author, {
      recipient: question.author,
      sender: req.user._id,
      type: 'question_voted',
      title: 'Your question received a vote',
      message: `Your question "${question.title}" received a ${voteType}`,
      data: {
        questionId: question._id,
        voteType: voteType
      }
    });
  }

  // Broadcast vote update
  broadcastToQuestion(question._id, 'vote-updated', {
    questionId: question._id,
    voteType,
    newCount: question.voteCount
  });

  sendSuccessResponse(res, { 
    voteCount: question.voteCount,
    userVote: voteType 
  }, 'Vote recorded successfully');
}));

// @route   DELETE /api/questions/:id/vote
// @desc    Remove vote from a question
// @access  Private
router.delete('/:id/vote', protect, validateId, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  // Remove vote
  await question.removeVote(req.user._id);

  // Broadcast vote update
  broadcastToQuestion(question._id, 'vote-updated', {
    questionId: question._id,
    voteType: null,
    newCount: question.voteCount
  });

  sendSuccessResponse(res, { 
    voteCount: question.voteCount,
    userVote: null 
  }, 'Vote removed successfully');
}));

// @route   POST /api/questions/:id/close
// @desc    Close a question (admin/author only)
// @access  Private
router.post('/:id/close', protect, validateId, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const question = await Question.findById(req.params.id);
  
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  // Check permissions
  if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, { 
      message: 'You can only close your own questions',
      statusCode: 403 
    });
  }

  await question.closeQuestion(reason, req.user._id);

  sendSuccessResponse(res, { question }, 'Question closed successfully');
}));

// @route   POST /api/questions/:id/reopen
// @desc    Reopen a closed question (admin only)
// @access  Private
router.post('/:id/reopen', protect, validateId, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  if (req.user.role !== 'admin') {
    return sendErrorResponse(res, { 
      message: 'Only admins can reopen questions',
      statusCode: 403 
    });
  }

  await question.reopenQuestion();

  sendSuccessResponse(res, { question }, 'Question reopened successfully');
}));

// @route   POST /api/questions/:id/feature
// @desc    Feature a question (admin only)
// @access  Private
router.post('/:id/feature', protect, validateId, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  if (req.user.role !== 'admin') {
    return sendErrorResponse(res, { 
      message: 'Only admins can feature questions',
      statusCode: 403 
    });
  }

  await question.featureQuestion(req.user._id);

  sendSuccessResponse(res, { question }, 'Question featured successfully');
}));

// @route   DELETE /api/questions/:id/feature
// @desc    Unfeature a question (admin only)
// @access  Private
router.delete('/:id/feature', protect, validateId, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  if (req.user.role !== 'admin') {
    return sendErrorResponse(res, { 
      message: 'Only admins can unfeature questions',
      statusCode: 403 
    });
  }

  await question.unfeatureQuestion();

  sendSuccessResponse(res, { question }, 'Question unfeatured successfully');
}));

// @route   POST /api/questions/:id/bounty
// @desc    Add bounty to a question
// @access  Private
router.post('/:id/bounty', protect, validateId, asyncHandler(async (req, res) => {
  const { amount, expiresInDays } = req.body;
  const question = await Question.findById(req.params.id);
  
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  if (question.author.toString() === req.user._id.toString()) {
    return sendErrorResponse(res, { 
      message: 'You cannot add bounty to your own question',
      statusCode: 400 
    });
  }

  await question.addBounty(amount, req.user._id, expiresInDays);

  sendSuccessResponse(res, { question }, 'Bounty added successfully');
}));

// @route   POST /api/questions/:id/upload
// @desc    Upload images for a question
// @access  Private
router.post('/:id/upload', protect, validateId, checkOwnership('Question'), upload.array('images', 5), asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return sendErrorResponse(res, { 
      message: 'Question not found',
      statusCode: 404 
    });
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    try {
      const result = await cloudinary.uploader.upload_stream({
        resource_type: 'auto',
        folder: 'stackit/questions'
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
        }
      }).end(file.buffer);

      uploadedFiles.push({
        filename: result.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.secure_url
      });
    } catch (error) {
      console.error('File upload error:', error);
    }
  }

  // Add attachments to question
  question.attachments.push(...uploadedFiles);
  await question.save();

  sendSuccessResponse(res, { attachments: uploadedFiles }, 'Files uploaded successfully');
}));

// @route   POST /api/questions/:id/answers
// @desc    Post a new answer to a question
// @access  Private
router.post('/:id/answers', protect, validateId, rateLimitByUser(10, 60 * 60 * 1000), asyncHandler(async (req, res) => {
  console.log('POST /api/questions/:id/answers', req.params, req.body);
  const questionId = req.params.id;
  const { content } = req.body;

  // Remove minimum length validation, only check for non-empty content
  if (!content || !content.trim()) {
    console.log('Validation failed: content missing', content);
    return sendErrorResponse(res, {
      message: 'Answer content is required',
      statusCode: 400,
      details: { content }
    });
  }

  const question = await Question.findById(questionId);
  if (!question) {
    console.log('Validation failed: question not found', questionId);
    return sendErrorResponse(res, {
      message: 'Question not found',
      statusCode: 404,
      details: { questionId }
    });
  }

  // Create answer
  const answer = await Answer.create({
    content: content.trim(),
    author: req.user._id,
    question: questionId
  });

  // Update answer count on question
  question.answerCount = (question.answerCount || 0) + 1;
  await question.save();

  // Populate author info
  await answer.populate('author', 'username avatar reputation');

  sendSuccessResponse(res, { answer }, 'Answer posted successfully', 201);
}));

module.exports = router; 