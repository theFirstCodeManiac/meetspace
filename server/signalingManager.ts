import { Router, Request, Response } from 'express';
import { WebSocket } from 'ws';
import { storage } from './storage';

export interface SignalingParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  inWaitingRoom: boolean;
  lastSeen: number;
  ws?: WebSocket;
}

export interface SignalingMessage {
  id: string;
  type: string;
  meetingCode: string;
  senderPeerId?: string;
  targetPeerId?: string;
  payload: any;
  timestamp: number;
}

class SignalingManager {
  private rooms = new Map<string, Map<string, SignalingParticipant>>();
  private messageQueues = new Map<string, SignalingMessage[]>(); // key: `${roomCode}:${participantId}`
  private pollWaiters = new Map<string, Array<(messages: SignalingMessage[]) => void>>(); // key: `${roomCode}:${participantId}`

  constructor() {
    // Periodic cleanup of stale participants (silent for > 45s)
    setInterval(() => {
      this.cleanupStaleParticipants();
    }, 15000);
  }

  private getQueueKey(roomCode: string, participantId: string): string {
    return `${roomCode.toLowerCase().trim()}:${participantId}`;
  }

  public getRoom(roomCode: string): Map<string, SignalingParticipant> {
    const code = roomCode.toLowerCase().trim();
    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Map());
    }
    return this.rooms.get(code)!;
  }

  public joinRoom(
    roomCode: string,
    participant: {
      id: string;
      displayName: string;
      avatarUrl?: string;
      isHost?: boolean;
      audioEnabled?: boolean;
      videoEnabled?: boolean;
      inWaitingRoom?: boolean;
      ws?: WebSocket;
    }
  ): { isHost: boolean; participants: SignalingParticipant[] } {
    const code = roomCode.toLowerCase().trim();
    const room = this.getRoom(code);
    const isFirst = room.size === 0;
    const isHost = participant.isHost ?? isFirst;

    const pSession: SignalingParticipant = {
      id: participant.id,
      displayName: participant.displayName || 'Guest',
      avatarUrl: participant.avatarUrl,
      isHost,
      audioEnabled: participant.audioEnabled ?? true,
      videoEnabled: participant.videoEnabled ?? true,
      screenSharing: false,
      handRaised: false,
      inWaitingRoom: participant.inWaitingRoom ?? false,
      lastSeen: Date.now(),
      ws: participant.ws,
    };

    room.set(participant.id, pSession);

    // Notify other peers in the room
    this.broadcastToRoom(code, {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'PEER_JOINED',
      meetingCode: code,
      senderPeerId: participant.id,
      payload: {
        participant: {
          id: pSession.id,
          displayName: pSession.displayName,
          avatarUrl: pSession.avatarUrl,
          isHost: pSession.isHost,
          audioEnabled: pSession.audioEnabled,
          videoEnabled: pSession.videoEnabled,
          screenSharing: pSession.screenSharing,
          handRaised: pSession.handRaised,
          inWaitingRoom: pSession.inWaitingRoom,
        },
      },
      timestamp: Date.now(),
    }, participant.id);

    // Return list of other active peers
    const existingParticipants = Array.from(room.values())
      .filter(p => p.id !== participant.id)
      .map(p => ({
        id: p.id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        isHost: p.isHost,
        audioEnabled: p.audioEnabled,
        videoEnabled: p.videoEnabled,
        screenSharing: p.screenSharing,
        handRaised: p.handRaised,
        inWaitingRoom: p.inWaitingRoom,
        lastSeen: p.lastSeen,
      }));

    return { isHost, participants: existingParticipants };
  }

  public leaveRoom(roomCode: string, participantId: string) {
    const code = roomCode.toLowerCase().trim();
    const room = this.rooms.get(code);
    if (!room) return;

    room.delete(participantId);
    const queueKey = this.getQueueKey(code, participantId);
    this.messageQueues.delete(queueKey);
    this.pollWaiters.delete(queueKey);

    this.broadcastToRoom(code, {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'PEER_LEFT',
      meetingCode: code,
      senderPeerId: participantId,
      payload: { participantId },
      timestamp: Date.now(),
    });

    if (room.size === 0) {
      this.rooms.delete(code);
    }
  }

  public routeMessage(message: SignalingMessage) {
    const code = message.meetingCode.toLowerCase().trim();
    const room = this.rooms.get(code);
    if (!room) return;

    // Update sender heartbeat if known
    if (message.senderPeerId) {
      const sender = room.get(message.senderPeerId);
      if (sender) sender.lastSeen = Date.now();
    }

    if (message.targetPeerId) {
      // Targeted delivery (Offer, Answer, ICE Candidate, Private Chat, etc.)
      this.deliverToParticipant(code, message.targetPeerId, message);
    } else {
      // Room Broadcast
      this.broadcastToRoom(code, message, message.senderPeerId);
    }
  }

  public deliverToParticipant(roomCode: string, participantId: string, message: SignalingMessage) {
    const code = roomCode.toLowerCase().trim();
    const room = this.rooms.get(code);
    const participant = room?.get(participantId);

    // 1. Deliver via WebSocket if open
    if (participant?.ws && participant.ws.readyState === WebSocket.OPEN) {
      try {
        participant.ws.send(JSON.stringify(message));
      } catch (err) {
        console.warn('WS delivery failed, queueing message:', err);
      }
    }

    // 2. Also deliver to HTTP long-polling queue & trigger any waiting long-poll listeners
    const queueKey = this.getQueueKey(code, participantId);
    if (!this.messageQueues.has(queueKey)) {
      this.messageQueues.set(queueKey, []);
    }
    const q = this.messageQueues.get(queueKey)!;
    q.push(message);
    // Keep max 100 messages in queue
    if (q.length > 100) q.shift();

    // Trigger waiters if any
    const waiters = this.pollWaiters.get(queueKey);
    if (waiters && waiters.length > 0) {
      const msgs = [...q];
      q.length = 0; // Clear queue
      this.pollWaiters.delete(queueKey);
      waiters.forEach(resolve => resolve(msgs));
    }
  }

  public broadcastToRoom(roomCode: string, message: SignalingMessage, excludeParticipantId?: string) {
    const code = roomCode.toLowerCase().trim();
    const room = this.rooms.get(code);
    if (!room) return;

    room.forEach((p, pId) => {
      if (excludeParticipantId && pId === excludeParticipantId) return;
      this.deliverToParticipant(code, pId, message);
    });
  }

  public async pollMessages(
    roomCode: string,
    participantId: string,
    timeoutMs = 12000
  ): Promise<SignalingMessage[]> {
    const code = roomCode.toLowerCase().trim();
    const room = this.getRoom(code);
    const p = room.get(participantId);
    if (p) p.lastSeen = Date.now();

    const queueKey = this.getQueueKey(code, participantId);
    const q = this.messageQueues.get(queueKey);

    if (q && q.length > 0) {
      const msgs = [...q];
      q.length = 0;
      return msgs;
    }

    // Wait for new messages with timeout
    return new Promise(resolve => {
      if (!this.pollWaiters.has(queueKey)) {
        this.pollWaiters.set(queueKey, []);
      }
      const waiters = this.pollWaiters.get(queueKey)!;

      const timer = setTimeout(() => {
        // Remove this resolve from waiters
        const idx = waiters.indexOf(resolveWrapper);
        if (idx !== -1) waiters.splice(idx, 1);
        resolve([]);
      }, timeoutMs);

      const resolveWrapper = (msgs: SignalingMessage[]) => {
        clearTimeout(timer);
        resolve(msgs);
      };

      waiters.push(resolveWrapper);
    });
  }

  public touchHeartbeat(roomCode: string, participantId: string) {
    const code = roomCode.toLowerCase().trim();
    const room = this.rooms.get(code);
    const p = room?.get(participantId);
    if (p) p.lastSeen = Date.now();
  }

  private cleanupStaleParticipants() {
    const now = Date.now();
    this.rooms.forEach((room, roomCode) => {
      room.forEach((p, pId) => {
        // If participant has no open websocket and hasn't polled in 45 seconds, remove them
        const isWsActive = p.ws && p.ws.readyState === WebSocket.OPEN;
        if (!isWsActive && now - p.lastSeen > 45000) {
          console.log(`[SignalingManager] Cleaning up stale peer ${pId} in room ${roomCode}`);
          this.leaveRoom(roomCode, pId);
        }
      });
    });
  }
}

