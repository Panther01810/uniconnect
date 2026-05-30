# Integration Guide: Status & Video Call Features

This document explains how to integrate the new status and video call features into KYU CONNECT.

## Overview

The application now includes:
- **Status Feature**: Instagram-style 24-hour stories with media support
- **Video/Voice Calls**: Real-time video and voice calls using Twilio
- **Real Test Accounts**: Database seeding with 10 realistic Instagram-style accounts

## Files Created

### Backend Files

1. **routes/status.js** - Status API endpoints
   - `POST /api/status` - Create status
   - `GET /api/status/feed` - Get status feed
   - `GET /api/status/user/:userId` - Get user statuses
   - `POST /api/status/:id/view` - Mark as viewed
   - `DELETE /api/status/:id` - Delete status

2. **routes/calls.js** - Call API endpoints
   - `POST /api/calls/initiate` - Start call
   - `POST /api/calls/:id/answer` - Accept call
   - `POST /api/calls/:id/decline` - Reject call
   - `POST /api/calls/:id/end` - End call
   - `GET /api/calls/history/:userId` - Get call history

3. **models/Status.js** - Status database model
   - 24-hour auto-expiration
   - Viewer tracking
   - Media support (image/video/text)

4. **models/Call.js** - Call database model
   - Call type tracking (audio/video)
   - Status management
   - Twilio integration

5. **scripts/seed.js** - Database seeding script
   - Creates 10 test accounts
   - Generates sample posts
   - Sets up follower relationships

### Frontend Files

1. **js/statusManager.js** - Status management class
   - Create status
   - View status
   - Get status feed
   - Status viewer UI

2. **js/callManager.js** - Call management class
   - Initiate/answer/end calls
   - Twilio integration
   - WebRTC video/audio handling
   - Incoming call notifications

3. **css/status-and-calls.css** - Styling
   - Status viewer modal
   - Status upload form
   - Video call UI
   - Responsive design

### Configuration Files

1. **.env.example** - Environment variables template
   - All required configuration keys

## Integration Steps

### Step 1: Register Routes in Backend

In `backend/app.js` or your main Express file:

```javascript
// Add these imports
const statusRoutes = require('./routes/status');
const callRoutes = require('./routes/calls');

// Add these routes (after other routes)
app.use('/api/status', statusRoutes);
app.use('/api/calls', callRoutes);
```

### Step 2: Update Main App File

Ensure your main app file includes:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Routes
app.use('/api/status', require('./routes/status'));
app.use('/api/calls', require('./routes/calls'));

// Start server
const server = app.listen(process.env.PORT || 3001);

// Socket.IO for call signaling
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Export for call routes
module.exports = { app, io };
```

### Step 3: Seed Database with Test Accounts

Run the seeding script:

```bash
cd backend
node scripts/seed.js
```

This creates 10 test accounts with realistic data:
- sarah.adventures
- david.fitness
- emma.design
- marcus.tech
- olivia.food
- james.music
- sophia.art
- alex.photography
- jessica.fashion
- nathan.gaming

**Default password**: `SecurePass123!`

### Step 4: Set Up Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your actual values:

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Twilio (Get from twilio.com)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Step 5: Install Twilio SDK

In your frontend HTML, add the Twilio Video JS SDK:

```html
<script src="https://sdk.twilio.com/js/video/releases/2.26.0/twilio-video.js"></script>
```

### Step 6: Initialize Managers in Frontend

In your main HTML file:

```html
<!-- Include CSS -->
<link rel="stylesheet" href="/css/status-and-calls.css">

<!-- Include JavaScript -->
<script src="/js/statusManager.js"></script>
<script src="/js/callManager.js"></script>

<script>
  // Initialize managers
  const statusManager = new StatusManager();
  
  // Assuming you have Socket.IO socket initialized
  const callManager = new CallManager(socket);
</script>
```

### Step 7: Add Status Feature to Profile Page

In profile HTML/JavaScript:

```javascript
// Get user statuses
const statuses = await statusManager.getUserStatuses(userId);

// Check if user has active status
const hasStatus = statuses.length > 0;

// Render status border on profile picture
statusManager.renderStatusBorder(profileContainer, hasStatus);

// Add click handler to view status
profileContainer.addEventListener('click', () => {
  if (hasStatus) {
    statusManager.showStatusViewer(statuses);
  }
});

