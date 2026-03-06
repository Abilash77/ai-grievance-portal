const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

export async function lodgeComplaint(payload: { name: string; email: string; subject: string; description: string; }) {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getComplaint(id: string) {
  const res = await fetch(`${API_BASE}/api/complaints/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listComplaints() {
  const res = await fetch(`${API_BASE}/api/complaints`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default { lodgeComplaint, getComplaint, listComplaints };
