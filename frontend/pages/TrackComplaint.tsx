import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, XCircle, Loader, Send } from 'lucide-react';
import { getComplaintById } from '../services/storageService';
import { Complaint, ComplaintStatus } from '../types';

const TrackComplaint: React.FC = () => {
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState<Complaint | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setHasSearched(true);
    const complaint = getComplaintById(trackingId.trim());
    
    if (complaint) {
      setResult(complaint);
      setError('');
    } else {
      setResult(null);
      setError('No complaint found with this Tracking ID.');
    }
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch(status) {
      case ComplaintStatus.RESOLVED: return <CheckCircle className="h-6 w-6 text-green-500" />;
      case ComplaintStatus.REJECTED: return <XCircle className="h-6 w-6 text-red-500" />;
      case ComplaintStatus.IN_PROGRESS: return <Loader className="h-6 w-6 text-blue-500 animate-spin" />;
      case ComplaintStatus.FORWARDED: return <Send className="h-6 w-6 text-purple-500" />;
      default: return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = (c: Complaint) => {
    if (c.status === ComplaintStatus.FORWARDED) {
      return `Forwarded to ${c.department} Dept.`;
    }
    return c.status;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Track Complaint Status</h1>
        <p className="mt-2 text-slate-600">Enter your Complaint Tracking Number to check the current progress.</p>
      </div>

      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. GRV-2023...)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-4 py-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>

        {hasSearched && !result && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Tracking Number</p>
                <p className="text-xl font-mono font-bold text-slate-900">{result.id}</p>
              </div>
              <div className="flex flex-col items-end">
                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                   result.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                 }`}>
                   {result.priority} Priority
                 </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                {getStatusIcon(result.status)}
                <div>
                  <p className="text-sm text-slate-500">Current Status</p>
                  <p className="text-lg font-bold text-slate-900">{getStatusText(result)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Submitted By</p>
                  <p className="font-medium text-slate-900">{result.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Date</p>
                  <p className="font-medium text-slate-900">{new Date(result.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Department</p>
                  <p className="font-medium text-slate-900">{result.department}</p>
                </div>
                <div>
                  <p className="text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{result.category}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-slate-500 text-sm mb-1">Issue Description</p>
                <p className="text-slate-800">{result.title}</p>
                <p className="text-slate-600 text-sm mt-1">{result.description}</p>
              </div>

              {result.remarks && result.remarks.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2">System Updates / Remarks</p>
                  <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                    {result.remarks.map((rem, idx) => (
                      <li key={idx}>{rem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackComplaint;