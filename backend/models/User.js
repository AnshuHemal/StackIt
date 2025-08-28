const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  reputation: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String,
    enum: ['newbie', 'regular', 'expert', 'moderator', 'contributor']
  }],
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's question count
userSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Virtual for user's answer count
userSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Virtual for user's accepted answers count
userSchema.virtual('acceptedAnswersCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'author',
  count: true,
  match: { isAccepted: true }
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ reputation: -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      username: this.username, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET || 'temporary-secret-key-change-this',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Method to update reputation
userSchema.methods.updateReputation = function(points) {
  this.reputation += points;
  return this.save();
};

// Method to check if user can perform action based on role
userSchema.methods.canPerformAction = function(action) {
  const permissions = {
    guest: ['view_questions', 'view_answers'],
    user: ['view_questions', 'view_answers', 'ask_questions', 'answer_questions', 'vote', 'comment'],
    admin: ['view_questions', 'view_answers', 'ask_questions', 'answer_questions', 'vote', 'comment', 'moderate', 'ban_users', 'delete_content']
  };
  
  return permissions[this.role]?.includes(action) || false;
};

// Method to get user profile (public data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    bio: this.bio,
    reputation: this.reputation,
    badges: this.badges,
    questionCount: this.questionCount,
    answerCount: this.answerCount,
    acceptedAnswersCount: this.acceptedAnswersCount,
    createdAt: this.createdAt,
    lastActive: this.lastActive
  };
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Static method to get top users by reputation
userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ isBanned: false })
    .sort({ reputation: -1 })
    .limit(limit)
    .select('username avatar reputation badges');
};

module.exports = mongoose.model('User', userSchema); 