const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const emailService = require('../services/emailService');

// Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, description } = req.body;
    // Validate input
    if (!name || !email || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    let complaint = null;
    // Try to save to MongoDB
    try {
      complaint = new Complaint({ name, email, subject, description });
      await complaint.save();
    } catch (dbError) {
      complaint = {
        _id: Date.now().toString(),
        name, email, subject, description,
        status: 'pending',
        createdAt: new Date()
      };
    }
    // Send acknowledgment email to the complaint giver
    const emailResult = await emailService.sendComplaintAcknowledgment(complaint);
    res.status(201).json({
      ...complaint,
      emailSent: emailResult.success,
      dbSaved: complaint instanceof Complaint
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;