export const signalingManager = new SignalingManager();

export const signalingRouter = Router();

// 1. Join Room via HTTP API
signalingRouter.post('/join', (req: Request, res: Response) => {
  try {
    const { meetingCode, participantId, displayName, avatarUrl, isHost, audioEnabled, videoEnabled, inWaitingRoom } = req.body || {};
    if (!meetingCode || !participantId) {
      return res.status(400).json({ error: 'meetingCode and participantId are required' });
    }

    const result = signalingManager.joinRoom(meetingCode, {
      id: participantId,
      displayName,
      avatarUrl,
      isHost,
      audioEnabled,
      videoEnabled,
      inWaitingRoom,
    });

    res.json({
      success: true,
      meetingCode: meetingCode.toLowerCase().trim(),
      participantId,
      isHost: result.isHost,
      participants: result.participants,
    });
  } catch (err: any) {
    console.error('Signaling join error:', err);
    res.status(500).json({ error: err?.message || 'Failed to join signaling room' });
  }
});

// 2. Send Message via HTTP API
signalingRouter.post('/send', (req: Request, res: Response) => {
  try {
    const { meetingCode, type, payload, senderPeerId, targetPeerId } = req.body || {};
    if (!meetingCode || !type) {
      return res.status(400).json({ error: 'meetingCode and type are required' });
    }

    const message: SignalingMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      meetingCode,
      senderPeerId,
      targetPeerId,
      payload: payload || {},
      timestamp: Date.now(),
    };

    // Chat message persistence
    if (type === 'CHAT_MESSAGE') {
      const room = signalingManager.getRoom(meetingCode);
      const sender = senderPeerId ? room.get(senderPeerId) : undefined;
      const savedMessage = storage.addMessage({
        meetingCode: meetingCode.toLowerCase().trim(),
        senderId: senderPeerId || 'anon',
        senderName: sender?.displayName || payload.senderName || 'Attendee',
        senderAvatar: sender?.avatarUrl || payload.senderAvatar,
        text: payload.text,
        isPrivate: payload.isPrivate,
        recipientId: payload.recipientId,
      });
      message.payload = { message: savedMessage };
    }

    signalingManager.routeMessage(message);
    res.json({ success: true, messageId: message.id });
  } catch (err: any) {
    console.error('Signaling send error:', err);
    res.status(500).json({ error: err?.message || 'Failed to send signaling message' });
  }
});

