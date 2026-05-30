const express = require('express');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');
const { protect } = require('../middleware/auth');
const Call = require('../models/Call');
const User = require('../models/User');
const io = require('../socket');

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// @desc    Initiate a call (audio or video)
// @route   POST /api/calls/initiate
// @access  Private
router.post('/initiate', protect, [
  body('recipientId')
    .notEmpty()
    .withMessage('Recipient ID is required'),
  body('callType')
    .isIn(['audio', 'video'])
    .withMessage('Call type must be audio or video'),
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

    const { recipientId, callType } = req.body;
    const callerId = req.user._id;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Prevent self-calling
    if (callerId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot call yourself'
      });
    }

    // Create Twilio room
    const roomName = `call_${callerId}_${recipientId}_${Date.now()}`;
    
    // Generate Twilio access tokens for both users
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const callerToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );
    callerToken.addGrant(new VideoGrant({ room: roomName }));
    callerToken.identity = callerId.toString();

    const recipientToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );
    recipientToken.addGrant(new VideoGrant({ room: roomName }));
    recipientToken.identity = recipientId;

    // Create call record
    const call = await Call.create({
      caller: callerId,
      recipient: recipientId,
      callType,
      status: 'pending',
      twilioRoomSid: roomName
    });

    await call.populate([
      { path: 'caller', select: 'username firstName lastName profilePicture' },
      { path: 'recipient', select: 'username firstName lastName profilePicture' }
    ]);

    // Emit call initiation event to recipient via Socket.IO
    const recipientSocketId = io.userSocketMap?.get(recipientId.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incomingCall', {
        callId: call._id,
        caller: call.caller,
        callType,
        callerToken: callerToken.toJwt()
      });
    }

    res.status(201).json({
      success: true,
      call,
      roomName,
      callerToken: callerToken.toJwt()
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Answer/accept a call
// @route   POST /api/calls/:callId/answer
// @access  Private
router.post('/:callId/answer', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Verify authorization
    if (call.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to answer this call'
      });
    }

    // Update call status
    call.status = 'accepted';
    call.answeredAt = new Date();
    await call.save();

    // Generate token for recipient
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const recipientToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );
    recipientToken.addGrant(new VideoGrant({ room: call.twilioRoomSid }));
    recipientToken.identity = req.user._id.toString();

    // Notify caller via Socket.IO
    const callerSocketId = io.userSocketMap?.get(call.caller.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('callAnswered', {
        callId: call._id,
        recipientToken: recipientToken.toJwt()
      });
    }

    res.json({
      success: true,
      call,
      recipientToken: recipientToken.toJwt()
    });
  } catch (error) {
    console.error('Answer call error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Decline/reject a call
// @route   POST /api/calls/:callId/decline
// @access  Private
router.post('/:callId/decline', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Verify authorization
    if (call.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    call.status = 'rejected';
    await call.save();

    // Notify caller
    const callerSocketId = io.userSocketMap?.get(call.caller.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('callDeclined', {
        callId: call._id
      });
    }

    res.json({
      success: true,
      message: 'Call declined'
    });
  } catch (error) {
    console.error('Decline call error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    End a call
// @route   POST /api/calls/:callId/end
// @access  Private
router.post('/:callId/end', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Verify authorization
    const userId = req.user._id.toString();
    if (call.caller.toString() !== userId && call.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await call.endCall();

    // Notify other user
    const otherUserId = call.caller.toString() === userId 
      ? call.recipient.toString() 
      : call.caller.toString();
    
    const otherSocketId = io.userSocketMap?.get(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit('callEnded', {
        callId: call._id,
        duration: call.duration
      });
    }

    res.json({
      success: true,
      call,
      duration: call.duration
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get call history for user
// @route   GET /api/calls/history/:userId
// @access  Private
router.get('/history/:userId', protect, async (req, res) => {
  try {
    const calls = await Call.getCallHistory(req.params.userId);

    res.json({
      success: true,
      calls
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get recent calls
// @route   GET /api/calls/recent/:userId
// @access  Private
router.get('/recent/:userId', protect, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const calls = await Call.getRecentCalls(req.params.userId, parseInt(limit));

    res.json({
      success: true,
      calls
    });
  } catch (error) {
    console.error('Get recent calls error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get call status
// @route   GET /api/calls/:callId
// @access  Private
router.get('/:callId', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId)
      .populate([
        { path: 'caller', select: 'username firstName lastName profilePicture' },
        { path: 'recipient', select: 'username firstName lastName profilePicture' }
      ]);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;