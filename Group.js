const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group must have a creator']
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'moderator'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    allowPublicJoin: {
      type: Boolean,
      default: true
    },
    messageApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 100
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  university: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['study', 'social', 'sports', 'club', 'project', 'general'],
    default: 'general'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Index for better query performance
groupSchema.index({ name: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ university: 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ tags: 1 });
groupSchema.index({ 'members.user': 1 });

// Pre-save middleware to add creator as admin
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add creator as first admin
    if (!this.admins.includes(this.creator)) {
      this.admins.push(this.creator);
    }

    // Add creator as first member
    const creatorMember = this.members.find(member =>
      member.user.toString() === this.creator.toString()
    );

    if (!creatorMember) {
      this.members.push({
        user: this.creator,
        role: 'admin',
        joinedAt: new Date()
      });
    }
  }
  next();
});

// Static method to get user's groups
groupSchema.statics.getUserGroups = function(userId) {
  return this.find({
    'members.user': userId,
    isActive: true
  })
  .populate('creator', 'username firstName lastName profilePicture')
  .populate('lastMessage')
  .sort({ updatedAt: -1 });
};

// Static method to search groups
groupSchema.statics.searchGroups = function(query, university = null, category = null) {
  const searchQuery = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  if (university) {
    searchQuery.university = university;
  }

  if (category) {
    searchQuery.category = category;
  }

  return this.find(searchQuery)
  .populate('creator', 'username firstName lastName profilePicture')
  .limit(20);
};

module.exports = mongoose.model('Group', groupSchema);