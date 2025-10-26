const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? '/api' // This will be handled by Vercel routing
    : 'http://localhost:5001'
};

export default config;