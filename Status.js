const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  mediaUrl: {
    type: String // Image or video URL
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  backgroundColor: {
    type: String,
    default: '#667eea' // For text-only status
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expire: 86400 // Auto delete after 24 hours
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
});

// Get status viewer count
statusSchema.methods.getViewCount = function() {
  return this.viewedBy.length;
};

// Add viewer to status
statusSchema.methods.addViewer = async function(userId) {
  if (!this.viewedBy.includes(userId)) {
    this.viewedBy.push(userId);
    await this.save();
  }
};

// Check if user has viewed
statusSchema.methods.hasViewed = function(userId) {
  return this.viewedBy.includes(userId);
};

// Get user's active statuses
statusSchema.statics.getActiveStatuses = async function(userId) {
  return await this.find({
    author: userId,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Get story feed for user
statusSchema.statics.getStatusFeed = async function(userId) {
  const user = await mongoose.model('User').findById(userId).select('following');
  
  return await this.find({
    author: { $in: user.following },
    expiresAt: { $gt: new Date() }
  }).populate('author', 'username firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Status', statusSchema);