# KYU CONNECT JavaScript Files Guide

## Overview
This document explains each JavaScript file and how they work together to create the KYU CONNECT platform.

---

## 📁 Frontend JavaScript Files

### 1. **js/app.js** - Main Navigation & Page Switching

**Purpose**: Manages page navigation and iframe loading

**Key Functions**:
```javascript
- setActiveLink() - Highlight current nav link
- changePage() - Load page into iframe
- updateHeaderUser() - Show/hide login based on user status
- initNavigation() - Set up click handlers
- fastStyleTweaks() - Performance optimizations
```

**What It Does**:
- Loads pages into the main content iframe
- Updates active navigation links
- Shows user name in header when logged in
- Enables smooth page transitions

**Uses**: localStorage (for user data), DOM manipulation

---

### 2. **js/auth.js** - User Authentication Management

**Purpose**: Handle user registration, login, and account management

**Key Functions**:
```javascript
- registerUser() - Create new account via API
- loginUser() - Log in with credentials
- logoutUser() - Clear session
- getCurrentUser() - Get logged-in user
- updateUserProfile() - Update profile info
- isAuthenticated() - Check if user is logged in
```

**What It Does**:
- Makes API calls to `/api/auth/register` and `/api/auth/login`
- Stores JWT token in localStorage
- Manages user session
- Updates user information
- Checks authentication on page load

**Uses**: Fetch API, localStorage, API calls

**API Endpoints Used**:
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/profile`
- PUT `/api/auth/profile`

---

### 3. **js/posts.js** - Posts & Feed Management

**Purpose**: Handle creating, displaying, and interacting with posts

**Key Classes**:
```javascript
PostsManager {
  - getAuthHeaders()
  - fetchFeed()
  - createPost()
  - likePost()
  - addComment()
  - renderPost()
  - displayPosts()
  - loadMorePosts()
}
```

**Global Functions**:
```javascript
- createStory() - Create new post from textarea
- likePost() - Like a post
- toggleComments() - Show/hide comments section
- addComment() - Add comment to post
- handleCommentKeyPress() - Send comment on Enter
- sharePost() - Share post (future feature)
```

**What It Does**:
- Fetches posts from `/api/posts/feed`
- Creates posts with optional images
- Likes and comments on posts
- Shows post author information
- Formats and displays posts dynamically
- Implements pagination
- Shows loading states and notifications

**Uses**: Fetch API, localStorage, DOM manipulation, Date formatting

**API Endpoints Used**:
- GET `/api/posts/feed`
- POST `/api/posts`
- POST `/api/posts/:id/like`
- POST `/api/posts/:id/comment`

---

### 4. **js/chat.js** - Real-Time Messaging

**Purpose**: Handle real-time chat with Socket.IO integration

**Key Classes**:
```javascript
ChatManager {
  - initialize()
  - setupSocketListeners()
  - loadConversations()
  - loadConversation()
  - openChat()
  - sendMessage()
  - handleIncomingMessage()
  - updateUserOnlineStatus()
  - markAsRead()
}
```

**Global Functions**:
```javascript
- openChat() - Open a conversation
- sendMessage() - Send message
- handleTyping() - Start typing indicator
```

**What It Does**:
- Connects to Socket.IO server
- Loads conversation list from API
- Loads message history from API
- Sends messages via Socket.IO
- Receives messages in real-time
- Shows typing indicators
- Displays online/offline status
- Marks messages as read
- Shows unread message badges

**Uses**: Socket.IO, Fetch API, localStorage, Real-time events

**Socket.IO Events**:
- Emit: `private_message`, `typing`, `join`
- Listen: `private_message`, `typing_indicator`, `user_online`, `user_offline`

**API Endpoints Used**:
- GET `/api/chat/conversations`
- GET `/api/chat/conversation/:userId`
- POST `/api/chat/mark-read/:userId`

---

### 5. **js/ai.js** - AI Assistant Integration

**Purpose**: Handle chat with OpenAI AI assistant

**Key Classes**:
```javascript
AIAssistant {
  - chat()
  - getSuggestions()
  - renderAIMessage()
  - renderUserQuestion()
  - formatMessage()
  - displayMessage()
  - clearHistory()
}
```

**Global Functions**:
```javascript
- askAI() - Send question to AI
- likeAIResponse() - Mark response as helpful
- shareAIResponse() - Share response
- getContextFromQuestion() - Detect question context
- showNotification() - Display notifications
```

**What It Does**:
- Sends user questions to OpenAI API
- Detects question context (profile, dating, safety, etc.)
- Gets personalized responses
- Maintains conversation history
- Shows loading indicators
- Falls back to templated responses if API unavailable
- Gets AI suggestions for different topics

**Uses**: Fetch API, localStorage, OpenAI integration

**API Endpoints Used**:
- POST `/api/ai/chat`
- GET `/api/ai/suggestions/:type`

---

## 🔄 How the Files Work Together

### User Flow

1. **User opens index.html**
   - `app.js` initializes navigation
   - Loads `home.html` in iframe
   - `auth.js` checks if user is logged in

2. **User creates an account (signup.html)**
   - `auth.js` calls POST `/api/auth/register`
   - Stores JWT token
   - Updates header with username

3. **User navigates to Home**
   - `posts.js` loads feed from API
   - Posts are rendered dynamically
   - User can create, like, and comment

4. **User goes to Chat**
   - `chat.js` initializes Socket.IO connection
   - Loads conversations from API
   - Opens socket listeners for real-time messages

5. **User asks AI a question**
   - `ai.js` sends question to API
   - Gets OpenAI response
   - Displays formatted response

---

## 🛠️ Architecture Diagram

```
index.html (Main Frame)
    ├── js/app.js (Navigation Manager)
    │
    └── content-frame iframe
        ├── pages/home.html
        │   └── js/posts.js (Feed Manager)
        │
        ├── pages/chat.html
        │   └── js/chat.js (Chat Manager)
        │
        ├── pages/ai.html
        │   └── js/ai.js (AI Manager)
        │
        ├── pages/login.html
        │   └── js/auth.js (Auth Manager)
        │
        └── pages/profile.html
            └── js/auth.js (Profile Manager)

