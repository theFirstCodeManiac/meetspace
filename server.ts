import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { authRouter } from './server/authRoutes';
import { meetingRouter } from './server/meetingRoutes';
import { aiRouter } from './server/aiRoutes';
import { signalingRouter, signalingManager, SignalingMessage } from './server/signalingManager';
import { storage } from './server/storage';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness & Readiness Probes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MeetSpace WebRTC & Auth Signaling Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/api/ready', (req, res) => {
  res.json({
    ready: true,
    storage: 'operational',
    signaling: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingRouter);
app.use('/api/ai', aiRouter);
app.use('/api/signaling', signalingRouter);
app.use('/api/meetings/signaling', signalingRouter);

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Signaling Server
const wss = new WebSocketServer({ server, path: '/ws/signaling' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode = '';
  let currentParticipantId = '';

  ws.on('message', (rawData: string) => {
    try {
      const message = JSON.parse(rawData.toString());
      const { type, meetingCode, payload } = message;

      if (!type) return;

      switch (type) {
        case 'JOIN_ROOM': {
          currentRoomCode = (meetingCode || 'default-room').toLowerCase().trim();
          currentParticipantId = payload.participantId || `usr_${Math.random().toString(36).substring(2, 9)}`;

          const result = signalingManager.joinRoom(currentRoomCode, {
            id: currentParticipantId,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
            isHost: payload.isHost,
            audioEnabled: payload.audioEnabled,
            videoEnabled: payload.videoEnabled,
            inWaitingRoom: payload.inWaitingRoom,
            ws,
          });

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            meetingCode: currentRoomCode,
            payload: {
              participantId: currentParticipantId,
              isHost: result.isHost,
              participants: result.participants,
            },
          }));
          break;
        }

        case 'SIGNAL_OFFER':
        case 'SIGNAL_ANSWER':
        case 'SIGNAL_ICE_CANDIDATE': {
          signalingManager.routeMessage({
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type,
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            targetPeerId: payload.targetPeerId,
            payload: {
              senderPeerId: currentParticipantId,
              ...payload,
            },
            timestamp: Date.now(),
          });
          break;
        }

        case 'MEDIA_STATE_CHANGED': {
          signalingManager.routeMessage({
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'PEER_MEDIA_STATE_CHANGED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {
              participantId: currentParticipantId,
              ...payload,
            },
            timestamp: Date.now(),
          });
          break;
        }

        case 'CHAT_MESSAGE': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);

          const savedMessage = storage.addMessage({
            meetingCode: currentRoomCode,
            senderId: currentParticipantId,
            senderName: session?.displayName || payload.senderName || 'Attendee',
            senderAvatar: session?.avatarUrl || payload.senderAvatar,
            text: payload.text,
            isPrivate: payload.isPrivate,
            recipientId: payload.recipientId,
          });

          signalingManager.routeMessage({
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'CHAT_MESSAGE_RECEIVED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            targetPeerId: payload.isPrivate ? payload.recipientId : undefined,
            payload: { message: savedMessage },
            timestamp: Date.now(),
          });
          break;
        }

        case 'REACTION': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'REACTION_RECEIVED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {
              participantId: currentParticipantId,
              displayName: session?.displayName || 'Attendee',
              emoji: payload.emoji,
            },
            timestamp: Date.now(),
          });
          break;
        }

        case 'WHITEBOARD_STROKE': {
          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'WHITEBOARD_STROKE_RECEIVED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {
              participantId: currentParticipantId,
              stroke: payload.stroke,
            },
            timestamp: Date.now(),
          }, currentParticipantId);
          break;
        }

        case 'WHITEBOARD_CLEAR': {
          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'WHITEBOARD_CLEAR_RECEIVED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {},
            timestamp: Date.now(),
          }, currentParticipantId);
          break;
        }

        case 'TRANSCRIPT_ENTRY': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'TRANSCRIPT_ENTRY_RECEIVED',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {
              id: payload.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              speakerId: currentParticipantId,
              speakerName: session?.displayName || payload.speakerName || 'Attendee',
              text: payload.text,
              timestamp: payload.timestamp || new Date().toISOString(),
              isFinal: payload.isFinal ?? true,
            },
            timestamp: Date.now(),
          }, currentParticipantId);
          break;
        }

        case 'AUDIO_SPEAKING_UPDATE': {
          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'PEER_SPEAKING_UPDATE',
            meetingCode: currentRoomCode,
            senderPeerId: currentParticipantId,
            payload: {
              participantId: currentParticipantId,
              isSpeaking: payload.isSpeaking,
              audioLevel: payload.audioLevel,
            },
            timestamp: Date.now(),
          }, currentParticipantId);
          break;
        }

        case 'ADMIT_PEER': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          const target = room.get(payload.targetPeerId);
          if (target) {
            target.inWaitingRoom = false;
            signalingManager.deliverToParticipant(currentRoomCode, payload.targetPeerId, {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              type: 'ADMITTED_TO_ROOM',
              meetingCode: currentRoomCode,
              payload: {},
              timestamp: Date.now(),
            });

            signalingManager.broadcastToRoom(currentRoomCode, {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              type: 'PEER_JOINED',
              meetingCode: currentRoomCode,
              payload: {
                participant: {
                  id: target.id,
                  displayName: target.displayName,
                  avatarUrl: target.avatarUrl,
                  isHost: target.isHost,
                  audioEnabled: target.audioEnabled,
                  videoEnabled: target.videoEnabled,
                  screenSharing: target.screenSharing,
                  handRaised: target.handRaised,
                  inWaitingRoom: false,
                },
              },
              timestamp: Date.now(),
            });
          }
          break;
        }

        case 'KICK_PEER': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          signalingManager.deliverToParticipant(currentRoomCode, payload.targetPeerId, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'KICKED_FROM_ROOM',
            meetingCode: currentRoomCode,
            payload: { reason: 'Removed by host' },
            timestamp: Date.now(),
          });
          signalingManager.leaveRoom(currentRoomCode, payload.targetPeerId);
          break;
        }

        case 'MUTE_ALL': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'FORCE_MUTE_AUDIO',
            meetingCode: currentRoomCode,
            payload: {},
            timestamp: Date.now(),
          }, currentParticipantId);
          break;
        }

        case 'END_MEETING': {
          const room = signalingManager.getRoom(currentRoomCode);
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          signalingManager.broadcastToRoom(currentRoomCode, {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'MEETING_ENDED_BY_HOST',
            meetingCode: currentRoomCode,
            payload: {},
            timestamp: Date.now(),
          });
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentRoomCode && currentParticipantId) {
            signalingManager.leaveRoom(currentRoomCode, currentParticipantId);
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Signaling message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentParticipantId) {
      signalingManager.leaveRoom(currentRoomCode, currentParticipantId);
    }
  });
});

// Vite Middleware for Frontend Integration
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MeetSpace] Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
