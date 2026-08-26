import React, { useRef, useEffect, useState } from 'react';
import { Participant } from '../../types';
import { Avatar } from '../ui/Avatar';
import { 
  MicOff, 
  Hand, 
  Pin, 
  PinOff, 
  Maximize2, 
  PictureInPicture, 
  Sparkles,
  ShieldCheck,
  Volume2
} from 'lucide-react';

interface VideoCardProps {
  participant: Participant;
  isPinned?: boolean;
  isSpotlight?: boolean;
  onTogglePin?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  participant,
  isPinned = false,
  isSpotlight = false,
  onTogglePin,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Attach MediaStream to <video> element
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.videoEnabled]);

  const handlePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const isSpeaking = participant.isSpeaking && participant.audioEnabled;

  return (
    <div
      ref={containerRef}
      id={`video-tile-${participant.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full rounded-2xl sm:rounded-3xl bg-slate-900 overflow-hidden border transition-all duration-300 flex items-center justify-center select-none group shadow-lg ${
        isSpeaking
          ? 'border-emerald-500 ring-2 sm:ring-4 ring-emerald-500/30'
          : isPinned
          ? 'border-indigo-500/80 ring-2 ring-indigo-500/20'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Video Track Display */}
      {participant.videoEnabled && (participant.stream || participant.isLocal) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal} // Local must be muted to avoid feedback loop
          className={`w-full h-full object-cover ${
            participant.isLocal && !participant.screenSharing ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : participant.videoEnabled && participant.id.startsWith('bot-') ? (
        // High quality simulated animated video feed for bots
        <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
          <img
            src={participant.avatarUrl}
            alt={participant.displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-90 animate-pulse duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
        </div>
      ) : (
        // Camera Turned Off: Refined Avatar Fallback
        <div className="flex flex-col items-center justify-center p-6 space-y-3">
          <div className="relative">
            <Avatar
              name={participant.displayName}
              src={participant.avatarUrl}
              size={isSpotlight ? 'xl' : 'lg'}
              className="shadow-2xl ring-4 ring-slate-800"
            />
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg animate-bounce">
                <Volume2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300 line-clamp-1 max-w-[200px] text-center">
            {participant.displayName}
          </p>
        </div>
      )}

      {/* Top Left: Badges (Host, Speaking Audio Wave) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        {participant.isHost && (
          <span className="px-2 py-0.5 rounded-lg bg-indigo-600/90 backdrop-blur-md text-[10px] sm:text-xs font-semibold text-white flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3" /> Host
          </span>
        )}
        {participant.screenSharing && (
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 backdrop-blur-md text-[10px] sm:text-xs font-semibold text-white shadow-md">
            Presenting Screen
          </span>
        )}
      </div>

      {/* Top Right: Hand Raised Indicator & Tile Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {participant.handRaised && (
          <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg animate-bounce flex items-center gap-1 text-xs">
            <Hand className="w-3.5 h-3.5 fill-current" />
          </span>
        )}

        {/* Hover Quick Action Controls */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 sm:pointer-events-none'
          }`}
        >
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title={isPinned ? 'Unpin participant' : 'Pin participant'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          {participant.videoEnabled && (
            <button
              onClick={handlePiP}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Nameplate & Mic Indicator */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 flex items-center gap-2 max-w-[85%] shadow-md">
          {/* Speaking live wave indicator */}
          {isSpeaking ? (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-full bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
              <span className="w-0.5 h-2/3 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 h-full bg-emerald-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite]" />
            </div>
          ) : !participant.audioEnabled ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          )}

          <span className="text-[11px] sm:text-xs font-medium text-white truncate">
            {participant.displayName}
          </span>
        </div>
      </div>
    </div>
  );
};
