import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  ShieldCheck,
  ArrowRight,
  Phone,
  MessageSquare,
  Mic,
  Activity,
  Wifi,
  CheckCircle,
} from 'lucide-react';

// ── Small feature pill used inside the AI section ──
const AIPill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div
    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300"
    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
  >
    <span className="text-orange-400">{icon}</span>
    {label}
  </div>
);

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/1920/1080')] bg-cover bg-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Your Voice, Our Action
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            A transparent and efficient platform for citizens to report grievances and track their resolution in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/lodge"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:text-lg transition-transform hover:-translate-y-1 shadow-lg"
            >
              Lodge a Complaint
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center justify-center px-8 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-transparent hover:bg-slate-800 md:text-lg transition-transform hover:-translate-y-1"
            >
              Track Status
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-slate-600">Three simple steps to get your issue resolved.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1. Lodge Complaint</h3>
              <p className="text-slate-600">Fill in the details, upload proof (text/audio/image), and submit your grievance instantly.</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">2. AI Prioritization</h3>
              <p className="text-slate-600">Our smart system analyzes urgency and assigns high priority to critical safety and health issues.</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">3. Track & Resolve</h3>
              <p className="text-slate-600">Get a unique tracking ID and monitor progress until the authority resolves your issue.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Assistants Section ── */}
      <div className="py-20 bg-slate-900 relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-orange-400 mb-4"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              AI-POWERED ASSISTANCE
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Two Ways to Get Help
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Choose your preferred way to interact with GrievAI — speak to a live voice agent or chat instantly via text.
            </p>
          </div>

          {/* Cards grid — desktop: 2 cols, mobile: 1 col */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* ── Card 1: AI Calling Agent (LEFT) ── */}
            <div
              className="group relative rounded-2xl p-0.5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.6), rgba(59,130,246,0.4), rgba(139,92,246,0.4))',
              }}
            >
              <div
                className="rounded-2xl h-full p-6 flex flex-col gap-5"
                style={{
                  background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Premium badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-orange-300"
                    style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                    ✦ PREMIUM
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-semibold">Online</span>
                  </div>
                </div>

                {/* Avatar + title */}
                <div className="flex items-center gap-4">
                  {/* Mini avatar orb */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, #f97316, #3b82f6, #8b5cf6, #f97316)',
                        animation: 'homeSpin 4s linear infinite',
                        padding: 2,
                        borderRadius: '9999px',
                      }} />
                    <div className="absolute inset-0.5 rounded-full bg-slate-900 flex items-center justify-center">
                      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                        <circle cx="16" cy="16" r="14" fill="#1e293b" />
                        <circle cx="11.5" cy="13" r="2.2" fill="#f97316" />
                        <circle cx="20.5" cy="13" r="2.2" fill="#f97316" />
                        <path d="M10 20 Q16 24.5 22 20" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">AI Calling Agent</h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Get grievance assistance through voice conversation
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  <AIPill icon={<Activity className="h-3 w-3" />} label="Complaint Status by Voice" />
                  <AIPill icon={<Mic className="h-3 w-3" />} label="Voice Registration" />
                  <AIPill icon={<Wifi className="h-3 w-3" />} label="Real-Time Support" />
                  <AIPill icon={<CheckCircle className="h-3 w-3" />} label="AI Guided Assistance" />
                </div>

                {/* CTA — directs user to the floating widget */}
                <div className="mt-auto">
                  <p className="text-slate-500 text-xs mb-3 text-center">
                    👇 Click the orange phone button at the bottom-left of your screen
                  </p>
                  <div
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
                      border: '1px solid rgba(249,115,22,0.3)',
                      color: '#fb923c',
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Available via floating widget
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 2: AI Chat Assistant (RIGHT) ── */}
            <div
              className="group relative rounded-2xl p-0.5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.4), rgba(249,115,22,0.3))',
              }}
            >
              <div
                className="rounded-2xl h-full p-6 flex flex-col gap-5"
                style={{
                  background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-blue-300"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    ✦ INSTANT
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-semibold">Always On</span>
                  </div>
                </div>

                {/* Avatar + title */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
                        animation: 'homeSpin 4s linear infinite reverse',
                        padding: 2,
                        borderRadius: '9999px',
                      }} />
                    <div className="absolute inset-0.5 rounded-full bg-slate-900 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">AI Chat Assistant</h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Instant text-based grievance support
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  <AIPill icon={<Search className="h-3 w-3" />} label="Track by Complaint ID" />
                  <AIPill icon={<FileText className="h-3 w-3" />} label="Grievance Guidance" />
                  <AIPill icon={<CheckCircle className="h-3 w-3" />} label="Instant Responses" />
                  <AIPill icon={<ShieldCheck className="h-3 w-3" />} label="24/7 Available" />
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <p className="text-slate-500 text-xs mb-3 text-center">
                    👇 Click the blue chat button at the bottom-right of your screen
                  </p>
                  <div
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#60a5fa',
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Available via floating widget
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spin keyframe for home section avatars */}
        <style>{`
          @keyframes homeSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Home;