All pages share:
- js/auth.js (Authentication)
- localStorage (Token storage)
- Font Awesome Icons
```

---

## 🔐 Authentication Flow

```
signup.html
    ↓
User fills form
    ↓
auth.js registerUser()
    ↓
POST /api/auth/register
    ↓
Backend creates user, returns JWT
    ↓
localStorage.setItem('token')
    ↓
Page redirects to home.html
    ↓
app.js loads home.html
    ↓
posts.js fetches feed with token header
```

---

## 💬 Chat Flow

```
chat.html loads
    ↓
chat.js initializes()
    ↓
Connect to Socket.IO with token
    ↓
Load conversations from API
    ↓
User selects conversation
    ↓
Load message history from API
    ↓
User types message
    ↓
emit 'private_message' event
    ↓
Server broadcasts to receiver
    ↓
listen 'private_message' event
    ↓
Display message in UI
```

---

## 🤖 AI Flow

```
ai.html loads
    ↓
User types question
    ↓
ai.js askAI()
    ↓
POST /api/ai/chat with message
    ↓
Backend calls OpenAI API
    ↓
OpenAI returns response (or fallback)
    ↓
Display response in feed
    ↓
aiAssistant.chat() stores in history
```

---

## 📊 Function Organization

### By Feature

**Authentication**
- Located in: `js/auth.js`
- Methods: registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile
- Used by: All pages

**Posts/Feed**
- Located in: `js/posts.js`
- Methods: fetchFeed, createPost, likePost, addComment, renderPost, displayPosts
- Used by: `pages/home.html`, `pages/kyu.html`, `pages/other-unis.html`

**Real-Time Chat**
- Located in: `js/chat.js`
- Methods: loadConversations, openChat, sendMessage, handleIncomingMessage
- Used by: `pages/chat.html`

**AI Assistant**
- Located in: `js/ai.js`
- Methods: chat, getSuggestions, renderAIMessage, formatMessage, displayMessage
- Used by: `pages/ai.html`

**Navigation**
- Located in: `js/app.js`
- Methods: setActiveLink, changePage, updateHeaderUser, initNavigation
- Used by: `index.html`

---

## 🔗 Dependency Graph

```
index.html
├─ css/style.css
├─ js/app.js
│  └─ (NO external dependencies)
│
└─ pages/*.html
   ├─ css/style.css
   ├─ js/auth.js
   │  └─ localStorage, Fetch API
   │
   ├─ js/posts.js
   │  ├─ js/auth.js (for token)
   │  └─ Fetch API
   │
   ├─ js/chat.js
   │  ├─ js/auth.js (for token)
   │  ├─ Socket.IO (CDN)
   │  └─ Fetch API
   │
   └─ js/ai.js
      ├─ js/auth.js (for token)
      └─ Fetch API
```

---

## 🔄 Initialization Order

1. Browser loads `index.html`
2. `js/app.js` loads and initializes
3. `iframe` loads `pages/home.html`
4. `pages/home.html` includes:
   - `js/auth.js` (checks authentication)
   - `js/posts.js` (initializes PostsManager)
   - Posts are fetched and displayed
5. When user navigates, iframe src changes
6. New page loads with its required scripts

---

## 🎯 Key Variables & Objects

### Global in auth.js
```javascript
localStorage.getItem('token')      // JWT token
localStorage.getItem('user')       // Current user data
localStorage.getItem('userId')     // User ID
```

### Global in posts.js
```javascript
postsManager                       // PostsManager instance
postsManager.posts                 // Array of loaded posts
postsManager.currentPage           // Current pagination page
```

### Global in chat.js
```javascript
chatManager                        // ChatManager instance
chatManager.socket                 // Socket.IO connection
chatManager.currentChatId          // Active conversation
chatManager.conversations          // List of conversations
chatManager.onlineUsers            // Set of online user IDs
```

### Global in ai.js
```javascript
aiAssistant                        // AIAssistant instance
aiAssistant.conversationHistory    // Array of Q&A pairs
aiAssistant.currentContext         // Question context type
```

---

## 💡 Extension Points

### Add a New Feature

1. Create `js/feature.js`
2. Create a manager class
3. Add API endpoints in backend
4. Create/update page HTML
5. Include script in page
6. Call manager initialization

Example:
```javascript
// js/stories.js
class StoriesManager {
    async getStories() { ... }
    async uploadStory() { ... }
    renderStory() { ... }
}

const storiesManager = new StoriesManager();
```

---

## 🐛 Debugging Tips

### Check Authentication
```javascript
console.log(localStorage.getItem('token'));
console.log(typeof getCurrentUser);
```

### Check Posts Loading
```javascript
console.log(postsManager.posts);
console.log(postsManager.loading);
```

### Check Chat Connection
```javascript
console.log(chatManager.socket.connected);
console.log(chatManager.conversations);
```

### Check API Responses
Open DevTools → Network tab → Filter by XHR/Fetch

---

## 📚 Summary Table

| File | Purpose | Key Class | Main Methods |
|------|---------|-----------|--------------|
| app.js | Navigation | N/A | changePage, updateHeaderUser |
| auth.js | Authentication | N/A | loginUser, registerUser, getCurrentUser |
| posts.js | Posts/Feed | PostsManager | fetchFeed, createPost, likePost |
| chat.js | Real-time Chat | ChatManager | loadConversations, sendMessage |
| ai.js | AI Assistant | AIAssistant | chat, getSuggestions |

---

**Version**: 1.0  
**Last Updated**: 2026  
**Status**: Complete ✅