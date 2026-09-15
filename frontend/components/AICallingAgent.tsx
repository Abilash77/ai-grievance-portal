/**
 * AICallingAgent.tsx — ElevenLabs Conversational AI Integration
 *
 * Full-duplex real-time voice call powered by ElevenLabs Conversational AI.
 * The agent speaks, listens, and responds exactly like a live phone agent.
 *
 * Setup:
 *   1. Go to https://elevenlabs.io/app/conversational-ai
 *   2. Create a new agent with the GrievAI system prompt
 *   3. Set VITE_ELEVENLABS_AGENT_ID in your .env file
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  useConversation,
} from '@elevenlabs/react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  CheckCircle,
  Wifi,
  Activity,
  AlertTriangle,
  Loader2,
  Radio,
  Database,
} from 'lucide-react';
import { getElevenLabsAgentId } from '../services/config';
import { lodgeComplaint } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Time-based greeting helper
// ─────────────────────────────────────────────────────────────────────────────

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

// ─────────────────────────────────────────────────────────────────────────────
// AURA — System Prompt (injected at call start via ElevenLabs override)
// ─────────────────────────────────────────────────────────────────────────────

const AURA_SYSTEM_PROMPT = `# Personality
You are Priya, a professional and empathetic government grievance helpline agent for the JanSuvidha Grievance Redressal Portal. You are here to assist citizens with their complaints, providing clear guidance and support. You are warm, patient, and always maintain a professional demeanor.

# Environment
You are assisting a citizen over a voice call to the JanSuvidha Grievance Redressal Portal helpline. The citizen may be seeking to register a new complaint, check the status of an existing one, or understand the grievance redressal process. They might be feeling frustrated or confused, so your clear and empathetic communication is crucial.

# Tone
Your responses are warm, empathetic, and professional, generally concise at 2-3 sentences to keep the conversation flowing smoothly over a voice call. You speak with a measured pace, using brief pauses [pauses] and occasional filler words like "um" or "well" to sound natural. You only ask one question at a time and always end your turn with a clear follow-up question or a next step to guide the citizen. You use punctuation strategically for clarity in spoken instructions and optimize for natural pronunciation.

# Goal
Your primary goal is to efficiently guide citizens through their needs related to the JanSuvidha Grievance Redressal Portal, ensuring they receive accurate information and assistance. This involves:

1. Initial Needs Assessment:
   - Identify if the citizen wants to register a new complaint, check an existing status, or understand the process.
   - Gather necessary preliminary information based on their request.

2. Complaint Registration Assistance (if applicable):
   - Guide the citizen step-by-step through the required information for registering a new complaint.
   - Ensure all mandatory fields are covered (e.g., citizen details, nature of grievance, department involved).
   - Confirm successful registration and provide the complaint ID.

3. Status Check Assistance (if applicable):
   - Politely request the complaint ID or other identifying details (e.g., citizen name, contact number).
   - Provide the current status of their complaint and explain what it means.
   - Offer information on next steps or expected timelines.

4. Process Understanding and Guidance (if applicable):
   - Clearly explain any part of the grievance redressal process the citizen has questions about.
   - Provide guidance on how to escalate, provide additional documents, or appeal a decision.
   - Ensure the citizen understands their options and the portal functionalities.

Always confirm the citizen's understanding before moving to the next step. If the citizen expresses frustration, acknowledge their feelings [empathetic] before refocusing on the solution.

Success is measured by the citizen's ability to successfully complete their task (register, check status, or understand the process) and their satisfaction with the assistance provided.

# Guardrails
Remain strictly within the scope of the JanSuvidha Grievance Redressal Portal and its services. Do not provide legal advice, personal opinions, or engage in discussions about political matters or issues outside the portal's jurisdiction. If a citizen asks for information or assistance beyond your capabilities, politely state your limitation and suggest where they might find appropriate help. Handle all personal information with the utmost confidentiality and only ask for details strictly necessary for their request. Maintain a professional and respectful tone at all times, even if the citizen becomes agitated.`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'info' | 'error' | 'warning';
interface Toast { id: number; message: string; type: ToastType }

// ElevenLabs mode reported by the SDK
type ConvMode = 'speaking' | 'listening' | 'inactive';
// ElevenLabs connection status
type ConvStatus = 'connected' | 'connecting' | 'disconnected';

// ─────────────────────────────────────────────────────────────────────────────
// Toast system
// ─────────────────────────────────────────────────────────────────────────────

const ToastContainer: React.FC<{
  toasts: Toast[];
  remove: (id: number) => void;
}> = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{ animation: 'slideIn 0.3s ease-out' }}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white ${
          t.type === 'success'  ? 'bg-green-600' :
          t.type === 'error'   ? 'bg-red-600'   :
          t.type === 'warning' ? 'bg-amber-600'  :
                                  'bg-blue-600'
        }`}
      >
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated agent avatar orb
// ─────────────────────────────────────────────────────────────────────────────

const AvatarOrb: React.FC<{
  mode: ConvMode;
  status: ConvStatus;
  size?: 'sm' | 'lg';
}> = ({ mode, status, size = 'lg' }) => {
  const dim    = size === 'lg' ? 'w-24 h-24' : 'w-14 h-14';
  const active = status === 'connected' && mode !== 'inactive';
  const px     = size === 'lg' ? { r1: 120, r2: 148 } : { r1: 70, r2: 86 };

  // Ring colour: orange when agent speaks, blue when agent listens
  const ringColor = mode === 'speaking' ? '#f97316' : '#3b82f6';

  return (
    <div className={`relative flex items-center justify-center ${dim}`}>
      {/* Pulse rings — only when active */}
      {active && (
        <>
          <span
            className="absolute rounded-full opacity-25"
            style={{
              width: px.r1, height: px.r1,
              background: ringColor,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
          <span
            className="absolute rounded-full opacity-15"
            style={{
              width: px.r2, height: px.r2,
              background: ringColor,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.35s',
            }}
          />
        </>
      )}

      {/* Spinning conic gradient ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg,#f97316,#3b82f6,#8b5cf6,#f97316)',
          animation: 'spin 3s linear infinite',
          padding: 2,
        }}
      />

      {/* Core */}
      <div
        className={`relative ${dim} rounded-full flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900`}
        style={{ zIndex: 1 }}
      >
        {size === 'lg' ? (
          <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
            <circle cx="24" cy="24" r="20" fill="#1e293b" />
            {/* Eyes */}
            <circle cx="18" cy="20" r="3" fill="#f97316" opacity={active ? 1 : 0.5} />
            <circle cx="30" cy="20" r="3" fill="#f97316" opacity={active ? 1 : 0.5} />
            {/* Smile */}
            <path d="M16 30 Q24 36 32 30" stroke="#f97316" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Sound waves — only when speaking */}
            {mode === 'speaking' && <>
              <path d="M6 22 Q4 24 6 26"  stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M3 19 Q0 24 3 29"  stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M42 22 Q44 24 42 26" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M45 19 Q48 24 45 29" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </>}
            {/* Ear arcs — only when listening */}
            {mode === 'listening' && <>
              <path d="M6 22 Q4 24 6 26"  stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M42 22 Q44 24 42 26" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </>}
          </svg>
        ) : (
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
            <circle cx="16" cy="16" r="14" fill="#1e293b" />
            <circle cx="12" cy="13" r="2" fill="#f97316" />
            <circle cx="20" cy="13" r="2" fill="#f97316" />
            <path d="M10 20 Q16 24 22 20" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated waveform bars
// ─────────────────────────────────────────────────────────────────────────────

const Waveform: React.FC<{ mode: ConvMode; status: ConvStatus }> = ({ mode, status }) => {
  const active = status === 'connected' && mode !== 'inactive';
  const color  = mode === 'speaking' ? '#f97316' : '#3b82f6';

  return (
    <div className="flex items-end gap-[2px] h-10 w-full justify-center">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: active ? `${color}${Math.floor(180 + (i % 4) * 20).toString(16)}` : 'rgba(148,163,184,0.12)',
            minHeight: '3px',
            animation: active
              ? `waveBar ${0.18 + (i % 8) * 0.06}s ease-in-out infinite alternate`
              : 'none',
            animationDelay: `${(i * 30) % 400}ms`,
          }}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Status label
// ─────────────────────────────────────────────────────────────────────────────

const StatusLabel: React.FC<{ mode: ConvMode; status: ConvStatus }> = ({ mode, status }) => {
  if (status === 'connecting') return (
    <span className="text-yellow-400 text-sm font-semibold flex items-center gap-1.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting…
    </span>
  );
  if (status === 'disconnected') return (
    <span className="text-slate-400 text-sm font-semibold">Call Ended</span>
  );
  // connected
  if (mode === 'speaking') return (
    <span className="text-orange-400 text-sm font-semibold flex items-center gap-1.5">
      <Radio className="h-3.5 w-3.5 animate-pulse" /> Agent Speaking
    </span>
  );
  if (mode === 'listening') return (
    <span className="text-blue-400 text-sm font-semibold flex items-center gap-1.5">
      <Mic className="h-3.5 w-3.5 animate-pulse" /> Listening… speak now
    </span>
  );
  return (
    <span className="text-green-400 text-sm font-semibold flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" /> AI Agent Online
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// No Agent ID warning card
// ─────────────────────────────────────────────────────────────────────────────

const NoAgentWarning: React.FC = () => (
  <div
    className="w-full rounded-xl p-4 flex flex-col gap-2 text-sm"
    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
  >
    <div className="flex items-center gap-2 text-amber-400 font-bold">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      ElevenLabs Agent Not Configured
    </div>
    <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside leading-relaxed">
      <li>Go to <span className="text-amber-300">elevenlabs.io/app/conversational-ai</span></li>
      <li>Create a new Conversational AI agent</li>
      <li>Copy the <strong className="text-white">Agent ID</strong></li>
      <li>Add to your <code className="text-green-400 bg-slate-800 px-1 rounded">.env</code> file:</li>
    </ol>
    <pre className="text-green-400 bg-slate-900 text-xs rounded-lg p-2 mt-1 overflow-x-auto select-all">
      VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
    </pre>
    <p className="text-slate-500 text-[11px]">Restart the dev server after adding the key.</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Call timer hook
// ─────────────────────────────────────────────────────────────────────────────

function useCallTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return fmt(elapsed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Call Modal — the live call UI
// ─────────────────────────────────────────────────────────────────────────────

const CallModal: React.FC<{
  isOpen: boolean;
  agentId: string;
  onClose: () => void;
  addToast: (msg: string, type: ToastType) => void;
}> = ({ isOpen, agentId, onClose, addToast }) => {
  const [muted,       setMuted]       = useState(false);
  const [dbSaved,     setDbSaved]     = useState(false);
  const [callStarted, setCallStarted] = useState<Date | null>(null);

  // Accumulate transcript messages to use as description
  const transcriptRef = useRef<string[]>([]);

  // ── ElevenLabs Conversational AI hook ──
  const conversation = useConversation({
    onConnect: () => {
      // NOTE: greeting is handled via useEffect below (avoids stale closure)
    },
    onDisconnect: async () => {
      // ── Save voice call session to database ──
      const callEndTime = new Date();
      const durationSec = callStarted
        ? Math.round((callEndTime.getTime() - callStarted.getTime()) / 1000)
        : 0;

      const transcriptSummary = transcriptRef.current.length > 0
        ? transcriptRef.current.slice(-10).join(' | ')
        : 'Voice call session via AURA AI Agent';

      try {
        await lodgeComplaint({
          name:             'Voice Call User',
          email:            'voice-call@jansuvidha.gov.in',
          subject:          `Voice Call Session — ${callEndTime.toLocaleString()}`,
          description:      transcriptSummary,
          department:       'Other',
          category:         'Service Issue',
          priority:         'Medium',
          submissionMethod: 'voice_call',
          voiceNote:        '',
          documentProof:    '',
          callDuration:     durationSec,
        });
        setDbSaved(true);
        addToast(`Call ended (${durationSec}s). Session saved to database. Thank you!`, 'success');
      } catch (err) {
        console.warn('⚠️ Could not save call session to DB:', err);
        addToast('Call ended. Thank you for contacting GrievAI!', 'info');
      }

      onClose();
    },
    onMessage: (message: { message?: string; source?: string }) => {
      // Capture transcript messages for the DB record
      if (message?.message) {
        transcriptRef.current.push(
          `[${message.source === 'user' ? 'User' : 'AURA'}] ${message.message}`
        );
      }
    },
    onError: (error: string | Error) => {
      const msg = typeof error === 'string' ? error : error?.message ?? 'Unknown error';
      console.error('ElevenLabs error:', msg);
      addToast(`Voice agent error: ${msg}`, 'error');
    },
  });

  const status: ConvStatus = (conversation.status as ConvStatus) ?? 'disconnected';
  const mode: ConvMode     = (conversation.isSpeaking ? 'speaking' :
                               status === 'connected'  ? 'listening' : 'inactive') as ConvMode;

  const timer = useCallTimer(status === 'connected');

  // ── Show time-based greeting toast when call connects ──
  const prevStatusRef = useRef<string>('disconnected');
  useEffect(() => {
    if (prevStatusRef.current !== 'connected' && status === 'connected') {
      setCallStarted(new Date());
      addToast(`${getTimeGreeting()}! AURA is connected and ready to assist you.`, 'success');
    }
    prevStatusRef.current = status;
  }, [status, addToast]);

  // ── Start session when modal opens ──
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    transcriptRef.current = [];
    setDbSaved(false);

    const startCall = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        await conversation.startSession({ agentId });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
          addToast('Microphone permission denied. Please allow access and try again.', 'error');
        } else {
          addToast(`Could not start call: ${msg}`, 'error');
        }
        onClose();
      }
    };

    startCall();

    return () => {
      cancelled = true;
      conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agentId]);

  // ── Mute toggle ──
  const handleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    try {
      await conversation.setVolume({ volume: next ? 0 : 1 });
    } catch {
      // setVolume may not be available in all SDK versions — graceful no-op
    }
  }, [muted, conversation]);

  const handleEndCall = () => {
    conversation.endSession();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(140deg,rgba(15,23,42,0.99),rgba(30,41,59,0.99))',
          border: '1px solid rgba(249,115,22,0.3)',
        }}
      >
        {/* Top gradient accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg,#f97316,#3b82f6,#8b5cf6)' }}
        />

        <div className="p-6 flex flex-col items-center gap-5">

          {/* ── Header row ── */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {status === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Live Call</span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-yellow-400 animate-spin" />
                  <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">Connecting</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Ended</span>
                </>
              )}
            </div>
            <button onClick={handleEndCall} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── Avatar ── */}
          <AvatarOrb mode={mode} status={status} size="lg" />

          {/* ── Agent name + live status ── */}
          <div className="text-center space-y-1.5">
            <h3 className="text-white text-xl font-bold">AURA</h3>
            <p className="text-slate-400 text-xs">AI Voice Agent · Government Grievance Assistant</p>
            <StatusLabel mode={mode} status={status} />
          </div>

          {/* ── Timer ── */}
          <div
            className="px-6 py-2 rounded-full text-orange-400 font-mono text-2xl font-bold tracking-widest"
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            {timer}
          </div>

          {/* ── Waveform ── */}
          <Waveform mode={mode} status={status} />

          {/* ── Info strip ── */}
          <div
            className="w-full rounded-xl px-4 py-3 text-center text-xs"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {mode === 'speaking' && (
              <p className="text-orange-300">🔊 Agent is speaking — please wait…</p>
            )}
            {mode === 'listening' && (
              <p className="text-blue-300">🎤 Your turn — speak your complaint or question</p>
            )}
            {mode === 'inactive' && status === 'connecting' && (
              <p className="text-slate-400">Establishing secure voice connection…</p>
            )}
            {status === 'disconnected' && (
              <p className="text-slate-500">The call has ended</p>
            )}
          </div>

          {/* ── Control buttons ── */}
          <div className="flex items-center gap-6">
            {/* Mute mic */}
            <button
              onClick={handleMute}
              title={muted ? 'Unmute microphone' : 'Mute microphone'}
              className={`p-4 rounded-full transition-all border ${
                muted
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 hover:text-white border-slate-600'
              }`}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* End Call — red center button */}
            <button
              onClick={handleEndCall}
              title="End call"
              className="p-5 rounded-full text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                boxShadow: '0 0 28px rgba(239,68,68,0.5)',
              }}
            >
              <PhoneOff className="h-7 w-7" />
            </button>

            {/* Speaker placeholder (ElevenLabs handles output natively) */}
            <button
              title="Speaker (managed by ElevenLabs)"
              className="p-4 rounded-full transition-all border bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 hover:text-white border-slate-600"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* DB Save indicator */}
          {dbSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold text-emerald-700"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Database className="h-3 w-3" />
              Call session saved to database
            </div>
          )}

          <p className="text-slate-600 text-[11px] text-center leading-relaxed">
            Powered by ElevenLabs Conversational AI · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature Pill
