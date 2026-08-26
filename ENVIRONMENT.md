# MeetSpace — Environment Variables Reference

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Port on which Express and WebSocket server listen | `3000` |
| `NODE_ENV` | No | Environment mode (`development` or `production`) | `development` |
| `JWT_SECRET` | Yes (in prod) | Secret key for signing session tokens | `meetspace-dev-secret-change-in-prod` |
| `STUN_SERVER_URL` | No | STUN server URL for NAT discovery | `stun:stun.l.google.com:19302` |
| `TURN_SERVER_URL` | No | TURN server URL for relaying media | Optional |
| `TURN_USERNAME` | No | Username for TURN authentication | Optional |
| `TURN_CREDENTIAL` | No | Credential/password for TURN authentication | Optional |
| `APP_URL` | No | Base application URL for shareable links | `http://localhost:3000` |
