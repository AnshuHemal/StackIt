const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateId, validateQuestionId } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const { rateLimitByUser } = require('../middleware/rateLimit');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const { broadcastToQuestion } = require('../socket/socketHandlers');

// Validation middleware for comment
const validateComment = (req, res, next) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return sendErrorResponse(res, {
      message: 'Comment content is required',
      statusCode: 400
    });
  }
  if (content.length > 1000) {
    return sendErrorResponse(res, {
      message: 'Comment cannot exceed 1000 characters',
      statusCode: 400
    });
  }
  next();
};

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', protect, validateComment, rateLimitByUser(20, 60 * 60 * 1000), asyncHandler(async (req, res) => {
  console.log('POST /api/comments', req.body);
  const { content, questionId, answerId, parentCommentId } = req.body;

  // Validate that we have either questionId or answerId
  if (!questionId && !answerId) {
    return sendErrorResponse(res, {
      message: 'Either questionId or answerId is required',
      statusCode: 400
    });
  }

  // Create comment
  const commentData = {
    content: content.trim(),
    author: req.user._id
  };

  if (questionId) {
    commentData.question = questionId;
  }
  if (answerId) {
    commentData.answer = answerId;
  }
  if (parentCommentId) {
    commentData.parentComment = parentCommentId;
  }

  const comment = await Comment.create(commentData);

  // Populate author info
  await comment.populate('author', 'username avatar reputation');

  // Send notification if commenting on a question
  if (questionId) {
    const question = await Question.findById(questionId).populate('author');
    if (question && question.author._id.toString() !== req.user._id.toString()) {
      await Notification.createCommentNotification(
        question._id,
        comment._id,
        req.user._id,
        question.author._id,
        question.title
      );
    }
  }

  // Send notification if commenting on an answer
  if (answerId) {
    const answer = await Answer.findById(answerId).populate('author');
    if (answer && answer.author._id.toString() !== req.user._id.toString()) {
      await Notification.createNotification({
        recipient: answer.author._id,
        sender: req.user._id,
        type: 'comment_posted',
        title: 'New comment on your answer',
        message: `${req.user.username} commented on your answer`,
        data: {
          answerId: answer._id,
          commentId: comment._id
        },
        priority: 'medium'
      });
    }
  }

  // Broadcast comment to connected users
  if (questionId) {
    broadcastToQuestion(questionId, 'comment-added', {
      comment: comment,
      questionId: questionId
    });
  }

  sendSuccessResponse(res, { comment }, 'Comment posted successfully', 201);
}));

// @route   GET /api/comments/question/:questionId
// @desc    Get comments for a question
// @access  Public
router.get('/question/:questionId', validateQuestionId, asyncHandler(async (req, res) => {
  console.log('GET /api/comments/question/:questionId', req.params);
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ 
    question: req.params.questionId,
    status: 'active'
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation')
    .populate('parentComment', 'content author');

  const total = await Comment.countDocuments({ 
    question: req.params.questionId,
    status: 'active'
  });

  sendSuccessResponse(res, {
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      hasNext: skip + comments.length < total,
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/comments/answer/:answerId
// @desc    Get comments for an answer
// @access  Public
router.get('/answer/:answerId', validateId, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ 
    answer: req.params.answerId,
    status: 'active'
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation')
    .populate('parentComment', 'content author');

  const total = await Comment.countDocuments({ 
    answer: req.params.answerId,
    status: 'active'
  });

  sendSuccessResponse(res, {
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      hasNext: skip + comments.length < total,
      hasPrev: page > 1
    }
  });
}));

// @route   PUT /api/comments/:id
// @desc    Edit a comment
// @access  Private
router.put('/:id', protect, validateId, validateComment, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, {
      message: 'Comment not found',
      statusCode: 404
    });
  }

  // Check ownership
  if (comment.author.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, {
      message: 'You can only edit your own comments',
      statusCode: 403
    });
  }

  // Edit comment
  await comment.editComment(content, req.user._id, 'User edit');

  // Populate author info
  await comment.populate('author', 'username avatar reputation');

  sendSuccessResponse(res, { comment }, 'Comment updated successfully');
}));

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', protect, validateId, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, {
      message: 'Comment not found',
      statusCode: 404
    });
  }

  // Check ownership or admin
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendErrorResponse(res, {
      message: 'You can only delete your own comments',
      statusCode: 403
    });
  }

  // Soft delete
  comment.status = 'deleted';
  await comment.save();

  sendSuccessResponse(res, {}, 'Comment deleted successfully');
}));

// @route   POST /api/comments/:id/vote
// @desc    Vote on a comment
// @access  Private
router.post('/:id/vote', protect, validateId, asyncHandler(async (req, res) => {
  const { voteType } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, {
      message: 'Comment not found',
      statusCode: 404
    });
  }

  // Check if user can downvote
  if (voteType === 'downvote' && req.user.reputation < 125) {
    return sendErrorResponse(res, {
      message: 'You need at least 125 reputation points to downvote',
      statusCode: 403
    });
  }

  // Check if user is voting on their own content
  if (comment.author.toString() === req.user._id.toString()) {
    return sendErrorResponse(res, {
      message: 'You cannot vote on your own content',
      statusCode: 400
    });
  }

  // Add vote
  await comment.addVote(req.user._id, voteType);

  // Update author reputation
  const reputationChange = voteType === 'upvote' ? 2 : -1;
  await comment.author.updateReputation(reputationChange);

  sendSuccessResponse(res, {
    voteCount: comment.voteCount,
    userVote: voteType
  }, 'Vote recorded successfully');
}));

// @route   DELETE /api/comments/:id/vote
// @desc    Remove vote from a comment
// @access  Private
router.delete('/:id/vote', protect, validateId, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, {
      message: 'Comment not found',
      statusCode: 404
    });
  }

  // Remove vote
  await comment.removeVote(req.user._id);

  sendSuccessResponse(res, {
    voteCount: comment.voteCount,
    userVote: null
  }, 'Vote removed successfully');
}));

// @route   POST /api/comments/:id/flag
// @desc    Flag a comment
// @access  Private
router.post('/:id/flag', protect, validateId, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return sendErrorResponse(res, {
      message: 'Comment not found',
      statusCode: 404
    });
  }

  // Check if user is flagging their own content
  if (comment.author.toString() === req.user._id.toString()) {
    return sendErrorResponse(res, {
      message: 'You cannot flag your own content',
      statusCode: 400
    });
  }

  // Flag comment
  await comment.flagComment(req.user._id, reason);

  sendSuccessResponse(res, {}, 'Comment flagged successfully');
}));

module.exports = router; 