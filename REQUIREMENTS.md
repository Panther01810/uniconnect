# KYU CONNECT - System Requirements & Installation

## 📋 Prerequisites

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB minimum
- **Internet**: Required for dependencies and APIs

### Required Software

#### 1. Node.js & npm
- **Download**: https://nodejs.org/
- **Minimum Version**: 14.0.0
- **Check Installation**:
  ```bash
  node --version
  npm --version
  ```

#### 2. MongoDB
- **Download**: https://www.mongodb.com/try/download/community
- **Minimum Version**: 4.0
- **Check Installation**:
  ```bash
  mongod --version
  ```
- **Start MongoDB**:
  ```bash
  # Windows
  mongod
  
  # macOS/Linux
  brew services start mongodb-community
  ```

#### 3. Git (Optional, for versioning)
- **Download**: https://git-scm.com/
- **Check Installation**:
  ```bash
  git --version
  ```

#### 4. Text Editor
- **Recommended**: VS Code (https://code.visualstudio.com/)
- **Alternative**: Sublime Text, Atom, WebStorm

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

Navigate to the backend directory:
```bash
cd backend
npm install
```

This installs:
- express (Web framework)
- mongoose (Database ODM)
- socket.io (Real-time communication)
- openai (AI integration)
- jsonwebtoken (Authentication)
- bcryptjs (Password hashing)
- cors (Cross-origin requests)
- helmet (Security)
- dotenv (Environment variables)
- multer (File uploads)
- express-validator (Input validation)

### Step 2: Set Up Environment Variables

Create `backend/.env` file:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kyuconnect

# Authentication
JWT_SECRET=change_this_to_a_random_string_in_production

# OpenAI API
OPENAI_API_KEY=sk-your_key_here

# File Upload
MAX_FILE_SIZE=5000000

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 3: Ensure MongoDB is Running

**Windows (CMD)**:
```bash
mongod
```

**Windows (PowerShell)**:
```powershell
Start-Process mongod
```

**macOS/Linux**:
```bash
brew services start mongodb-community
```

**Docker** (Alternative):
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### Step 4: Start the Backend Server

From `backend/` directory:
```bash
npm start
```

Expected output:
```
Connected to MongoDB
Server running on port 3001
Environment: development
```

### Step 5: Open Frontend

1. Open `index.html` in your browser
2. Or use a local server:
   ```bash
   # npm method
   npm install -g http-server
   http-server
   
   # Python method
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`

---

## ✅ Verification Checklist

### Backend Running
- [ ] Terminal shows "Connected to MongoDB"
- [ ] Terminal shows "Server running on port 3001"
- [ ] No error messages in terminal

### MongoDB Connected
- [ ] Can start `mongod` without errors
- [ ] Database folder exists
- [ ] No port conflicts

### Frontend Loading
- [ ] `index.html` opens without errors
- [ ] Navigation links work
- [ ] Pages load in iframe

---

## 📦 Dependencies List

### Core Dependencies
```json
{
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "socket.io": "^4.5.0",
  "openai": "^3.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.0",
  "cors": "^2.8.0",
  "helmet": "^7.0.0",
  "dotenv": "^16.0.0",
  "multer": "^1.4.0",
  "express-validator": "^7.0.0"
}
```

### Installation Command
```bash
npm install express mongoose socket.io openai jsonwebtoken bcryptjs cors helmet dotenv multer express-validator
```

---

## 🔐 OpenAI API Setup

### Get API Key
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Navigate to "API keys" section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

### Test API Integration
```bash
# From backend directory
node -e "
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log('OpenAI initialized successfully');
"
```

---

## 🗄️ MongoDB Setup

### Option 1: Local Installation

**Windows**:
1. Download MongoDB Community Edition
2. Run installer
3. Choose "Install MongoDB as a Service"
4. Start service via Services app

**macOS**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu)**:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
```

### Option 2: Docker (Recommended)

```bash
# Install Docker from https://docker.com

# Run MongoDB container
docker run -d \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  --name my-mongodb \
  mongo:latest

# Stop container
docker stop my-mongodb

# Start container again
docker start my-mongodb
```

### Option 3: MongoDB Atlas (Cloud)

1. Visit https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kyuconnect
   ```

---

## 🔧 Configuration Options

### Change Server Port
Edit `backend/.env`:
```env
PORT=3000
```

