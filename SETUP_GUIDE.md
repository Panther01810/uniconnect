# KYU CONNECT - Dynamic API Integration Setup Guide

## 🎯 Overview

KYU CONNECT has been fully integrated with a **Node.js/Express backend** featuring:
- Real-time messaging with Socket.IO
- MongoDB database for persistent storage
- OpenAI AI assistant integration
- JWT authentication & security
- Complete REST API for all features

## 📦 Quick Start

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kyuconnect

# Authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here

# File Upload
MAX_FILE_SIZE=5000000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Backend Server

```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 3001
Environment: development
```

### 4. Open Frontend

Open `index.html` in your browser. The frontend will now connect to your local backend API.

---

## 🔧 Features & API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update profile
- `POST /logout` - User logout

### Posts/Feed (`/api/posts`)
- `GET /feed` - Get feed posts
- `POST /` - Create new post
- `GET /:id` - Get single post
- `PUT /:id` - Update post
- `DELETE /:id` - Delete post
- `POST /:id/like` - Like a post
- `POST /:id/comment` - Add comment
- `POST /:id/share` - Share a post

### Users (`/api/users`)
- `GET /:id` - Get user profile
- `PUT /:id` - Update user
- `POST /:id/follow` - Follow user
- `POST /:id/unfollow` - Unfollow user
- `GET /:id/followers` - Get followers
- `GET /:id/following` - Get following list
- `GET /search` - Search users

### Chat/Messaging (`/api/chat`)
- `GET /conversations` - Get all conversations
- `GET /conversation/:userId` - Get specific conversation
- `POST /message` - Send message (via Socket.IO)
- `GET /unread-count` - Get unread messages
- `POST /mark-read/:userId` - Mark as read
- `DELETE /message/:messageId` - Delete message

### AI Assistant (`/api/ai`)
- `POST /chat` - Chat with AI
- `GET /suggestions/:type` - Get AI suggestions
  - Types: `conversation-starters`, `profile-tips`, `safety-tips`, `match-advice`

---

## 🔌 Socket.IO Real-Time Events

The frontend connects to Socket.IO for real-time features:

### Client → Server Events
- `join` - User joins their room
- `private_message` - Send private message
- `group_message` - Send group message
- `typing` - Typing indicator
- `disconnect` - User disconnects

### Server → Client Events
- `private_message` - Receive private message
- `group_message` - Receive group message
- `typing_indicator` - Someone is typing
- `user_online` - User came online
- `user_offline` - User went offline
- `message_error` - Error sending message

---

## 📁 Project Structure

```
KYU CONNECT MOCKUP/
├── index.html                    # Main entry point
├── css/
│   └── style.css                 # All styling
├── js/
│   ├── app.js                    # Navigation & page switching
│   ├── auth.js                   # Authentication management
│   ├── posts.js                  # Posts API integration
│   ├── chat.js                   # Chat & Socket.IO integration
│   └── ai.js                     # AI assistant integration
├── pages/
│   ├── home.html                 # Feed page
│   ├── chat.html                 # Chat page
│   ├── ai.html                   # AI assistant page
│   ├── profile.html              # User profile
│   ├── login.html                # Login page
│   ├── signup.html               # Sign up page
│   ├── status.html               # Status updates
│   ├── kyu.html                  # KYU campus page
│   └── other-unis.html           # Other universities page
└── backend/
    ├── server.js                 # Express & Socket.IO setup
    ├── .env                      # Environment variables
    ├── package.json              # Dependencies
    ├── models/
    │   ├── User.js               # User schema
    │   ├── Post.js               # Post schema
    │   ├── Message.js            # Private message schema
    │   ├── GroupMessage.js       # Group message schema
    │   ├── Group.js              # Group chat schema
    │   └── Story.js              # Story schema
    ├── routes/
    │   ├── auth.js               # Authentication routes
    │   ├── users.js              # User profile routes
    │   ├── posts.js              # Post management routes
    │   ├── chat.js               # Messaging routes
    │   └── ai.js                 # AI assistant routes
    ├── middleware/
    │   └── auth.js               # JWT authentication
    └── uploads/                  # User uploads folder
```

---

## 🔐 Authentication Flow

1. **Sign Up/Login**: User creates account or logs in
2. **JWT Token**: Server returns JWT token stored in localStorage
3. **API Requests**: All requests include `Authorization: Bearer <token>`
4. **Socket.IO Auth**: Token is passed during Socket.IO connection
5. **Auto-Refresh**: Token used for all subsequent requests

---

## 🎮 Frontend Integration

### Pages Using APIs

#### home.html (Feed)
- Loads posts from `/api/posts/feed`
- Create posts with `/api/posts`
- Like/comment/share via `/api/posts/:id/*`
- Real-time updates via Socket.IO

#### chat.html (Messaging)
- Lists conversations from `/api/chat/conversations`
- Loads messages from `/api/chat/conversation/:userId`
- Sends messages via Socket.IO `private_message` event
- Typing indicators via Socket.IO

#### ai.html (AI Assistant)
- Sends questions to `/api/ai/chat`
- Gets suggestions from `/api/ai/suggestions/:type`
- Displays AI responses in feed format
- Supports context-based responses

#### profile.html (User Profile)
- Fetches user data from `/api/users/:id`
- Updates profile via `/api/users/:id`
- Manages followers/following
- Shows user's posts

---

## 🚀 Testing the Integration

### 1. Test Authentication
```javascript
// In browser console
fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

### 2. Test Posts API
```javascript
// Get feed
fetch('http://localhost:3001/api/posts/feed', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d));
```

### 3. Test Chat Connection
```javascript
// Check if Socket.IO is connected
console.log(chatManager.socket.connected);
```

### 4. Test AI Chat
```javascript
// Ask AI a question
aiAssistant.chat('How do I write a good profile?', 'profile')
.then(response => console.log(response));
```

---

## 📊 Database Models

### User
- Basic info (name, email, password)
- Profile details (bio, university, year, interests)
- Relationships (followers, following)
- Authentication (JWT compatible)

### Post
- Author reference
- Content & images
- Visibility (public/followers/private)
- Likes, comments, shares
- Feed query methods

### Message
- Sender & receiver
- Content & type
- Read status
- Conversation grouping
- Conversation history methods

### Group
- Name & description
- Members management
- Privacy settings
- Group messages

### Story
- Author & content
- Expiration (24 hours)
- View tracking
- Rich media support

---

## ⚙️ Configuration

### Change Server Port
Edit `backend/.env`:
```env
PORT=3000
```

### Change Database
Edit `backend/.env`:
```env
MONGODB_URI=mongodb://user:password@cluster.mongodb.net/kyuconnect
```

### Enable OpenAI
1. Get API key from [openai.com](https://openai.com)
2. Add to `backend/.env`:
```env
OPENAI_API_KEY=sk-xxxxxxxx
```

### Disable AI Fallback
If OpenAI is unavailable, the system automatically uses fallback responses.

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify port 27017 is not blocked

### Socket.IO Connection Error
- Ensure backend server is running
- Check CORS configuration in `server.js`
- Verify frontend URL in `.env`

### API 401 Errors
- Token expired - user needs to log in again
- Check localStorage has valid token
- Verify JWT_SECRET matches

### CORS Errors
- Backend needs `CORS` enabled
- Check `server.js` CORS configuration
- Verify frontend URL is whitelisted

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [Mongoose ODM](https://mongoosejs.com)
- [Socket.IO Documentation](https://socket.io)
- [OpenAI API](https://openai.com/api)
- [JWT Authentication](https://jwt.io)

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend console logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**Happy coding! 🚀**