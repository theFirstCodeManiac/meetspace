import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Smile,
  LayoutGrid,
  Square,
  MessageSquare,
  Users,
  PhoneOff,
  Info,
  Settings,
  Bot,
  ChevronUp,
  LogOut,
  Sparkles,
  PenTool,
  Subtitles,
  FileText,
  Radio,
  StopCircle
} from 'lucide-react';

interface RoomControlBarProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleTranscript: () => void;
  onToggleCopilot: () => void;
  onOpenWhiteboard: () => void;
  onOpenSummary: () => void;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isTranscriptOpen: boolean;
  isCopilotOpen: boolean;
}

const REACTION_EMOJIS = ['👍', '👏', '❤️', '🔥', '🎉', '😂', '😮', '🚀'];

export const RoomControlBar: React.FC<RoomControlBarProps> = ({
  onToggleChat,
  onToggleParticipants,
  onToggleTranscript,
  onToggleCopilot,
  onOpenWhiteboard,
  onOpenSummary,
  onOpenInfo,
  onOpenSettings,
  isChatOpen,
  isParticipantsOpen,
  isTranscriptOpen,
  isCopilotOpen,
}) => {
  const {
    isAudioOn,
    isVideoOn,
    isScreenSharing,
    isHandRaised,
    layout,
    setLayout,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    sendReaction,
    leaveRoom,
    endMeetingForAll,
    isHost,
    participants,
    unreadChatCount,
    isSimulationActive,
    toggleSimulationAttendees,

    // Phase 4 states
    isCaptionsOn,
    toggleCaptions,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
  } = useWebRTC();

  const [showReactions, setShowReactions] = useState(false);
  const [showEndMenu, setShowEndMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const reactionsRef = useRef<HTMLDivElement>(null);
  const endMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
      if (endMenuRef.current && !endMenuRef.current.contains(e.target as Node)) {
        setShowEndMenu(false);
      }
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectReaction = (emoji: string) => {
    sendReaction(emoji);
    setShowReactions(false);
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-2 sm:px-4 py-3 flex items-center justify-between gap-2 z-30">
      {/* Left Group: Info & Active Bots Status & Recording */}
      <div className="hidden lg:flex items-center gap-2 min-w-[240px]">
        <button
          id="dock-info-btn"
          onClick={onOpenInfo}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium"
        >
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Room Info</span>
        </button>

        {/* Simulation Bots Toggle (Great for solo testing & evaluation) */}
        <button
          id="dock-simulation-btn"
          onClick={toggleSimulationAttendees}
          className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isSimulationActive
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/40'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800/80'
          }`}
          title="Toggle simulated teammates to test multi-grid, captions, AI summary & active speaker"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>{isSimulationActive ? 'Bots (3 Active)' : 'Add Test Bots'}</span>
        </button>

        {/* Local Recording Trigger */}
        <button
          id="dock-record-btn"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isRecording
              ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/40 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800/80'
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Local Meeting Recording'}
        >
          {isRecording ? (
            <>
              <StopCircle className="w-4 h-4 text-rose-400" />
              <span>REC {formatRecordingTime(recordingDuration)}</span>
            </>
          ) : (
            <>
              <Radio className="w-4 h-4 text-slate-400" />
              <span>Record</span>
            </>
          )}
        </button>
      </div>

      {/* Center Main Controls Dock */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl mx-auto">
        {/* Audio Toggle */}
        <button
          id="dock-audio-btn"
          onClick={toggleAudio}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
            isAudioOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
              : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/40'
          }`}
          aria-label={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
          title={isAudioOn ? 'Mute (Ctrl+D)' : 'Unmute (Ctrl+D)'}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          id="dock-video-btn"
          onClick={toggleVideo}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
            isVideoOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
              : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/40'
          }`}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          title={isVideoOn ? 'Stop Video (Ctrl+E)' : 'Start Video (Ctrl+E)'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          id="dock-share-btn"
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
            isScreenSharing
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
          }`}
          aria-label={isScreenSharing ? 'Stop presenting' : 'Present screen'}
          title={isScreenSharing ? 'Stop Presenting' : 'Share Screen'}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Collaborative Whiteboard */}
        <button
          id="dock-whiteboard-btn"
          onClick={onOpenWhiteboard}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-indigo-600 text-white border border-slate-700/60 hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-md"
          aria-label="Collaborative Whiteboard"
          title="Open Collaborative Whiteboard"
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Live Closed Captions Toggle */}
        <button
          id="dock-captions-btn"
          onClick={toggleCaptions}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
            isCaptionsOn
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
          }`}
          aria-label="Live Captions"
          title={isCaptionsOn ? 'Disable Live Captions' : 'Enable Live Captions'}
        >
          <Subtitles className="w-5 h-5" />
        </button>

        {/* Hand Raise */}
        <button
          id="dock-hand-btn"
          onClick={toggleHandRaise}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
            isHandRaised
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
          }`}
          aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className={`w-5 h-5 ${isHandRaised ? 'fill-current' : ''}`} />
        </button>

        {/* Emoji Reactions Popover */}
        <div className="relative" ref={reactionsRef}>
          <button
            id="dock-reactions-btn"
            onClick={() => setShowReactions(!showReactions)}
            className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
              showReactions
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
            }`}
            aria-label="Reactions"
            title="Reactions"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showReactions && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 z-50">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSelectReaction(emoji)}
                  className="text-2xl hover:scale-130 transition-transform p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Switcher Popover */}
        <div className="relative" ref={layoutMenuRef}>
          <button
            id="dock-layout-btn"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md ${
              showLayoutMenu
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
            }`}
            aria-label="Change Layout"
            title="Switch View Layout"
          >
            {layout === 'grid' ? <LayoutGrid className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>

          {showLayoutMenu && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl space-y-1 z-50 animate-in fade-in duration-150">
              <button
                onClick={() => {
                  setLayout('grid');
                  setShowLayoutMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  layout === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => {
                  setLayout('spotlight');
                  setShowLayoutMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  layout === 'spotlight' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>Spotlight / Speaker</span>
              </button>
            </div>
          )}
        </div>

        {/* Device Settings */}
        <button
          id="dock-settings-btn"
          onClick={onOpenSettings}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60 transition-all duration-200 cursor-pointer shadow-md"
          aria-label="Device Settings"
          title="Device Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Leave / End Call Button */}
        <div className="relative" ref={endMenuRef}>
          {isHost ? (
            <button
              id="dock-leave-btn"
              onClick={() => setShowEndMenu(!showEndMenu)}
              className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              aria-label="End Meeting Options"
            >
              <PhoneOff className="w-5 h-5" />
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="dock-leave-btn"
              onClick={leaveRoom}
              className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              aria-label="Leave Meeting"
              title="Leave Meeting"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          )}

          {showEndMenu && isHost && (
            <div className="absolute bottom-16 right-0 w-52 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl space-y-1 z-50 animate-in fade-in duration-150">
              <button
                id="dock-end-all-btn"
                onClick={endMeetingForAll}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 text-rose-500" />
                <span>End Meeting for All</span>
              </button>
              <button
                id="dock-leave-alone-btn"
                onClick={leaveRoom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Leave Meeting</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Group: AI Copilot, Transcript, People, Chat */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-[240px] justify-end">
        {/* AI Meeting Copilot Toggle */}
        <button
          id="dock-copilot-btn"
          onClick={onToggleCopilot}
          className={`p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-semibold ${
            isCopilotOpen
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 ring-2 ring-indigo-500/40'
              : 'bg-slate-900/80 hover:bg-indigo-950/50 text-indigo-300 hover:text-white border-indigo-500/30'
          }`}
          aria-label="Toggle AI Copilot"
          title="Open AI Meeting Copilot"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="hidden xl:inline">AI Copilot</span>
        </button>

        {/* Live Transcript Toggle */}
        <button
          id="dock-transcript-btn"
          onClick={onToggleTranscript}
          className={`p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isTranscriptOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          aria-label="Toggle Live Transcript"
          title="View Live Transcript"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="hidden xl:inline">Transcript</span>
        </button>

        {/* Participants Drawer Toggle */}
        <button
          id="dock-participants-btn"
          onClick={onToggleParticipants}
          className={`p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isParticipantsOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          aria-label="Toggle Participants"
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">People</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold">
            {participants.length}
          </span>
        </button>

        {/* Chat Drawer Toggle */}
        <button
          id="dock-chat-btn"
          onClick={onToggleChat}
          className={`relative p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isChatOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          aria-label="Toggle In-Call Chat"
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Chat</span>
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
