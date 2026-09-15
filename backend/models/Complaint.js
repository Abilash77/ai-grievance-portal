const mongoose = require('mongoose');

const FakeDetectionSchema = new mongoose.Schema({
  isFake:    { type: Boolean, default: false },
  score:     { type: Number, default: 0, min: 0, max: 100 }, // 0=genuine, 100=definitely fake
  verdict:   { type: String, enum: ['genuine', 'suspicious', 'fake'], default: 'genuine' },
  reason:    { type: String, default: '' },
  checkedAt: { type: Date, default: Date.now },
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  // ── Citizen Info ──────────────────────────────────────────────
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   { type: String, default: '' },
  address: { type: String, default: '' },

  // ── Complaint Details ─────────────────────────────────────────
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  department:  { type: String, default: 'Other' },
  category:    { type: String, default: 'Other' },
  priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },

  // ── Submission Metadata ───────────────────────────────────────
  submissionMethod: {
    type: String,
    enum: ['web_form', 'voice_call'],
    default: 'web_form',
  },

  // ── Media Attachments ─────────────────────────────────────────
  // Voice note stored as base64 string (audio/webm) or a public URL
  voiceNote:     { type: String, default: '' },
  // Proof document: filename / URL
  documentProof: { type: String, default: '' },

  // ── Call Metadata (voice_call submissions only) ───────────────
  callDuration: { type: Number, default: 0 }, // seconds

  // ── AI Fake Detection ─────────────────────────────────────────
  fakeDetection: { type: FakeDetectionSchema, default: () => ({}) },

  // ── Status ────────────────────────────────────────────────────
  status:    { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', ComplaintSchema);