Then update frontend API calls in `js/` files.

### Change Database
Edit `backend/.env`:
```env
MONGODB_URI=mongodb://your-host:27017/your-db-name
```

### Set JWT Secret
Generate random key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `backend/.env`:
```env
JWT_SECRET=generated_key_here
```

### Enable/Disable Features
In `backend/server.js`, comment/uncomment CORS origins.

---

## 🧪 Testing Installation

### Test Backend API
```bash
# From any directory with curl or Postman
curl http://localhost:3001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### Test Frontend
Open browser DevTools (F12) → Console:
```javascript
// Should return the API base URL
console.log('API_BASE:', 'http://localhost:3001/api');

// Should connect to backend
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(d => console.log('API Response:', d));
```

### Test Socket.IO
```javascript
// In browser console
console.log(typeof io); // Should be 'function'

// If chatManager is available
console.log(chatManager.socket?.connected); // Should be true/false
```

---

## 🆘 Troubleshooting

### "MongoDB connection failed"
```bash
# Solution 1: Start MongoDB
mongod

# Solution 2: Check MongoDB is running
ps aux | grep mongod

# Solution 3: Check default port
lsof -i :27017
```

### "Port 3001 already in use"
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

### "Cannot find module 'express'"
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### "OPENAI_API_KEY not set"
```bash
# Check .env file exists
ls backend/.env

# Check key is set
echo $OPENAI_API_KEY

# Add to .env if missing
OPENAI_API_KEY=sk-your_key_here
```

### "CORS error from frontend"
```javascript
// Error: Access to fetch blocked by CORS policy

// Solution: Ensure backend server is running on correct port
// Check backend console shows: "Server running on port 3001"

// Update frontend API_BASE if port changed:
// const API_BASE = 'http://localhost:3001/api';
```

### Node.js version issues
```bash
# Check version (should be 14+)
node --version

# Update Node.js if needed
# Visit https://nodejs.org/ and reinstall
```

---

## 🚀 Quick Start Commands Cheatsheet

### Terminal 1: Start Backend
```bash
cd backend
npm install  # First time only
npm start
```

### Terminal 2: Start Frontend (optional, if not using browser directly)
```bash
npm install -g http-server
http-server .
```

### Open in Browser
```
http://localhost:8000  # If using http-server
or
file:///path/to/KYU CONNECT MOCKUP/index.html  # Direct file
```

---

## 📊 System Check

Run this to verify everything:
```bash
# Check Node.js
echo "Node.js version:" && node --version

# Check npm
echo "npm version:" && npm --version

# Check MongoDB
echo "Checking MongoDB..." && mongod --version

# Check ports
echo "Checking ports..."
lsof -i :27017  # MongoDB
lsof -i :3001   # Backend
```

---

## 💾 Backup & Recovery

### Backup MongoDB Data
```bash
# Dump database
mongodump --uri="mongodb://localhost:27017/kyuconnect"

# Restore database
mongorestore --uri="mongodb://localhost:27017/" dump/
```

### Reset Database
```bash
# Connect to MongoDB
mongo

# In MongoDB shell
use kyuconnect
db.dropDatabase()
exit
```

---

## 📈 Performance Optimization

### For Development
- Keep MongoDB running locally
- Use Node.js v18+ for better performance
- Use modern browser (Chrome, Edge, Firefox)

### For Production
- Use MongoDB Atlas (cloud)
- Use PM2 for process management
- Add Redis for caching
- Use CDN for static files
- Enable compression in Express
- Set up monitoring and logging

---

## 🔒 Security Checklist

Before deploying:
- [ ] Change JWT_SECRET to random key
- [ ] Update FRONTEND_URL to production domain
- [ ] Set NODE_ENV=production
- [ ] Get valid OpenAI API key
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable database authentication
- [ ] Use strong passwords
- [ ] Regular backups

---

## 📞 Getting Help

### Check Logs
```bash
# Backend errors
# Check terminal running 'npm start'

# Frontend errors
# Open DevTools (F12) → Console tab
```

### Common Issues Documentation
- See TROUBLESHOOTING section above
- Check SETUP_GUIDE.md
- Review API_REFERENCE.md

---

**Version**: 1.0  
**Last Updated**: 2026  
**Difficulty Level**: Beginner-Friendly ✅