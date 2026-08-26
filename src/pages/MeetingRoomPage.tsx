import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../context/WebRTCContext';
import { useNavigation } from '../context/NavigationContext';
import { VideoGrid } from '../components/room/VideoGrid';
import { SpotlightView } from '../components/room/SpotlightView';
import { FloatingReactions } from '../components/room/FloatingReactions';
import { InCallChatDrawer } from '../components/room/InCallChatDrawer';
import { ParticipantsDrawer } from '../components/room/ParticipantsDrawer';
import { RoomControlBar } from '../components/room/RoomControlBar';
import { MeetingInfoModal } from '../components/room/MeetingInfoModal';
import { DeviceSettingsModal } from '../components/room/DeviceSettingsModal';

// Phase 4 Components
import { CaptionsOverlay } from '../components/room/CaptionsOverlay';
import { TranscriptDrawer } from '../components/room/TranscriptDrawer';
import { AICopilotDrawer } from '../components/room/AICopilotDrawer';
import { WhiteboardModal } from '../components/room/WhiteboardModal';
import { MeetingSummaryModal } from '../components/room/MeetingSummaryModal';
import { RecordingModal } from '../components/room/RecordingModal';

import {
  ShieldCheck,
  Clock,
  Info,
  Settings,
  Users,
  Lock,
  Sparkles,
  Maximize,
  Minimize,
  Radio,
  FileText,
  PenTool
} from 'lucide-react';
import { formatMeetingCode } from '../lib/utils';

export const MeetingRoomPage: React.FC = () => {
  const {
    meetingCode,
    isHost,
    participants,
    layout,
    setLayout,
    pinnedParticipantId,
    setPinnedParticipantId,
    activeSpeakerId,
    floatingReactions,

    // Phase 4 hooks
    isWhiteboardOpen,
    setIsWhiteboardOpen,
    isRecording,
    recordingDuration,
    recordedBlobUrl,
  } = useWebRTC();

  const { navigate } = useNavigation();

  // Drawers and Modals state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Call duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Open recording modal automatically when recording finishes
  useEffect(() => {
    if (recordedBlobUrl && !isRecording) {
      setIsRecordingModalOpen(true);
    }
  }, [recordedBlobUrl, isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Close other side drawers when one opens (to keep layout responsive and clean)
  const handleOpenChat = () => {
    setIsChatOpen(prev => !prev);
    if (!isChatOpen) {
      setIsParticipantsOpen(false);
      setIsTranscriptOpen(false);
      setIsCopilotOpen(false);
    }
  };

  const handleOpenParticipants = () => {
    setIsParticipantsOpen(prev => !prev);
    if (!isParticipantsOpen) {
      setIsChatOpen(false);
      setIsTranscriptOpen(false);
      setIsCopilotOpen(false);
    }
  };

  const handleOpenTranscript = () => {
    setIsTranscriptOpen(prev => !prev);
    if (!isTranscriptOpen) {
      setIsChatOpen(false);
      setIsParticipantsOpen(false);
      setIsCopilotOpen(false);
    }
  };

  const handleOpenCopilot = () => {
    setIsCopilotOpen(prev => !prev);
    if (!isCopilotOpen) {
      setIsChatOpen(false);
      setIsParticipantsOpen(false);
      setIsTranscriptOpen(false);
    }
  };

  // Find candidate for spotlight (pinned > screen sharing > active speaker > host > first participant)
  const spotlightCandidate =
    participants.find(p => p.id === pinnedParticipantId) ||
    participants.find(p => p.screenSharing) ||
    participants.find(p => p.id === activeSpeakerId) ||
    participants[0];

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Floating Reaction Particles */}
      <FloatingReactions reactions={floatingReactions} />

      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-20 shrink-0">
        {/* Left: Meeting Title & Code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
              Live Session
            </h1>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300">
            {formatMeetingCode(meetingCode)}
          </span>
          {isHost && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
              Host
            </span>
          )}

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-semibold animate-pulse">
              <Radio className="w-3 h-3 text-rose-400" />
              <span>REC {formatTimer(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Center: Call Timer & Encryption Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Encrypted WebRTC</span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick AI Summary Shortcut */}
          <button
            onClick={() => setIsSummaryOpen(true)}
            className="p-2 rounded-xl text-indigo-400 hover:text-white hover:bg-indigo-600/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            title="AI Meeting Summary"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden md:inline">Summary</span>
          </button>

          {/* Collaborative Whiteboard Shortcut */}
          <button
            onClick={() => setIsWhiteboardOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Open Whiteboard"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Meeting Information"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Video Stage & Side Drawers */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Main Stage Viewport */}
        <main className="flex-1 relative h-full flex flex-col justify-center items-center overflow-hidden">
          {layout === 'grid' || !spotlightCandidate ? (
            <VideoGrid
              participants={participants}
              pinnedParticipantId={pinnedParticipantId}
              onTogglePin={id => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
            />
          ) : (
            <SpotlightView
              participants={participants}
              spotlightParticipant={spotlightCandidate}
              pinnedParticipantId={pinnedParticipantId}
              onSelectSpotlight={id => setPinnedParticipantId(id)}
              onTogglePin={id => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
            />
          )}

          {/* Live Subtitle / Closed Captions Floating Overlay */}
          <CaptionsOverlay />
        </main>

        {/* Side Drawers */}
        {/* In-Call Chat Drawer */}
        <InCallChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />

        {/* Participants Drawer */}
        <ParticipantsDrawer
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
        />

        {/* Live Transcript Drawer */}
        <TranscriptDrawer
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
          onOpenSummary={() => setIsSummaryOpen(true)}
        />

        {/* AI Copilot Drawer */}
        <AICopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <footer className="shrink-0 bg-slate-950/60 backdrop-blur-md border-t border-slate-900">
        <RoomControlBar
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          isTranscriptOpen={isTranscriptOpen}
          isCopilotOpen={isCopilotOpen}
          onToggleChat={handleOpenChat}
          onToggleParticipants={handleOpenParticipants}
          onToggleTranscript={handleOpenTranscript}
          onToggleCopilot={handleOpenCopilot}
          onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
          onOpenSummary={() => setIsSummaryOpen(true)}
          onOpenInfo={() => setIsInfoOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </footer>

      {/* Modals */}
      <MeetingInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Collaborative Whiteboard Canvas Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      {/* AI Meeting Summary Intelligence Modal */}
      <MeetingSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />

      {/* Local Meeting Recording Playback & Export Modal */}
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
      />
    </div>
  );
};
