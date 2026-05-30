const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have an author']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post cannot exceed 2000 characters']
  },
  images: [{
    type: String, // URLs to uploaded images
    trim: true
  }],
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'link'],
    default: 'text'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  university: {
    type: String,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ university: 1 });
postSchema.index({ visibility: 1 });

// Pre-save middleware to extract mentions and tags
postSchema.pre('save', function(next) {
  // Extract mentions (@username)
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(this.content)) !== null) {
    mentions.push(match[1]);
  }

  // Find users by username for mentions
  if (mentions.length > 0) {
    // This would be handled in the controller
    this.mentions = mentions;
  }

  // Extract hashtags (#tag)
  const tagRegex = /#(\w+)/g;
  const tags = [];
  while ((match = tagRegex.exec(this.content)) !== null) {
    tags.push(match[1]);
  }
  this.tags = tags;

  next();
});

// Static method to get feed posts
postSchema.statics.getFeedPosts = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  return this.find({
    isDeleted: false,
    $or: [
      { visibility: 'public' },
      {
        visibility: 'followers',
        author: { $in: userId ? [userId] : [] } // Show if user follows author
      }
    ]
  })
  .populate('author', 'username firstName lastName profilePicture university year')
  .populate('comments.user', 'username firstName lastName profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

module.exports = mongoose.model('Post', postSchema);