# MeetSpace — Architecture & Technical Specifications

## Executive Summary
MeetSpace is a full-stack, enterprise-grade, real-time video conferencing platform built with React, TypeScript, Express, WebSockets, WebRTC mesh media layer (with architectural path for SFU migration), and secure relational data persistence.

---

## 1. System Topology & Component Overview

```
                           +--------------------------------------------------+
                           |                   Client Browser                 |
                           |   (React 19 + TypeScript + Tailwind + Motion)    |
                           +--------+------------------+-----------------+----+
                                    |                  |                 |
                   HTTPS / REST API |                  | WebSocket (WSS) | WebRTC Media
                      (Port 3000)   |                  | Signaling       | (P2P / Mesh / STUN/TURN)
                                    v                  v                 |
                    +---------------+------------------+--------------+  |
                    |                 Node.js / Express               |  |
                    |                 Application Server              |  |
                    |   +-------------------+  +--------------------+ |  |
                    |   |  REST API Layer   |  | Signaling Gateway  | |  |
                    |   | (Auth, Meetings,  |  |  (Room Router,     | |  |
                    |   |  Users, Admin)    |  |   Events, Sync)    | |  |
                    |   +---------+---------+  +---------+----------+ |  |
                    |             |                      |            |  |
                    |   +---------v----------------------v----------+ |  |
                    |   |      Services & Domain Business Logic     | |  |
                    |   |   (AuthService, MeetingService, etc.)     | |  |
                    |   +--------------------+----------------------+ |  |
                    |                        |                        |  |
                    |   +--------------------v----------------------+ |  |
                    |   |      Persistence / Repository Layer       | |  |
                    |   |           (Relational Engine)             | |  |
                    +---+--------------------+----------------------+----+
                                             |                           ^
                                             v                           |
                               +-----------------------------+           |
                               |  PostgreSQL Database Engine |           |
                               +-----------------------------+           |
                                                                         v
                                                       +-----------------------------+
                                                       |   STUN / TURN Server Pool   |
                                                       |     (Google STUN / Coturn)  |
                                                       +-----------------------------+
```

---

## 2. Frontend Architecture

### Core Tech Stack
- **Framework**: React 19 with Vite
- **Language**: TypeScript (Strict Mode enabled, no `any`)
- **Styling**: Tailwind CSS v4 with refined neutral typography and mathematical spacing
- **Iconography**: Lucide React
- **Animations**: `motion/react` for layout transitions and subtle UI states
- **State Management**: Domain-isolated custom hooks + lightweight reactive stores for media, room state, device inventory, and chat

### Structural Organization
```
src/
├── components/          # Reusable UI primitives (Buttons, Dialogs, Badges, Tooltips, Inputs)
├── features/
│   ├── auth/            # Login, Register, Forgot Password, Reset Password forms & guards
│   ├── dashboard/       # Instant meet, schedule modal, upcoming & previous meetings list
│   ├── room/            # Main meeting room, adaptive video grid, video tiles, pinned speaker
│   ├── controls/        # Meeting control dock (Mic, Cam, Screen, Chat, Participants, Settings, Leave)
│   ├── chat/            # Real-time room chat panel, timestamps, unread badges, markdown safe
│   ├── participants/    # Participant roster, host action triggers, role badges, hand raises
│   ├── waiting-room/    # Host admission queue & guest waiting state view
│   └── settings/        # Device switcher (mic/cam/speaker) & audio level meter visualizer
├── hooks/
│   ├── useAuth.ts               # Authenticated user session & persistence
│   ├── useLocalMedia.ts         # User media streams, track management, hardware constraints
│   ├── useMeetingMedia.ts       # WebRTC peer connections coordinator, ICE candidate queueing
│   ├── useSignalingSocket.ts    # Resilient WebSocket connection with heartbeat & auto-reconnect
│   ├── useScreenShare.ts        # DisplayMedia API track lifecycle & renegotiation
│   ├── useDevices.ts            # MediaDeviceInfo enumeration & dynamic change listeners
│   └── useConnectionQuality.ts  # RTCStatsReport collector (RTT, packet loss, bitrate)
├── lib/
│   ├── api.ts           # Type-safe Fetch REST client with auth token interceptor
│   ├── webrtc.ts        # RTCPeerConnection factories, STUN/TURN config, SDP helpers
│   ├── formatters.ts    # Meeting code formatting, durations, dates
│   └── sound.ts         # Non-blocking audio chimes (join/leave/chat notifications)
├── types/
│   ├── auth.ts          # User, Session, Token types
│   ├── meeting.ts       # Meeting entity, Participant, Role, WaitingStatus
│   ├── signaling.ts     # WebSocket message protocol types & payloads
│   └── webrtc.ts        # Peer state, Stream maps, Track metadata
├── App.tsx              # Application router and layout boundary
├── main.tsx             # React DOM root
└── index.css            # Tailwind CSS root styling
```

---

## 3. Backend Architecture

### Server Layer
- **Engine**: Node.js with Express & `ws` (native WebSocket server integrated into HTTP server)
- **Port & Host**: Bind to `0.0.0.0:3000`
- **Vite Integration**: In development, Vite runs via Express middleware; in production, static assets are served from `dist/` with SPA fallback.

