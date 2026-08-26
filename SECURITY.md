# MeetSpace — Security Policy & Threat Model

## 1. Authentication & Session Security
- **Password Hashing**: Bcrypt / Argon2 with individual salts and adaptive cost factor.
- **Session Tokens**: Cryptographically strong tokens with expiration and instant revocation support.
- **Data Protection**: Passwords and hashes are strictly stripped from all API outputs.

## 2. Meeting Authorization & RBAC
- **Cryptographic Meeting Codes**: Non-sequential, unguessable meeting IDs (`xxx-yyyy-zzz`).
- **Server-Side Enforcement**: All privileged operations (muting, kicking, admitting, ending) are validated against database records and connection identity before execution.
- **Waiting Room Isolation**: Unadmitted guests receive no media tracks, ICE candidates, or chat streams until explicitly approved by the host.

## 3. WebRTC Media Security
- **DTLS-SRTP**: Mandatory end-to-end encryption for all WebRTC audio, video, and data channels.
- **Ephemeral Credentials**: ICE user fragments and passwords are generated dynamically per session.
