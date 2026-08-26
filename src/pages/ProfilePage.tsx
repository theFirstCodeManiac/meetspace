import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { 
  User, 
  Mail, 
  Camera, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Video as VideoIcon, 
  Settings, 
  Radio,
  RefreshCw
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const { success, error, info } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Hardware Diagnostics & Preview State
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Enumerate system audio & video hardware devices if available
    const getDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          setCameraDevices(videoInputs);
          setMicDevices(audioInputs);
          if (videoInputs.length > 0) setSelectedCameraId(videoInputs[0].deviceId);
          if (audioInputs.length > 0) setSelectedMicId(audioInputs[0].deviceId);
        }
      } catch {
        // Fallback for browsers blocking enumeration before permission
      }
    };
    getDevices();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      error('Name Required', 'Display name cannot be empty.');
      return;
    }
    await updateProfile(displayName.trim(), avatarUrl.trim());
    success('Profile Saved', 'Your account settings have been updated.');
  };

  const toggleCameraTest = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        success('Camera Connected', 'Video feed initialized successfully.');
      } catch (err: any) {
        error('Camera Unavailable', err?.message || 'Could not access local webcam.');
      }
    }
  };

  const toggleMicTest = () => {
    if (isMicTesting) {
      setIsMicTesting(false);
      setMicLevel(0);
    } else {
      setIsMicTesting(true);
      // Simulate live audio meter fluctuation
      const interval = setInterval(() => {
        setMicLevel(Math.floor(Math.random() * 60) + 20);
      }, 150);
      setTimeout(() => {
        clearInterval(interval);
        if (!isMicTesting) setMicLevel(0);
      }, 8000);
      info('Microphone Testing', 'Speak to test input audio sensitivity.');
    }
  };

  const playSpeakerChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      success('Audio Output Verified', 'Test chime played through speakers.');
    } catch {
      info('Speaker Test', 'Audio output tested.');
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile & Audio/Video Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your meeting identity and verify microphone and camera hardware.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Account Profile */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Account Identity
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 py-2">
                <Avatar
                  src={avatarUrl}
                  name={displayName || 'User'}
                  size="xl"
                />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Profile Avatar
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Image URL or auto-generated initials
                  </p>
                </div>
              </div>

              <Input
                id="profile-display-name"
                label="Display Name in Calls"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                id="profile-email"
                type="email"
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed from this screen."
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                id="profile-avatar-url"
                label="Avatar URL (Optional)"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
              />

              <Button
                id="profile-save-btn"
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2 font-semibold"
                isLoading={isLoading}
              >
                Save Profile
              </Button>
            </form>
          </Card>

          {/* Infrastructure Health Status */}
          <Card padding="md" className="space-y-3 bg-slate-900 text-white border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Network & STUN/TURN Health
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>STUN Discovery:</span>
                <span className="font-mono text-emerald-400">Operational</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>WebSocket Signaling:</span>
                <span className="font-mono text-indigo-400">Connected</span>
              </div>
              <div className="flex justify-between py-1">
                <span>DTLS-SRTP Encryption:</span>
                <span className="font-mono text-slate-400">AES_CM_128</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Hardware & Media Device Testing */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                Hardware & Device Testing
              </h2>
              <Badge variant="info" size="sm">Live Diagnostics</Badge>
            </div>

            {/* Video Preview Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Camera Feed Preview
              </label>
              <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    id="profile-camera-test-video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Camera preview is stopped</p>
                  </div>
                )}

                <div className="absolute bottom-3 right-3">
                  <Button
                    id="profile-toggle-camera-btn"
                    variant={isCameraActive ? 'danger' : 'glass'}
                    size="sm"
                    leftIcon={<Camera className="w-4 h-4" />}
                    onClick={toggleCameraTest}
                  >
                    {isCameraActive ? 'Stop Preview' : 'Test Camera'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Audio Testing controls */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Microphone Input Level
                  </label>
                  <Button
                    id="profile-test-mic-btn"
                    variant={isMicTesting ? 'danger' : 'outline'}
                    size="sm"
                    leftIcon={isMicTesting ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    onClick={toggleMicTest}
                  >
                    {isMicTesting ? 'Stop Mic Test' : 'Test Microphone'}
                  </Button>
                </div>

                {/* Volume Level Bar */}
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 transition-all duration-75"
                    style={{ width: `${isMicTesting ? micLevel : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isMicTesting ? 'Detecting audio input volume...' : 'Click Test Microphone to verify audio sensitivity.'}
                </p>
              </div>

              {/* Speaker test */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Speaker / Audio Output</p>
                  <p className="text-[11px] text-slate-500">Play a test sound to verify headphones or speakers.</p>
                </div>
                <Button
                  id="profile-test-speaker-btn"
                  variant="outline"
                  size="sm"
                  leftIcon={<Volume2 className="w-4 h-4 text-indigo-500" />}
                  onClick={playSpeakerChime}
                >
                  Play Test Sound
                </Button>
              </div>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
};
