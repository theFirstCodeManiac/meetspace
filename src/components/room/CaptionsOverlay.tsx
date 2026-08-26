import React from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { Subtitles, Globe } from 'lucide-react';

export const CaptionsOverlay: React.FC = () => {
  const { isCaptionsOn, latestCaption, captionsLanguage } = useWebRTC();

  if (!isCaptionsOn || !latestCaption) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[90%] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-center flex flex-col items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-[11px] flex items-center gap-1">
            <Subtitles className="w-3 h-3" />
            {latestCaption.speakerName}
          </span>
          {captionsLanguage !== 'English' && (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              {captionsLanguage}
            </span>
          )}
        </div>

        <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed tracking-wide">
          "{latestCaption.translatedText || latestCaption.text}"
        </p>
      </div>
    </div>
  );
};
