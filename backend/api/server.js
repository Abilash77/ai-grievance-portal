// Vercel-friendly entry point. It imports the express app from index.js
// and exports it as a standard http handler.
const app = require('../index');

module.exports = app;