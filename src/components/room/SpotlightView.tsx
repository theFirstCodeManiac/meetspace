import React from 'react';
import { Participant } from '../../types';
import { VideoCard } from './VideoCard';

interface SpotlightViewProps {
  participants: Participant[];
  spotlightParticipant: Participant;
  pinnedParticipantId: string | null;
  onSelectSpotlight: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const SpotlightView: React.FC<SpotlightViewProps> = ({
  participants,
  spotlightParticipant,
  pinnedParticipantId,
  onSelectSpotlight,
  onTogglePin,
}) => {
  const filmstripParticipants = participants.filter(p => p.id !== spotlightParticipant.id);

  return (
    <div className="w-full h-full p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
      
      {/* Primary Main Spotlight Stage */}
      <div className="flex-1 w-full h-full min-h-0 min-w-0 flex items-center justify-center">
        <VideoCard
          participant={spotlightParticipant}
          isSpotlight
          isPinned={pinnedParticipantId === spotlightParticipant.id}
          onTogglePin={() => onTogglePin(spotlightParticipant.id)}
        />
      </div>

      {/* Side / Bottom Filmstrip for Other Participants */}
      {filmstripParticipants.length > 0 && (
        <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:w-72 shrink-0 py-1 px-1 custom-scrollbar max-h-[140px] lg:max-h-full">
          {filmstripParticipants.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectSpotlight(p.id)}
              className="w-44 lg:w-full aspect-video shrink-0 cursor-pointer rounded-2xl overflow-hidden ring-2 ring-transparent hover:ring-indigo-500/80 transition-all duration-200"
            >
              <VideoCard
                participant={p}
                isPinned={pinnedParticipantId === p.id}
                onTogglePin={() => onTogglePin(p.id)}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
