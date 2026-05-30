# KYU CONNECT API Quick Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication Header (Required for most endpoints)
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication Endpoints

### Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "university": "KYU",
  "year": "2nd"
}

Response: {
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Get Current User Profile
```http
GET /auth/profile
Authorization: Bearer <token>

Response: {
  "success": true,
  "user": { ... }
}
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "bio": "Updated bio",
  "interests": ["travel", "coding"]
}

Response: {
  "success": true,
  "user": { ... }
}
```

---

## 📝 Posts Endpoints

### Get Feed
```http
GET /posts/feed?page=1&limit=20
Authorization: Bearer <token>

Response: {
  "success": true,
  "posts": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- content: "Post text here"
- visibility: "public" (or "followers", "private")
- location: "Campus Library"
- images: [file1, file2, ...] (optional)

Response: {
  "success": true,
  "post": { ... }
}
```

### Get Single Post
```http
GET /posts/:postId
Authorization: Bearer <token>

Response: {
  "success": true,
  "post": { ... }
}
```

### Update Post
```http
PUT /posts/:postId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content",
  "visibility": "followers"
}

Response: {
  "success": true,
  "post": { ... }
}
```

### Delete Post
```http
DELETE /posts/:postId
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Post deleted"
}
```

### Like Post
```http
POST /posts/:postId/like
Authorization: Bearer <token>

Response: {
  "success": true,
  "post": { likes: [...] }
}
```

### Add Comment
```http
POST /posts/:postId/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great post!"
}

Response: {
  "success": true,
  "post": { comments: [...] }
}
```

### Share Post
```http
POST /posts/:postId/share
Authorization: Bearer <token>

Response: {
  "success": true,
  "post": { shares: [...] }
}
```

---

## 👥 Users Endpoints

### Get User Profile
```http
GET /users/:userId
Authorization: Bearer <token>

Response: {
  "success": true,
  "user": { ... }
}
```

### Update User Profile
```http
PUT /users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "bio": "New bio"
}

Response: {
  "success": true,
  "user": { ... }
}
```

### Follow User
```http
POST /users/:userId/follow
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "User followed"
}
```

### Unfollow User
```http
POST /users/:userId/unfollow
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "User unfollowed"
}
```

### Get User's Followers
```http
GET /users/:userId/followers
Authorization: Bearer <token>

Response: {
  "success": true,
  "followers": [ ... ]
}
```

### Get User's Following
```http
GET /users/:userId/following
Authorization: Bearer <token>

Response: {
  "success": true,
  "following": [ ... ]
}
```

### Search Users
```http
GET /users/search?query=john&limit=10
Authorization: Bearer <token>

Response: {
  "success": true,
  "users": [ ... ]
}
```

---

## 💬 Chat Endpoints

### Get All Conversations
```http
GET /chat/conversations
Authorization: Bearer <token>

Response: {
  "success": true,
  "conversations": [
    {
      "user": { ... },
      "lastMessage": { ... },
      "unreadCount": 3
    }
  ]
}
```

### Get Conversation with User
```http
GET /chat/conversation/:userId?page=1&limit=50
Authorization: Bearer <token>

Response: {
  "success": true,
  "messages": [ ... ],
  "otherUser": { ... },
  "pagination": { ... }
}
```

### Get Unread Count
```http
GET /chat/unread-count
Authorization: Bearer <token>

Response: {
  "success": true,
  "unreadCount": 5
}
```

### Mark Conversation as Read
```http
POST /chat/mark-read/:userId
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Conversation marked as read"
}
```

### Delete Message
```http
DELETE /chat/message/:messageId
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Message deleted"
}
```

### Send Message (Socket.IO)
```javascript
socket.emit('private_message', {
  senderId: 'user_id',
  receiverId: 'target_user_id',
  message: 'Message content',
  messageType: 'text'
});

// Receive message
socket.on('private_message', (message) => { ... });
```

---

## 🤖 AI Endpoints

### Chat with AI
```http
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I write a good bio?",
  "context": "profile" (or "general", "dating", "conversation", "safety")
}

Response: {
  "success": true,
  "response": "AI response text...",
  "context": "profile",
  "fallback": false
}
```

### Get AI Suggestions
```http
GET /ai/suggestions/:type
Authorization: Bearer <token>

Types:
- conversation-starters
- profile-tips
- safety-tips
- match-advice

Response: {
  "success": true,
  "suggestions": [ "suggestion1", "suggestion2", ... ]
}
```

---

## Error Responses

All endpoints return standard error format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [ ... ] // Optional validation details
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not permitted)
- `404` - Not Found
- `500` - Server Error

---

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

### Send Message
```javascript
socket.emit('private_message', {
  senderId: 'your_id',
  receiverId: 'target_id',
  message: 'Content',
  messageType: 'text'
});
```

### Receive Message
```javascript
socket.on('private_message', (message) => {
  console.log('New message:', message);
});
```

### Typing Indicator
```javascript
socket.emit('typing', {
  senderId: 'your_id',
  receiverId: 'target_id',
  isTyping: true
});

socket.on('typing_indicator', (data) => {
  console.log(data.senderId, 'is typing:', data.isTyping);
});
```

### User Status
```javascript
socket.on('user_online', (userId) => {
  console.log(userId, 'came online');
});

socket.on('user_offline', (userId) => {
  console.log(userId, 'went offline');
});
```

---

## Example JavaScript Usage

### Authentication
```javascript
// Sign up
const signup = async () => {
  const response = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'pass123',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      university: 'KYU',
      year: '2nd'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
};

// Login
const login = async () => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'pass123'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
};
```

### Posts
```javascript
// Get feed
const getFeed = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/posts/feed', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Create post
const createPost = async (content) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: content,
      visibility: 'public'
    })
  });
  return await response.json();
};
```

---

## Rate Limiting

- Standard: 100 requests per minute
- Auth endpoints: 5 requests per minute
- File uploads: 10 requests per minute

---

**Last Updated**: 2026
**Version**: 1.0