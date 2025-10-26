const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL || 'https://your-fly-app.fly.dev/api'
    : 'http://localhost:5001'
};

export default config;
