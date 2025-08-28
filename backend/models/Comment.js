const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  lastEdited: {
    type: Date,
    default: null
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  status: {
    type: String,
    enum: ['active', 'deleted', 'pending_review', 'flagged'],
    default: 'active'
  },
  flaggedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'offensive', 'duplicate', 'other']
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  flagCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
commentSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for upvote count
commentSchema.virtual('upvoteCount').get(function() {
  return this.votes.upvotes.length;
});

// Virtual for downvote count
commentSchema.virtual('downvoteCount').get(function() {
  return this.votes.downvotes.length;
});

// Virtual for checking if user has voted
commentSchema.methods.hasUserVoted = function(userId) {
  const hasUpvoted = this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  const hasDownvoted = this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  
  if (hasUpvoted) return 'upvote';
  if (hasDownvoted) return 'downvote';
  return null;
};

// Method to add vote
commentSchema.methods.addVote = function(userId, voteType) {
  // Remove existing votes from this user
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote
  if (voteType === 'upvote') {
    this.votes.upvotes.push({ user: userId });
  } else if (voteType === 'downvote') {
    this.votes.downvotes.push({ user: userId });
  }
  
  return this.save();
};

// Method to remove vote
commentSchema.methods.removeVote = function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  return this.save();
};

// Method to edit comment
commentSchema.methods.editComment = function(newContent, editedBy, reason = '') {
  // Save current content to edit history
  this.editHistory.push({
    content: this.content,
    editedBy: editedBy,
    reason: reason
  });
  
  this.content = newContent;
  this.isEdited = true;
  this.lastEdited = new Date();
  
  return this.save();
};

// Method to flag comment
commentSchema.methods.flagComment = function(userId, reason) {
  // Check if user already flagged this comment
  const existingFlag = this.flaggedBy.find(flag => flag.user.toString() === userId.toString());
  
  if (!existingFlag) {
    this.flaggedBy.push({
      user: userId,
      reason: reason
    });
    this.flagCount += 1;
    
    // Auto-flag if too many flags
    if (this.flagCount >= 3) {
      this.status = 'flagged';
    }
  }
  
  return this.save();
};

// Method to unflag comment
commentSchema.methods.unflagComment = function(userId) {
  this.flaggedBy = this.flaggedBy.filter(flag => flag.user.toString() !== userId.toString());
  this.flagCount = this.flaggedBy.length;
  
  if (this.flagCount < 3 && this.status === 'flagged') {
    this.status = 'active';
  }
  
  return this.save();
};

// Method to extract mentions from content
commentSchema.methods.extractMentions = function() {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(this.content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

// Method to process mentions
commentSchema.methods.processMentions = async function() {
  const mentionUsernames = this.extractMentions();
  const User = this.model('User');
  
  const mentionedUsers = await User.find({
    username: { $in: mentionUsernames }
  }).select('_id username');
  
  this.mentions = mentionedUsers.map(user => ({
    user: user._id,
    username: user.username
  }));
  
  return this.save();
};

// Indexes for better performance
commentSchema.index({ question: 1 });
commentSchema.index({ answer: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ voteCount: -1 });
commentSchema.index({ status: 1 });
commentSchema.index({ flagCount: -1 });

// Pre-save middleware to process mentions
commentSchema.pre('save', async function(next) {
  if (this.isModified('content')) {
    try {
      await this.processMentions();
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }
  next();
});

// Post-save middleware to update parent content's comment count
commentSchema.post('save', function() {
  if (this.isNew) {
    if (this.question) {
      this.model('Question').findByIdAndUpdate(
        this.question,
        { $inc: { commentCount: 1 } }
      ).exec();
    } else if (this.answer) {
      this.model('Answer').findByIdAndUpdate(
        this.answer,
        { $inc: { commentCount: 1 } }
      ).exec();
    }
  }
});

// Post-remove middleware to update parent content's comment count
commentSchema.post('remove', function() {
  if (this.question) {
    this.model('Question').findByIdAndUpdate(
      this.question,
      { $inc: { commentCount: -1 } }
    ).exec();
  } else if (this.answer) {
    this.model('Answer').findByIdAndUpdate(
      this.answer,
      { $inc: { commentCount: -1 } }
    ).exec();
  }
});

// Static method to get comments for a question
commentSchema.statics.getQuestionComments = function(questionId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    question: questionId, 
    parentComment: null,
    status: 'active' 
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar reputation')
    .populate('mentions.user', 'username')
    .populate({
      path: 'replies',
      match: { status: 'active' },
      populate: {
        path: 'author',
        select: 'username avatar reputation'
      },
      options: { sort: { createdAt: 1 } }
    });
};

// Static method to get comments for an answer
commentSchema.statics.getAnswerComments = function(answerId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    answer: answerId, 
    parentComment: null,
    status: 'active' 
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar reputation')
    .populate('mentions.user', 'username')
    .populate({
      path: 'replies',
      match: { status: 'active' },
      populate: {
        path: 'author',
        select: 'username avatar reputation'
      },
      options: { sort: { createdAt: 1 } }
    });
};

// Static method to get user comments
commentSchema.statics.getUserComments = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    author: userId, 
    status: 'active' 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('question', 'title')
    .populate('answer', 'content')
    .populate('parentComment', 'content');
};

// Static method to get flagged comments
commentSchema.statics.getFlaggedComments = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    status: 'flagged' 
  })
    .sort({ flagCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username')
    .populate('question', 'title')
    .populate('answer', 'content')
    .populate('flaggedBy.user', 'username');
};

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

module.exports = mongoose.model('Comment', commentSchema); 