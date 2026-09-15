import React, { useState, useRef, useCallback } from 'react';
import {
  Mic, Square, Image as ImageIcon, UploadCloud, AlertCircle,
  Sparkles, RotateCcw, CheckCircle, ShieldCheck, ShieldAlert,
  ShieldX, Loader2, Info,
} from 'lucide-react';
import { saveComplaint } from '../services/storageService';
import { predictPriority, enhanceComplaintDescription } from '../services/geminiService';
import { lodgeComplaint as submitComplaintToBackend, detectFakeComplaint, FakeDetectionResult } from '../services/api';
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convert Blob to base64 string
// ─────────────────────────────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Complaint Enhancer Button
// ─────────────────────────────────────────────────────────────────────────────
interface EnhancerProps {
  isEnhancing: boolean;
  enhanced:    boolean;
  disabled:    boolean;
  onEnhance:   () => void;
  onRevert:    () => void;
}

const AIEnhancerButton: React.FC<EnhancerProps> = ({
  isEnhancing, enhanced, disabled, onEnhance, onRevert,
}) => (
  <div className="flex items-center gap-2 flex-wrap">
    <button
      type="button"
      onClick={onEnhance}
      disabled={disabled || isEnhancing}
      className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        background: isEnhancing || disabled
          ? 'rgba(139,92,246,0.15)'
          : 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))',
        border: '1px solid rgba(139,92,246,0.5)',
        color: disabled && !isEnhancing ? 'rgba(139,92,246,0.4)' : '#fff',
        boxShadow: !disabled && !isEnhancing
          ? '0 0 12px rgba(139,92,246,0.35), 0 0 24px rgba(139,92,246,0.15)'
          : 'none',
      }}
    >
      {!disabled && !isEnhancing && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      )}
      {isEnhancing ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <span className="text-purple-200">Enhancing with AI…</span>
        </>
      ) : enhanced ? (
        <><CheckCircle className="h-3.5 w-3.5 text-green-300" /><span>Enhanced ✓</span></>
      ) : (
        <><Sparkles className="h-3.5 w-3.5" /><span>✨ Enhance with AI</span></>
      )}
    </button>

    {enhanced && (
      <button
        type="button"
        onClick={onRevert}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all border border-slate-200"
        title="Revert to original description"
      >
        <RotateCcw className="h-3 w-3" /> Revert
      </button>
    )}

    <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 font-medium tracking-wide">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      Powered by AI
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AI Fake Detection Badge
// ─────────────────────────────────────────────────────────────────────────────
type DetectionState = 'idle' | 'checking' | 'done' | 'error';

interface FakeDetectionBadgeProps {
  state:  DetectionState;
  result: FakeDetectionResult | null;
  error:  string;
  onCheck: () => void;
  canCheck: boolean;
}