// 3. Poll for Messages via HTTP API (Long-Polling fallback)
signalingRouter.get('/poll', async (req: Request, res: Response) => {
  try {
    const meetingCode = (req.query.meetingCode || req.query.room) as string;
    const participantId = (req.query.participantId || req.query.peerId) as string;

    if (!meetingCode || !participantId) {
      return res.status(400).json({ error: 'meetingCode and participantId are required' });
    }

    const messages = await signalingManager.pollMessages(meetingCode, participantId, 10000);
    res.json({ success: true, messages });
  } catch (err: any) {
    console.error('Signaling poll error:', err);
    res.status(500).json({ error: err?.message || 'Failed to poll signaling messages', messages: [] });
  }
});

// 4. Heartbeat
signalingRouter.post('/heartbeat', (req: Request, res: Response) => {
  const { meetingCode, participantId } = req.body || {};
  if (meetingCode && participantId) {
    signalingManager.touchHeartbeat(meetingCode, participantId);
  }
  res.json({ success: true });
});

// 5. Leave Room
signalingRouter.post('/leave', (req: Request, res: Response) => {
  const { meetingCode, participantId } = req.body || {};
  if (meetingCode && participantId) {
    signalingManager.leaveRoom(meetingCode, participantId);
  }
  res.json({ success: true });
});
