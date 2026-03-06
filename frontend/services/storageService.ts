import { Complaint, ComplaintStatus, Priority } from '../types';

const STORAGE_KEY = 'grievance_portal_data';

// Helper to generate tracking number
const generateTrackingNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${dateStr}-${randomPart}`;
};

export const getComplaints = (): Complaint[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getComplaintById = (id: string): Complaint | undefined => {
  const complaints = getComplaints();
  return complaints.find((c) => c.id === id);
};

export const saveComplaint = (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'remarks' | 'forwardedAt'>): Complaint => {
  const complaints = getComplaints();
  
  const newComplaint: Complaint = {
    ...complaintData,
    id: generateTrackingNumber(),
    status: ComplaintStatus.SUBMITTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    remarks: []
  };

  complaints.push(newComplaint);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  return newComplaint;
};

export const updateComplaintStatus = (id: string, status: ComplaintStatus, remark?: string): Complaint | null => {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  
  if (index === -1) return null;

  complaints[index].status = status;
  complaints[index].updatedAt = new Date().toISOString();
  
  if (remark) {
    complaints[index].remarks = [...(complaints[index].remarks || []), remark];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  return complaints[index];
};

export const forwardComplaint = (id: string, remark?: string): Complaint | null => {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  
  if (index === -1) return null;

  complaints[index].status = ComplaintStatus.FORWARDED;
  complaints[index].updatedAt = new Date().toISOString();
  complaints[index].forwardedAt = new Date().toISOString();
  
  const forwardMsg = `Forwarded to ${complaints[index].department} department.`;
  complaints[index].remarks = [...(complaints[index].remarks || []), remark ? `${forwardMsg} Note: ${remark}` : forwardMsg];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  return complaints[index];
};

export const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const dummyData: Complaint[] = [
      {
        id: 'GRV-20231025-1234',
        fullName: 'Ramesh Gupta',
        email: 'ramesh@example.com',
        phone: '9876543210',
        department: 'Electricity',
        category: 'Hazard',
        title: 'Live wire hanging near school',
        description: 'There is a live electricity wire hanging very low near the primary school entrance. Immediate action required.',
        priority: Priority.HIGH,
        status: ComplaintStatus.SUBMITTED,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        userId: 'user1'
      },
      {
        id: 'GRV-20231026-5678',
        fullName: 'Sita Verma',
        email: 'sita@example.com',
        phone: '9876543211',
        department: 'Municipal',
        category: 'Sanitation',
        title: 'Garbage not collected for 5 days',
        description: 'The garbage truck has not visited Sector 4 for the past 5 days. Piles of trash are accumulating.',
        priority: Priority.LOW,
        status: ComplaintStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        userId: 'user2'
      },
      {
        id: 'GRV-20231027-9101',
        fullName: 'Amit Kumar',
        email: 'amit@example.com',
        phone: '9876543212',
        department: 'Health',
        category: 'Service Issue',
        title: 'Unavailability of doctors at City Hospital',
        description: 'Visited the emergency ward last night, no senior doctor was available for 3 hours.',
        priority: Priority.HIGH,
        status: ComplaintStatus.UNDER_REVIEW,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'user3'
      },
      {
        id: 'GRV-20231015-9999',
        fullName: 'Vikram Singh',
        email: 'vikram@example.com',
        phone: '9876543213',
        department: 'Transport',
        category: 'Infrastructure',
        title: 'Large Pothole on Main Road',
        description: 'A very deep pothole causing accidents near the market area. Forwarded to department long ago but no action.',
        priority: Priority.HIGH,
        status: ComplaintStatus.FORWARDED,
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        forwardedAt: new Date(Date.now() - 86400000 * 12).toISOString(), // 12 days ago
        userId: 'user4',
        remarks: ['Forwarded to Transport department.']
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyData));
  }
};