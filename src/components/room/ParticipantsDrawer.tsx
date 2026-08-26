import React, { useState } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  X, 
  Search, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Hand, 
  ShieldCheck, 
  UserMinus, 
  VolumeX, 
  Copy, 
  Check, 
  UserPlus 
} from 'lucide-react';

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({ isOpen, onClose }) => {
  const { participants, isHost, muteAllParticipants, kickParticipant, meetingCode } = useWebRTC();
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filtered = participants.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/#meet/${meetingCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Invitation Copied', 'Meeting link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full sm:w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl transition-all">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Participants</h2>
          <span className="px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-semibold">
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Participants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Moderation Controls */}
      <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="participants-search-input"
            type="text"
            placeholder="Search participants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            id="participants-copy-invite-btn"
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyInvite}
          >
            {copied ? 'Copied' : 'Invite Link'}
          </Button>

          {isHost && (
            <Button
              id="participants-mute-all-btn"
              variant="secondary"
              size="sm"
              className="text-xs text-rose-300 hover:text-rose-200"
              leftIcon={<VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              onClick={muteAllParticipants}
            >
              Mute All
            </Button>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {filtered.map(p => (
          <div
            key={p.id}
            id={`participant-row-${p.id}`}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group border border-transparent hover:border-slate-800"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={p.displayName}
                src={p.avatarUrl}
                size="sm"
                className="shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white truncate">
                    {p.displayName}
                  </p>
                  {p.isHost && (
                    <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" title="Host" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  {p.isLocal ? 'You' : p.isHost ? 'Meeting Host' : 'Attendee'}
                  {p.handRaised && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      • <Hand className="w-2.5 h-2.5 fill-current" /> Raised Hand
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media Indicators and Host Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {p.audioEnabled ? (
                <span className="p-1 text-slate-400" title="Mic On">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              ) : (
                <span className="p-1 text-rose-400" title="Mic Muted">
                  <MicOff className="w-3.5 h-3.5" />
                </span>
              )}

              {p.videoEnabled ? (
                <span className="p-1 text-slate-400" title="Video On">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              ) : (
                <span className="p-1 text-slate-500" title="Video Off">
                  <VideoOff className="w-3.5 h-3.5" />
                </span>
              )}

              {/* Host kick button for remote participants */}
              {isHost && !p.isLocal && (
                <button
                  id={`kick-btn-${p.id}`}
                  onClick={() => kickParticipant(p.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer ml-1"
                  title="Remove from meeting"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
