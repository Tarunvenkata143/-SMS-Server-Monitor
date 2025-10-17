# Firebase Integration for OTP and Push Notifications

## Completed Tasks
- [x] Install firebase-admin in backend (already installed)
- [x] Create Firebase config in backend (already exists)
- [x] Modify backend/routes/alert.js for FCM push notifications (already implemented)
- [x] Analyze current codebase (Twilio OTP, Fast2SMS alerts)

## Pending Tasks
- [ ] Update backend/models/User.js to add fcmToken field
- [ ] Modify backend/routes/auth.js for Firebase Phone Auth (replace Twilio/Fast2SMS OTP)
- [ ] Update frontend-react/src/components/Signup.js for Firebase client integration (Phone Auth)
- [ ] Add FCM token registration in frontend (in Login.js or Signup.js)
- [ ] Add Firebase environment variables to backend/.env
- [ ] Set up Firebase project and obtain config keys (user action)
- [ ] Test OTP flow and push notifications
- [ ] Ensure no paid services are used
