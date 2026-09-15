import { getApiBaseUrl } from './config';

const API_BASE = getApiBaseUrl();

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FakeDetectionResult {
  isFake:    boolean;
  score:     number;       // 0-100
  verdict:   'genuine' | 'suspicious' | 'fake';
  reason:    string;
  checkedAt: string;
}

export interface LodgeComplaintPayload {
  // Required
  name:        string;
  email:       string;
  subject:     string;
  description: string;
  // Optional rich fields
  phone?:             string;
  address?:           string;
  department?:        string;
  category?:          string;
  priority?:          string;
  submissionMethod?:  'web_form' | 'voice_call';
  voiceNote?:         string;   // base64 encoded audio or empty string
  documentProof?:     string;   // filename or URL
  callDuration?:      number;   // seconds (voice call only)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lodge Complaint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send complaint to backend — saves all fields + runs backend fake detection.
 */
export async function lodgeComplaint(payload: LodgeComplaintPayload) {
  try {
    const res = await fetch(`${API_BASE}/api/complaints`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `Backend error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('❌ Error submitting complaint to backend:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fake Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call the backend /detect-fake endpoint.
 * Used by the frontend to show a live detection badge before final submission.
 */
export async function detectFakeComplaint(params: {
  title:        string;
  description:  string;
  department?:  string;
  category?:    string;
  hasVoiceNote?: boolean;
  hasProof?:     boolean;
}): Promise<FakeDetectionResult> {
  const res = await fetch(`${API_BASE}/api/complaints/detect-fake`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Backend error: ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Complaint by ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getComplaint(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/complaints/${id}`);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `Backend error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('❌ Error fetching complaint:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// List All Complaints (admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function listComplaints() {
  try {
    const res = await fetch(`${API_BASE}/api/complaints`);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `Backend error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('❌ Error listing complaints:', error);
    throw error;
  }
}

export default { lodgeComplaint, detectFakeComplaint, getComplaint, listComplaints };
