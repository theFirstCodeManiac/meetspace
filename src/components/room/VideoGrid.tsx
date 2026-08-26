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

  // Compute responsive layout styles
  const getGridClass = () => {
    if (count <= 1) return 'grid-cols-1 max-w-4xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto';
    if (count <= 9) return 'grid-cols-2 sm:grid-cols-3 max-w-7xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto';
  };

  return (
    <div className={`w-full h-full p-2 sm:p-4 grid gap-3 sm:gap-4 items-center justify-center auto-rows-fr ${getGridClass()}`}>
      {participants.map(participant => (
        <div key={participant.id} className="w-full h-full min-h-[180px] sm:min-h-[220px] max-h-[70vh] aspect-video">
          <VideoCard
            participant={participant}
            isPinned={pinnedParticipantId === participant.id}
            onTogglePin={() => onTogglePin(participant.id)}
          />
        </div>
      ))}
    </div>
  );
};
