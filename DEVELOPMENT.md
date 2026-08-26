# MeetSpace — Development Guide

## Local Development Workflow

### Prerequisites
- Node.js 20+ (Node 22 LTS recommended)
- Modern browser with WebRTC and MediaDevices support (Chrome, Firefox, Edge, Safari)

### Setup Steps
1. Clone the repository
2. Ensure dependencies are installed: `npm install`
3. Configure environment variables in `.env` (refer to `.env.example` and `ENVIRONMENT.md`)
4. Start the development server:
   ```bash
   npm run dev
   ```
   The dev server binds to `0.0.0.0:3000` with Express handling both API/WebSocket routes and Vite middleware for the React frontend.

### Multi-Participant Local Testing
To test multi-user video meetings locally:
1. Open `http://localhost:3000` in standard Chrome tab (User A).
2. Open an Incognito window or a separate browser profile / Firefox (User B).
3. Create an instant meeting in User A, copy the meeting code or URL, and join from User B.
4. Verify audio, video, chat, screen share, and host control actions synchronize in real time.
