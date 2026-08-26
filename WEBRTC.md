# MeetSpace — WebRTC Media Pipeline & SFU Migration Architecture

## 1. Media Architecture Overview
MeetSpace employs a full-duplex WebRTC pipeline providing real-time audio, video, and screen-sharing tracks with sub-150ms glass-to-glass latency.

## 2. Peer-to-Peer Mesh (Current Foundation)
- Each participant establishes direct DTLS-SRTP encrypted peer connections with all other peers in the room.
- **Perfect Negotiation Pattern**: Resolves SDP glare automatically by designating polite vs. impolite peers based on participant ID comparison.
- **ICE Candidate Queuing**: Early candidate trickles before `remoteDescription` is set are cached in a temporary queue and drained upon `setRemoteDescription` resolution.
- **Track Management**: Dynamic track swapping (`replaceTrack`) on sender transceivers allows instantaneous switching between webcam and screen-sharing without tearing down the peer connection.

## 3. Scalability & Path to SFU (Selective Forwarding Unit)
- Mesh topology is ideal for 1–8 participants. For massive rooms (50–500+ participants), the media layer is cleanly isolated behind `useMeetingMedia`.
- To migrate to an SFU (e.g. LiveKit or mediasoup), only the transport adapter needs replacement, leaving all UI video grids, mute states, and audio pipelines intact.
