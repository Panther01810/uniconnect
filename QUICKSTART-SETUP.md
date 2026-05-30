# KYU CONNECT Quick Start Guide

**Goal**: Get status and video call features working in 15 minutes

## Prerequisites

- Node.js 16+ installed
- Backend running locally
- MongoDB connection working
- Twilio account (free trial available)

## Quick Setup (15 Minutes)

### Step 1: Copy Environment Template (1 minute)

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in these required values:

```env
MONGODB_URI=mongodb://localhost:27017/kyu-connect
JWT_SECRET=your-secret-key-here
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_API_KEY=your_api_key_here
TWILIO_API_SECRET=your_api_secret_here
```

### Step 2: Register Routes in Backend (2 minutes)

Edit `backend/app.js` or your main Express file:

```javascript
// Add these lines after other route imports
const statusRoutes = require('./routes/status');
const callRoutes = require('./routes/calls');

// Add these lines after other route registrations
app.use('/api/status', statusRoutes);
app.use('/api/calls', callRoutes);
```

### Step 3: Seed Database (2 minutes)

```bash
cd backend
npm install  # if you haven't already
node scripts/seed.js
```

You should see:
```
✅ Connected to MongoDB
✅ Cleared existing data
✅ Creating test users...
✅ Follower relationships created
✅ Sample posts created
✨ Database seeding completed successfully!
```

### Step 4: Add Twilio SDK to Frontend (1 minute)

In your main HTML file (likely `index.html`), add before closing `</body>`:

```html
<!-- Twilio Video SDK for calls -->
<script src="https://sdk.twilio.com/js/video/releases/2.26.0/twilio-video.js"></script>

<!-- Our manager classes -->
<script src="/js/statusManager.js"></script>
<script src="/js/callManager.js"></script>

<!-- Initialize managers -->
<script>
  const statusManager = new StatusManager();
  
  // If you have Socket.IO socket initialized:
  // const callManager = new CallManager(socket);
</script>
```

### Step 5: Add Styling (1 minute)

In your main HTML file, add to `<head>`:

```html
<link rel="stylesheet" href="/css/status-and-calls.css">
```

### Step 6: Test Status API (2 minutes)

Using curl or Postman:

```bash
# Get all users (to get a userId)
curl http://localhost:3001/api/users

# Create a status (replace userId with real ID)
curl -X POST http://localhost:3001/api/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"My first status!"}'

# Get status feed
curl http://localhost:3001/api/status/feed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 7: Test Calls API (2 minutes)

```bash
# Initiate a call (replace with real user IDs)
curl -X POST http://localhost:3001/api/calls/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"USER_ID","callType":"video"}'

# Get call history
curl http://localhost:3001/api/calls/history/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 8: Test in Frontend (3 minutes)

In browser console:

```javascript
// Test status manager
const testStatus = await statusManager.createStatus({
  content: "Testing status feature! 🎉"
});

// Get feed
const feed = await statusManager.getStatusFeed();
console.log('Status feed:', feed);

// Test call manager (requires Socket.IO)
// callManager.initiateCall(recipientId, 'video');
```

## Verify Everything Works

Run through this checklist:

- [ ] `.env` file created with Twilio credentials
- [ ] Routes registered in backend app.js
- [ ] Database seeded with 10 test accounts
- [ ] Both CSS and JS files added to HTML
- [ ] Status API endpoints returning data
- [ ] Call API endpoints returning data
- [ ] StatusManager accessible in browser console
- [ ] CallManager accessible in browser console

## Common Issues

### "TWILIO_ACCOUNT_SID is undefined"
**Solution**: Check .env file exists and contains TWILIO_ACCOUNT_SID value

### "Routes not found (404)"
**Solution**: Verify routes registered in app.js - check requires and app.use() calls

### "Database seeding failed"
**Solution**: 
- Check MongoDB is running: `mongod`
- Check MONGODB_URI in .env is correct
- Check no other app using port 27017

### "Status not creating"
**Solution**:
- Check JWT token is being sent in Authorization header
- Check uploads folder exists: `mkdir -p backend/uploads/statuses`

### "Video calls not working"
**Solution**:
- Check Twilio credentials are correct
- Check browser console for specific errors
- Allow microphone/camera permissions in browser

## Next Steps

After quick start:

1. **Remove demo data** from existing pages
   - Replace hardcoded user lists with API calls
   - Update chat page to use real conversations

2. **Add status to profiles**
   - Show status border around profile pictures
   - Add view status button

3. **Add video call button**
   - Add to messaging interface
   - Add to user profile cards

4. **Create Instagram gallery**
   - Add grid view of posts on profile

5. **Deploy to Render**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)

## Key Files Reference

| File | Purpose | Key Classes |
|------|---------|-------------|
| `backend/routes/status.js` | Status API endpoints | POST/GET/DELETE |
| `backend/routes/calls.js` | Call API endpoints | POST/GET |
| `backend/models/Status.js` | Status database model | getActiveStatuses() |
| `backend/models/Call.js` | Call database model | getCallHistory() |
| `backend/scripts/seed.js` | Database seeding | Creates test accounts |
| `frontend/js/statusManager.js` | Status management | createStatus(), getStatusFeed() |
| `frontend/js/callManager.js` | Call management | initiateCall(), answerCall() |
| `frontend/css/status-and-calls.css` | UI styling | All modal/UI styles |

## API Endpoints Summary

### Status Endpoints
```
POST /api/status                 - Create status
GET /api/status/feed             - Get feed
GET /api/status/user/:userId     - Get user statuses
POST /api/status/:id/view        - Mark viewed
GET /api/status/:id/viewers      - Get viewers
DELETE /api/status/:id           - Delete status
```

### Call Endpoints
```
POST /api/calls/initiate         - Start call
POST /api/calls/:id/answer       - Accept call
POST /api/calls/:id/decline      - Reject call
POST /api/calls/:id/end          - End call
GET /api/calls/history/:userId   - Call history
GET /api/calls/recent/:userId    - Recent calls
GET /api/calls/:id               - Get call status
```

## Test Account Credentials

Use any of these to log in after seeding:

```
Username: sarah.adventures  | Password: SecurePass123!
Username: david.fitness      | Password: SecurePass123!
Username: emma.design        | Password: SecurePass123!
... (10 accounts total)
```

## Troubleshooting Commands

```bash
# Check MongoDB running
mongosh

# Check Node processes
ps aux | grep node

# View backend logs
tail -f logs/app.log

# Test API connectivity
curl http://localhost:3001/api

# Check file permissions
ls -la backend/uploads/

# Restart backend
npm start
```

## Support

For detailed setup:
- See [INTEGRATION.md](INTEGRATION.md) for step-by-step guide
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- See [PROGRESS.md](PROGRESS.md) for project overview

---

**Congratulations!** 🎉 Status and video call features are now ready to use!

Next: Review [INTEGRATION.md](INTEGRATION.md) to implement UI components in your existing pages.