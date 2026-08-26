export type Route = 
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'dashboard'
  | 'scheduled-meetings'
  | 'meeting-history'
  | 'profile-settings'
  | 'room-preview'
  | 'meeting-room'
  | 'meeting-ended';

export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export type MeetingStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface Meeting {
  id: string;
  meetingCode: string;
  title: string;
  hostId: string;
  hostName: string;
  status: MeetingStatus;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  participantCount?: number;
  allowGuests: boolean;
  waitingRoomEnabled: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export type MeetingLayout = 'grid' | 'spotlight' | 'sidebar';

export interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  inWaitingRoom?: boolean;
  stream?: MediaStream | null;
  audioLevel?: number;
  joinedAt?: string;
}

export interface ChatMessage {
  id: string;
  meetingCode: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isPrivate?: boolean;
  recipientId?: string;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  senderName: string;
  emoji: string;
  xOffset: number; // 10% - 90%
}

export interface MediaDeviceSetting {
  audioInputId?: string;
  audioOutputId?: string;
  videoInputId?: string;
}

export interface TranscriptItem {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface ActionItem {
  task: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
}

export interface MeetingSummary {
  title: string;
  executiveSummary: string;
  keyDiscussionPoints: string[];
  keyPoints?: string[];
  decisionsMade: string[];
  decisions?: string[];
  nextSteps?: string[];
  actionItems: ActionItem[];
  sentimentOverview?: string;
  topics: string[];
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: string;
}

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  type?: 'pen' | 'highlighter' | 'line' | 'rectangle' | 'circle' | 'rect' | 'arrow' | 'text' | 'sticky' | 'eraser';
  tool?: 'pen' | 'highlighter' | 'line' | 'rectangle' | 'circle' | 'eraser';
  color: string;
  size?: number;
  width?: number;
  points: WhiteboardPoint[];
  text?: string;
  bgColor?: string;
}

export interface RecordingState {
  isRecording: boolean;
  recordingDuration: number;
  recordedBlobUrl: string | null;
  recordedBlobSize?: number;
}


