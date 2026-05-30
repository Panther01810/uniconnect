const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const Status = require('../models/Status');

const router = express.Router();

// Configure multer for status uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/statuses'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB for video
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos allowed'));
    }
  }
});

// @desc    Create a status
// @route   POST /api/status
// @access  Private
router.post('/', protect, upload.single('media'), [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Status content must be between 1 and 500 characters'),
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

    const { content, backgroundColor } = req.body;
    const mediaUrl = req.file ? `/uploads/statuses/${req.file.filename}` : null;
    const mediaType = req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : 'text';

    const status = await Status.create({
      author: req.user._id,
      content,
      mediaUrl,
      mediaType,
      backgroundColor: mediaType === 'text' ? backgroundColor : undefined
    });

    await status.populate('author', 'username firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Create status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user's active statuses
// @route   GET /api/status/user/:userId
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const statuses = await Status.getActiveStatuses(req.params.userId);

    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get status feed (from following users)
// @route   GET /api/status/feed
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const statuses = await Status.getStatusFeed(req.user._id);

    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    View a status (mark as viewed)
// @route   POST /api/status/:statusId/view
// @access  Private
router.post('/:statusId/view', protect, async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Status not found'
      });
    }

    await status.addViewer(req.user._id);

    res.json({
      success: true,
      viewCount: status.getViewCount()
    });
  } catch (error) {
    console.error('View status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get status viewers
// @route   GET /api/status/:statusId/viewers
// @access  Private
router.get('/:statusId/viewers', protect, async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId)
      .populate('viewedBy', 'username firstName lastName profilePicture');

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Status not found'
      });
    }

    res.json({
      success: true,
      viewCount: status.getViewCount(),
      viewers: status.viewedBy
    });
  } catch (error) {
    console.error('Get viewers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete a status
// @route   DELETE /api/status/:statusId
// @access  Private
router.delete('/:statusId', protect, async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Status not found'
      });
    }

    // Check authorization
    if (status.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await Status.findByIdAndDelete(req.params.statusId);

    res.json({
      success: true,
      message: 'Status deleted'
    });
  } catch (error) {
    console.error('Delete status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;