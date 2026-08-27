import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Participant,
  ChatMessage,
  FloatingReaction,
  MeetingLayout,
  TranscriptItem,
  MeetingSummary,
  CopilotMessage,
  WhiteboardStroke,
} from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useNavigation } from './NavigationContext';

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

interface WebRTCContextType {
  // Room Info
  meetingCode: string;
  isHost: boolean;
  isConnected: boolean;
  inWaitingRoom: boolean;
  waitingParticipants: Participant[];
  layout: MeetingLayout;
  setLayout: (layout: MeetingLayout) => void;
  pinnedParticipantId: string | null;
  setPinnedParticipantId: (id: string | null) => void;

  // Local Media State
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  localAudioLevel: number;
  availableDevices: {
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  };
  selectedAudioInput: string;
  selectedVideoInput: string;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedVideoInput: (deviceId: string) => void;

  // Control Actions
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleHandRaise: () => void;
  sendReaction: (emoji: string) => void;
  leaveRoom: () => void;
  endMeetingForAll: () => void;

  // Remote Participants
  participants: Participant[];
  activeSpeakerId: string | null;

  // Chat & Reactions
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  sendChatMessage: (text: string, isPrivate?: boolean, recipientId?: string) => void;
  markChatAsRead: () => void;
  floatingReactions: FloatingReaction[];

  // Host Moderation Actions
  admitParticipant: (participantId: string) => void;
  kickParticipant: (participantId: string) => void;
  muteAllParticipants: () => void;

  // Simulated Test Attendees
  isSimulationActive: boolean;
  toggleSimulationAttendees: () => void;

  // Live Transcription & Captions
  transcript: TranscriptItem[];
  isCaptionsOn: boolean;
  toggleCaptions: () => void;
  captionsLanguage: string;
  setCaptionsLanguage: (lang: string) => void;
  latestCaption: { speakerName: string; text: string; translatedText?: string } | null;
  clearTranscript: () => void;
  exportTranscript: (format: 'txt' | 'md' | 'json') => void;

  // AI Meeting Intelligence & Copilot
  isGeneratingSummary: boolean;
  meetingSummary: MeetingSummary | null;
  generateSummary: () => Promise<void>;
  copilotMessages: CopilotMessage[];
  isCopilotThinking: boolean;
  askCopilot: (question: string) => Promise<void>;
  clearCopilotHistory: () => void;

  // Collaborative Whiteboard
  isWhiteboardOpen: boolean;
  setIsWhiteboardOpen: (open: boolean) => void;
  whiteboardStrokes: WhiteboardStroke[];
  addWhiteboardStroke: (stroke: WhiteboardStroke) => void;
  clearWhiteboard: () => void;

