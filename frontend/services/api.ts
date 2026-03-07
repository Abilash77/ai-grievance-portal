import { getApiBaseUrl } from './config';

const API_BASE = getApiBaseUrl();

/**
 * Send complaint to backend
 * Handles email notification and complaint acknowledgment
 */
export async function lodgeComplaint(payload: {
  name: string;
  email: string;
  subject: string;
  description: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

/**
 * Retrieve a specific complaint by ID
 */
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

/**
 * Retrieve all complaints (admin only)
 */
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

export default { lodgeComplaint, getComplaint, listComplaints };
