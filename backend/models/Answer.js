const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    minlength: [20, 'Answer must be at least 20 characters long'],
    maxlength: [15000, 'Answer cannot exceed 15000 characters']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  commentCount: {
    type: Number,
    default: 0
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
    enum: ['active', 'deleted', 'pending_review'],
    default: 'active'
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for upvote count
answerSchema.virtual('upvoteCount').get(function() {
  return this.votes.upvotes.length;
});

// Virtual for downvote count
answerSchema.virtual('downvoteCount').get(function() {
  return this.votes.downvotes.length;
});

// Virtual for checking if user has voted
answerSchema.methods.hasUserVoted = function(userId) {
  const hasUpvoted = this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  const hasDownvoted = this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  
  if (hasUpvoted) return 'upvote';
  if (hasDownvoted) return 'downvote';
  return null;
};

// Method to add vote
answerSchema.methods.addVote = function(userId, voteType) {
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
answerSchema.methods.removeVote = function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString());
  
  return this.save();
};

// Method to accept answer
answerSchema.methods.acceptAnswer = function(acceptedBy) {
  // First, unaccept any previously accepted answer for this question
  return this.model('Answer').updateMany(
    { 
      question: this.question, 
      isAccepted: true 
    },
    { 
      isAccepted: false, 
      acceptedAt: null, 
      acceptedBy: null 
    }
  ).then(() => {
    this.isAccepted = true;
    this.acceptedAt = new Date();
    this.acceptedBy = acceptedBy;
    return this.save();
  });
};

// Method to unaccept answer
answerSchema.methods.unacceptAnswer = function() {
  this.isAccepted = false;
  this.acceptedAt = null;
  this.acceptedBy = null;
  return this.save();
};

// Method to edit answer
answerSchema.methods.editAnswer = function(newContent, editedBy, reason = '') {
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

// Method to update comment count
answerSchema.methods.updateCommentCount = function() {
  return this.model('Comment').countDocuments({ 
    answer: this._id, 
    status: 'active' 
  }).then(count => {
    this.commentCount = count;
    return this.save();
  });
};

// Indexes for better performance
answerSchema.index({ question: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ voteCount: -1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ status: 1 });

// Pre-save middleware to update question's lastActivity
answerSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    // Update question's lastActivity
    this.model('Question').findByIdAndUpdate(
      this.question,
      { lastActivity: new Date() }
    ).exec();
  }
  next();
});

// Post-save middleware to update question's answer count
answerSchema.post('save', function() {
  if (this.isNew) {
    this.model('Question').findByIdAndUpdate(
      this.question,
      { $inc: { answerCount: 1 } }
    ).exec();
  }
});

// Post-remove middleware to update question's answer count
answerSchema.post('remove', function() {
  this.model('Question').findByIdAndUpdate(
    this.question,
    { $inc: { answerCount: -1 } }
  ).exec();
});

// Static method to get answers for a question
answerSchema.statics.getAnswersForQuestion = function(questionId, sortBy = 'votes', page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  let sortQuery = {};
  switch (sortBy) {
    case 'votes':
      sortQuery = { voteCount: -1, createdAt: -1 };
      break;
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    case 'oldest':
      sortQuery = { createdAt: 1 };
      break;
    case 'accepted':
      sortQuery = { isAccepted: -1, voteCount: -1, createdAt: -1 };
      break;
    default:
      sortQuery = { voteCount: -1, createdAt: -1 };
  }
  
  return this.find({ 
    question: questionId, 
    status: 'active' 
  })
  .sort(sortQuery)
  .skip(skip)
  .limit(limit)
  .populate('author', 'username avatar reputation badges')
  .populate('acceptedBy', 'username');
};

// Static method to get user's answers
answerSchema.statics.getUserAnswers = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    author: userId, 
    status: 'active' 
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('question', 'title tags')
  .populate('author', 'username avatar reputation');
};

// Static method to get accepted answers count for a user
answerSchema.statics.getAcceptedAnswersCount = function(userId) {
  return this.countDocuments({ 
    author: userId, 
    isAccepted: true, 
    status: 'active' 
  });
};

module.exports = mongoose.model('Answer', answerSchema); 