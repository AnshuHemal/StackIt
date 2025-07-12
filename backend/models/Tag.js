const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    lowercase: true,
    minlength: [2, 'Tag name must be at least 2 characters long'],
    maxlength: [20, 'Tag name cannot exceed 20 characters'],
    match: [/^[a-z0-9-]+$/, 'Tag name can only contain lowercase letters, numbers, and hyphens']
  },
  displayName: {
    type: String,
    required: [true, 'Tag display name is required'],
    trim: true,
    maxlength: [30, 'Display name cannot exceed 30 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Tag description cannot exceed 500 characters'],
    default: ''
  },
  usageCount: {
    type: Number,
    default: 0
  },
  questionCount: {
    type: Number,
    default: 0
  },
  isModerated: {
    type: Boolean,
    default: false
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
  synonyms: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  relatedTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  category: {
    type: String,
    enum: ['programming', 'technology', 'science', 'business', 'education', 'other'],
    default: 'other'
  },
  color: {
    type: String,
    default: '#007bff',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: null
  },
  wiki: {
    content: {
      type: String,
      maxlength: [5000, 'Wiki content cannot exceed 5000 characters']
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedAt: {
      type: Date,
      default: null
    },
    editCount: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalAnswers: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    avgScore: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'deprecated', 'banned'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ questionCount: -1 });
tagSchema.index({ category: 1 });
tagSchema.index({ isFeatured: 1 });
tagSchema.index({ status: 1 });
tagSchema.index({ 'stats.lastActivity': -1 });

// Method to increment usage count
tagSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.questionCount += 1;
  this.stats.totalQuestions += 1;
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to decrement usage count
tagSchema.methods.decrementUsage = function() {
  this.usageCount = Math.max(0, this.usageCount - 1);
  this.questionCount = Math.max(0, this.questionCount - 1);
  this.stats.totalQuestions = Math.max(0, this.stats.totalQuestions - 1);
  return this.save();
};

// Method to update stats
tagSchema.methods.updateStats = function() {
  return this.model('Question').aggregate([
    { $match: { tags: this.name, status: 'active' } },
    {
      $lookup: {
        from: 'answers',
        localField: '_id',
        foreignField: 'question',
        as: 'answers'
      }
    },
    {
      $addFields: {
        totalVotes: { $add: ['$voteCount', { $sum: '$answers.voteCount' }] },
        totalAnswers: { $size: '$answers' }
      }
    },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        totalAnswers: { $sum: '$totalAnswers' },
        totalVotes: { $sum: '$totalVotes' },
        avgScore: { $avg: '$voteCount' }
      }
    }
  ]).then(results => {
    if (results.length > 0) {
      const stats = results[0];
      this.stats.totalQuestions = stats.totalQuestions;
      this.stats.totalAnswers = stats.totalAnswers;
      this.stats.totalVotes = stats.totalVotes;
      this.stats.avgScore = Math.round(stats.avgScore * 100) / 100;
      this.stats.lastActivity = new Date();
      this.questionCount = stats.totalQuestions;
      this.usageCount = stats.totalQuestions;
    }
    return this.save();
  });
};

// Method to feature tag
tagSchema.methods.featureTag = function(featuredBy) {
  this.isFeatured = true;
  this.featuredBy = featuredBy;
  this.featuredAt = new Date();
  return this.save();
};

// Method to unfeature tag
tagSchema.methods.unfeatureTag = function() {
  this.isFeatured = false;
  this.featuredBy = null;
  this.featuredAt = null;
  return this.save();
};

// Method to add synonym
tagSchema.methods.addSynonym = function(synonym) {
  if (!this.synonyms.includes(synonym)) {
    this.synonyms.push(synonym);
  }
  return this.save();
};

// Method to remove synonym
tagSchema.methods.removeSynonym = function(synonym) {
  this.synonyms = this.synonyms.filter(s => s !== synonym);
  return this.save();
};

// Method to add related tag
tagSchema.methods.addRelatedTag = function(tagId) {
  if (!this.relatedTags.includes(tagId)) {
    this.relatedTags.push(tagId);
  }
  return this.save();
};

// Method to remove related tag
tagSchema.methods.removeRelatedTag = function(tagId) {
  this.relatedTags = this.relatedTags.filter(id => id.toString() !== tagId.toString());
  return this.save();
};

// Method to update wiki
tagSchema.methods.updateWiki = function(content, editedBy) {
  this.wiki.content = content;
  this.wiki.lastEditedBy = editedBy;
  this.wiki.lastEditedAt = new Date();
  this.wiki.editCount += 1;
  return this.save();
};

// Static method to get popular tags
tagSchema.statics.getPopularTags = function(limit = 20, category = null) {
  const query = { status: 'active' };
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ usageCount: -1, name: 1 })
    .limit(limit)
    .select('name displayName description usageCount questionCount color icon category');
};

// Static method to get featured tags
tagSchema.statics.getFeaturedTags = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active' 
  })
    .sort({ featuredAt: -1 })
    .limit(limit)
    .populate('featuredBy', 'username');
};

// Static method to search tags
tagSchema.statics.searchTags = function(query, limit = 10) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { displayName: { $regex: query, $options: 'i' } },
      { synonyms: { $in: [new RegExp(query, 'i')] } }
    ],
    status: 'active'
  })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name displayName description usageCount color icon category');
};

// Static method to get tags by category
tagSchema.statics.getTagsByCategory = function(category, limit = 20) {
  return this.find({ 
    category: category, 
    status: 'active' 
  })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name displayName description usageCount color icon');
};

// Static method to get related tags
tagSchema.statics.getRelatedTags = function(tagNames, limit = 10) {
  return this.aggregate([
    {
      $match: {
        name: { $in: tagNames },
        status: 'active'
      }
    },
    {
      $lookup: {
        from: 'questions',
        localField: 'name',
        foreignField: 'tags',
        as: 'questions'
      }
    },
    {
      $unwind: '$questions'
    },
    {
      $group: {
        _id: '$questions._id',
        tags: { $addToSet: '$questions.tags' }
      }
    },
    {
      $unwind: '$tags'
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        _id: { $nin: tagNames }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'tags',
        localField: '_id',
        foreignField: 'name',
        as: 'tagInfo'
      }
    },
    {
      $unwind: '$tagInfo'
    },
    {
      $project: {
        name: '$tagInfo.name',
        displayName: '$tagInfo.displayName',
        description: '$tagInfo.description',
        usageCount: '$tagInfo.usageCount',
        color: '$tagInfo.color',
        icon: '$tagInfo.icon',
        count: 1
      }
    }
  ]);
};

// Static method to create tag if not exists
tagSchema.statics.findOrCreate = function(tagData) {
  return this.findOne({ name: tagData.name })
    .then(tag => {
      if (tag) {
        return tag;
      }
      return this.create(tagData);
    });
};

// Static method to get tag statistics
tagSchema.statics.getTagStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' },
        avgUsage: { $avg: '$usageCount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('Tag', tagSchema); 