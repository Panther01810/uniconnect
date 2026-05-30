const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'missed', 'completed'],
    default: 'pending'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  twilioRoomSid: {
    type: String // Twilio room ID
  },
  twilioToken: {
    type: String // Twilio access token
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for conversation history
callSchema.index({ caller: 1, recipient: 1, createdAt: -1 });

// Get call duration
callSchema.virtual('durationMinutes').get(function() {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / 60000);
  }
  return 0;
});

// End call and calculate duration
callSchema.methods.endCall = async function() {
  this.endedAt = new Date();
  this.status = 'completed';
  this.duration = Math.round((this.endedAt - this.startedAt) / 1000);
  await this.save();
  return this;
};

// Get call history between two users
callSchema.statics.getCallHistory = async function(userId1, userId2) {
  return await this.find({
    $or: [
      { caller: userId1, recipient: userId2 },
      { caller: userId2, recipient: userId1 }
    ]
  }).populate('caller recipient', 'username firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

// Get recent calls for user
callSchema.statics.getRecentCalls = async function(userId) {
  return await this.find({
    $or: [
      { caller: userId },
      { recipient: userId }
    ]
  }).populate('caller recipient', 'username firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);
};

module.exports = mongoose.model('Call', callSchema);