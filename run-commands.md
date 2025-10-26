# SMS Server Monitor - Run Commands

## Prerequisites
- Node.js (v16+)
- npm
- MongoDB Atlas account

## Quick Setup Commands

### 1. Clone and Setup
```bash
git clone https://github.com/Tarunvenkata143/-SMS-Server-Monitor.git
cd sms-server-monitor
```

### 2. Backend Setup
```bash
cd backend

# Create .env file with:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sms-monitor
# JWT_SECRET=your_jwt_secret
# PORT=5001
# TWILIO_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_PHONE_NUMBER=your_twilio_phone_number
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_email_app_password

npm install
npm run dev
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend-react
npm install
npm start
```

## Access
- Frontend: http://localhost:3003
- Backend API: http://localhost:5001/api

## Production Build
```bash
cd frontend-react
npm run build

cd ../backend
npm start
```
