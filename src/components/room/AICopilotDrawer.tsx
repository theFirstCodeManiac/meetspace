import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import {
  X,
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  ListTodo,
  Mail,
  FileQuestion
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { label: 'Summarize so far', query: 'Can you summarize the key discussion points from the meeting transcript so far?' },
  { label: 'Extract action items', query: 'What are the explicit action items, deadlines, and assigned owners mentioned so far?' },
  { label: 'Draft follow-up email', query: 'Draft a professional follow-up email highlighting the decisions and next steps from this call.' },
  { label: 'Key decisions', query: 'What architectural or product decisions have been agreed upon in this meeting?' },
];

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { copilotMessages, isCopilotThinking, askCopilot, clearCopilotHistory, transcript } = useWebRTC();
  const { success } = useToast();

  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages.length, isOpen, isCopilotThinking]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isCopilotThinking) return;
    const q = inputQuery.trim();
    setInputQuery('');
    await askCopilot(q);
  };

  const handlePromptClick = async (query: string) => {
    if (isCopilotThinking) return;
    await askCopilot(query);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied', 'Copilot response copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="absolute sm:relative inset-y-0 right-0 w-full sm:w-80 md:w-96 h-full bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 flex flex-col z-40 shrink-0 shadow-2xl transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-white">AI Meeting Copilot</h2>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Context-aware meeting intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearCopilotHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Suggestion Pills */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium text-slate-300">Suggested Inquiries</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(p.query)}
              disabled={isCopilotThinking}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 hover:border-indigo-500/40 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {copilotMessages.map(msg => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 text-xs ${
                isAssistant ? 'items-start' : 'items-end'
              }`}
            >
              <div className="flex items-center gap-1.5 px-1">
                {isAssistant ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-indigo-400 text-[11px]">MeetSpace Copilot</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-400 text-[11px]">You</span>
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </>
                )}
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`relative group p-3.5 rounded-2xl max-w-[92%] leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200 shadow-md'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {isAssistant && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isCopilotThinking && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Analyzing meeting transcript & synthesizing answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Ask Copilot about this meeting..."
            disabled={isCopilotThinking}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isCopilotThinking}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white cursor-pointer transition-all shadow-md"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