### Structural Organization
```
server/
├── controllers/         # HTTP request handlers (Auth, Meetings, Participants, Users)
├── middleware/          # JWT/Session authentication, rate-limiting, error handling, input validation
├── services/            # Pure business logic (AuthService, MeetingService, TokenService)
├── websocket/
│   ├── signalingServer.ts # WebSocket server lifecycle, connection auth, heartbeat
│   ├── roomManager.ts     # In-memory fast room roster, participant mapping, state broadcast
│   └── messageRouter.ts   # Event dispatcher with strict authorization guards
├── db/                  # Relational database schema, connection pool, migrations
├── utils/               # Password hashing (Argon2/bcrypt), crypto token generators, logger
└── config/              # Environment variables, STUN/TURN list, JWT secret loader
```

---

## 4. Database Architecture & Schema

### Entities & Relationships
1. **`users`**: Unique email, hashed password, display name, avatar URL, verification status, timestamps.
2. **`sessions`**: User session tokens, expiry, IP, user-agent, revoked status.
3. **`meetings`**: Unique 9-character code (`xxx-yyyy-zzz`), host ID (FK to users), title, status (`SCHEDULED`, `ACTIVE`, `ENDED`), scheduled start time, guest allowance flag, waiting room flag, participant limit, timestamps.
4. **`meeting_participants`**: Meeting ID (FK), User ID (FK, nullable for guests), display name, role (`HOST`, `CO_HOST`, `PARTICIPANT`), join time, leave time, current media states (muted, video off, screen sharing).
5. **`meeting_messages`**: Meeting ID (FK), Sender ID / name, message content, authoritative server timestamp.
6. **`scheduled_meetings`**: Metadata, recurrence rules, invitee emails.

---

## 5. WebRTC & Media Pipeline Architecture

### Media Topology: Hybrid Peer-to-Peer Mesh with SFU-Ready Abstraction
- For small rooms (1–8 participants), full-mesh peer connections provide zero-transcoding latency, end-to-end privacy, and zero server bandwidth overhead.
- Peer connection state is fully isolated behind the `useMeetingMedia` facade, creating an abstraction layer that can cleanly switch to an SFU (e.g., LiveKit or Mediasoup) by replacing the signaling and peer-connection transport adapter.

```
                    +--------------------------+
                    |  useMeetingMedia Hook    |
                    +------------+-------------+
                                 |
           +---------------------+--------------------+
           v                                          v
+-----------------------+                  +----------------------+
| MeshPeerTransport     |                  | SFUTransportAdapter  |
| (Current: P2P Mesh)   |                  | (Future Extension)   |
+-----------------------+                  +----------------------+
```

### ICE Candidate & SDP Negotiation Flow
1. **Join Notification**: New participant joins room -> Server notifies all existing peers with `participant:joined`.
2. **Polite/Impolite Peer Pattern**: Perfect negotiation pattern handles SDP offer/answer glare cleanly.
3. **Candidate Trickle**: ICE candidates are queued if remote description is not yet set, preventing dropped candidate races.
4. **Track Lifecycle**: `addTrack` and `replaceTrack` APIs allow seamless switching between Camera and Screen Share streams without full renegotiation.

---

## 6. Realtime WebSocket Signaling Protocol

Every message adheres to a standardized JSON schema:
```json
{
  "type": "webrtc:offer",
  "requestId": "uuid-v4",
  "meetingCode": "abc-defg-hij",
  "payload": { ... }
}
```

### Key Event Types:
- `meeting:join` / `meeting:joined` / `meeting:leave`
- `participant:joined` / `participant:left` / `participant:updated`
- `webrtc:offer` / `webrtc:answer` / `webrtc:ice-candidate`
- `media:state_changed` (mic, camera, screen share)
- `chat:message` / `chat:broadcast`
- `waiting:request` / `waiting:admit` / `waiting:reject`
- `host:mute_participant` / `host:remove_participant` / `host:end_meeting`
- `system:ping` / `system:pong`

---

## 7. Security & Authorization Model

1. **Authentication**: Argon2 / bcrypt password hashing with strong salt; JWT-based bearer authorization with secure session rotation.
2. **Meeting Identifier Obfuscation**: Cryptographically secure, unguessable meeting codes (`[a-z]{3}-[a-z]{4}-[a-z]{3}`) generated via `crypto.randomBytes`.
3. **Role-Based Access Control (RBAC)**:
   - `HOST`: Can mute, remove, admit/reject waiting participants, lock room, end meeting.
   - `CO_HOST`: Can mute and admit participants.
   - `PARTICIPANT`: Can stream media, chat, share screen (if unlocked).
   - `GUEST`: Subject to waiting room approval.
4. **Server-Side Enforcement**: All WebSocket host actions (`host:mute`, `host:remove`, `host:admit`) verify the connection's authenticated session against the meeting's host/co-host record in the database before broadcasting.

---

## 8. Deployment, Observability & Error Recovery

- **Health Checks**: `/api/health` (liveness) and `/api/ready` (readiness).
- **Structured Logging**: Timestamps, requestId, event categorization, sanitized payload (no secrets or passwords).
- **Resilient Reconnection**: Exponential backoff (1s, 2s, 4s, 8s max) on WebSocket drops with full room state resynchronization on reconnect.
