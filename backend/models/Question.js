const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Question description is required'],
    minlength: [20, 'Description must be at least 20 characters long'],
    maxlength: [10000, 'Description cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
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
  views: {
    type: Number,
    default: 0
  },
  viewHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isClosed: {
    type: Boolean,
    default: false
  },
  closedReason: {
    type: String,
    enum: ['duplicate', 'off_topic', 'too_broad', 'opinion_based', 'spam', 'other'],
    default: null
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  featuredAt: {
    type: Date,
    default: null
  },
  bounty: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Bounty amount cannot be negative']
    },
    expiresAt: {
      type: Date,
      default: null
    },
    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  answerCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted', 'pending_review'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for upvote count
questionSchema.virtual('upvoteCount').get(function() {
  return this.votes.upvotes.length;
});

// Virtual for downvote count
questionSchema.virtual('downvoteCount').get(function() {
  return this.votes.downvotes.length;
});

// Virtual for checking if user has voted
questionSchema.methods.hasUserVoted = function(userId) {
  const hasUpvoted = this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  const hasDownvoted = this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  
  if (hasUpvoted) return 'upvote';
  if (hasDownvoted) return 'downvote';
  return null;
};

// Method to add vote
questionSchema.methods.addVote = function(userId, voteType) {
  // Remove existing votes from this user
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote
  if (voteType === 'upvote') {
    this.votes.upvotes.push({ user: userId });
  } else if (voteType === 'downvote') {
    this.votes.downvotes.push({ user: userId });
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to remove vote
questionSchema.methods.removeVote = function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to add view
questionSchema.methods.addView = function(userId = null) {
  this.views += 1;
  
  if (userId) {
    // Remove existing view from this user (to update timestamp)
    this.viewHistory = this.viewHistory.filter(view => view.user.toString() !== userId.toString());
    this.viewHistory.push({ user: userId });
  }
  
  return this.save();
};

// Method to close question
questionSchema.methods.closeQuestion = function(reason, closedBy) {
  this.isClosed = true;
  this.closedReason = reason;
  this.closedBy = closedBy;
  this.closedAt = new Date();
  this.status = 'closed';
  this.lastActivity = new Date();
  return this.save();
};

// Method to reopen question
questionSchema.methods.reopenQuestion = function() {
  this.isClosed = false;
  this.closedReason = null;
  this.closedBy = null;
  this.closedAt = null;
  this.status = 'active';
  this.lastActivity = new Date();
  return this.save();
};

// Method to feature question
questionSchema.methods.featureQuestion = function(featuredBy) {
  this.isFeatured = true;
  this.featuredBy = featuredBy;
  this.featuredAt = new Date();
  this.lastActivity = new Date();
  return this.save();
};

// Method to unfeature question
questionSchema.methods.unfeatureQuestion = function() {
  this.isFeatured = false;
  this.featuredBy = null;
  this.featuredAt = null;
  this.lastActivity = new Date();
  return this.save();
};

// Method to add bounty
questionSchema.methods.addBounty = function(amount, offeredBy, expiresInDays = 7) {
  this.bounty.amount = amount;
  this.bounty.offeredBy = offeredBy;
  this.bounty.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  this.lastActivity = new Date();
  return this.save();
};

// Method to update answer count
questionSchema.methods.updateAnswerCount = function() {
  return this.model('Answer').countDocuments({ question: this._id, status: 'active' })
    .then(count => {
      this.answerCount = count;
      this.lastActivity = new Date();
      return this.save();
    });
};

// Indexes for better performance
questionSchema.index({ title: 'text', description: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ lastActivity: -1 });
questionSchema.index({ voteCount: -1 });
questionSchema.index({ views: -1 });
questionSchema.index({ isFeatured: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ 'bounty.expiresAt': 1 });

// Pre-save middleware to update lastActivity
questionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastActivity = new Date();
  }
  next();
});

// Static method to get trending questions
questionSchema.statics.getTrendingQuestions = function(limit = 10, days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: date },
        status: 'active'
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $size: '$votes.upvotes' }, 10] },
            { $multiply: [{ $size: '$votes.downvotes' }, -2] },
            { $multiply: ['$views', 0.1] },
            { $multiply: ['$answerCount', 5] }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $project: {
        title: 1,
        description: 1,
        tags: 1,
        voteCount: 1,
        views: 1,
        answerCount: 1,
        createdAt: 1,
        lastActivity: 1,
        'author.username': 1,
        'author.avatar': 1,
        'author.reputation': 1
      }
    }
  ]);
};

// Static method to search questions
questionSchema.statics.searchQuestions = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query }
  };
  
  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }
  
  if (filters.status) {
    searchQuery.status = filters.status;
  }
  
  if (filters.author) {
    searchQuery.author = filters.author;
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'username avatar reputation')
    .limit(filters.limit || 20);
};

module.exports = mongoose.model('Question', questionSchema); 