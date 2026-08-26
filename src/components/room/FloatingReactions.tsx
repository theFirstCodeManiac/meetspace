import React from 'react';
import { FloatingReaction } from '../../types';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          style={{ left: `${reaction.xOffset}%` }}
          className="absolute bottom-24 flex flex-col items-center gap-1 animate-reaction-float select-none"
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow-lg transform transition-transform hover:scale-125">
            {reaction.emoji}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-medium text-white border border-white/10 shadow-md">
            {reaction.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
