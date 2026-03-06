export enum ComplaintStatus {
  SUBMITTED = 'Submitted',
  FORWARDED = 'Forwarded',
  UNDER_REVIEW = 'Under Review',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected',
}

export enum Priority {
  HIGH = 'High',
  LOW = 'Low',
}

export interface Complaint {
  id: string; // Tracking Number: GRV-YYYYMMDD-XXXX
  userId: string; // For this demo, we might just store user details directly
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  department: string;
  category: string;
  title: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  voiceNote?: string; // Base64 or URL
  imageProof?: string; // Base64 or URL
  documentProof?: string; // Base64 or URL
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  forwardedAt?: string; // ISO String - When it was forwarded to the department
  remarks?: string[]; // Admin remarks
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  overdue: number;
}