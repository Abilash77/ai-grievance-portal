/**
 * CORS Configuration Module
 * Manages allowed origins for the backend API
 */

/**
 * Get allowed origins from environment variable
 * Defaults to localhost for local development
 */
const getAllowedOrigins = () => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  
  if (allowedOriginsEnv) {
    // Split comma-separated string into array
    return allowedOriginsEnv.split(',').map(origin => origin.trim());
  }
  
  // Default for local development
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
};

/**
 * Get CORS configuration options
 * Note: credentials: true requires specific origins (not '*')
 */
const getCorsOptions = () => {
  return {
    origin: (origin, callback) => {
      // Allow all origins
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
  };
};

module.exports = { getAllowedOrigins, getCorsOptions };
