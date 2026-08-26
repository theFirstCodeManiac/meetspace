# MeetSpace — REST API Specification

## Base URL
`/api`

## Authentication Endpoints
- `POST /api/auth/register`: Create a new user account `{ email, password, displayName }`
- `POST /api/auth/login`: Authenticate `{ email, password }` -> returns `{ user, token }`
- `POST /api/auth/logout`: Revoke active session
- `GET /api/auth/me`: Get current authenticated user profile
- `PATCH /api/auth/profile`: Update display name or avatar
- `POST /api/auth/forgot-password`: Request password reset token
- `POST /api/auth/reset-password`: Reset password using token

## Meeting Management Endpoints
- `POST /api/meetings`: Create a new instant or scheduled meeting `{ title, scheduledAt?, allowGuests?, waitingRoomEnabled? }`
- `GET /api/meetings`: List upcoming and historical meetings for authenticated user
- `GET /api/meetings/:code`: Retrieve public/authenticated meeting metadata and check status
- `PATCH /api/meetings/:id`: Update meeting settings (host only)
- `DELETE /api/meetings/:id`: Delete or cancel a scheduled meeting (host only)
- `POST /api/meetings/:code/start`: Start meeting (host only)
- `POST /api/meetings/:code/end`: Terminate meeting for all (host only)
- `GET /api/meetings/:code/messages`: Fetch historical chat messages for the meeting

## Health Endpoints
- `GET /api/health`: Liveness probe `{ status: "ok", timestamp: 1234567890 }`
- `GET /api/ready`: Readiness probe verifying database and signaling subsystem status
