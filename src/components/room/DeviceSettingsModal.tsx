import React from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Mic, Video, Volume2, CheckCircle2 } from 'lucide-react';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    availableDevices, 
    selectedAudioInput, 
    selectedVideoInput, 
    setSelectedAudioInput, 
    setSelectedVideoInput,
    localAudioLevel,
    localStream 
  } = useWebRTC();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audio & Video Settings"
      description="Configure hardware devices, test inputs, and check sensitivity."
      maxWidth="md"
    >
      <div className="space-y-5">
        
        {/* Microphone Selection & Live Meter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-indigo-500" />
            Microphone Input
          </label>
          <select
            id="settings-audio-select"
            value={selectedAudioInput}
            onChange={e => setSelectedAudioInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          >
            {availableDevices.audioInputs.length === 0 ? (
              <option value="">Default Microphone</option>
            ) : (
              availableDevices.audioInputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))
            )}
          </select>

          {/* Real-time mic test level meter */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Input Sensitivity</span>
              <span>{localAudioLevel}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, localAudioLevel)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-indigo-500" />
            Camera Device
          </label>
          <select
            id="settings-video-select"
            value={selectedVideoInput}
            onChange={e => setSelectedVideoInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          >
            {availableDevices.videoInputs.length === 0 ? (
              <option value="">Default HD Camera</option>
            ) : (
              availableDevices.videoInputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Audio Output Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-indigo-500" />
            Audio Output / Speakers
          </label>
          <select
            id="settings-speaker-select"
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          >
            {availableDevices.audioOutputs.length === 0 ? (
              <option value="">Default System Speakers</option>
            ) : (
              availableDevices.audioOutputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            id="settings-modal-save-btn"
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Save & Close
          </Button>
        </div>

      </div>
    </Modal>
  );
};
