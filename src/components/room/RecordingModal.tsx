import React from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import {
  X,
  Video,
  Download,
  Play,
  Share2,
  Trash2,
  CheckCircle2,
  FileVideo
} from 'lucide-react';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({ isOpen, onClose }) => {
  const { recordedBlobUrl, downloadRecording, meetingCode } = useWebRTC();

  if (!isOpen || !recordedBlobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <FileVideo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Meeting Recording Ready</h2>
              <p className="text-xs text-slate-400">Captured audio, video & presentation feed</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="p-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video shadow-inner flex items-center justify-center">
            <video
              src={recordedBlobUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  meetspace-recording-{meetingCode}.webm
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">High-definition WebM format with synced stereo audio</p>
            </div>

            <button
              onClick={downloadRecording}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download .webm</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
