const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Story must have an author']
  },
  content: {
    type: String,
    maxlength: [500, 'Story content cannot exceed 500 characters']
  },
  mediaUrl: {
    type: String,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  backgroundColor: {
    type: String,
    default: '#667eea'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  fontStyle: {
    type: String,
    enum: ['normal', 'bold', 'italic'],
    default: 'normal'
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [200, 'Reply cannot exceed 200 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    index: { expires: 0 } // TTL index
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
storySchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Index for better query performance
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ createdAt: -1 });

// Static method to get active stories for feed
storySchema.statics.getActiveStories = function(userId = null) {
  const query = {
    expiresAt: { $gt: new Date() }
  };

  if (userId) {
    // Don't show user's own stories in feed
    query.author = { $ne: userId };
  }

  return this.find(query)
  .populate('author', 'username firstName lastName profilePicture university year')
  .populate('replies.user', 'username firstName lastName profilePicture')
  .sort({ createdAt: -1 })
  .limit(50);
};

// Static method to get user's stories
storySchema.statics.getUserStories = function(userId) {
  return this.find({
    author: userId,
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: -1 });
};

// Static method to mark story as viewed
storySchema.statics.markAsViewed = function(storyId, userId) {
  return this.findByIdAndUpdate(
    storyId,
    {
      $addToSet: {
        views: { user: userId, viewedAt: new Date() }
      }
    },
    { new: true }
  );
};

module.exports = mongoose.model('Story', storySchema);