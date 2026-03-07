require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { getCorsOptions } = require('./config/cors');

const app = express();

// CORS Configuration with origin validation
app.use(cors(getCorsOptions()));

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
	console.error('MONGODB_URI not set in environment');
	process.exit(1);
}

mongoose.connect(mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => {
	console.log('✅ Connected to MongoDB');
}).catch(err => {
	console.error('❌ MongoDB connection error:', err.message);
	console.warn('⚠️  Server continuing without MongoDB. Email service should still work.');
});

const complaintsRouter = require('./routes/complaints');
app.use('/api/complaints', complaintsRouter);

// start the server only when the file is executed directly (not when imported by a serverless wrapper)
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
