# MeetSpace — Deployment & Infrastructure Guide

## 1. Containerized Production Build
The application is structured to compile into a single high-performance bundle:
- **Frontend**: Built via Vite to `dist/`
- **Backend**: Bundled via `esbuild` to `dist/server.cjs`
- **Start Command**: `node dist/server.cjs`

## 2. Docker Setup

```dockerfile
# Multi-stage production Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

## 3. TURN / STUN Infrastructure (Coturn Setup)
For production deployments across symmetric NATs and restrictive enterprise firewalls, a dedicated TURN server (e.g. `coturn`) is required:

```bash
# Example coturn installation on Ubuntu
sudo apt-get install coturn
# Configuration in /etc/turnserver.conf:
listening-port=3478
tls-listening-port=5349
realm=turn.meetspace.app
user=meetuser:SecurePassword123
```
Configure `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` in the application environment.
