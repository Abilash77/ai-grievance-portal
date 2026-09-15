const express  = require('express');
const router   = express.Router();
const Complaint = require('../models/Complaint');
const emailService = require('../services/emailService');
const { detectFakeComplaint } = require('../services/fakeDetection');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints  — Create a new complaint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      // Required
      name, email, subject, description,
      // Optional rich fields
      phone, address, department, category, priority,
      submissionMethod, voiceNote, documentProof, callDuration,
      // Pre-computed fake detection from frontend (optional — backend will re-verify)
      fakeDetectionResult,
    } = req.body;

    // Basic validation
    if (!name || !email || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields: name, email, subject, description' });
    }

    // ── AI Fake Detection (authoritative — runs on backend) ──
    let fakeDetection;
    try {
      fakeDetection = await detectFakeComplaint({
        title:       subject,
        description,
        department:  department || '',
        category:    category  || '',
        hasVoiceNote: Boolean(voiceNote),
        hasProof:     Boolean(documentProof),
      });
    } catch (fdErr) {
      console.warn('⚠️  Fake detection error (non-fatal):', fdErr.message);
      fakeDetection = {
        isFake:    false,
        score:     0,
        verdict:   'genuine',
        reason:    'Fake detection unavailable.',
        checkedAt: new Date(),
      };
    }

    // ── Build complaint document ──
    const complaintData = {
      name,
      email,
      phone:   phone   || '',
      address: address || '',
      subject,
      description,
      department:       department       || 'Other',
      category:         category         || 'Other',
      priority:         ['High','Medium','Low'].includes(priority) ? priority : 'Medium',
      submissionMethod: submissionMethod === 'voice_call' ? 'voice_call' : 'web_form',
      voiceNote:        voiceNote        || '',
      documentProof:    documentProof    || '',
      callDuration:     Number(callDuration) || 0,
      fakeDetection,
      status: 'pending',
    };

    // ── Save to MongoDB ──
    let complaint = null;
    let dbSaved = false;
    try {
      complaint = new Complaint(complaintData);
      await complaint.save();
      dbSaved = true;
    } catch (dbError) {
      console.error('❌ DB save error:', dbError.message);
      // Fallback: in-memory object so the response still succeeds
      complaint = { _id: Date.now().toString(), ...complaintData, createdAt: new Date() };
    }

    // ── Send acknowledgment email ──
    let emailSent = false;
    try {
      const emailResult = await emailService.sendComplaintAcknowledgment(complaint);
      emailSent = emailResult.success;
    } catch (emailErr) {
      console.warn('⚠️  Email send failed (non-fatal):', emailErr.message);
    }

    return res.status(201).json({
      _id:          complaint._id,
      status:       complaint.status,
      priority:     complaint.priority,
      fakeDetection: complaint.fakeDetection,
      emailSent,
      dbSaved,
    });
  } catch (err) {
    console.error('❌ POST /api/complaints error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints/detect-fake  — Standalone fake-detection endpoint
// (called by frontend before showing the detection badge)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/detect-fake', async (req, res) => {
  try {
    const { title, description, department, category, hasVoiceNote, hasProof } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const result = await detectFakeComplaint({
      title,
      description,
      department:  department  || '',
      category:    category    || '',
      hasVoiceNote: Boolean(hasVoiceNote),
      hasProof:     Boolean(hasProof),
    });

    return res.json(result);
  } catch (err) {
    console.error('❌ POST /api/complaints/detect-fake error:', err);
    return res.status(500).json({ error: 'Fake detection failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaints  — List all complaints (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(100);
    return res.json(complaints);
  } catch (err) {
    console.error('❌ GET /api/complaints error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaints/:id  — Get a single complaint by ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    return res.json(complaint);
  } catch (err) {
    console.error('❌ GET /api/complaints/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;