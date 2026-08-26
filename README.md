# MeetSpace — Production Video Conferencing Platform

MeetSpace is an enterprise-grade, browser-based video conferencing platform inspired by Google Meet. It provides end-to-end real-time video and audio streaming, dynamic screen sharing, instant and scheduled meetings, waiting room admissions, in-meeting chat, host controls, and device switching.

---

## 🌟 Key Features

- 🔐 **Enterprise Authentication**: User registration, login, session management, password security, and guest join support.
- 📹 **Real-Time Video & Audio**: Full-duplex WebRTC media streaming with configurable STUN/TURN servers.
- 💻 **Screen Sharing**: High-definition display capture with dynamic video track replacement.
- 👥 **Adaptive Participant Grid**: Intelligent layouts adapting from 1 to 20+ participants, with active speaker highlight and pinned view.
- ⏳ **Waiting Room & Host Admission**: Real-time queue for host review and admission of guests.
- 💬 **Persistent In-Meeting Chat**: Instant messaging synchronized across all participants with timestamps and unread counters.
- 🎛️ **Host Controls**: Remote muting, participant removal, meeting lock, and termination for all attendees.
- ⚙️ **Device Management**: Live camera preview, microphone level visualizer, and hot-swappable input/output devices.
- 📶 **Connection Quality Monitor**: Live RTT, jitter, and packet loss metrics using RTCPeerConnection statistics.
- 🔄 **Fault-Tolerant Reconnection**: Automatic WebSocket reconnect with exponential backoff and seamless session resumption.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion
- **Backend**: Node.js, Express, WebSocket (`ws`) server
- **Media / Realtime**: WebRTC, STUN/TURN traversal
- **Persistence**: Relational database engine with transactions and indexing
- **Security**: Argon2/Bcrypt password hashing, secure random meeting codes, RBAC authorization

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (runs full-stack on port 3000)
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm start
```

---

## 📚 Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture, topology, and component design
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Local developer setup, workflows, and testing guides
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker, Cloud Run, and production deployment guide
- [SECURITY.md](./SECURITY.md) — Security policies, RBAC, encryption, and threat model
- [API.md](./API.md) — Complete REST API specification
- [WEBSOCKET.md](./WEBSOCKET.md) — WebSocket signaling event schemas and protocol
- [WEBRTC.md](./WEBRTC.md) — WebRTC media pipeline, ICE trickle, and SFU migration path
- [ENVIRONMENT.md](./ENVIRONMENT.md) — Environment variables documentation
