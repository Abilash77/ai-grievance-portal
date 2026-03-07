import React, { useState, useRef } from 'react';
import { Mic, Square, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import { saveComplaint } from '../services/storageService';
import { predictPriority } from '../services/geminiService';
import { lodgeComplaint as submitComplaintToBackend } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
  'Electricity', 'Water Supply', 'Municipal/Corporation', 'Health', 
  'Transport', 'Police', 'Education', 'Social Welfare', 'Revenue', 
  'Other'
];

const CATEGORIES = [
  'Service Issue', 'Infrastructure', 'Harassment/Misconduct', 
  'Safety Hazard', 'Sanitation', 'Delay', 'Other'
];

const LodgeComplaint: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '',
    department: DEPARTMENTS[0], category: CATEGORIES[0],
    title: '', description: '', otherDepartment: ''
  });
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{id: string, priority: string} | null>(null);

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Could not access microphone. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Try to predict priority, but don't fail if API is unavailable
      let priority = 'Medium';
      try {
        priority = await predictPriority(formData.title, formData.description, formData.department);
      } catch (err) {
        console.warn('⚠️ Gemini API unavailable, using default priority:', err);
        // Continue with default priority
      }

      // 2. Send to Backend API (for email notifications)
      const backendResponse = await submitComplaintToBackend({
        name: formData.fullName,
        email: formData.email,
        subject: formData.title,
        description: formData.description
      });

      // 3. Process Files (Convert to Base64 mock)
      let voiceUrl = '';
      if (voiceBlob) {
        // In real app, upload to S3/Cloudinary
        voiceUrl = URL.createObjectURL(voiceBlob); 
      }
      
      let proofUrl = '';
      if (proofFile) {
        proofUrl = URL.createObjectURL(proofFile);
      }

      // 4. Save to localStorage too
      const finalDepartment = formData.department === 'Other' ? formData.otherDepartment : formData.department;
      
      const complaint = saveComplaint({
        ...formData,
        department: finalDepartment,
        priority: priority,
        voiceNote: voiceUrl,
        documentProof: proofUrl,
        userId: 'guest', // Demo user
      });

      setSubmitResult({ id: backendResponse._id || complaint.id, priority: complaint.priority });
    } catch (error) {
      console.error('Error:', error);
      alert("Error submitting complaint. Please try again. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <UploadCloud className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Complaint Submitted!</h2>
          <p className="text-slate-600 mb-6">Your grievance has been successfully lodged.</p>
          
          <div className="bg-slate-50 p-4 rounded-md mb-6 inline-block text-left">
            <p className="text-sm text-slate-500">Tracking Number:</p>
            <p className="text-2xl font-mono font-bold text-slate-900">{submitResult.id}</p>
            <p className="text-sm text-slate-500 mt-2">Predicted Priority:</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              submitResult.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {submitResult.priority}
            </span>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/track')} className="text-blue-600 font-medium hover:underline">
              Track Status
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={() => navigate('/')} className="text-slate-600 font-medium hover:underline">
              Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lodge a Complaint</h1>
        <p className="mt-2 text-slate-600">Please provide detailed information to help us resolve your issue faster.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name *</label>
            <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone Number *</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Email Address *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Address (Optional)</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Complaint Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Department *</label>
            <select name="department" value={formData.department} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {formData.department === 'Other' && (
              <input type="text" name="otherDepartment" placeholder="Specify Department" value={formData.otherDepartment} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-slate-300 shadow-sm border p-2 text-sm" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Complaint Title *</label>
            <input required type="text" name="title" placeholder="e.g. Broken street light in Sector 5" value={formData.title} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Detailed Description *</label>
            <textarea required rows={4} name="description" placeholder="Describe the issue in detail..." value={formData.description} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* Media Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Voice Note */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Record Voice Note (Optional)</label>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors">
                  <Mic className="h-4 w-4" /> Record
                </button>
              ) : (
                <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full animate-pulse">
                  <Square className="h-4 w-4 fill-current" /> Stop
                </button>
              )}
              {voiceBlob && <span className="text-xs text-green-600 font-medium">Audio Captured</span>}
            </div>
            {voiceBlob && (
              <audio controls src={URL.createObjectURL(voiceBlob)} className="mt-3 h-8 w-full" />
            )}
          </div>

          {/* Image/File Upload */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Proof (Image/PDF)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {proofFile ? (
                     <div className="flex items-center gap-2 text-green-600">
                       <ImageIcon className="h-6 w-6" />
                       <p className="text-sm truncate max-w-[150px]">{proofFile.name}</p>
                     </div>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500">Click to upload</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting & Analyzing Priority...' : 'Submit Complaint'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default LodgeComplaint;