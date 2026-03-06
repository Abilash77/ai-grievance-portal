require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PATCH', 'DELETE'],
	credentials: true
}));

app.use(express.json());

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

const port = process.env.PORT || 4000;
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
