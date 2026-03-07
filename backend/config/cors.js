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
  const allowedOrigins = getAllowedOrigins();
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or server requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS rejected origin: ${origin}`);
        callback(new Error('CORS not allowed for this origin'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
  };
};

module.exports = { getAllowedOrigins, getCorsOptions };
