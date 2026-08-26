import express, { Request, Response, NextFunction } from 'express';
import { authRouter } from '../server/authRoutes';
import { meetingRouter } from '../server/meetingRoutes';
import { aiRouter } from '../server/aiRoutes';
import { signalingRouter } from '../server/signalingManager';

const app = express();

// Enable CORS and Preflight handling
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MeetSpace Vercel Serverless Gateway',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/api/ready', '/ready'], (req: Request, res: Response) => {
  res.json({
    ready: true,
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes under both /api/* and /* to support all Vercel rewrite patterns
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/meetings', meetingRouter);
app.use('/meetings', meetingRouter);

app.use('/api/ai', aiRouter);
app.use('/ai', aiRouter);

app.use('/api/signaling', signalingRouter);
app.use('/signaling', signalingRouter);
app.use('/api/meetings/signaling', signalingRouter);

// Generic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Serverless Gateway Error:', err);
  res.status(500).json({ error: err?.message || 'Serverless Execution Error' });
});

export default app;

