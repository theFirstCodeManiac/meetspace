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
  StopCircle,
  MoreVertical,
  X,
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
  const [showMobileMore, setShowMobileMore] = useState(false);

  const reactionsRef = useRef<HTMLDivElement>(null);
  const endMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

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
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setShowMobileMore(false);
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
    <div className="w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-2 z-30 relative">
      {/* Desktop Left Group: Info & Active Bots Status & Recording */}
      <div className="hidden lg:flex items-center gap-2 min-w-[200px] shrink-0">
        <button
          id="dock-info-btn"
          onClick={onOpenInfo}
          className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium"
        >
          <Info className="w-4 h-4 text-indigo-400" />
          <span className="hidden xl:inline">Room Info</span>
        </button>

        {/* Simulation Bots Toggle */}
        <button
          id="dock-simulation-btn"
          onClick={toggleSimulationAttendees}
          className={`p-2 sm:p-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isSimulationActive
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/40'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800/80'
          }`}
          title="Toggle simulated teammates for live testing"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="hidden xl:inline">{isSimulationActive ? 'Bots Active' : 'Add Bots'}</span>
        </button>

        {/* Local Recording Trigger */}
        <button
          id="dock-record-btn"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 sm:p-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isRecording
              ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/40 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800/80'
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Meeting Recording'}
        >
          {isRecording ? (
            <>
              <StopCircle className="w-4 h-4 text-rose-400" />
              <span className="hidden xl:inline">REC {formatRecordingTime(recordingDuration)}</span>
            </>
          ) : (
            <>
              <Radio className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline">Record</span>
            </>
          )}
        </button>
      </div>

      {/* Main Center Controls Dock */}
      <div className="flex-1 lg:flex-none flex items-center justify-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl max-w-full mx-auto">
        {/* Audio Toggle */}
        <button
          id="dock-audio-btn"
          onClick={toggleAudio}
          className={`min-w-[42px] min-h-[42px] sm:min-w-[46px] sm:min-h-[46px] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center ${
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
          className={`min-w-[42px] min-h-[42px] sm:min-w-[46px] sm:min-h-[46px] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center ${
            isVideoOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
              : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/40'
          }`}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          title={isVideoOn ? 'Stop Video (Ctrl+E)' : 'Start Video (Ctrl+E)'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share (Desktop & Tablet) */}
        <button
          id="dock-share-btn"
          onClick={toggleScreenShare}
          className={`hidden md:flex min-w-[46px] min-h-[46px] p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md items-center justify-center ${
            isScreenSharing
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
          }`}
          aria-label={isScreenSharing ? 'Stop presenting' : 'Present screen'}
          title={isScreenSharing ? 'Stop Presenting' : 'Share Screen'}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Collaborative Whiteboard (Desktop & Tablet) */}
        <button
          id="dock-whiteboard-btn"
          onClick={onOpenWhiteboard}
          className="hidden md:flex min-w-[46px] min-h-[46px] p-3 rounded-2xl bg-slate-800 hover:bg-indigo-600 text-white border border-slate-700/60 hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-md items-center justify-center"
          aria-label="Collaborative Whiteboard"
          title="Open Collaborative Whiteboard"
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Live Closed Captions Toggle (Desktop & Tablet) */}
        <button
          id="dock-captions-btn"
          onClick={toggleCaptions}
          className={`hidden lg:flex min-w-[46px] min-h-[46px] p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md items-center justify-center ${
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
          className={`min-w-[42px] min-h-[42px] sm:min-w-[46px] sm:min-h-[46px] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center ${
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
        <div className="relative hidden sm:block" ref={reactionsRef}>
          <button
            id="dock-reactions-btn"
            onClick={() => setShowReactions(!showReactions)}
            className={`min-w-[46px] min-h-[46px] p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center ${
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
                  className="text-2xl hover:scale-125 transition-transform p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Switcher Popover (Desktop) */}
        <div className="relative hidden md:block" ref={layoutMenuRef}>
          <button
            id="dock-layout-btn"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className={`min-w-[46px] min-h-[46px] p-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center ${
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

        {/* Device Settings (Desktop) */}
        <button
          id="dock-settings-btn"
          onClick={onOpenSettings}
          className="hidden md:flex min-w-[46px] min-h-[46px] p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60 transition-all duration-200 cursor-pointer shadow-md items-center justify-center"
          aria-label="Device Settings"
          title="Device Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Mobile "More Options" Trigger */}
        <div className="relative md:hidden" ref={mobileMoreRef}>
          <button
            id="dock-mobile-more-btn"
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`min-w-[42px] min-h-[42px] p-2.5 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
              showMobileMore
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700/60'
            }`}
            aria-label="More Meeting Controls"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Mobile Bottom Sheet Menu */}
          {showMobileMore && (
            <div className="fixed inset-x-2 bottom-20 p-4 rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Meeting Options</span>
                <button
                  onClick={() => setShowMobileMore(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Reactions in Mobile Sheet */}
              <div className="flex items-center justify-around py-2 px-1 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3">
                {REACTION_EMOJIS.slice(0, 6).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleSelectReaction(emoji);
                      setShowMobileMore(false);
                    }}
                    className="text-2xl active:scale-125 p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Grid of Tools */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  onClick={() => {
                    onOpenWhiteboard();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <PenTool className="w-5 h-5 text-indigo-400" />
                  <span>Whiteboard</span>
                </button>

                <button
                  onClick={() => {
                    toggleCaptions();
                    setShowMobileMore(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs ${
                    isCaptionsOn
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-200 border-slate-700/60'
                  }`}
                >
                  <Subtitles className="w-5 h-5 text-emerald-400" />
                  <span>Captions</span>
                </button>

                <button
                  onClick={() => {
                    setLayout(layout === 'grid' ? 'spotlight' : 'grid');
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  <span>{layout === 'grid' ? 'Spotlight' : 'Grid'}</span>
                </button>

                <button
                  onClick={() => {
                    onToggleCopilot();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>AI Copilot</span>
                </button>

                <button
                  onClick={() => {
                    onToggleTranscript();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Transcript</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    toggleSimulationAttendees();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <span>{isSimulationActive ? 'Remove Bots' : 'Test Bots'}</span>
                </button>

                <button
                  onClick={() => {
                    if (isRecording) stopRecording();
                    else startRecording();
                    setShowMobileMore(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs ${
                    isRecording
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                      : 'bg-slate-800 text-slate-200 border-slate-700/60'
                  }`}
                >
                  <Radio className="w-5 h-5 text-rose-400" />
                  <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenInfo();
                    setShowMobileMore(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex flex-col items-center gap-1 text-slate-200 text-xs"
                >
                  <Info className="w-5 h-5 text-indigo-400" />
                  <span>Room Info</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ALWAYS VISIBLE PROMINENT END CALL BUTTON */}
        <div className="relative shrink-0" ref={endMenuRef}>
          {isHost ? (
            <button
              id="dock-leave-btn"
              onClick={() => setShowEndMenu(!showEndMenu)}
              className="min-w-[46px] min-h-[42px] sm:min-h-[46px] px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/40 flex items-center justify-center gap-1 ring-2 ring-rose-500/50"
              aria-label="End or Leave Meeting"
              title="End / Leave Meeting Options"
            >
              <PhoneOff className="w-5 h-5" />
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="dock-leave-btn"
              onClick={leaveRoom}
              className="min-w-[46px] min-h-[42px] sm:min-h-[46px] px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/40 flex items-center justify-center gap-1.5 ring-2 ring-rose-500/50"
              aria-label="Leave Meeting"
              title="Leave Meeting (End Call)"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline text-xs">End</span>
            </button>
          )}

          {showEndMenu && isHost && (
            <div className="absolute bottom-16 right-0 w-52 p-1.5 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-700 shadow-2xl space-y-1 z-50 animate-in fade-in duration-150">
              <button
                id="dock-end-all-btn"
                onClick={endMeetingForAll}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/60 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 text-rose-500" />
                <span>End Meeting for All</span>
              </button>
              <button
                id="dock-leave-alone-btn"
                onClick={leaveRoom}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Leave Meeting</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Group: AI Copilot, Transcript, People, Chat */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* AI Meeting Copilot Toggle */}
        <button
          id="dock-copilot-btn"
          onClick={onToggleCopilot}
          className={`p-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-semibold ${
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

        {/* Live Transcript Toggle (Desktop) */}
        <button
          id="dock-transcript-btn"
          onClick={onToggleTranscript}
          className={`hidden md:flex p-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg items-center gap-1.5 text-xs font-medium ${
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
          className={`p-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isParticipantsOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          aria-label="Toggle Participants"
          title="Participants list"
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
          className={`relative p-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium ${
            isChatOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          aria-label="Toggle In-Call Chat"
          title="In-Call Chat"
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
