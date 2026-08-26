import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { authRouter } from './server/authRoutes';
import { meetingRouter } from './server/meetingRoutes';
import { aiRouter } from './server/aiRoutes';
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

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Signaling Server
const wss = new WebSocketServer({ server, path: '/ws/signaling' });

interface ClientSession {
  ws: WebSocket;
  participantId: string;
  meetingCode: string;
  displayName: string;
  isHost: boolean;
  avatarUrl?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  inWaitingRoom: boolean;
}

const rooms = new Map<string, Map<string, ClientSession>>();

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

          if (!rooms.has(currentRoomCode)) {
            rooms.set(currentRoomCode, new Map());
          }

          const room = rooms.get(currentRoomCode)!;
          const isFirst = room.size === 0;

          const session: ClientSession = {
            ws,
            participantId: currentParticipantId,
            meetingCode: currentRoomCode,
            displayName: payload.displayName || 'Attendee',
            isHost: payload.isHost ?? isFirst,
            avatarUrl: payload.avatarUrl,
            audioEnabled: payload.audioEnabled ?? true,
            videoEnabled: payload.videoEnabled ?? true,
            screenSharing: false,
            handRaised: false,
            inWaitingRoom: payload.inWaitingRoom ?? false,
          };

          room.set(currentParticipantId, session);

          // Notify existing participants of new peer
          room.forEach((client, peerId) => {
            if (peerId !== currentParticipantId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'PEER_JOINED',
                meetingCode: currentRoomCode,
                payload: {
                  participant: {
                    id: session.participantId,
                    displayName: session.displayName,
                    avatarUrl: session.avatarUrl,
                    isHost: session.isHost,
                    audioEnabled: session.audioEnabled,
                    videoEnabled: session.videoEnabled,
                    screenSharing: session.screenSharing,
                    handRaised: session.handRaised,
                    inWaitingRoom: session.inWaitingRoom,
                  },
                },
              }));
            }
          });

          // Send list of current peers to the joining client
          const existingParticipants = Array.from(room.values())
            .filter(c => c.participantId !== currentParticipantId)
            .map(c => ({
              id: c.participantId,
              displayName: c.displayName,
              avatarUrl: c.avatarUrl,
              isHost: c.isHost,
              audioEnabled: c.audioEnabled,
              videoEnabled: c.videoEnabled,
              screenSharing: c.screenSharing,
              handRaised: c.handRaised,
              inWaitingRoom: c.inWaitingRoom,
            }));

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            meetingCode: currentRoomCode,
            payload: {
              participantId: currentParticipantId,
              isHost: session.isHost,
              participants: existingParticipants,
            },
          }));
          break;
        }

        case 'SIGNAL_OFFER':
        case 'SIGNAL_ANSWER':
        case 'SIGNAL_ICE_CANDIDATE': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const targetPeer = room.get(payload.targetPeerId);
          if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
            targetPeer.ws.send(JSON.stringify({
              type,
              meetingCode: currentRoomCode,
              payload: {
                senderPeerId: currentParticipantId,
                ...payload,
              },
            }));
          }
          break;
        }

        case 'MEDIA_STATE_CHANGED': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (session) {
            if (payload.audioEnabled !== undefined) session.audioEnabled = payload.audioEnabled;
            if (payload.videoEnabled !== undefined) session.videoEnabled = payload.videoEnabled;
            if (payload.screenSharing !== undefined) session.screenSharing = payload.screenSharing;
            if (payload.handRaised !== undefined) session.handRaised = payload.handRaised;

            // Broadcast state update to everyone in room
            room.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'PEER_MEDIA_STATE_CHANGED',
                  meetingCode: currentRoomCode,
                  payload: {
                    participantId: currentParticipantId,
                    audioEnabled: session.audioEnabled,
                    videoEnabled: session.videoEnabled,
                    screenSharing: session.screenSharing,
                    handRaised: session.handRaised,
                  },
                }));
              }
            });
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (!session) return;

          const savedMessage = storage.addMessage({
            meetingCode: currentRoomCode,
            senderId: session.participantId,
            senderName: session.displayName,
            senderAvatar: session.avatarUrl,
            text: payload.text,
            isPrivate: payload.isPrivate,
            recipientId: payload.recipientId,
          });

          if (payload.isPrivate && payload.recipientId) {
            // Private message: Send only to recipient and sender
            const recipient = room.get(payload.recipientId);
            if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
              recipient.ws.send(JSON.stringify({
                type: 'CHAT_MESSAGE_RECEIVED',
                meetingCode: currentRoomCode,
                payload: { message: savedMessage },
              }));
            }
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'CHAT_MESSAGE_RECEIVED',
                meetingCode: currentRoomCode,
                payload: { message: savedMessage },
              }));
            }
          } else {
            // Broadcast to all participants
            room.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'CHAT_MESSAGE_RECEIVED',
                  meetingCode: currentRoomCode,
                  payload: { message: savedMessage },
                }));
              }
            });
          }
          break;
        }

        case 'REACTION': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          room.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'REACTION_RECEIVED',
                meetingCode: currentRoomCode,
                payload: {
                  participantId: currentParticipantId,
                  displayName: session?.displayName || 'Attendee',
                  emoji: payload.emoji,
                },
              }));
            }
          });
          break;
        }

        case 'WHITEBOARD_STROKE': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.forEach((client, peerId) => {
            if (peerId !== currentParticipantId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'WHITEBOARD_STROKE_RECEIVED',
                meetingCode: currentRoomCode,
                payload: {
                  participantId: currentParticipantId,
                  stroke: payload.stroke,
                },
              }));
            }
          });
          break;
        }

        case 'WHITEBOARD_CLEAR': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.forEach((client, peerId) => {
            if (peerId !== currentParticipantId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'WHITEBOARD_CLEAR_RECEIVED',
                meetingCode: currentRoomCode,
              }));
            }
          });
          break;
        }

        case 'TRANSCRIPT_ENTRY': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          room.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'TRANSCRIPT_ENTRY_RECEIVED',
                meetingCode: currentRoomCode,
                payload: {
                  id: payload.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  speakerId: currentParticipantId,
                  speakerName: session?.displayName || payload.speakerName || 'Attendee',
                  text: payload.text,
                  timestamp: payload.timestamp || new Date().toISOString(),
                  isFinal: payload.isFinal ?? true,
                },
              }));
            }
          });
          break;
        }

        case 'AUDIO_SPEAKING_UPDATE': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.forEach((client, peerId) => {
            if (peerId !== currentParticipantId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'PEER_SPEAKING_UPDATE',
                meetingCode: currentRoomCode,
                payload: {
                  participantId: currentParticipantId,
                  isSpeaking: payload.isSpeaking,
                  audioLevel: payload.audioLevel,
                },
              }));
            }
          });
          break;
        }

        case 'ADMIT_PEER': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return; // Only host can admit

          const target = room.get(payload.targetPeerId);
          if (target) {
            target.inWaitingRoom = false;
            if (target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(JSON.stringify({
                type: 'ADMITTED_TO_ROOM',
                meetingCode: currentRoomCode,
              }));
            }

            // Broadcast peer joined to everyone
            room.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'PEER_JOINED',
                  meetingCode: currentRoomCode,
                  payload: {
                    participant: {
                      id: target.participantId,
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
                }));
              }
            });
          }
          break;
        }

        case 'KICK_PEER': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return; // Only host can kick

          const target = room.get(payload.targetPeerId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'KICKED_FROM_ROOM',
              meetingCode: currentRoomCode,
              payload: { reason: 'Removed by host' },
            }));
          }
          handleLeave(currentRoomCode, payload.targetPeerId);
          break;
        }

        case 'MUTE_ALL': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          room.forEach((client, peerId) => {
            if (peerId !== currentParticipantId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'FORCE_MUTE_AUDIO',
                meetingCode: currentRoomCode,
              }));
            }
          });
          break;
        }

        case 'END_MEETING': {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const session = room.get(currentParticipantId);
          if (!session?.isHost) return;

          room.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'MEETING_ENDED_BY_HOST',
                meetingCode: currentRoomCode,
              }));
            }
          });
          rooms.delete(currentRoomCode);
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentRoomCode && currentParticipantId) {
            handleLeave(currentRoomCode, currentParticipantId);
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

  const handleLeave = (roomCode: string, participantId: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.delete(participantId);

    room.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'PEER_LEFT',
          meetingCode: roomCode,
          payload: { participantId },
        }));
      }
    });

    if (room.size === 0) {
      rooms.delete(roomCode);
    }
  };

  ws.on('close', () => {
    if (currentRoomCode && currentParticipantId) {
      handleLeave(currentRoomCode, currentParticipantId);
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
