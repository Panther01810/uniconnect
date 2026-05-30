const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { protect, ownerOrAdmin } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @desc    Get feed posts
// @route   GET /api/posts/feed
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.getFeedPosts(req.user._id, page, limit);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, upload.array('images', 4), [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Invalid visibility setting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content, visibility = 'public', location } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create post
    const post = await Post.create({
      author: req.user._id,
      content,
      images,
      visibility,
      location,
      university: req.user.university
    });

    // Populate author data
    await post.populate('author', 'username firstName lastName profilePicture university year');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName profilePicture university year')
      .populate('comments.user', 'username firstName lastName profilePicture')
      .populate('likes.user', 'username firstName lastName profilePicture')
      .populate('shares.user', 'username firstName lastName profilePicture');

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check visibility permissions
    const isAuthor = post.author._id.toString() === req.user._id.toString();
    const isFollowing = await User.findOne({
      _id: req.user._id,
      following: post.author._id
    });

    if (!isAuthor && post.visibility === 'private') {
      return res.status(403).json({
        success: false,
        error: 'This post is private'
      });
    }

    if (!isAuthor && post.visibility === 'followers' && !isFollowing) {
      return res.status(403).json({
        success: false,
        error: 'This post is only visible to followers'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, ownerOrAdmin('Post'), [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content, visibility } = req.body;
    const updateData = {
      isEdited: true,
      editedAt: new Date()
    };

    if (content !== undefined) updateData.content = content;
    if (visibility !== undefined) updateData.visibility = visibility;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName profilePicture');

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, ownerOrAdmin('Post'), async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(like =>
      like.user.toString() === req.user._id.toString()
    );

    let message;
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      message = 'Post unliked';
    } else {
      // Like
      post.likes.push({ user: req.user._id });
      message = 'Post liked';
    }

    await post.save();

    res.json({
      success: true,
      message,
      likeCount: post.likeCount,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', protect, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const { content } = req.body;
    const comment = {
      user: req.user._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment
    await post.populate('comments.user', 'username firstName lastName profilePicture');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment,
      commentCount: post.commentCount
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const shareIndex = post.shares.findIndex(share =>
      share.user.toString() === req.user._id.toString()
    );

    if (shareIndex > -1) {
      return res.status(400).json({
        success: false,
        error: 'Post already shared'
      });
    }

    post.shares.push({ user: req.user._id });
    await post.save();

    res.json({
      success: true,
      message: 'Post shared successfully',
      shareCount: post.shareCount
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      author: req.params.userId,
      isDeleted: false
    })
    .populate('author', 'username firstName lastName profilePicture university year')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({
      author: req.params.userId,
      isDeleted: false
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;