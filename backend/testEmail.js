// Test email service
require('dotenv').config();
const emailService = require('./services/emailService');

console.log('\n🧪 Testing Email Service\n');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Password length:', (process.env.EMAIL_PASSWORD || '').length);

// Simulate a test complaint from someone else
const testComplaint = {
  _id: '123456',
  name: 'John Doe',
  email: 'johndoe@gmail.com',  // ← Complaining person's email
  subject: 'Test Complaint',
  description: 'This is a test complaint from John Doe'
};

console.log('\n📧 Attempting to send test email...\n');

(async () => {
  const result = await emailService.sendComplaintAcknowledgment(testComplaint);
  if (result.success) {
    console.log('\n✅ SUCCESS: Email sent!');
    console.log('Message ID:', result.messageId);
  } else {
    console.log('\n❌ FAILED: Email not sent');
    console.log('Error:', result.error);
  }
  process.exit(result.success ? 0 : 1);
})();
