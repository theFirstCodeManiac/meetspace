import React, { useState } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Copy, Check, ShieldCheck, Key, Globe, Users } from 'lucide-react';
import { formatMeetingCode } from '../../lib/utils';

interface MeetingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingInfoModal: React.FC<MeetingInfoModalProps> = ({ isOpen, onClose }) => {
  const { meetingCode, isHost, participants } = useWebRTC();
  const { success } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const meetingUrl = `${window.location.origin}/#meet/${meetingCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meetingCode);
    setCopiedCode(true);
    success('Meeting Code Copied', `${meetingCode} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    success('Link Copied', 'Direct meeting invitation link copied.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Details & Invitation"
      description="Share credentials with collaborators to join this session."
      maxWidth="md"
    >
      <div className="space-y-4">
        
        {/* Meeting Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            Direct Meeting Link
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <p className="text-xs font-mono text-slate-900 dark:text-white truncate flex-1 select-all">
              {meetingUrl}
            </p>
            <Button
              id="info-modal-copy-link-btn"
              variant="outline"
              size="sm"
              leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Meeting Code Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            Meeting Code
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {formatMeetingCode(meetingCode)}
            </p>
            <Button
              id="info-modal-copy-code-btn"
              variant="outline"
              size="sm"
              leftIcon={copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyCode}
            >
              {copiedCode ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
        </div>

        {/* Security & Summary */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>End-to-End Encrypted WebRTC Peer Mesh</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{participants.length} connected participants ({isHost ? 'You are Host' : 'Joined as Attendee'})</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            id="info-modal-done-btn"
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Done
          </Button>
        </div>

      </div>
    </Modal>
  );
};
