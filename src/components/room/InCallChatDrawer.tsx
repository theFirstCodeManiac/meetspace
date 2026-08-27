import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { 
  X, 
  Send, 
  Smile, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Search 
} from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface InCallChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_EMOJIS = ['👍', '👏', '❤️', '🔥', '🚀', '🎉', '😂', '💡'];

export const InCallChatDrawer: React.FC<InCallChatDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { chatMessages, sendChatMessage, participants, markChatAsRead } = useWebRTC();
  const [inputText, setInputText] = useState('');
  const [recipientId, setRecipientId] = useState<string>('everyone');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      markChatAsRead();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages.length, markChatAsRead]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const isPrivate = recipientId !== 'everyone';
    sendChatMessage(inputText.trim(), isPrivate, isPrivate ? recipientId : undefined);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const otherParticipants = participants.filter(p => !p.isLocal);

  return (
    <div className="absolute sm:relative inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl transition-all">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">In-Call Messages</h2>
          <span className="px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-semibold">
            {chatMessages.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Recipient Selector (Everyone vs Direct Message) */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-slate-400 shrink-0">
            Send to:
          </label>
          <select
            id="chat-recipient-select"
            value={recipientId}
            onChange={e => setRecipientId(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="everyone">Everyone in Room (Public)</option>
            {otherParticipants.map(p => (
              <option key={p.id} value={p.id}>
                {p.displayName} (Private)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
            <Globe className="w-8 h-8 text-slate-600 mb-1" />
            <p className="text-xs font-medium text-slate-400">No messages yet</p>
            <p className="text-[11px]">Messages sent here are visible to call participants.</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === user?.id || msg.senderName.includes('(You)');
            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.isPrivate && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-semibold text-[10px]">
                      <Lock className="w-2.5 h-2.5" /> Direct
                    </span>
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words shadow-md ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : msg.isPrivate
                      ? 'bg-amber-950/60 border border-amber-800 text-amber-100 rounded-bl-xs'
                      : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Bar & Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {showEmojiPicker && (
          <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-slate-800/90 border border-slate-700 mb-2">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="in-call-chat-input"
              type="text"
              placeholder={recipientId === 'everyone' ? 'Send a message to everyone...' : 'Send private message...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <Button
            id="chat-send-btn"
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim()}
            className="rounded-xl px-3"
            aria-label="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>

    </div>
  );
};
