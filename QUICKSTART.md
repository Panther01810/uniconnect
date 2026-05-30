# 🚀 KYU CONNECT - Quick Start (5 Minutes)

## TL;DR - Get Running in 5 Minutes

### Prerequisites
- Node.js installed (https://nodejs.org/)
- MongoDB running locally or MongoDB Atlas account

### Step 1: Install Backend (1 min)
```bash
cd backend
npm install
```

### Step 2: Configure Environment (1 min)
Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kyuconnect
JWT_SECRET=your_secret_key_12345
OPENAI_API_KEY=sk-your_key_optional
MAX_FILE_SIZE=5000000
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start Backend (1 min)
```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 3001
```

### Step 4: Open Frontend (1 min)
Open `index.html` in your browser

### Step 5: Sign Up & Start Using (1 min)
1. Click "Sign Up"
2. Create account
3. Start posting, chatting, and using AI!

---

## 🎯 What Works Now

✅ **Posts/Feed**
- Create visible to all
- Like/comment/share
- See real posts from database

✅ **Real-Time Chat**
- Send instant messages
- See typing indicators
- Online status

✅ **AI Assistant**
- Ask questions
- Get AI responses
- Chat history

✅ **User Profiles**
- Create account
- Update profile
- Follow/unfollow users

---

## 🐛 If Something Breaks

### Backend won't start?
```bash
# Check MongoDB is running
mongod

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm start
```

### Can't log in?
- Check `.env` file exists in `backend/`
- Check MongoDB is running
- Clear browser localStorage

### Messages show "offline"?
- Check backend console shows no errors
- Backend must be running on port 3001
- Refresh page

### AI not responding?
- AI works without API (shows fallback response)
- Optional: Add OPENAI_API_KEY to `.env`

---

## 📁 Key Files to Remember

```
backend/
├── .env                    ← Configure here
├── server.js               ← Main server
└── models/, routes/        ← Database & API

js/
├── auth.js                ← Login/signup
├── posts.js               ← Feed management  
├── chat.js                ← Real-time chat
└── ai.js                  ← AI assistant

pages/                      ← All pages
```

---

## 💡 Test It

Try these:
1. Sign up with email/password
2. Create a post with text
3. Go to Chat and try messaging
4. Ask AI: "How do I write a good bio?"
5. Follow someone in search

---

## 📚 More Info

- **SETUP_GUIDE.md** - Detailed setup (15 min read)
- **API_REFERENCE.md** - All endpoints (reference)
- **REQUIREMENTS.md** - System requirements
- **JS_FILES_GUIDE.md** - How code works

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3001 in use | Change PORT in .env |
| MongoDB error | Run `mongod` in another terminal |
| Blank page | Check browser console (F12) |
| Posts not loading | Backend must be running |
| Messages offline | Refresh page, check backend |

---

## ✨ You're All Set!

Your platform is ready to use. Start with:
1. Create an account
2. Make a post
3. Send a message
4. Chat with AI

Enjoy! 🎉

---

**Next Steps**: Read SETUP_GUIDE.md for deployment, customization, and advanced features.