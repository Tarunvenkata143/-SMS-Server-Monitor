import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navigation from './components/Navigation';
import Login from './components/Login';
import SignupScreen from './components/Signup';
import VerifyOtp from './components/VerifyOtp';
import Dashboard from './components/Dashboard';
import Trends from './components/Trends';
import Settings from './components/Settings';
import SchemaExplorer from './components/SchemaExplorer';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-firebase-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase (only if not already initialized)
if (!window.firebaseInitialized) {
  import('firebase/app').then(({ initializeApp }) => {
    initializeApp(firebaseConfig);
    window.firebaseInitialized = true;
  });
}

// Set axios base URL for backend
axios.defaults.baseURL = 'http://localhost:5001';

function App() {
  return (
    <Router basename="/server-monitoring-sms">
      <div className="min-h-screen bg-gray-100">
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/dashboard" element={
            <>
              <Navigation />
              <Dashboard />
            </>
          } />
          <Route path="/trends" element={
            <>
              <Navigation />
              <Trends />
            </>
          } />
          <Route path="/settings" element={
            <>
              <Navigation />
              <Settings />
            </>
          } />
          <Route path="/schema-explorer" element={
            <>
              <Navigation />
              <SchemaExplorer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// (Mobile overlay removed per user request)

export default App;
