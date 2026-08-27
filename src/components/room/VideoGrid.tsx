import React from 'react';
import { Participant } from '../../types';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  participants: Participant[];
  pinnedParticipantId: string | null;
  onTogglePin: (id: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  pinnedParticipantId,
  onTogglePin,
}) => {
  const count = participants.length;

  // Compute responsive layout styles based on count
  const getGridClass = () => {
    if (count <= 1) return 'grid-cols-1 max-w-4xl max-h-[82vh]';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-[82vh]';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-7xl';
    if (count <= 9) return 'grid-cols-2 sm:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center overflow-y-auto custom-scrollbar">
      <div className={`w-full h-full grid gap-2 sm:gap-4 items-center justify-center auto-rows-fr ${getGridClass()}`}>
        {participants.map(participant => (
          <div
            key={participant.id}
            className={`w-full h-full min-h-[140px] sm:min-h-[180px] md:min-h-[220px] max-h-[75vh] ${
              count === 1 ? 'aspect-video max-w-4xl mx-auto' : 'aspect-video'
            }`}
          >
            <VideoCard
              participant={participant}
              isPinned={pinnedParticipantId === participant.id}
              onTogglePin={() => onTogglePin(participant.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
