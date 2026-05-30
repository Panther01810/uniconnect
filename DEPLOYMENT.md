# 🚀 KYU CONNECT - Deployment Guide

## Deploy to Render.com (Recommended)

### Step 1: Prepare GitHub Repository

1. Initialize git if not done:
```bash
git init
git add .
git commit -m "Initial commit: KYU CONNECT social platform"
```

2. Create GitHub repository and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/kyu-connect.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click "Create New" → "Web Service"
4. Select your GitHub repository
5. Configure:
   - **Name**: kyu-connect-backend
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

### Step 3: Set Environment Variables on Render

In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kyuconnect
JWT_SECRET=generate_random_key_here
OPENAI_API_KEY=sk-your_key_here
FRONTEND_URL=https://YOUR_APP_NAME.onrender.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
MAX_FILE_SIZE=5000000
```

### Step 4: Deploy Frontend on Render

1. Create new Static Site
2. Select repository (same one)
3. Publish directory: `.` (root)
4. Click Deploy

### Step 5: Connect MongoDB Atlas

1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to Render environment variables as `MONGODB_URI`

### Step 6: Set Up Twilio (for video/voice calls)

1. Go to https://twilio.com
2. Sign up for account
3. Create API key and get credentials
4. Add to Render environment variables

---

## Deploy to GitHub Pages + Heroku

### Backend on Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create kyu-connect-backend`
4. Add MongoDB:
```bash
heroku addons:create mongolab:sandbox
```

5. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
# ... set other variables
```

6. Deploy:
```bash
git push heroku main
```

### Frontend on GitHub Pages

1. Update package.json:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/kyu-connect"
}
```

2. Build and deploy:
```bash
npm run build
npx gh-pages -d .
```

---

## Environment Variables Required

### Mandatory
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Random secret key for JWT
- `NODE_ENV` - Set to "production"

### Optional (for features)
- `OPENAI_API_KEY` - For AI assistant
- `TWILIO_ACCOUNT_SID` - For video calls
- `TWILIO_AUTH_TOKEN` - For video calls
- `TWILIO_PHONE_NUMBER` - For SMS features

### Recommended
- `FRONTEND_URL` - Your frontend URL
- `MAX_FILE_SIZE` - Max upload size

---

## Generate Secure Secrets

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Connection
Use MongoDB Atlas free tier:
1. Create account at mongodb.com
2. Create cluster (free)
3. Create user with password
4. Get connection string
5. Format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

---

## Post-Deployment Checklist

- [ ] Backend running on Render
- [ ] Frontend deployed and loading
- [ ] Can create account and login
- [ ] Can create posts
- [ ] Can send messages
- [ ] Can make video calls
- [ ] AI assistant working
- [ ] Status features showing
- [ ] Database persisting data
- [ ] File uploads working

---

## Troubleshooting Deployment

### Backend won't start
1. Check MONGODB_URI format
2. Verify JWT_SECRET is set
3. Check logs: `render logs`
4. Ensure database is accessible

### Frontend not connecting to Backend
1. Check FRONTEND_URL in backend env
2. Verify API base URL in frontend
3. Check CORS settings
4. Test with curl:
```bash
curl https://your-backend.onrender.com/api/health
```

### Database connection fails
1. Verify connection string format
2. Check IP whitelist on MongoDB
3. Test connection locally first
4. Ensure credentials are correct

### Video calls not working
1. Add Twilio credentials to env
2. Verify Twilio account is active
3. Check API key permissions
4. Test with Twilio console

---

## Maintenance & Updates

### Updating Code
```bash
git add .
git commit -m "Update message"
git push origin main
# Render auto-deploys on push
```

### Scaling Up
- Upgrade from free tier
- Use paid MongoDB Atlas
- Add Redis caching
- Set up CDN for static files

### Monitoring
1. Check Render dashboard
2. Review logs regularly
3. Monitor database size
4. Track API usage

---

## Cost Estimation (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Render | ~$0 | $7-28 |
| MongoDB Atlas | ~$0 | $0-57+ |
| Twilio | $0 (trial) | Pay-as-you-go |
| **Total** | **~$0** | **~$50+** |

---

## Backup & Recovery

### Backup Database
```bash
# Using MongoDB CLI
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/kyuconnect"
```

### Restore Database
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/" dump/
```

---

## Security Checklist

- [ ] Change JWT_SECRET to random value
- [ ] Use strong MongoDB password
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set FRONTEND_URL correctly
- [ ] Restrict MongoDB access to app only
- [ ] Keep .env out of git
- [ ] Rotate API keys regularly
- [ ] Monitor usage for attacks

---

## Performance Optimization

1. **Enable Compression**
   - Already in backend

2. **Add Caching Headers**
   - Configure in Express

3. **Database Indexing**
   - Already configured in models

4. **CDN for Static Files**
   - Use Render's static hosting
   - Or add Cloudflare free tier

5. **Monitor Performance**
   - Check Render metrics
   - Monitor API response times

---

**Deployed! Your KYU CONNECT is live! 🎉**