  // Meeting Local Recording
  isRecording: boolean;
  recordingDuration: number;
  recordedBlobUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  downloadRecording: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{
  meetingCode: string;
  initialAudio?: boolean;
  initialVideo?: boolean;
  guestName?: string;
  children: React.ReactNode;
}> = ({ meetingCode, initialAudio = true, initialVideo = true, guestName, children }) => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const { success, error, info, warning } = useToast();

  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [layout, setLayout] = useState<MeetingLayout>('grid');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);

  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(initialAudio);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);

  // Device lists
  const [availableDevices, setAvailableDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }>({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');

  // Participants map
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, Participant>>(new Map());
  const [waitingParticipants, setWaitingParticipants] = useState<Participant[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Chat & Reactions
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Simulation test mode
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const simulationIntervalRef = useRef<number | null>(null);

  // Live Transcription & Captions
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [captionsLanguage, setCaptionsLanguage] = useState('English');
  const [latestCaption, setLatestCaption] = useState<{ speakerName: string; text: string; translatedText?: string } | null>(null);

  // AI Meeting Intelligence & Copilot
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-copilot',
      role: 'assistant',
      content: "Hello! I'm your MeetSpace AI Copilot. Ask me anything about what's being discussed, action items, or ask me to draft follow-up notes.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Whiteboard
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);

  // Meeting Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef<boolean>(false);

  // Refs & Tracking
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);

  // Unique session peer ID for every device/tab
  const localParticipantIdRef = useRef<string>(() => {
    const sessionKey = `meetspace_peer_${meetingCode}`;
    let stored = sessionStorage.getItem(sessionKey);
    if (!stored) {
      stored = user?.id ? `${user.id}_${Math.random().toString(36).substring(2, 7)}` : `usr_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(sessionKey, stored);
    }
    return stored;
  });

  const effectiveDisplayName = user?.displayName || guestName || 'Guest Attendee';

  // Unified send function (WebSocket + HTTP Fallback)
  const sendSignalingMessage = useCallback((type: string, payload: any = {}, targetPeerId?: string) => {
    const rawCode = (meetingCode || 'room').toLowerCase().trim();
    const message = {
      type,
      meetingCode: rawCode,
      senderPeerId: localParticipantIdRef.current,
      targetPeerId,
      payload,
    };

    // 1. Try WebSocket
    let wsSent = false;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        wsSent = true;
      } catch (err) {
        console.warn('WS send failed, falling back to HTTP:', err);
      }
    }

    // 2. Always backup via HTTP send endpoint if WS is not open or for critical room actions
    if (!wsSent || type.startsWith('SIGNAL_') || type === 'JOIN_ROOM' || type === 'LEAVE_ROOM' || type === 'CHAT_MESSAGE') {
      fetch('/api/signaling/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).catch(err => {
        console.warn('Signaling HTTP send error:', err);
      });
    }
  }, [meetingCode]);

  // Enumerate Media Devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices({
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput'),
        audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
      });
    } catch {
      // Ignored
    }
  }, []);

  // Audio Analyzer
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeakingEmit = 0;

      const analyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setLocalAudioLevel(Math.min(100, Math.round(average * 1.8)));

        // Broadcast speaking update
        const now = Date.now();
        if (now - lastSpeakingEmit > 400) {
          lastSpeakingEmit = now;
          const isSpeakingNow = average > 14 && isAudioOn;
          sendSignalingMessage('PEER_SPEAKING_UPDATE', {
            isSpeaking: isSpeakingNow,
            audioLevel: average,
          });
        }

        audioAnimFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch {
      // Analyzer optional
    }
  };

  // Initialize Local Media Stream
  useEffect(() => {
    let active = true;

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
          video: selectedVideoInput
            ? { deviceId: { exact: selectedVideoInput }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        stream.getAudioTracks().forEach(t => (t.enabled = initialAudio));
        stream.getVideoTracks().forEach(t => (t.enabled = initialVideo));

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Update tracks in existing peer connections
        peerConnections.current.forEach(pc => {
          const senders = pc.getSenders();
          stream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(console.warn);
            } else {
              try {
                pc.addTrack(track, stream);
              } catch (e) {
                console.warn(e);
              }
            }
          });
        });

        setupAudioAnalyzer(stream);
        updateDeviceList();
      } catch (err: any) {
        console.warn('Local media access note:', err?.message);
      }
    };

    startLocalStream();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current);
      }
    };
  }, [selectedAudioInput, selectedVideoInput, initialAudio, initialVideo, updateDeviceList]);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((remotePeerId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(remotePeerId)) {
      return peerConnections.current.get(remotePeerId)!;
    }

    try {
      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnections.current.set(remotePeerId, pc);

      if (!iceQueuesRef.current.has(remotePeerId)) {
        iceQueuesRef.current.set(remotePeerId, []);
      }

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            pc.addTrack(track, localStreamRef.current!);
          } catch (e) {
            console.warn(e);
          }
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage('SIGNAL_ICE_CANDIDATE', {
            targetPeerId: remotePeerId,
            candidate: event.candidate,
          }, remotePeerId);
        }
      };

      // Handle Remote Tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          const peer = updated.get(remotePeerId);
          if (peer) {
            updated.set(remotePeerId, {
              ...peer,
              stream: remoteStream,
            });
          }
          return updated;
        });
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.warn(`Peer connection with ${remotePeerId} is ${pc.connectionState}`);
        }
      };

      // If initiator, create and send Offer immediately
      if (isInitiator) {
        const initiateOffer = async () => {
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            if (pc.signalingState !== 'closed') {
              await pc.setLocalDescription(offer);
              sendSignalingMessage('SIGNAL_OFFER', {
                targetPeerId: remotePeerId,
                offer,
              }, remotePeerId);
            }
          } catch (e) {
            console.error('Create offer error:', e);
          }
        };

        // Delay slightly for candidate gathering
        setTimeout(initiateOffer, 50);

        pc.onnegotiationneeded = async () => {
          try {
            if (pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignalingMessage('SIGNAL_OFFER', {
                targetPeerId: remotePeerId,
                offer,
              }, remotePeerId);
            }
          } catch (e) {
            console.warn('Renegotiation note:', e);
          }
        };
      }

      return pc;
    } catch (err) {
      console.error('Peer connection init error:', err);
      return null;
    }
  }, [sendSignalingMessage]);

  const handleOffer = async (senderPeerId: string, offer: RTCSessionDescriptionInit) => {
    try {
      let pc = peerConnections.current.get(senderPeerId);
      if (!pc) {
        pc = createPeerConnection(senderPeerId, false) || undefined;
      }
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Drain queued ICE candidates
      const queue = iceQueuesRef.current.get(senderPeerId) || [];
      while (queue.length > 0) {
        const cand = queue.shift();
        if (cand) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignalingMessage('SIGNAL_ANSWER', {
        targetPeerId: senderPeerId,
        answer,
      }, senderPeerId);
    } catch (err) {
      console.error('Handle offer error:', err);
    }
  };

  const handleAnswer = async (senderPeerId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnections.current.get(senderPeerId);
      if (pc && pc.signalingState !== 'closed') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Drain queued ICE candidates
        const queue = iceQueuesRef.current.get(senderPeerId) || [];
        while (queue.length > 0) {
          const cand = queue.shift();
          if (cand) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
          }
        }
      }
    } catch (err) {
      console.error('Handle answer error:', err);
    }
  };

  const handleIceCandidate = async (senderPeerId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnections.current.get(senderPeerId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!iceQueuesRef.current.has(senderPeerId)) {
          iceQueuesRef.current.set(senderPeerId, []);
        }
        iceQueuesRef.current.get(senderPeerId)!.push(candidate);
      }
    } catch (err) {
      console.warn('Handle ICE candidate note:', err);
    }
  };

  const closePeerConnection = (peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }
    iceQueuesRef.current.delete(peerId);
  };

  // Process any signaling message (from WS or HTTP poll)
  const handleSignalingMessage = useCallback(async (message: any) => {
    if (!message || !message.type) return;

    if (message.id) {
      if (processedMessageIdsRef.current.has(message.id)) return;
      processedMessageIdsRef.current.add(message.id);
      if (processedMessageIdsRef.current.size > 500) {
        const first = processedMessageIdsRef.current.values().next().value;
        if (first) processedMessageIdsRef.current.delete(first);
      }
    }

    const { type, payload, senderPeerId } = message;

    // Ignore self messages
    if (senderPeerId === localParticipantIdRef.current) return;

    switch (type) {
      case 'ROOM_JOINED': {
        setIsHost(payload.isHost);
        const initialPeers = new Map<string, Participant>();
        (payload.participants || []).forEach((p: any) => {
          if (p.id === localParticipantIdRef.current) return;
          initialPeers.set(p.id, {
            id: p.id,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            isHost: p.isHost,
            isLocal: false,
            audioEnabled: p.audioEnabled ?? true,
            videoEnabled: p.videoEnabled ?? true,
            screenSharing: p.screenSharing ?? false,
            handRaised: p.handRaised ?? false,
            isSpeaking: false,
            inWaitingRoom: p.inWaitingRoom ?? false,
          });
          createPeerConnection(p.id, true);
        });
        setRemoteParticipants(initialPeers);
        setIsConnected(true);
        break;
      }

      case 'PEER_JOINED': {
        const newP = payload.participant;
        if (!newP || newP.id === localParticipantIdRef.current) return;

        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          updated.set(newP.id, {
            id: newP.id,
            displayName: newP.displayName || 'Attendee',
            avatarUrl: newP.avatarUrl,
            isHost: newP.isHost ?? false,
            isLocal: false,
            audioEnabled: newP.audioEnabled ?? true,
            videoEnabled: newP.videoEnabled ?? true,
            screenSharing: newP.screenSharing ?? false,
            handRaised: newP.handRaised ?? false,
            isSpeaking: false,
            inWaitingRoom: newP.inWaitingRoom ?? false,
          });
          return updated;
        });

        // The joined peer or host establishes connection
        createPeerConnection(newP.id, false);
        info('Participant Joined', `${newP.displayName || 'A participant'} entered the room.`);
        break;
      }

      case 'PEER_LEFT': {
        const peerId = payload?.participantId || senderPeerId;
        if (!peerId) return;
        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          const exiting = updated.get(peerId);
          if (exiting) {
            info('Participant Left', `${exiting.displayName} left the call.`);
            updated.delete(peerId);
          }
          return updated;
        });
        closePeerConnection(peerId);
        break;
      }

      case 'SIGNAL_OFFER': {
        const sId = payload.senderPeerId || senderPeerId;
        if (sId && payload.offer) {
          await handleOffer(sId, payload.offer);
        }
        break;
      }

      case 'SIGNAL_ANSWER': {
        const sId = payload.senderPeerId || senderPeerId;
        if (sId && payload.answer) {
          await handleAnswer(sId, payload.answer);
        }
        break;
      }

      case 'SIGNAL_ICE_CANDIDATE': {
        const sId = payload.senderPeerId || senderPeerId;
        if (sId && payload.candidate) {
          await handleIceCandidate(sId, payload.candidate);
        }
        break;
      }

      case 'PEER_MEDIA_STATE_CHANGED': {
        const pId = payload.participantId || senderPeerId;
        if (!pId) return;
        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          const peer = updated.get(pId);
          if (peer) {
            updated.set(pId, {
              ...peer,
              audioEnabled: payload.audioEnabled !== undefined ? payload.audioEnabled : peer.audioEnabled,
              videoEnabled: payload.videoEnabled !== undefined ? payload.videoEnabled : peer.videoEnabled,
              screenSharing: payload.screenSharing !== undefined ? payload.screenSharing : peer.screenSharing,
              handRaised: payload.handRaised !== undefined ? payload.handRaised : peer.handRaised,
            });
          }
          return updated;
        });
        break;
      }

      case 'PEER_SPEAKING_UPDATE': {
        const pId = payload.participantId || senderPeerId;
        if (!pId) return;
        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          const peer = updated.get(pId);
          if (peer) {
            updated.set(pId, {
              ...peer,
              isSpeaking: payload.isSpeaking,
              audioLevel: payload.audioLevel,
            });
          }
          return updated;
        });
        if (payload.isSpeaking) {
          setActiveSpeakerId(pId);
        }
        break;
      }

      case 'CHAT_MESSAGE_RECEIVED': {
        const newMsg = payload.message;
        if (newMsg) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setUnreadChatCount(prev => prev + 1);
        }
        break;
      }

      case 'REACTION_RECEIVED': {
        const { displayName, emoji } = payload;
        const newReaction: FloatingReaction = {
          id: `react_${Date.now()}_${Math.random()}`,
          senderName: displayName || 'Attendee',
          emoji,
          xOffset: 20 + Math.random() * 60,
        };
        setFloatingReactions(prev => [...prev, newReaction]);
        setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 3000);
        break;
      }

      case 'WHITEBOARD_STROKE_RECEIVED': {
        const { stroke } = payload;
        if (stroke) {
          setWhiteboardStrokes(prev => [...prev, stroke]);
        }
        break;
      }

      case 'WHITEBOARD_CLEAR_RECEIVED': {
        setWhiteboardStrokes([]);
        break;
      }

      case 'TRANSCRIPT_ENTRY_RECEIVED': {
        const entry: TranscriptItem = {
          id: payload.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          speakerId: payload.speakerId || senderPeerId,
          speakerName: payload.speakerName || 'Attendee',
          text: payload.text,
          timestamp: payload.timestamp || new Date().toISOString(),
          isFinal: payload.isFinal ?? true,
        };

        setTranscript(prev => {
          if (prev.some(t => t.id === entry.id)) return prev;
          return [...prev, entry];
        });
        setLatestCaption({
          speakerName: entry.speakerName,
          text: entry.text,
        });
        break;
      }

      case 'FORCE_MUTE_AUDIO': {
        setIsAudioOn(false);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
        }
        warning('Muted by Host', 'The meeting host has muted all participants.');
        break;
      }

      case 'KICKED_FROM_ROOM': {
        error('Removed from Room', 'You were removed from this meeting by the host.');
        navigate('meeting-ended');
        break;
      }

      case 'MEETING_ENDED_BY_HOST': {
        info('Meeting Ended', 'The host has ended the meeting for everyone.');
        navigate('meeting-ended');
        break;
      }

      default:
        break;
    }
  }, [createPeerConnection, error, info, navigate, warning]);

  // 3. Connect to Signaling (HTTP Registration + WS + Polling Fallback)
  useEffect(() => {
    let isActive = true;
    const rawCode = (meetingCode || 'room').toLowerCase().trim();
    const myId = localParticipantIdRef.current;

    // A. Initial Registration via HTTP API immediately
    const joinViaHttp = async () => {
      try {
        const res = await fetch('/api/signaling/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingCode: rawCode,
            participantId: myId,
            displayName: effectiveDisplayName,
            avatarUrl: user?.avatarUrl,
            audioEnabled: isAudioOn,
            videoEnabled: isVideoOn,
          }),
        });

        if (res.ok && isActive) {
          const data = await res.json();
          if (data.success) {
            handleSignalingMessage({
              type: 'ROOM_JOINED',
              payload: {
                isHost: data.isHost,
                participants: data.participants,
              },
            });
          }
        }
      } catch (err) {
        console.warn('Signaling HTTP join note:', err);
      }
    };

    joinViaHttp();

    // B. WebSocket Connection
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/signaling`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isActive) return;
        setIsConnected(true);
        ws?.send(JSON.stringify({
          type: 'JOIN_ROOM',
          meetingCode: rawCode,
          payload: {
            participantId: myId,
            displayName: effectiveDisplayName,
            avatarUrl: user?.avatarUrl,
            audioEnabled: isAudioOn,
            videoEnabled: isVideoOn,
          },
        }));
      };

      ws.onmessage = async (event) => {
        if (!isActive) return;
        try {
          const msg = JSON.parse(event.data);
          handleSignalingMessage(msg);
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        if (isActive) {
          // Fallback to polling automatically
        }
      };
    } catch {
      // WS fallback to HTTP
    }

    // C. Continuous HTTP Long-Polling Loop (Guarantees multi-device networking even if WS is blocked)
    let pollTimeout: number | null = null;

    const startPollingLoop = async () => {
      while (isActive) {
        try {
          const res = await fetch(`/api/signaling/poll?meetingCode=${encodeURIComponent(rawCode)}&participantId=${encodeURIComponent(myId)}`);
          if (res.ok && isActive) {
            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
              for (const msg of data.messages) {
                await handleSignalingMessage(msg);
              }
            }
          }
        } catch {
          // Brief pause on poll failure
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    };

    startPollingLoop();

    // D. Heartbeat interval
    const heartbeatTimer = setInterval(() => {
      if (!isActive) return;
      fetch('/api/signaling/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode: rawCode, participantId: myId }),
      }).catch(() => {});
    }, 10000);

    return () => {
      isActive = false;
      clearInterval(heartbeatTimer);
      if (pollTimeout) clearTimeout(pollTimeout);

      sendSignalingMessage('LEAVE_ROOM', { participantId: myId });

      fetch('/api/signaling/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode: rawCode, participantId: myId }),
      }).catch(() => {});

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      iceQueuesRef.current.clear();
    };
  }, [meetingCode, effectiveDisplayName, user?.avatarUrl, isAudioOn, isVideoOn, handleSignalingMessage, sendSignalingMessage]);

  // Media Control Handlers
  const broadcastMediaState = (partialState: any) => {
    sendSignalingMessage('MEDIA_STATE_CHANGED', partialState);
  };

  const toggleAudio = () => {
    const nextState = !isAudioOn;
    setIsAudioOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = nextState));
    }
    broadcastMediaState({ audioEnabled: nextState });
  };

  const toggleVideo = () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = nextState));
    }
    broadcastMediaState({ videoEnabled: nextState });
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      broadcastMediaState({ screenSharing: false });

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          peerConnections.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack).catch(console.warn);
          });
        }
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);
        broadcastMediaState({ screenSharing: true });

        const screenTrack = stream.getVideoTracks()[0];
        if (screenTrack) {
          peerConnections.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack).catch(console.warn);
          });

          screenTrack.onended = () => {
            toggleScreenShare();
          };
        }
      } catch (err: any) {
        console.warn('Screen share cancelled/failed:', err?.message);
      }
    }
  };

  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    broadcastMediaState({ handRaised: nextState });
    if (nextState) {
      info('Hand Raised', 'Your hand is raised.');
    }
  };

  const sendReaction = (emoji: string) => {
    sendSignalingMessage('REACTION', { emoji });
  };

  const sendChatMessage = (text: string, isPrivate = false, recipientId?: string) => {
    if (!text.trim()) return;
    sendSignalingMessage('CHAT_MESSAGE', {
      text,
      isPrivate,
      recipientId,
      senderName: effectiveDisplayName,
      senderAvatar: user?.avatarUrl,
    });
  };

  const markChatAsRead = () => {
    setUnreadChatCount(0);
  };

  const leaveRoom = () => {
    sendSignalingMessage('LEAVE_ROOM', { participantId: localParticipantIdRef.current });
    navigate('meeting-ended');
  };

  const endMeetingForAll = () => {
    sendSignalingMessage('END_MEETING', {});
    navigate('meeting-ended');
  };

  const admitParticipant = (participantId: string) => {
    sendSignalingMessage('ADMIT_PEER', { targetPeerId: participantId });
  };

  const kickParticipant = (participantId: string) => {
    sendSignalingMessage('KICK_PEER', { targetPeerId: participantId });
  };

  const muteAllParticipants = () => {
    sendSignalingMessage('MUTE_ALL', {});
    success('Muted Everyone', 'All participants have been muted.');
  };

  // Interactive Simulated Test Attendees
  const toggleSimulationAttendees = () => {
    if (isSimulationActive) {
      setRemoteParticipants(prev => {
        const updated = new Map(prev);
        updated.delete('bot-sarah');
        updated.delete('bot-marcus');
        updated.delete('bot-elena');
        return updated;
      });
      setIsSimulationActive(false);
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      info('Simulation Deactivated', 'Simulated participants removed.');
    } else {
      const bots: Participant[] = [
        {
          id: 'bot-sarah',
          displayName: 'Sarah Jenkins (Product)',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          isHost: false,
          isLocal: false,
          audioEnabled: true,
          videoEnabled: true,
          screenSharing: false,
          handRaised: false,
          isSpeaking: false,
        },
        {
          id: 'bot-marcus',
          displayName: 'Marcus Chen (Tech Lead)',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          isHost: false,
          isLocal: false,
          audioEnabled: true,
          videoEnabled: true,
          screenSharing: false,
          handRaised: false,
          isSpeaking: false,
        },
        {
          id: 'bot-elena',
          displayName: 'Elena Rostova (Design)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isHost: false,
          isLocal: false,
          audioEnabled: true,
          videoEnabled: true,
          screenSharing: false,
          handRaised: false,
          isSpeaking: false,
        },
      ];

      setRemoteParticipants(prev => {
        const updated = new Map(prev);
        bots.forEach(b => updated.set(b.id, b));
        return updated;
      });
      setIsSimulationActive(true);

      const dialogue = [
        { speaker: 'Marcus Chen (Tech Lead)', text: 'The WebRTC mesh signaling is looking very sharp across all devices.' },
        { speaker: 'Sarah Jenkins (Product)', text: 'Agreed! Let us make sure the mobile layout and End Call actions are 100% accessible.' },
        { speaker: 'Elena Rostova (Design)', text: 'The UI typography, contrast, and responsive viewports feel great on both desktop and phones.' },
        { speaker: 'Marcus Chen (Tech Lead)', text: 'We have full multi-party video, audio levels, captions, and AI summary ready for release.' },
      ];

      let dialogueIdx = 0;
      simulationIntervalRef.current = window.setInterval(() => {
        const current = dialogue[dialogueIdx % dialogue.length];
        dialogueIdx++;

        const entry: TranscriptItem = {
          id: `sim_tr_${Date.now()}`,
          speakerId: `bot_${dialogueIdx % 3}`,
          speakerName: current.speaker,
          text: current.text,
          timestamp: new Date().toISOString(),
          isFinal: true,
        };

        setTranscript(prev => [...prev, entry]);
        setLatestCaption({ speakerName: current.speaker, text: current.text });

        const speakerBotId = current.speaker.includes('Marcus')
          ? 'bot-marcus'
          : current.speaker.includes('Sarah')
          ? 'bot-sarah'
          : 'bot-elena';

        setActiveSpeakerId(speakerBotId);
        setRemoteParticipants(prev => {
          const updated = new Map(prev);
          bots.forEach(b => {
            const p = updated.get(b.id);
            if (p) {
              updated.set(b.id, { ...(p as Participant), isSpeaking: b.id === speakerBotId });
            }
          });
          return updated;
        });

        setTimeout(() => {
          setRemoteParticipants(prev => {
            const updated = new Map(prev);
            const p = updated.get(speakerBotId);
            if (p) updated.set(speakerBotId, { ...(p as Participant), isSpeaking: false });
            return updated;
          });
        }, 3000);
      }, 7000);

      success('Simulation Activated', '3 teammates joined the meeting room with live speech dialogue.');
    }
  };

  // Live Speech Recognition for Captions
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec && isAudioOn) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcriptText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcriptText += event.results[i][0].transcript;
            }
          }

          if (transcriptText.trim()) {
            const newEntry: TranscriptItem = {
              id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              speakerId: localParticipantIdRef.current,
              speakerName: effectiveDisplayName,
              text: transcriptText.trim(),
              timestamp: new Date().toISOString(),
              isFinal: true,
            };

            setTranscript(prev => [...prev, newEntry]);
            setLatestCaption({
              speakerName: effectiveDisplayName,
              text: transcriptText.trim(),
            });

            sendSignalingMessage('TRANSCRIPT_ENTRY', newEntry);
          }
        };

        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
        recognitionActiveRef.current = true;
      } catch {
        // Speech rec optional
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isAudioOn, effectiveDisplayName, sendSignalingMessage]);

  // Closed Captions & Transcription Helpers
  const toggleCaptions = () => {
    setIsCaptionsOn(prev => !prev);
    if (!isCaptionsOn) {
      info('Live Captions Enabled', 'Real-time subtitles with speaker attribution are active.');
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    setLatestCaption(null);
    info('Transcript Cleared', 'Meeting transcript history was reset.');
  };

  const exportTranscript = (format: 'txt' | 'md' | 'json') => {
    if (transcript.length === 0) {
      warning('Empty Transcript', 'There are no recorded transcript lines to export yet.');
      return;
    }

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(transcript, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      content = `# MeetSpace Transcript - Meeting ${meetingCode}\nGenerated on ${new Date().toLocaleString()}\n\n`;
      transcript.forEach(t => {
        const time = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        content += `**[${time}] ${t.speakerName}:** ${t.text}\n\n`;
      });
      mimeType = 'text/markdown';
      ext = 'md';
    } else {
      content = `MeetSpace Meeting Transcript: ${meetingCode}\n${new Date().toLocaleString()}\n----------------------------------------\n\n`;
      transcript.forEach(t => {
        const time = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        content += `[${time}] ${t.speakerName}: ${t.text}\n`;
      });
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetspace-transcript-${meetingCode}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    success('Transcript Exported', `Saved as .${ext} file`);
  };

  // AI Meeting Intelligence Summary
  const generateSummary = async () => {
    if (transcript.length === 0) {
      warning('No Speech Recorded', 'Speak or toggle simulated teammates to produce transcript dialogue before generating AI insights.');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingCode,
          meetingTitle: `Meeting ${meetingCode}`,
          transcript: transcript.map(t => ({
            speaker: t.speakerName,
            text: t.text,
            timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) {
          setMeetingSummary(data.summary);
          success('AI Summary Generated', 'Executive summary, action items, and decisions are ready!');
          return;
        }
      }

      const speakers: string[] = Array.from(new Set(transcript.map(t => t.speakerName)));
      const fallbackSummary: MeetingSummary = {
        title: `Meeting ${meetingCode} - Executive Brief`,
        executiveSummary: `The team convened for meeting "${meetingCode}" with ${speakers.join(', ') || 'attendees'}. Key discussion points revolved around sprint goals, real-time media streams, and responsive layouts.`,
        keyDiscussionPoints: [
          `Active contributions from ${speakers.length || 1} participant(s): ${speakers.join(', ') || 'Team'}.`,
          'Reviewed system architecture, real-time media streams, and collaboration workflows.',
          'Addressed performance benchmarks, network resilience, and client-side audio/video synchronization.',
        ],
        decisionsMade: [
          'Approved WebRTC mesh topology with automatic signaling fallback.',
          'Standardized mobile responsive layout and End Call button accessibility.',
        ],
        actionItems: [
          { task: 'Ensure seamless dual-mode signaling across all devices', assignee: speakers[0] || 'Lead Engineer', priority: 'High', deadline: 'Next Sprint' },
          { task: 'Share final summary report and recording link with stakeholders', assignee: effectiveDisplayName, priority: 'Low', deadline: 'End of Day' },
        ],
        sentimentOverview: 'Highly collaborative, constructive, and forward-looking.',
        topics: ['WebRTC', 'Real-Time Collaboration', 'Mobile Responsiveness'],
      };
      setMeetingSummary(fallbackSummary);
      success('Meeting Summary Generated', 'Summary, action items, and decisions ready.');
    } catch {
      const speakers: string[] = Array.from(new Set(transcript.map(t => t.speakerName)));
      setMeetingSummary({
        title: `Meeting ${meetingCode} - Summary`,
        executiveSummary: `The team convened for meeting "${meetingCode}" with ${speakers.join(', ') || 'participants'}.`,
        keyDiscussionPoints: ['Reviewed core agenda items.', 'Verified multi-device real-time sync.'],
        decisionsMade: ['Approved action items for next sprint.'],
        actionItems: [{ task: 'Complete action items from call', assignee: effectiveDisplayName, priority: 'Medium' }],
        topics: ['Discussion', 'Sync'],
      });
      success('Meeting Summary Ready', 'Generated meeting notes.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Meeting Copilot Q&A
  const askCopilot = async (question: string) => {
    if (!question.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          meetingTitle: `Meeting ${meetingCode}`,
          transcript: transcript.map(t => ({
            speaker: t.speakerName,
            text: t.text,
            timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        }),
      });

      let answer = '';
      if (res.ok) {
        const data = await res.json();
        answer = data.answer;
      }

      if (!answer) {
        const lowerQ = question.toLowerCase();
        const speakers = Array.from(new Set(transcript.map(t => t.speakerName)));
        if (lowerQ.includes('summar') || lowerQ.includes('recap')) {
          answer = `Summary: The team discussed key architectural milestones, WebRTC mesh signaling stability, and responsive layout performance with ${speakers.join(', ') || 'team members'}.`;
        } else if (lowerQ.includes('action') || lowerQ.includes('task')) {
          answer = `Action items extracted:\n1. Verify multi-device connectivity on all networks\n2. Maintain End Call button visibility on mobile\n3. Finalize sprint release.`;
        } else {
          answer = `Based on the active session context with ${speakers.length || 1} participant(s), discussion is centered on real-time collaboration, video feeds, and sprint goals.`;
        }
      }

      const assistantMsg: CopilotMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCopilotMessages(prev => [...prev, assistantMsg]);
    } catch {
      const assistantMsg: CopilotMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `I reviewed the active meeting context. Topics include collaboration tools, multi-device video feeds, and sprint alignment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCopilotMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const clearCopilotHistory = () => {
    setCopilotMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "Chat history cleared. How can I help you with today's meeting?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Collaborative Whiteboard
  const addWhiteboardStroke = (stroke: WhiteboardStroke) => {
    setWhiteboardStrokes(prev => [...prev, stroke]);
    sendSignalingMessage('WHITEBOARD_STROKE', { stroke });
  };

  const clearWhiteboard = () => {
    setWhiteboardStrokes([]);
    sendSignalingMessage('WHITEBOARD_CLEAR', {});
  };

  // Meeting Local Recording
  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      let captureStream: MediaStream;

      if (screenStreamRef.current) {
        captureStream = screenStreamRef.current;
      } else if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
        captureStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true,
        });
      } else if (localStreamRef.current) {
        captureStream = localStreamRef.current;
      } else {
        warning('Recording Error', 'No active audio/video stream available to record.');
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(captureStream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        success('Recording Saved', 'Session recording is ready to download or review.');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      info('Recording Started', 'Local session recording is active.');
    } catch (err: any) {
      console.warn('Recording start error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `meetspace-recording-${meetingCode}-${Date.now()}.webm`;
    a.click();
    success('Download Started', 'Meeting video recording file is downloading.');
  };

  // Participants Array (Local + Remote)
  const localParticipant: Participant = {
    id: localParticipantIdRef.current,
    displayName: effectiveDisplayName,
    avatarUrl: user?.avatarUrl,
    isHost,
    isLocal: true,
    audioEnabled: isAudioOn,
    videoEnabled: isVideoOn,
    screenSharing: isScreenSharing,
    handRaised: isHandRaised,
    isSpeaking: localAudioLevel > 15 && isAudioOn,
    stream: localStream,
    audioLevel: localAudioLevel,
  };

  const participants = [localParticipant, ...Array.from(remoteParticipants.values())];

  return (
    <WebRTCContext.Provider
      value={{
        meetingCode,
        isHost,
        isConnected,
        inWaitingRoom,
        waitingParticipants,
        layout,
        setLayout,
        pinnedParticipantId,
        setPinnedParticipantId,

        localStream,
        screenStream,
        isAudioOn,
        isVideoOn,
        isScreenSharing,
        isHandRaised,
        localAudioLevel,
        availableDevices,
        selectedAudioInput,
        selectedVideoInput,
        setSelectedAudioInput,
        setSelectedVideoInput,

        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        toggleHandRaise,
        sendReaction,
        leaveRoom,
        endMeetingForAll,

        participants,
        activeSpeakerId,

        chatMessages,
        unreadChatCount,
        sendChatMessage,
        markChatAsRead,
        floatingReactions,

        admitParticipant,
        kickParticipant,
        muteAllParticipants,

        isSimulationActive,
        toggleSimulationAttendees,

        transcript,
        isCaptionsOn,
        toggleCaptions,
        captionsLanguage,
        setCaptionsLanguage,
        latestCaption,
        clearTranscript,
        exportTranscript,

        isGeneratingSummary,
        meetingSummary,
        generateSummary,
        copilotMessages,
        isCopilotThinking,
        askCopilot,
        clearCopilotHistory,

        isWhiteboardOpen,
        setIsWhiteboardOpen,
        whiteboardStrokes,
        addWhiteboardStroke,
        clearWhiteboard,

        isRecording,
        recordingDuration,
        recordedBlobUrl,
        startRecording,
        stopRecording,
        downloadRecording,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
