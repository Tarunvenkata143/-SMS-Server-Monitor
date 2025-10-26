# Deployment Plan for SMS Server Monitor

## Overview
- **Frontend**: Deployed on Vercel (React app)
- **Backend**: Deployed on Fly.io (Express.js app)
- **Database**: MongoDB Atlas (cloud database)

## Prerequisites
- Accounts: Vercel, Fly.io, MongoDB Atlas
- Node.js installed locally
- Git repository pushed to GitHub

## Step-by-Step Deployment Guide

### 1. Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create an account
2. Create a new project and cluster (free tier is fine)
3. Create a database user with read/write permissions
4. Get the connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`
5. Whitelist IP addresses (0.0.0.0/0 for testing, or your Fly.io IP later)

### 2. Prepare Backend for Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. In backend directory, create `fly.toml`:
   ```toml
   app = "sms-server-monitor-backend"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"
     buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

   [[services]]
     internal_port = 5001
     protocol = "tcp"

     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"

     [[services.ports]]
       handlers = ["http"]
       port = "80"

     [[services.ports]]
       handlers = ["tls", "http"]
       port = "443"

     [[services.tcp_checks]]
       grace_period = "1s"
       interval = "15s"
       restart_limit = 0
       timeout = "2s"
   ```
4. Set environment variables: `fly secrets set MONGODB_URI="your_atlas_uri"`
5. Deploy: `fly deploy`

### 3. Deploy Frontend on Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. In frontend-react directory, update `src/config.js` to point to Fly.io backend:
   ```javascript
   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-fly-app.fly.dev/api';
   ```
4. Set environment variable: `vercel env add REACT_APP_API_URL`
5. Deploy: `vercel --prod`

### 4. Update Vercel Configuration
- Remove backend from vercel.json, keep only frontend
- Update routes if needed

### 5. Testing
- Test frontend loads
- Test API calls to backend
- Verify database connections

## Environment Variables Needed
- Backend (Fly.io):
  - MONGODB_URI
  - JWT_SECRET
  - TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
  - EMAIL_USER, EMAIL_PASS
  - FIREBASE credentials
- Frontend (Vercel):
  - REACT_APP_API_URL
