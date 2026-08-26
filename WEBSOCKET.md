# MeetSpace — Realtime WebSocket Signaling Protocol

## Connection Endpoint
`ws://<HOST>:3000/ws/signaling` or `wss://<HOST>/ws/signaling`

## Protocol Framing
All messages are JSON objects structured as follows:
```typescript
interface SignalingMessage {
  type: string;
  requestId?: string;
  meetingCode: string;
  senderId?: string;
  payload: any;
}
```

## Standard Events

### 1. Room Lifecycle
- `meeting:join`: `{ meetingCode, displayName, isHost, token? }`
- `meeting:joined`: Server ack with `{ participantId, role, currentParticipants, isWaiting }`
- `meeting:leave`: Notification of intentional departure
- `participant:joined`: Broadcast to existing room peers
- `participant:left`: Broadcast when peer leaves or disconnects

### 2. WebRTC Peer Signaling
- `webrtc:offer`: `{ targetParticipantId, sdp }`
- `webrtc:answer`: `{ targetParticipantId, sdp }`
- `webrtc:ice-candidate`: `{ targetParticipantId, candidate }`

### 3. Media & Presentation State
- `media:state_changed`: `{ isMuted, isCameraEnabled, isScreenSharing }`

### 4. Realtime In-Meeting Chat
- `chat:send`: `{ text }`
- `chat:broadcast`: `{ id, senderId, senderName, text, timestamp }`

### 5. Waiting Room & Host Actions
- `waiting:request`: Guest enters queue
- `waiting:admit`: Host admits guest `{ participantId }`
- `waiting:reject`: Host denies entry `{ participantId }`
- `host:mute_participant`: Host mutes peer `{ targetParticipantId }`
- `host:remove_participant`: Host removes peer `{ targetParticipantId }`
- `host:end_meeting`: Host terminates room for all attendees
