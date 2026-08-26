import express, { Request, Response } from 'express';
import { authRouter } from '../server/authRoutes';
import { meetingRouter } from '../server/meetingRoutes';
import { aiRouter } from '../server/aiRoutes';

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MeetSpace Vercel Serverless Gateway',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', (req: Request, res: Response) => {
  res.json({
    ready: true,
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingRouter);
app.use('/api/ai', aiRouter);

export default app;
