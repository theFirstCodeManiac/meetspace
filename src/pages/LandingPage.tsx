import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Video, 
  Keyboard, 
  ShieldCheck, 
  Share2, 
  Users, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { formatMeetingCode, generateMeetingCode } from '../lib/utils';

export const LandingPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { isAuthenticated } = useAuth();
  const { error, success } = useToast();

  const [meetingCode, setMeetingCode] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInstant = () => {
    const code = generateMeetingCode();
    success('Instant Meeting Created', `Room code: ${code}`);
    navigate('room-preview', code);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = meetingCode.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (!clean || clean.length < 4) {
      error('Invalid Code', 'Please enter a valid meeting code.');
      return;
    }
    const formatted = formatMeetingCode(clean);
    navigate('room-preview', formatted);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Quick Launch */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Live Clock / Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime || 'Realtime Systems Ready'}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Video calls and meetings for everyone.
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
                Connect, collaborate, and celebrate from anywhere with crystal clear WebRTC video, low-latency audio, real-time screen sharing, and enterprise host controls.
              </p>
            </div>

            {/* Meeting Actions Dock */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button
                id="hero-new-meeting-btn"
                variant="primary"
                size="lg"
                leftIcon={<Video className="w-5 h-5" />}
                onClick={handleStartInstant}
                className="h-12 text-sm sm:text-base font-semibold shadow-md shadow-indigo-600/20"
              >
                New Meeting
              </Button>

              <form onSubmit={handleJoin} className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Keyboard className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="hero-join-input"
                    type="text"
                    placeholder="Enter code or link"
                    value={meetingCode}
                    onChange={e => setMeetingCode(e.target.value)}
                    className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <Button
                  id="hero-join-btn"
                  type="submit"
                  variant="outline"
                  size="lg"
                  disabled={!meetingCode.trim()}
                  className="h-12 font-semibold"
                >
                  Join
                </Button>
              </form>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                DTLS-SRTP End-to-End Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                Zero Download Required
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Host Moderation & Waiting Rooms
              </span>
            </div>
          </div>

          {/* Right Column: Live Conference Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-slate-900 p-3 shadow-2xl border border-slate-800 overflow-hidden">
              
              {/* Simulated Conference Grid */}
              <div className="grid grid-cols-2 gap-2 aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 p-2">
                {/* Tile 1 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center group">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80"
                    alt="Participant"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Elena Rostova (Host)
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80"
                    alt="Participant"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white flex items-center gap-1.5">
                    Marcus Vance
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80"
                    alt="Participant"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white flex items-center gap-1.5">
                    Sophia Chen
                  </div>
                </div>

                {/* Tile 4 (Self) */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/80 to-slate-900 border border-indigo-500/30 flex items-center justify-center">
                  <div className="text-center p-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold mx-auto flex items-center justify-center text-sm shadow-md">
                      You
                    </div>
                    <p className="text-[11px] text-indigo-200 mt-2 font-medium">Ready to connect</p>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[11px] font-medium text-white">
                    You (Preview)
                  </div>
                </div>
              </div>

              {/* Conference Dock Simulation */}
              <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs">
                <span className="font-mono text-slate-400">code: msp-live-room</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">HD 1080p</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Grid */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise Grade Media Infrastructure
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Engineered with modern WebRTC peer-to-peer pipelines, WebSockets signaling, and strict security boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card padding="md" hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sub-150ms WebRTC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Full-duplex peer connection pipelines with automated ICE trickling and NAT traversal via STUN/TURN.
              </p>
            </Card>

            <Card padding="md" hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Seamless Screen Sharing</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                DisplayMedia API integration with dynamic video track replacement and presenter state synchronization.
              </p>
            </Card>

            <Card padding="md" hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Waiting Room & Admission</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Server-side authorization allowing hosts to admit, reject, mute, or remove participants in real time.
              </p>
            </Card>

            <Card padding="md" hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Hot-Swappable Devices</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Live microphone volume meter visualizer, audio output routing, and dynamic camera input selection.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Prompt User to Register / Sign In Banner */}
      {!isAuthenticated && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-indigo-800/50">
            <div className="space-y-3 max-w-xl text-center md:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personalized Meeting Spaces</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Create your account or sign in
              </h2>
              <p className="text-sm text-indigo-200 leading-relaxed">
                Sign up to save recurring rooms, view meeting history, manage recordings, and schedule sessions with custom waiting room security.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
              <Button
                id="cta-register-btn"
                variant="primary"
                size="lg"
                onClick={() => navigate('register')}
                className="w-full sm:w-auto font-semibold bg-white text-indigo-950 hover:bg-slate-100 shadow-lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Free Account
              </Button>
              <Button
                id="cta-signin-btn"
                variant="outline"
                size="lg"
                onClick={() => navigate('login')}
                className="w-full sm:w-auto font-semibold border-indigo-400/40 text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
