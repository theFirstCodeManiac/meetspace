import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Share2, 
  ShieldCheck, 
  ArrowLeft, 
  Settings, 
  Copy, 
  Check, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatMeetingCode } from '../lib/utils';

export const MeetingRoomPreview: React.FC = () => {
  const { meetingCodeParam, navigate } = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const { success, info, error } = useToast();

  const meetingCode = meetingCodeParam || 'eng-sync-dev';

  const [displayName, setDisplayName] = useState(user?.displayName || 'Guest Attendee');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera preview
  useEffect(() => {
    let active = true;

    const startMedia = async () => {
      if (!isCameraOn && !isMicOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: isMicOn,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current && isCameraOn) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Media preview permission note:', err?.message);
        if (isCameraOn) setIsCameraOn(false);
      }
    };

    startMedia();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isCameraOn, isMicOn]);

  const toggleCamera = () => {
    setIsCameraOn(prev => !prev);
  };

  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#meet/${meetingCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Link Copied', 'Meeting link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      error('Name Required', 'Please provide a name before joining.');
      return;
    }

    setIsJoining(true);
    // Release local preview stream before entering full room to allow room component to acquire clean stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    navigate('meeting-room', meetingCode, {
      initialAudio: isMicOn,
      initialVideo: isCameraOn,
      guestName: displayName.trim(),
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      
      {/* Top Bar Back & Info */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          id="preview-back-btn"
          onClick={() => navigate(isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isAuthenticated ? 'Dashboard' : 'Home'}
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Room: {formatMeetingCode(meetingCode)}
          </Badge>
          <Button
            id="preview-copy-btn"
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyLink}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Main Split Content: Video Preview on Left, Join Actions on Right */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Green Room Video Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            
            {isCameraOn ? (
              <video
                id="greenroom-local-video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Avatar
                  name={displayName}
                  src={user?.avatarUrl}
                  size="xl"
                  className="mx-auto shadow-xl"
                />
                <p className="text-sm font-medium text-slate-300">
                  Camera is turned off
                </p>
              </div>
            )}

            {/* In-Preview Identity Tag */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-medium text-white flex items-center gap-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{displayName}</span>
            </div>

            {/* Quick Preview Control Dock */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                id="preview-toggle-mic-btn"
                onClick={toggleMic}
                className={`p-3.5 rounded-2xl backdrop-blur-md text-white transition-all cursor-pointer shadow-lg ${
                  isMicOn
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border border-white/15'
                    : 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-500/50'
                }`}
                aria-label={isMicOn ? 'Turn off mic' : 'Turn on mic'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                id="preview-toggle-cam-btn"
                onClick={toggleCamera}
                className={`p-3.5 rounded-2xl backdrop-blur-md text-white transition-all cursor-pointer shadow-lg ${
                  isCameraOn
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border border-white/15'
                    : 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-500/50'
                }`}
                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                id="preview-settings-btn"
                onClick={() => navigate('profile-settings')}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/15 backdrop-blur-md text-white transition-all cursor-pointer shadow-lg"
                aria-label="Device settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Join Actions and Guest Config */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready to join?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No one else is in the room right now. You will be the first participant.
            </p>
          </div>

          <div className="space-y-4">
            {!isAuthenticated && (
              <div className="space-y-1.5">
                <label 
                  htmlFor="preview-guest-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Your Name (for other participants)
                </label>
                <input
                  id="preview-guest-name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="space-y-2.5">
              <Button
                id="preview-join-now-btn"
                variant="primary"
                size="lg"
                className="w-full h-12 text-sm sm:text-base font-semibold shadow-md shadow-indigo-600/20"
                isLoading={isJoining}
                onClick={handleJoin}
              >
                Join Now
              </Button>

              <Button
                id="preview-present-now-btn"
                variant="outline"
                size="lg"
                className="w-full h-12 text-sm sm:text-base font-semibold"
                leftIcon={<Share2 className="w-4 h-4 text-indigo-500" />}
                onClick={handleJoin}
              >
                Present Screen Directly
              </Button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Encrypted Peer Connection
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Your audio and video are end-to-end encrypted directly with room peers using WebRTC DTLS-SRTP.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
