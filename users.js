const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Private
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username firstName lastName profilePicture')
      .populate('following', 'username firstName lastName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check privacy settings
    const isFollowing = user.followers.some(follower =>
      follower._id.toString() === req.user._id.toString()
    );
    const isOwnProfile = user._id.toString() === req.user._id.toString();

    if (!isOwnProfile && !isFollowing && !user.privacySettings.showProfile) {
      return res.status(403).json({
        success: false,
        error: 'This profile is private'
      });
    }

    // Get user's posts
    const posts = await Post.find({
      author: user._id,
      isDeleted: false,
      visibility: { $in: isOwnProfile ? ['public', 'followers', 'private'] : ['public', isFollowing ? 'followers' : null] }
    })
    .populate('author', 'username firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        university: user.university,
        year: user.year,
        bio: user.bio,
        interests: user.interests,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        location: user.location,
        followers: user.followers,
        following: user.following,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      posts,
      isFollowing,
      isOwnProfile
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Follow user
// @route   POST /api/users/:userId/follow
// @access  Private
router.post('/:userId/follow', protect, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already following
    const isFollowing = currentUser.following.some(id =>
      id.toString() === req.params.userId
    );

    if (isFollowing) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }

    // Add to following list
    currentUser.following.push(req.params.userId);
    await currentUser.save();

    // Add to followers list
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    res.json({
      success: true,
      message: 'User followed successfully',
      followerCount: userToFollow.followerCount,
      followingCount: currentUser.followingCount
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Unfollow user
// @route   DELETE /api/users/:userId/follow
// @access  Private
router.delete('/:userId/follow', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if following
    const followingIndex = currentUser.following.findIndex(id =>
      id.toString() === req.params.userId
    );

    if (followingIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Not following this user'
      });
    }

    // Remove from following list
    currentUser.following.splice(followingIndex, 1);
    await currentUser.save();

    // Remove from followers list
    const followerIndex = userToUnfollow.followers.findIndex(id =>
      id.toString() === req.user._id.toString()
    );
    if (followerIndex !== -1) {
      userToUnfollow.followers.splice(followerIndex, 1);
      await userToUnfollow.save();
    }

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      followerCount: userToUnfollow.followerCount,
      followingCount: currentUser.followingCount
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get followers
// @route   GET /api/users/:userId/followers
// @access  Private
router.get('/:userId/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username firstName lastName profilePicture university year isOnline');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      followers: user.followers,
      count: user.followerCount
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get following
// @route   GET /api/users/:userId/following
// @access  Private
router.get('/:userId/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username firstName lastName profilePicture university year isOnline');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      following: user.following,
      count: user.followingCount
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search/:query
// @access  Private
router.get('/search/:query', protect, async (req, res) => {
  try {
    const query = req.params.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { university: { $regex: query, $options: 'i' } }
          ]
        },
        { accountStatus: 'active' }
      ]
    })
    .select('username firstName lastName profilePicture university year isOnline lastSeen')
    .skip(skip)
    .limit(limit)
    .sort({ isOnline: -1, lastSeen: -1 });

    const total = await User.countDocuments({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { university: { $regex: query, $options: 'i' } }
          ]
        },
        { accountStatus: 'active' }
      ]
    });

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get suggested users
// @route   GET /api/users/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get users from same university, not already following
    const suggestions = await User.find({
      _id: { $ne: req.user._id },
      university: req.user.university,
      accountStatus: 'active',
      followers: { $ne: req.user._id }
    })
    .select('username firstName lastName profilePicture university year interests')
    .limit(limit)
    .sort({ createdAt: -1 });

    // If not enough from same university, get from other universities
    if (suggestions.length < limit) {
      const additionalSuggestions = await User.find({
        _id: { $ne: req.user._id },
        university: { $ne: req.user.university },
        accountStatus: 'active',
        followers: { $ne: req.user._id }
      })
      .select('username firstName lastName profilePicture university year interests')
      .limit(limit - suggestions.length)
      .sort({ createdAt: -1 });

      suggestions.push(...additionalSuggestions);
    }

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;