// Add button to create status
const createStatusBtn = document.querySelector('.btn-create-status');
if (createStatusBtn) {
  createStatusBtn.addEventListener('click', () => {
    const form = statusManager.createStatusUploadForm();
    document.body.appendChild(form);
  });
}
```

### Step 8: Add Video Call Feature

In messaging or user profile:

```javascript
// Initiate video call
const startCallBtn = document.querySelector('.btn-video-call');
startCallBtn.addEventListener('click', async () => {
  const recipientId = getUserId(); // Get from context
  try {
    const call = await callManager.initiateCall(recipientId, 'video');
    // Show call UI
    showCallUI();
  } catch (error) {
    alert('Failed to start call: ' + error.message);
  }
});

// Handle incoming calls
document.addEventListener('call:incomingCall', (e) => {
  // Incoming call UI is shown automatically
});

// Handle call events
document.addEventListener('call:callAnswered', () => {
  // Call was answered
});

document.addEventListener('call:callEnded', (e) => {
  // Call ended, duration available in e.detail.duration
});
```

### Step 9: Update Home Feed

In home.html/home.js:

```javascript
// Load status feed
const statuses = await statusManager.getStatusFeed();

// Display status carousel at top of feed
displayStatusCarousel(statuses);
```

### Step 10: Remove Demo Data

Find and replace all hardcoded demo users with API calls:

**Before:**
```javascript
const demoUsers = [
  { username: 'ruth_m', name: 'Ruth M.' },
  { username: 'sarah_p', name: 'Sarah P.' }
];
```

**After:**
```javascript
const users = await fetch('/api/users/following').then(r => r.json());
```

## API Examples

### Create a Status

```javascript
const status = await statusManager.createStatus({
  content: 'Beautiful sunset! 🌅',
  media: fileInput.files[0],
  backgroundColor: '#6366F1'
});
```

### Get Status Feed

```javascript
const statuses = await statusManager.getStatusFeed();
statusManager.showStatusViewer(statuses);
```

### Start a Video Call

```javascript
try {
  const call = await callManager.initiateCall(userId, 'video');
} catch (error) {
  console.error('Call failed:', error);
}
```

### End a Call

```javascript
await callManager.endCall();
```

## Database Models Reference

### Status Document

```json
{
  "_id": "ObjectId",
  "author": "User ObjectId",
  "content": "Status text content",
  "mediaUrl": "/uploads/statuses/...",
  "mediaType": "text|image|video",
  "backgroundColor": "#6366F1",
  "viewedBy": ["User IDs"],
  "createdAt": "2024-01-01T12:00:00Z",
  "expiresAt": "2024-01-02T12:00:00Z"
}
```

### Call Document

```json
{
  "_id": "ObjectId",
  "caller": "User ObjectId",
  "recipient": "User ObjectId",
  "callType": "audio|video",
  "status": "pending|accepted|rejected|completed|missed",
  "twilioRoomSid": "room-name",
  "twilioToken": "access-token",
  "startedAt": "2024-01-01T12:00:00Z",
  "answeredAt": "2024-01-01T12:01:00Z",
  "endedAt": "2024-01-01T12:15:00Z",
  "duration": 900
}
```

## Features Checklist

- [x] Status model with 24-hour expiration
- [x] Status API endpoints
- [x] Call model with Twilio integration
- [x] Call API endpoints
- [x] StatusManager frontend class
- [x] CallManager frontend class
- [x] Status UI styles
- [x] Call UI styles
- [x] Database seeding script
- [x] Environment configuration template
- [ ] Remove demo data from all pages
- [ ] Add status display to profile pages
- [ ] Add video call button to messaging
- [ ] Add status carousel to home feed
- [ ] Test Twilio integration
- [ ] Test deployment on Render

## Troubleshooting

### Twilio Tokens Not Working

Ensure your Twilio credentials are correct in `.env`:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### Status Not Appearing

1. Verify seeding script ran: `node backend/scripts/seed.js`
2. Check MongoDB connection
3. Verify routes are registered

### Video Call Not Starting

1. Check browser console for errors
2. Ensure Twilio SDK is loaded
3. Verify microphone/camera permissions granted
4. Check CORS settings in backend

### Deployment Issues

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Next Steps

1. Test all features locally
2. Deploy to Render using render.yaml
3. Test with real users
4. Monitor performance and error rates
5. Gather user feedback for improvements