const FakeDetectionBadge: React.FC<FakeDetectionBadgeProps> = ({
  state, result, error, onCheck, canCheck,
}) => {
  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={onCheck}
        disabled={!canCheck}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canCheck
            ? 'linear-gradient(135deg, rgba(16,185,129,0.85), rgba(5,150,105,0.85))'
            : 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#fff',
          boxShadow: canCheck ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        🛡️ Verify Authenticity
      </button>
    );
  }

  if (state === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        AI is verifying authenticity…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50">
        <Info className="h-3.5 w-3.5" />
        {error || 'Verification failed'}
      </div>
    );
  }

  if (state === 'done' && result) {
    const verdict = result.verdict;
    const score   = result.score;

    if (verdict === 'genuine') {
      return (
        <div
          className="flex flex-col gap-1 w-full p-3 rounded-xl border"
          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-700 font-bold text-xs">✅ Verified Genuine</span>
            <span className="ml-auto text-[10px] text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded-full">
              Score: {score}/100
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">{result.reason}</p>
        </div>
      );
    }

    if (verdict === 'suspicious') {
      return (
        <div
          className="flex flex-col gap-1 w-full p-3 rounded-xl border"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.35)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700 font-bold text-xs">⚠️ Suspicious — Review Before Submitting</span>
            <span className="ml-auto text-[10px] text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-full">
              Score: {score}/100
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">{result.reason}</p>
          <p className="text-[10px] text-amber-600 pl-6 font-medium">You may still submit, but please add more specific details.</p>
        </div>
      );
    }

    // fake
    return (
      <div
        className="flex flex-col gap-1 w-full p-3 rounded-xl border"
        style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.35)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldX className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-red-700 font-bold text-xs">🚫 Likely Fake — Cannot Submit</span>
          <span className="ml-auto text-[10px] text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded-full">
            Score: {score}/100
          </span>
        </div>
        <p className="text-[11px] text-slate-500 pl-6">{result.reason}</p>
        <p className="text-[10px] text-red-600 pl-6 font-medium">Please provide a genuine, specific complaint with real details.</p>
      </div>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const LodgeComplaint: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '',
    department: DEPARTMENTS[0], category: CATEGORIES[0],
    title: '', description: '', otherDepartment: '',
  });

  const [voiceBlob,    setVoiceBlob]    = useState<Blob | null>(null);
  const [isRecording,  setIsRecording]  = useState(false);
  const [proofFile,    setProofFile]    = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ id: string; priority: string } | null>(null);

  // AI Enhancer state
  const [isEnhancing,  setIsEnhancing]  = useState(false);
  const [enhanced,     setEnhanced]     = useState(false);
  const [originalDesc, setOriginalDesc] = useState('');
  const [enhanceError, setEnhanceError] = useState('');

  // AI Fake Detection state
  const [detectionState,  setDetectionState]  = useState<DetectionState>('idle');
  const [detectionResult, setDetectionResult] = useState<FakeDetectionResult | null>(null);
  const [detectionError,  setDetectionError]  = useState('');

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'description' && enhanced) {
      setEnhanced(false);
      setOriginalDesc('');
    }
    setEnhanceError('');
    // Reset detection when content changes
    if (e.target.name === 'description' || e.target.name === 'title') {
      setDetectionState('idle');
      setDetectionResult(null);
    }
  };

  // ── AI Enhancer ───────────────────────────────────────────────────────────
  const handleEnhance = async () => {
    const raw = formData.description.trim();
    if (!raw) { setEnhanceError('Please enter a description first.'); return; }
    if (raw.length < 10) { setEnhanceError('Description is too short. Add a few more words.'); return; }

    setEnhanceError('');
    setOriginalDesc(raw);
    setIsEnhancing(true);

    try {
      const improved = await enhanceComplaintDescription(
        formData.title || 'Grievance Complaint',
        raw,
        formData.department,
        formData.category,
      );
      setFormData(prev => ({ ...prev, description: improved }));
      setEnhanced(true);
      // Reset detection after enhancement
      setDetectionState('idle');
      setDetectionResult(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enhancement failed.';
      if (msg.includes('API key')) {
        setEnhanceError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
      } else {
        setEnhanceError('AI enhancement failed. Please try again.');
      }
      setEnhanced(false);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRevert = () => {
    setFormData(prev => ({ ...prev, description: originalDesc }));
    setEnhanced(false);
    setOriginalDesc('');
    setEnhanceError('');
    setDetectionState('idle');
    setDetectionResult(null);
  };

  // ── Fake Detection ────────────────────────────────────────────────────────
  const handleDetectFake = useCallback(async () => {
    const title       = formData.title.trim();
    const description = formData.description.trim();
    if (!title || !description) return;

    setDetectionState('checking');
    setDetectionError('');

    try {
      const result = await detectFakeComplaint({
        title,
        description,
        department:   formData.department,
        category:     formData.category,
        hasVoiceNote: Boolean(voiceBlob),
        hasProof:     Boolean(proofFile),
      });
      setDetectionResult(result);
      setDetectionState('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setDetectionError(msg);
      setDetectionState('error');
    }
  }, [formData.title, formData.description, formData.department, formData.category, voiceBlob, proofFile]);

  // ── Audio Recording ───────────────────────────────────────────────────────
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
        stream.getTracks().forEach(t => t.stop());
        // Trigger detection re-check on new voice note
        setDetectionState('idle');
        setDetectionResult(null);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      alert('Could not access microphone. Please enable permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block fake complaints
    if (detectionResult?.verdict === 'fake') {
      alert('Your complaint has been flagged as potentially fake. Please provide genuine, specific details before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Priority prediction
      let priority = 'Medium';
      try {
        priority = await predictPriority(formData.title, formData.description, formData.department);
      } catch (err) {
        console.warn('⚠️ Priority prediction unavailable:', err);
      }

      // Convert voice note to base64 for DB storage
      let voiceNoteBase64 = '';
      if (voiceBlob) {
        try {
          voiceNoteBase64 = await blobToBase64(voiceBlob);
        } catch {
          console.warn('Could not encode voice note');
        }
      }

      const finalDepartment = formData.department === 'Other'
        ? formData.otherDepartment || 'Other'
        : formData.department;

      // Submit to backend — all fields saved to MongoDB
      const backendResponse = await submitComplaintToBackend({
        name:             formData.fullName,
        email:            formData.email,
        phone:            formData.phone,
        address:          formData.address,
        subject:          formData.title,
        description:      formData.description,
        department:       finalDepartment,
        category:         formData.category,
        priority,
        submissionMethod: 'web_form',
        voiceNote:        voiceNoteBase64,
        documentProof:    proofFile ? proofFile.name : '',
        callDuration:     0,
      });

      // Also save to localStorage for offline tracking
      const localVoiceUrl = voiceBlob ? URL.createObjectURL(voiceBlob) : '';
      const localProofUrl = proofFile ? URL.createObjectURL(proofFile) : '';

      const complaint = saveComplaint({
        ...formData,
        department: finalDepartment,
        priority,
        voiceNote:     localVoiceUrl,
        documentProof: localProofUrl,
        userId: 'guest',
      });

      setSubmitResult({
        id:       backendResponse._id || complaint.id,
        priority: backendResponse.priority || complaint.priority,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDetect = formData.title.trim().length > 3 && formData.description.trim().length >= 10;
  const isBlockedByFakeDetection = detectionResult?.verdict === 'fake';

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <UploadCloud className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Complaint Submitted!</h2>
          <p className="text-slate-600 mb-6">Your grievance has been successfully lodged and saved to the database.</p>

          <div className="bg-slate-50 p-4 rounded-md mb-6 inline-block text-left">
            <p className="text-sm text-slate-500">Tracking Number:</p>
            <p className="text-2xl font-mono font-bold text-slate-900">{submitResult.id}</p>
            <p className="text-sm text-slate-500 mt-2">Predicted Priority:</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              submitResult.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {submitResult.priority}
            </span>

            {detectionResult && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">AI Authenticity Verdict:</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  detectionResult.verdict === 'genuine'    ? 'bg-emerald-100 text-emerald-800' :
                  detectionResult.verdict === 'suspicious' ? 'bg-amber-100 text-amber-800'     :
                                                             'bg-red-100 text-red-800'
                }`}>
                  {detectionResult.verdict === 'genuine'    ? '✅ Genuine'    :
                   detectionResult.verdict === 'suspicious' ? '⚠️ Suspicious' : '🚫 Fake'}
                  &nbsp;(Score: {detectionResult.score}/100)
                </span>
              </div>
            )}
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

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lodge a Complaint</h1>
        <p className="mt-2 text-slate-600">
          Please provide detailed information to help us resolve your issue faster.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">

        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name *</label>
            <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone Number *</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Email Address *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Address (Optional)</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Complaint Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Department *</label>
            <select name="department" value={formData.department} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {formData.department === 'Other' && (
              <input type="text" name="otherDepartment" placeholder="Specify Department"
                value={formData.otherDepartment} onChange={handleInputChange}
                className="mt-2 block w-full rounded-md border-slate-300 shadow-sm border p-2 text-sm" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Complaint Title *</label>
            <input required type="text" name="title"
              placeholder="e.g. Broken street light in Sector 5"
              value={formData.title} onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          {/* Detailed Description + AI Enhancer */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <label className="block text-sm font-medium text-slate-700">Detailed Description *</label>
              <AIEnhancerButton
                isEnhancing={isEnhancing}
                enhanced={enhanced}
                disabled={!formData.description.trim() || formData.description.trim().length < 10}
                onEnhance={handleEnhance}
                onRevert={handleRevert}
              />
            </div>

            <div className="relative">
              <textarea
                required
                rows={5}
                name="description"
                placeholder="Describe the issue in detail… or type a brief summary and click ✨ Enhance with AI"
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full rounded-lg border p-3 text-sm focus:outline-none transition-all duration-300 resize-none"
                style={{
                  borderColor: isEnhancing
                    ? 'rgba(139,92,246,0.6)'
                    : enhanced
                    ? 'rgba(34,197,94,0.5)'
                    : '#cbd5e1',
                  boxShadow: isEnhancing
                    ? '0 0 0 3px rgba(139,92,246,0.15), 0 0 16px rgba(139,92,246,0.2)'
                    : enhanced
                    ? '0 0 0 3px rgba(34,197,94,0.1)'
                    : 'none',
                }}
              />

              {isEnhancing && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none"
                  style={{ background: 'rgba(139,92,246,0.04)' }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-purple-500"
                          style={{ animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                    <span className="text-xs text-purple-600 font-semibold bg-white/90 px-3 py-1 rounded-full shadow-sm">
                      Enhancing with AI…
                    </span>
                  </div>
                </div>
              )}

              {enhanced && !isEnhancing && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-green-700"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <CheckCircle className="h-3 w-3" />
                  AI Enhanced
                </div>
              )}
            </div>

            {enhanceError && (
              <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{enhanceError}</span>
              </div>
            )}

            {!enhanced && !isEnhancing && !enhanceError && (
              <p className="mt-1.5 text-xs text-slate-400">
                💡 Tip: Enter a short description and click <strong className="text-purple-500">✨ Enhance with AI</strong> to auto-generate a formal, detailed complaint.
              </p>
            )}
          </div>
        </div>

        {/* ── AI Fake Detection Panel ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">🛡️ AI Authenticity Check</p>
              <p className="text-xs text-slate-400">Our AI scans your complaint for spam or fake content before submission.</p>
            </div>
            <FakeDetectionBadge
              state={detectionState}
              result={detectionResult}
              error={detectionError}
              onCheck={handleDetectFake}
              canCheck={canDetect}
            />
          </div>

          {/* Full-width result card */}
          {detectionState === 'done' && detectionResult && (
            <FakeDetectionBadge
              state="done"
              result={detectionResult}
              error=""
              onCheck={handleDetectFake}
              canCheck={canDetect}
            />
          )}
        </div>

        {/* Media Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Voice Note */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Record Voice Note (Optional)
            </label>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button type="button" onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors">
                  <Mic className="h-4 w-4" /> Record
                </button>
              ) : (
                <button type="button" onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full animate-pulse">
                  <Square className="h-4 w-4 fill-current" /> Stop
                </button>
              )}
              {voiceBlob && <span className="text-xs text-green-600 font-medium">✅ Audio Captured — will be saved to DB</span>}
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
                <input type="file" className="hidden" accept="image/*,.pdf"
                  onChange={(e) => {
                    setProofFile(e.target.files?.[0] || null);
                    setDetectionState('idle');
                    setDetectionResult(null);
                  }} />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isBlockedByFakeDetection}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isBlockedByFakeDetection
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting
              ? 'Submitting & Saving to Database…'
              : isBlockedByFakeDetection
              ? '🚫 Submission Blocked — Complaint Flagged as Fake'
              : 'Submit Complaint'}
          </button>
          {isBlockedByFakeDetection && (
            <p className="mt-2 text-xs text-center text-red-600">
              Please revise your complaint with genuine, specific details and run the authenticity check again.
            </p>
          )}
        </div>

      </form>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0);    opacity: 0.6; }
          50%       { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
};

export default LodgeComplaint;