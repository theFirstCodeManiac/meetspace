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
  ],
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

  // --- Phase 4: AI & Collaboration Enhancements ---
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

  // --- Phase 4 State Hooks ---
  // Transcription & Live Captions
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

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);
  const localParticipantIdRef = useRef<string>(`usr_${Math.random().toString(36).substring(2, 9)}`);

  const effectiveDisplayName = user?.displayName || guestName || 'Guest Attendee';

  // 1. Enumerate Media Devices
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

  // 2. Initialize Local Audio & Video Stream
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

        // Apply initial mute states
        stream.getAudioTracks().forEach(t => (t.enabled = initialAudio));
        stream.getVideoTracks().forEach(t => (t.enabled = initialVideo));

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Setup audio level analyzer
        setupAudioAnalyzer(stream);
        updateDeviceList();
      } catch (err: any) {
        console.warn('Local media access note:', err?.message);
        // Fallback with empty or audio-only if video failed
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (active) {
            localStreamRef.current = audioOnlyStream;
            setLocalStream(audioOnlyStream);
            setIsVideoOn(false);
            setupAudioAnalyzer(audioOnlyStream);
          }
        } catch {
          // No media devices available
        }
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
  }, [selectedAudioInput, selectedVideoInput, updateDeviceList]);

  // Audio level visualizer loop
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSpeakingEmit = 0;

      const analyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setLocalAudioLevel(normalized);

        const isSpeaking = normalized > 15 && isAudioOn;
        const now = Date.now();

        // Throttle broadcast of speaking indicator to once every 300ms
        if (now - lastSpeakingEmit > 300 && wsRef.current?.readyState === WebSocket.OPEN) {
          lastSpeakingEmit = now;
          wsRef.current.send(JSON.stringify({
            type: 'AUDIO_SPEAKING_UPDATE',
            meetingCode,
            payload: {
              isSpeaking,
              audioLevel: normalized,
            },
          }));
        }

        audioAnimFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch {
      // Audio context analyzer optional
    }
  };

  // 3. Connect to WebSocket Signaling Server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/signaling`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join Room
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        meetingCode,
        payload: {
          participantId: localParticipantIdRef.current,
          displayName: effectiveDisplayName,
          avatarUrl: user?.avatarUrl,
          audioEnabled: isAudioOn,
          videoEnabled: isVideoOn,
        },
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'ROOM_JOINED': {
            setIsHost(payload.isHost);
            const initialPeers = new Map<string, Participant>();
            payload.participants.forEach((p: any) => {
              initialPeers.set(p.id, {
                id: p.id,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                isHost: p.isHost,
                isLocal: false,
                audioEnabled: p.audioEnabled,
                videoEnabled: p.videoEnabled,
                screenSharing: p.screenSharing,
                handRaised: p.handRaised,
                isSpeaking: false,
                inWaitingRoom: p.inWaitingRoom,
              });
              // Initiate WebRTC peer connection to existing participants
              createPeerConnection(p.id, true);
            });
            setRemoteParticipants(initialPeers);
            break;
          }

          case 'PEER_JOINED': {
            const newP = payload.participant;
            setRemoteParticipants((prev: Map<string, Participant>) => {
              const updated = new Map<string, Participant>(prev);
              updated.set(newP.id, {
                id: newP.id,
                displayName: newP.displayName,
                avatarUrl: newP.avatarUrl,
                isHost: newP.isHost,
                isLocal: false,
                audioEnabled: newP.audioEnabled,
                videoEnabled: newP.videoEnabled,
                screenSharing: newP.screenSharing,
                handRaised: newP.handRaised,
                isSpeaking: false,
                inWaitingRoom: newP.inWaitingRoom,
              });
              return updated;
            });
            createPeerConnection(newP.id, false);
            info('Participant Joined', `${newP.displayName} entered the meeting.`);
            break;
          }

          case 'PEER_LEFT': {
            const peerId = payload.participantId;
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
            await handleOffer(payload.senderPeerId, payload.offer);
            break;
          }

          case 'SIGNAL_ANSWER': {
            await handleAnswer(payload.senderPeerId, payload.answer);
            break;
          }

          case 'SIGNAL_ICE_CANDIDATE': {
            await handleIceCandidate(payload.senderPeerId, payload.candidate);
            break;
          }

          case 'PEER_MEDIA_STATE_CHANGED': {
            const { participantId, audioEnabled, videoEnabled, screenSharing, handRaised } = payload;
            setRemoteParticipants((prev: Map<string, Participant>) => {
              const updated = new Map<string, Participant>(prev);
              const peer = updated.get(participantId);
              if (peer) {
                const updatedPeer: Participant = {
                  ...peer,
                  audioEnabled: audioEnabled !== undefined ? audioEnabled : peer.audioEnabled,
                  videoEnabled: videoEnabled !== undefined ? videoEnabled : peer.videoEnabled,
                  screenSharing: screenSharing !== undefined ? screenSharing : peer.screenSharing,
                  handRaised: handRaised !== undefined ? handRaised : peer.handRaised,
                };
                updated.set(participantId, updatedPeer);
              }
              return updated;
            });
            break;
          }

          case 'PEER_SPEAKING_UPDATE': {
            const { participantId, isSpeaking, audioLevel } = payload;
            setRemoteParticipants((prev: Map<string, Participant>) => {
              const updated = new Map<string, Participant>(prev);
              const peer = updated.get(participantId);
              if (peer) {
                const updatedPeer: Participant = {
                  ...peer,
                  isSpeaking,
                  audioLevel,
                };
                updated.set(participantId, updatedPeer);
              }
              return updated;
            });
            if (isSpeaking) {
              setActiveSpeakerId(participantId);
            }
            break;
          }

          case 'CHAT_MESSAGE_RECEIVED': {
            const newMsg = payload.message;
            setChatMessages(prev => [...prev, newMsg]);
            setUnreadChatCount(prev => prev + 1);
            break;
          }

          case 'REACTION_RECEIVED': {
            const { displayName, emoji } = payload;
            const newReaction: FloatingReaction = {
              id: `react_${Date.now()}_${Math.random()}`,
              senderName: displayName,
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
              id: payload.id || `tr_${Date.now()}`,
              speakerId: payload.speakerId,
              speakerName: payload.speakerName,
              text: payload.text,
              timestamp: payload.timestamp || new Date().toISOString(),
              isFinal: payload.isFinal ?? true,
            };

            setTranscript(prev => [...prev, entry]);
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
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'LEAVE_ROOM',
          meetingCode,
        }));
      }
      ws.close();
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
    };
  }, [meetingCode, effectiveDisplayName, user?.avatarUrl, isAudioOn, isVideoOn, info, error, warning, navigate]);

  // WebRTC Mesh Helpers
  const createPeerConnection = (remotePeerId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(remotePeerId)) return;

    try {
      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnections.current.set(remotePeerId, pc);

      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'SIGNAL_ICE_CANDIDATE',
            meetingCode,
            payload: {
              targetPeerId: remotePeerId,
              candidate: event.candidate,
            },
          }));
        }
      };

      // Handle Remote Tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          const peer = updated.get(remotePeerId);
          if (peer) {
            const updatedPeer: Participant = {
              ...peer,
              stream: remoteStream,
            };
            updated.set(remotePeerId, updatedPeer);
          }
          return updated;
        });
      };

      // If initiator, create and send Offer
      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'SIGNAL_OFFER',
                meetingCode,
                payload: {
                  targetPeerId: remotePeerId,
                  offer,
                },
              }));
            }
          } catch (e) {
            console.error('Create offer error:', e);
          }
        };
      }
    } catch (err) {
      console.error('Peer connection init error:', err);
    }
  };

  const handleOffer = async (senderPeerId: string, offer: RTCSessionDescriptionInit) => {
    try {
      let pc = peerConnections.current.get(senderPeerId);
      if (!pc) {
        createPeerConnection(senderPeerId, false);
        pc = peerConnections.current.get(senderPeerId);
      }
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'SIGNAL_ANSWER',
          meetingCode,
          payload: {
            targetPeerId: senderPeerId,
            answer,
          },
        }));
      }
    } catch (err) {
      console.error('Handle offer error:', err);
    }
  };

  const handleAnswer = async (senderPeerId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnections.current.get(senderPeerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Handle answer error:', err);
    }
  };

  const handleIceCandidate = async (senderPeerId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnections.current.get(senderPeerId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Handle ICE candidate error:', err);
    }
  };

  const closePeerConnection = (peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }
  };

  // 4. Media Control Handlers
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
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      broadcastMediaState({ screenSharing: false });
    } else {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: false,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);
        broadcastMediaState({ screenSharing: true });

        // Auto stop when user clicks browser's built-in "Stop Sharing" floating button
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          broadcastMediaState({ screenSharing: false });
        };
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          error('Screen Share Failed', err.message || 'Could not access display media');
        }
      }
    }
  };

  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    broadcastMediaState({ handRaised: next });
    if (next) {
      success('Hand Raised', 'Other participants have been notified.');
    }
  };

  const broadcastMediaState = (partialState: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenSharing?: boolean;
    handRaised?: boolean;
  }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'MEDIA_STATE_CHANGED',
        meetingCode,
        payload: partialState,
      }));
    }
  };

  const sendReaction = (emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'REACTION',
        meetingCode,
        payload: { emoji },
      }));
    }
  };

  const sendChatMessage = (text: string, isPrivate = false, recipientId?: string) => {
    if (!text.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        meetingCode,
        payload: { text, isPrivate, recipientId },
      }));
    }
  };

  const markChatAsRead = () => {
    setUnreadChatCount(0);
  };

  const leaveRoom = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'LEAVE_ROOM',
        meetingCode,
      }));
    }
    navigate('meeting-ended');
  };

  const endMeetingForAll = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'END_MEETING',
        meetingCode,
      }));
    }
    navigate('meeting-ended');
  };

  const admitParticipant = (participantId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ADMIT_PEER',
        meetingCode,
        payload: { targetPeerId: participantId },
      }));
    }
  };

  const kickParticipant = (participantId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'KICK_PEER',
        meetingCode,
        payload: { targetPeerId: participantId },
      }));
    }
  };

  const muteAllParticipants = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'MUTE_ALL',
        meetingCode,
      }));
    }
    success('Muted Everyone', 'All participants have been muted.');
  };

  // 5. Interactive Simulated Test Attendees (for solo evaluation and testing)
  const toggleSimulationAttendees = () => {
    if (isSimulationActive) {
      // Remove simulated bots
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
      // Add 3 interactive simulated teammates
      const botSarah: Participant = {
        id: 'bot-sarah',
        displayName: 'Sarah Chen (Design Lead)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        isHost: false,
        isLocal: false,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false,
        handRaised: false,
        isSpeaking: true,
        audioLevel: 65,
      };

      const botMarcus: Participant = {
        id: 'bot-marcus',
        displayName: 'Marcus Vance (Staff Eng)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        isHost: false,
        isLocal: false,
        audioEnabled: true,
        videoEnabled: false,
        screenSharing: false,
        handRaised: true,
        isSpeaking: false,
        audioLevel: 0,
      };

      const botElena: Participant = {
        id: 'bot-elena',
        displayName: 'Elena Rostova (Product)',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        isHost: false,
        isLocal: false,
        audioEnabled: false,
        videoEnabled: true,
        screenSharing: false,
        handRaised: false,
        isSpeaking: false,
        audioLevel: 0,
      };

      setRemoteParticipants(prev => {
        const updated = new Map(prev);
        updated.set('bot-sarah', botSarah);
        updated.set('bot-marcus', botMarcus);
        updated.set('bot-elena', botElena);
        return updated;
      });

      setIsSimulationActive(true);
      success('Simulation Activated', 'Added 3 interactive teammates to test grid, live captions, AI summaries & moderation.');

      // Simulated dialogue pool
      const dialoguePool = [
        { speaker: 'Sarah Chen', text: "I reviewed the WebRTC mesh latency metrics and p99 is under 42ms across all active rooms." },
        { speaker: 'Marcus Vance', text: "Let's ensure the Gemini AI action items schema extracts owners and priority tags consistently." },
        { speaker: 'Elena Rostova', text: "We need the interactive whiteboard export ready for stakeholders before tomorrow's demo." },
        { speaker: 'Sarah Chen', text: "The new noise suppression filter has eliminated background feedback during multi-speaker calls." },
        { speaker: 'Marcus Vance', text: "Action item on me: finalize the automated STUN/TURN failover integration test suite by Thursday." },
        { speaker: 'Elena Rostova', text: "Agreed. Let's make sure the post-meeting debrief exports both markdown and structured JSON." }
      ];

      let dialogueIndex = 0;

      // Periodically alternate simulated speaker activity, speech transcripts, and reactions
      simulationIntervalRef.current = window.setInterval(() => {
        const speakers = ['bot-sarah', 'bot-marcus', 'bot-elena', null];
        const nextSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
        setActiveSpeakerId(nextSpeaker);

        setRemoteParticipants((prev: Map<string, Participant>) => {
          const updated = new Map<string, Participant>(prev);
          ['bot-sarah', 'bot-marcus', 'bot-elena'].forEach(id => {
            const p = updated.get(id);
            if (p) {
              const speaking = id === nextSpeaker;
              const updatedBot: Participant = {
                ...p,
                isSpeaking: speaking,
                audioLevel: speaking ? 40 + Math.floor(Math.random() * 50) : 0,
              };
              updated.set(id, updatedBot);
            }
          });
          return updated;
        });

        // Generate simulated speech transcripts
        if (nextSpeaker && Math.random() > 0.3) {
          const item = dialoguePool[dialogueIndex % dialoguePool.length];
          dialogueIndex++;

          const simulatedEntry: TranscriptItem = {
            id: `tr_sim_${Date.now()}`,
            speakerId: nextSpeaker,
            speakerName: item.speaker,
            text: item.text,
            timestamp: new Date().toISOString(),
            isFinal: true,
          };

          setTranscript(prev => [...prev, simulatedEntry]);
          setLatestCaption({
            speakerName: simulatedEntry.speakerName,
            text: simulatedEntry.text,
          });
        }

        // Random reaction
        if (Math.random() > 0.6) {
          const emojis = ['👏', '🔥', '❤️', '👍', '🚀'];
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          const names = ['Sarah Chen', 'Marcus Vance', 'Elena Rostova'];
          const name = names[Math.floor(Math.random() * names.length)];
          const newReaction: FloatingReaction = {
            id: `bot_react_${Date.now()}`,
            senderName: name,
            emoji,
            xOffset: 20 + Math.random() * 60,
          };
          setFloatingReactions(prev => [...prev, newReaction]);
          setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        }
      }, 4500);
    }
  };

  // --- Phase 4 Functions ---

  // 6. Speech Recognition Hook for Local User
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && isAudioOn) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current]?.[0]?.transcript?.trim();
          if (transcriptText) {
            const newEntry: TranscriptItem = {
              id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              speakerId: localParticipantIdRef.current,
              speakerName: effectiveDisplayName,
              text: transcriptText,
              timestamp: new Date().toISOString(),
              isFinal: true,
            };

            // Add locally
            setTranscript(prev => [...prev, newEntry]);
            setLatestCaption({
              speakerName: effectiveDisplayName,
              text: transcriptText,
            });

            // Broadcast to room peers
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'TRANSCRIPT_ENTRY',
                meetingCode,
                payload: newEntry,
              }));
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.debug('Speech recognition event:', e.error);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        recognitionActiveRef.current = true;
      } catch (err) {
        console.debug('Speech recognition init note:', err);
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isAudioOn, effectiveDisplayName, meetingCode]);

  // 7. Closed Captions Toggle & Language Translation
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

  // 8. Gemini AI Meeting Intelligence Summary
  const generateSummary = async () => {
    if (transcript.length === 0) {
      warning('No Speech Recorded', 'Speak or toggle simulated attendees to produce transcript dialogue before generating AI insights.');
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

      const data = await res.json();
      if (data.success && data.summary) {
        setMeetingSummary(data.summary);
        success('AI Summary Generated', 'Executive summary, action items, and decisions are ready!');
      } else {
        error('AI Summary Error', data.error || 'Failed to synthesize meeting summary.');
      }
    } catch (err: any) {
      error('Network Error', err.message || 'Could not communicate with AI summary service.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 9. Meeting Copilot Q&A
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

      const data = await res.json();
      const assistantMsg: CopilotMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I checked the meeting context but could not locate specific details.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCopilotMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'I encountered a temporary connection issue. Please try your question again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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

  // 10. Collaborative Whiteboard
  const addWhiteboardStroke = (stroke: WhiteboardStroke) => {
    setWhiteboardStrokes(prev => [...prev, stroke]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'WHITEBOARD_STROKE',
        meetingCode,
        payload: { stroke },
      }));
    }
  };

  const clearWhiteboard = () => {
    setWhiteboardStrokes([]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'WHITEBOARD_CLEAR',
        meetingCode,
      }));
    }
  };

  // 11. Meeting Local Recording Engine
  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      let captureStream: MediaStream;

      // Prefer screen display capture combined with mic audio
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
        throw new Error('No media stream available to record');
      }

      // Add local audio tracks if not present
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          captureStream.addTrack(track.clone());
        });
      }

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(captureStream, { mimeType: mime });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const blobUrl = URL.createObjectURL(fullBlob);
        setRecordedBlobUrl(blobUrl);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        success('Recording Ready', 'Session recording is ready for preview and download.');
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      info('Recording Started', 'Capturing meeting audio, video, and screen sharing.');
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        error('Recording Failed', err.message || 'Unable to start recording');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const downloadRecording = () => {
    if (!recordedBlobUrl) {
      warning('No Recording', 'No completed recording found to download.');
      return;
    }
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `meetspace-recording-${meetingCode}-${Date.now()}.webm`;
    a.click();
    success('Downloaded', 'Meeting video recording saved.');
  };

  // Compile full participants list (local user + remote peers)
  const localParticipant: Participant = {
    id: localParticipantIdRef.current,
    displayName: `${effectiveDisplayName} (You)`,
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

        // Phase 4 additions
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

export const useWebRTC = (): WebRTCContextType => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTC must be used within WebRTCProvider');
  return ctx;
};
