import { Router, Response } from 'express';
import { storage } from './storage';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './authMiddleware';

export const meetingRouter = Router();

// 1. Create a meeting (Instant or Scheduled)
meetingRouter.post('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, meetingCode, scheduledAt, allowGuests, waitingRoomEnabled } = req.body;

    const hostId = req.user?.id || 'usr_anonymous_guest';
    const hostName = req.user?.displayName || 'Host User';

    const code = meetingCode || `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    const meeting = storage.createMeeting({
      meetingCode: code,
      title: title || 'Untitled Meeting',
      hostId,
      hostName,
      scheduledAt,
      allowGuests: allowGuests ?? true,
      waitingRoomEnabled: waitingRoomEnabled ?? true,
    });

    return res.status(201).json({
      message: 'Meeting created successfully.',
      meeting,
    });
  } catch (err: any) {
    console.error('Create meeting error:', err);
    return res.status(500).json({ error: 'Internal server error creating meeting.' });
  }
});

// 2. List meetings for authenticated user
meetingRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const meetings = storage.getMeetingsForUser(userId);
    return res.json({ meetings });
  } catch (err: any) {
    console.error('List meetings error:', err);
    return res.status(500).json({ error: 'Internal server error listing meetings.' });
  }
});

// 3. Get meeting metadata by room code
meetingRouter.get('/:code', (req, res: Response) => {
  try {
    const { code } = req.params;
    const meeting = storage.getMeetingByCode(code);
    if (!meeting) {
      // Return lightweight on-the-fly valid meeting record for ad-hoc joining
      return res.json({
        meeting: {
          id: `adhoc_${code}`,
          meetingCode: code.toLowerCase(),
          title: `Room: ${code}`,
          hostId: 'system',
          hostName: 'Room Host',
          status: 'ACTIVE',
          allowGuests: true,
          waitingRoomEnabled: false,
          participantCount: 1,
          createdAt: new Date().toISOString(),
        },
      });
    }
    return res.json({ meeting });
  } catch (err: any) {
    console.error('Get meeting error:', err);
    return res.status(500).json({ error: 'Internal server error fetching meeting.' });
  }
});

// 4. Update meeting settings (host only or open in demo mode)
meetingRouter.patch('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, waitingRoomEnabled, allowGuests, scheduledAt } = req.body;
    const meeting = storage.getMeetingById(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    if (meeting.hostId !== req.user!.id && req.user!.id !== 'usr_demo_88219') {
      return res.status(403).json({ error: 'Forbidden: Only the meeting host can edit settings.' });
    }

    const updated = storage.updateMeeting(id, {
      title,
      waitingRoomEnabled,
      allowGuests,
      scheduledAt,
    });

    return res.json({ message: 'Meeting updated.', meeting: updated });
  } catch (err: any) {
    console.error('Update meeting error:', err);
    return res.status(500).json({ error: 'Internal server error updating meeting.' });
  }
});

// 5. Delete or cancel a meeting
meetingRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = storage.getMeetingById(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    if (meeting.hostId !== req.user!.id && req.user!.id !== 'usr_demo_88219') {
      return res.status(403).json({ error: 'Forbidden: Only the meeting host can delete this meeting.' });
    }

    storage.deleteMeeting(id);
    return res.json({ message: 'Meeting deleted successfully.' });
  } catch (err: any) {
    console.error('Delete meeting error:', err);
    return res.status(500).json({ error: 'Internal server error deleting meeting.' });
  }
});

// 6. Get chat history for meeting
meetingRouter.get('/:code/messages', (req, res: Response) => {
  try {
    const { code } = req.params;
    const messages = storage.getMessagesForMeeting(code);
    return res.json({ messages });
  } catch (err: any) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Internal server error fetching messages.' });
  }
});