// ─────────────────────────────────────────────────────────────────────────────

const FeaturePill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div
    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300"
    style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <span className="text-orange-400">{icon}</span>
    {label}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Root component — floating bottom-left widget
// ─────────────────────────────────────────────────────────────────────────────

const AICallingAgent: React.FC = () => {
  const [expanded,   setExpanded]   = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const agentId = getElevenLabsAgentId();

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleStartCall = useCallback(() => {
    if (!agentId) {
      addToast('ElevenLabs Agent ID not configured. See console for setup instructions.', 'warning');
      return;
    }
    setExpanded(false);
    setCallActive(true);
  }, [agentId, addToast]);

  const handleCloseCall = useCallback(() => {
    setCallActive(false);
  }, []);

  return (
    <>
      {/* ── Toast layer ── */}
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* ── Live Call Modal ── */}
      {callActive && agentId && (
        <CallModal
          isOpen={callActive}
          agentId={agentId}
          onClose={handleCloseCall}
          addToast={addToast}
        />
      )}

      {/* ── Floating widget — bottom-left ── */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">

        {/* Expanded info card */}
        {expanded && (
          <div
            className="mb-4 w-72 sm:w-80 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(145deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97))',
              border: '1px solid rgba(249,115,22,0.25)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Gradient top bar */}
            <div
              className="h-0.5 w-full"
              style={{ background: 'linear-gradient(90deg,#f97316,#3b82f6,#8b5cf6)' }}
            />

            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AvatarOrb mode="inactive" status="disconnected" size="sm" />
                <div>
                  <h3 className="text-white text-sm font-bold">AI Calling Agent</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {agentId ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-medium">Online · ElevenLabs</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">Setup Required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <div className="px-4 pb-2">
              <p className="text-slate-400 text-xs leading-relaxed">
                Experience a real-time AI phone call. Speak naturally — AURA listens, understands,
                and responds with a professional voice, just like calling a government helpline.
              </p>
            </div>

            {/* Agent not configured warning */}
            {!agentId && (
              <div className="px-4 pb-3">
                <NoAgentWarning />
              </div>
            )}

            {/* Feature pills */}
            {agentId && (
              <div className="px-4 py-3 flex flex-wrap gap-2">
                <FeaturePill icon={<Activity    className="h-3 w-3" />} label="Complaint Status" />
                <FeaturePill icon={<Mic         className="h-3 w-3" />} label="Voice Filing" />
                <FeaturePill icon={<Wifi        className="h-3 w-3" />} label="Real-Time Voice" />
                <FeaturePill icon={<CheckCircle className="h-3 w-3" />} label="AI Guidance" />
                <FeaturePill icon={<Phone       className="h-3 w-3" />} label="24×7 Available" />
                <FeaturePill icon={<VolumeX     className="h-3 w-3" />} label="No Hold Music" />
              </div>
            )}

            {/* CTA */}
            <div className="px-4 pb-5 pt-1">
              <button
                onClick={handleStartCall}
                disabled={!agentId}
                className={`group w-full relative flex items-center justify-center gap-3 py-3 px-5 rounded-xl text-white text-sm font-bold overflow-hidden transition-all ${
                  agentId
                    ? 'hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  background: 'linear-gradient(135deg,#f97316,#ea580c)',
                  boxShadow: agentId ? '0 0 20px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                {agentId && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
                <Phone className="h-4 w-4" />
                📞 Call AI Agent
                <Mic className="h-4 w-4 opacity-70" />
              </button>
              <p className="text-slate-500 text-[10px] text-center mt-2">
                Requires microphone · Works in Chrome &amp; Edge
              </p>
            </div>
          </div>
        )}

        {/* ── Floating trigger button ── */}
        <div className="relative">
          {/* Pulse ring — only when idle */}
          {!expanded && !callActive && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: 'rgba(249,115,22,0.4)',
                animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            aria-label="Open AI Calling Agent"
            title="AI Calling Agent — powered by ElevenLabs"
            className="relative p-4 rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: expanded
                ? 'linear-gradient(135deg,#64748b,#475569)'
                : 'linear-gradient(135deg,#f97316,#ea580c)',
              boxShadow: expanded
                ? '0 4px 16px rgba(0,0,0,0.3)'
                : '0 0 28px rgba(249,115,22,0.5)',
            }}
          >
            {expanded ? <X className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Global keyframe styles ── */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes waveBar {
          from { height: 3px;  }
          to   { height: 32px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AICallingAgent;
