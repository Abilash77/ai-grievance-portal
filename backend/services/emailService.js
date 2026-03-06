const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️  Email credentials not configured. Emails will not be sent.');
  console.warn('Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
}

const cleanPassword = process.env.EMAIL_PASSWORD 
  ? process.env.EMAIL_PASSWORD.replace(/\s/g, '') 
  : '';

console.log('📧 Initializing email service...');
console.log('   Email User:', process.env.EMAIL_USER);
console.log('   Password length:', cleanPassword.length);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: cleanPassword
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service failed to connect:', error.message);
    if (error.message.includes('Invalid login')) {
      console.error('💡 Tip: Check if your app password is correct');
      console.error('   1. Go to https://myaccount.google.com/apppasswords');
      console.error('   2. Select Mail & Windows Computer');
      console.error('   3. Copy the 16-char password and paste in .env');
    }
  } else {
    console.log('✅ Email service ready - emails will be sent');
  }
});

const sendComplaintAcknowledgment = async (complaintData) => {
  const { email, name, subject, _id } = complaintData;
  // ...existing code for sending email...
};

module.exports = { sendComplaintAcknowledgment };
