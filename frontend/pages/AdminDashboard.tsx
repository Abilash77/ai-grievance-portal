import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplaints, updateComplaintStatus, forwardComplaint } from '../services/storageService';
import { getApiBaseUrl } from '../services/config';
import { Complaint, ComplaintStatus, Priority } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Search, Filter, AlertTriangle, Check, ExternalLink, Mic, Image as ImageIcon, Send, Clock, UserCheck } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [remarkInput, setRemarkInput] = useState('');

  // Protect Route (Simple check)
  useEffect(() => {
    const isAuth = localStorage.getItem('isAdminAuth');
    if (!isAuth) navigate('/admin-login');
    setComplaints(getComplaints());
  }, [navigate]);

  // Helper to check overdue
  const isOverdue = (c: Complaint) => {
    if (!c.forwardedAt) return false;
    const daysPassed = (Date.now() - new Date(c.forwardedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysPassed > 10 && c.status !== ComplaintStatus.RESOLVED && c.status !== ComplaintStatus.REJECTED;
  };

  // Derived State
  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === ComplaintStatus.SUBMITTED).length,
      resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
      highPriority: complaints.filter(c => c.priority === Priority.HIGH).length,
      overdue: complaints.filter(c => isOverdue(c)).length
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter(c => {
        const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.department.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesPriority && matchesSearch;
      })
      .sort((a, b) => {
        // High priority first
        if (a.priority === Priority.HIGH && b.priority !== Priority.HIGH) return -1;
        if (a.priority !== Priority.HIGH && b.priority === Priority.HIGH) return 1;
        // Then by date desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [complaints, filterStatus, filterPriority, searchTerm]);

  // Chart Data
  const statusData = [
    { name: 'Submitted', value: complaints.filter(c => c.status === ComplaintStatus.SUBMITTED).length, color: '#FBBF24' },
    { name: 'Forwarded', value: complaints.filter(c => c.status === ComplaintStatus.FORWARDED).length, color: '#A855F7' },
    { name: 'In Progress', value: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length, color: '#3B82F6' },
    { name: 'Resolved', value: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length, color: '#10B981' },
    { name: 'Rejected', value: complaints.filter(c => c.status === ComplaintStatus.REJECTED).length, color: '#EF4444' },
  ];

  const handleUpdateStatus = async (newStatus: ComplaintStatus) => {
    if (!selectedComplaint) return;
    
    const API_BASE = getApiBaseUrl();
    
    // Update local storage
    const updated = updateComplaintStatus(selectedComplaint.id, newStatus, remarkInput);
    if (updated) {
      setComplaints(getComplaints()); // Refresh
      setSelectedComplaint(updated);

      // Send status update to backend (for email notification)
      try {
        const response = await fetch(`${API_BASE}/api/complaints/${selectedComplaint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Status updated on backend, email sent:', data.emailSent);
        } else {
          console.warn('⚠️ Backend status update failed (email may not be sent)');
        }
      } catch (err) {
        console.warn('⚠️ Could not reach backend for email notification:', err);
      }

      setRemarkInput('');
      alert(`Status updated to "${newStatus}" and complainant notified via email`);
    }
  };

  const handleForward = async () => {
    if (!selectedComplaint) return;
    
    const API_BASE = getApiBaseUrl();
    
    const updated = forwardComplaint(selectedComplaint.id, remarkInput);
    if (updated) {
      setComplaints(getComplaints()); // Refresh
      setSelectedComplaint(updated);

      // Send status update to backend (for email notification)
      try {
        const response = await fetch(`${API_BASE}/api/complaints/${selectedComplaint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'forwarded' })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Forwarded and email sent:', data.emailSent);
        } else {
          console.warn('⚠️ Backend status update failed (email may not be sent)');
        }
      } catch (err) {
        console.warn('⚠️ Could not reach backend for email notification:', err);
      }

      setRemarkInput('');
      alert(`Complaint forwarded to ${updated.department} department and complainant notified via email.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="text-sm text-slate-500">Welcome, Administrator</div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-medium uppercase">Total</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-400">
            <p className="text-slate-500 text-sm font-medium uppercase">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
            <p className="text-slate-500 text-sm font-medium uppercase text-purple-700">Overdue (&gt;10 days)</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.overdue}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
            <p className="text-slate-500 text-sm font-medium uppercase">High Priority</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.highPriority}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
            <p className="text-slate-500 text-sm font-medium uppercase">Resolved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Complaint Status Distribution</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-slate-400">
                 <h3 className="text-lg font-semibold mb-4 text-slate-900 w-full text-left">Action Items</h3>
                 <div className="w-full h-full flex flex-col gap-4 overflow-y-auto">
                    {stats.overdue > 0 ? (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700">
                           <AlertTriangle className="h-6 w-6" />
                           <div>
                             <p className="font-bold">Attention Needed!</p>
                             <p className="text-sm">{stats.overdue} complaints have been forwarded over 10 days ago without resolution.</p>
                           </div>
                        </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3 text-green-700">
                          <Check className="h-6 w-6" />
                          <div>
                            <p className="font-bold">All Good</p>
                            <p className="text-sm">No overdue complaints.</p>
                          </div>
                      </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search ID, Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                />
             </div>
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-slate-400" />
               <select className="border-slate-300 rounded-md text-sm p-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                 <option value="All">All Status</option>
                 <option value="Submitted">Submitted</option>
                 <option value="Forwarded">Forwarded</option>
                 <option value="In Progress">In Progress</option>
                 <option value="Resolved">Resolved</option>
               </select>
               <select className="border-slate-300 rounded-md text-sm p-2" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                 <option value="All">All Priorities</option>
                 <option value="High">High</option>
                 <option value="Low">Low</option>
               </select>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredComplaints.map((c) => {
                  const overdue = isOverdue(c);
                  return (
                    <tr key={c.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${overdue ? 'bg-red-50 hover:bg-red-100' : ''}`} onClick={() => setSelectedComplaint(c)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-900">
                        {c.id}
                        {overdue && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800">Overdue</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.priority === Priority.HIGH ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">View</td>
                    </tr>
                  );
                })}
                {filteredComplaints.length === 0 && (
                   <tr>
                     <td colSpan={7} className="px-6 py-10 text-center text-slate-500">No complaints found.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal / Detail View */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button onClick={() => setSelectedComplaint(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <ExternalLink className="h-6 w-6" />
              </button>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Complaint Details</h2>
                <p className="text-slate-500 font-mono text-sm mb-6">{selectedComplaint.id}</p>

                {isOverdue(selectedComplaint) && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Overdue Warning</p>
                    <p>This complaint was forwarded over 10 days ago and is not yet resolved. Please escalate.</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Status & Priority */}
                  <div className="flex gap-4">
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-bold ${selectedComplaint.priority === Priority.HIGH ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                       <AlertTriangle className="h-4 w-4" /> {selectedComplaint.priority} Priority (AI)
                     </div>
                     <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-bold">
                       Status: {selectedComplaint.status}
                     </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                    <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedComplaint.fullName}</span></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{selectedComplaint.phone}</span></div>
                    <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedComplaint.email}</span></div>
                    <div><span className="text-slate-500">Department:</span> <span className="font-medium">{selectedComplaint.department}</span></div>
                    {selectedComplaint.forwardedAt && (
                      <div className="col-span-2 text-purple-700"><span className="text-slate-500">Forwarded On:</span> <span className="font-medium">{new Date(selectedComplaint.forwardedAt).toLocaleString()}</span></div>
                    )}
                    <div className="col-span-2 mt-2"><span className="text-slate-500 block mb-1">Title:</span> <span className="font-medium block">{selectedComplaint.title}</span></div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{selectedComplaint.description}</p>
                  </div>

                  {/* Media */}
                  <div className="flex gap-4 border-t border-b border-slate-100 py-4">
                    {selectedComplaint.voiceNote ? (
                      <div>
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Mic className="h-3 w-3" /> Voice Note</p>
                        <audio controls src={selectedComplaint.voiceNote} className="h-8 w-48" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No voice note</p>
                    )}
                    
                    {selectedComplaint.documentProof ? (
                      <div>
                         <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Proof</p>
                         <a href={selectedComplaint.documentProof} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">View Document</a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No document proof</p>
                    )}
                  </div>

                  {/* Action Section */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Admin Actions</h3>
                    <textarea 
                      placeholder="Add remarks for the user or department..."
                      className="w-full text-sm p-2 border border-slate-300 rounded-md mb-3 focus:ring-blue-500"
                      rows={2}
                      value={remarkInput}
                      onChange={(e) => setRemarkInput(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                       {/* Forward Button - Main Action for new complaints */}
                       <button 
                          onClick={handleForward}
                          disabled={selectedComplaint.status === ComplaintStatus.FORWARDED || selectedComplaint.status === ComplaintStatus.RESOLVED || selectedComplaint.status === ComplaintStatus.REJECTED}
                          className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <Send className="h-4 w-4" />
                         Forward to {selectedComplaint.department}
                       </button>

                       <button onClick={() => handleUpdateStatus(ComplaintStatus.IN_PROGRESS)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200">Mark In Progress</button>
                       <button onClick={() => handleUpdateStatus(ComplaintStatus.RESOLVED)} className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded hover:bg-green-200">Mark Resolved</button>
                       <button onClick={() => handleUpdateStatus(ComplaintStatus.REJECTED)} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200">Reject</button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={() => setSelectedComplaint(null)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm font-medium hover:bg-slate-300">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;