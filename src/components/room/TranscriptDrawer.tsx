import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import {
  X,
  Subtitles,
  Download,
  Trash2,
  Search,
  Sparkles,
  Bot,
  Globe,
  FileText,
  Copy,
  Check,
  Languages
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSummary: () => void;
}

const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Portuguese'];

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSummary,
}) => {
  const {
    transcript,
    isCaptionsOn,
    toggleCaptions,
    captionsLanguage,
    setCaptionsLanguage,
    clearTranscript,
    exportTranscript,
    generateSummary,
    isGeneratingSummary,
  } = useWebRTC();

  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript.length, isOpen]);

  if (!isOpen) return null;

  const filteredTranscript = transcript.filter(
    t =>
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.speakerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyAll = () => {
    if (transcript.length === 0) return;
    const text = transcript
      .map(
        t =>
          `[${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${
            t.speakerName
          }: ${t.text}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Copied', 'Full meeting transcript copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSummary = async () => {
    onOpenSummary();
    await generateSummary();
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0 shadow-2xl transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Subtitles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Live Transcript</h2>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                {transcript.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Continuous speech-to-text</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar (Captions toggle, Language, AI Summary Trigger) */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Closed Captions Switch */}
          <button
            onClick={toggleCaptions}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
              isCaptionsOn
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Toggle on-screen subtitle banner"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>{isCaptionsOn ? 'Captions ON' : 'Captions OFF'}</span>
          </button>

          {/* AI Meeting Summary Trigger */}
          <button
            onClick={handleGenerateSummary}
            disabled={transcript.length === 0 || isGeneratingSummary}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            title="Generate AI Meeting Summary & Action Items"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isGeneratingSummary ? 'Synthesizing...' : 'AI Summary'}</span>
          </button>
        </div>

        {/* Search & Export bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transcript..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title="Export transcript"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-9 w-40 p-1 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl space-y-0.5 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    exportTranscript('md');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    exportTranscript('txt');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Plain Text (.txt)
                </button>
                <button
                  onClick={() => {
                    exportTranscript('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  JSON Format (.json)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleCopyAll}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            title="Copy all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={clearTranscript}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors cursor-pointer"
            title="Clear transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript Items Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {filteredTranscript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Subtitles className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
            <p className="text-sm font-medium text-slate-400">No Transcript Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Speech from attendees will be automatically transcribed here in real-time. You can also turn on
              test bots to simulate conversation.
            </p>
          </div>
        ) : (
          filteredTranscript.map((item, index) => {
            const time = new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={`${item.id || 'tr'}-${index}`} className="group flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-400">{item.speakerName}</span>
                  <span className="text-[10px] text-slate-500">{time}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-200 leading-relaxed group-hover:border-slate-700 transition-colors">
                  {item.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
