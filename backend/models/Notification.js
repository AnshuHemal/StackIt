const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Notification title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Notification message cannot exceed 500 characters']
  },
  data: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    answerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    bountyAmount: Number,
    voteType: {
      type: String,
      enum: ['upvote', 'downvote']
    },
    mentionText: String,
    adminMessage: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Method to mark email as sent
notificationSchema.methods.markEmailSent = function() {
  this.isEmailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  return notification.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20, unreadOnly = false) {
  const skip = (page - 1) * limit;
  const query = { recipient: userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('data.questionId', 'title')
    .populate('data.answerId', 'content')
    .populate('data.commentId', 'content');
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Static method to create answer notification
notificationSchema.statics.createAnswerNotification = function(questionId, answerId, senderId, recipientId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'answer_posted',
    title: 'New answer to your question',
    message: 'Someone has posted an answer to your question',
    data: {
      questionId: questionId,
      answerId: answerId
    },
    priority: 'medium'
  });
};

// Static method to create vote notification
notificationSchema.statics.createVoteNotification = function(contentId, contentType, senderId, recipientId, voteType) {
  const type = contentType === 'question' ? 'question_voted' : 'answer_voted';
  const title = contentType === 'question' ? 'Your question received a vote' : 'Your answer received a vote';
  const message = `Your ${contentType} received a ${voteType}`;
  
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: type,
    title: title,
    message: message,
    data: {
      [contentType === 'question' ? 'questionId' : 'answerId']: contentId,
      voteType: voteType
    },
    priority: 'low'
  });
};

// Static method to create mention notification
notificationSchema.statics.createMentionNotification = function(mentionedUserId, senderId, content, contentId, contentType) {
  return this.createNotification({
    recipient: mentionedUserId,
    sender: senderId,
    type: 'user_mentioned',
    title: 'You were mentioned',
    message: 'Someone mentioned you in a comment or answer',
    data: {
      [contentType === 'question' ? 'questionId' : 'answerId']: contentId,
      mentionText: content
    },
    priority: 'medium'
  });
};

// Static method to create acceptance notification
notificationSchema.statics.createAcceptanceNotification = function(answerId, questionId, senderId, recipientId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'answer_accepted',
    title: 'Your answer was accepted!',
    message: 'The question owner accepted your answer',
    data: {
      questionId: questionId,
      answerId: answerId
    },
    priority: 'high'
  });
};

// Static method to create admin notification
notificationSchema.statics.createAdminNotification = function(recipientId, title, message, data = {}) {
  return this.createNotification({
    recipient: recipientId,
    sender: null, // System notification
    type: 'admin_message',
    title: title,
    message: message,
    data: data,
    priority: 'high'
  });
};

// Static method to create comment notification
notificationSchema.statics.createCommentNotification = function(questionId, commentId, senderId, recipientId, questionTitle) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'comment_posted',
    title: 'New comment on your question',
    message: `Someone commented on your question "${questionTitle}"`,
    data: {
      questionId: questionId,
      commentId: commentId
    },
    priority: 'medium'
  });
};

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration for low priority notifications
    if (this.priority === 'low') {
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (this.priority === 'medium') {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    // High and urgent notifications don't expire automatically
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 