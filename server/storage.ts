import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'meetspace_super_secret_jwt_key_2026';
// Support serverless write directories (/tmp) when deployed on Vercel or read-only containers
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production' && !process.env.DOCKER);
const DATA_DIR = isServerless 
  ? path.join('/tmp', 'meetspace_data') 
  : path.join(process.cwd(), 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (dirErr) {
  console.warn('Storage directory initialization notice:', dirErr);
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingRecord {
  id: string;
  meetingCode: string;
  title: string;
  hostId: string;
  hostName: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  participantCount?: number;
  allowGuests: boolean;
  waitingRoomEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  meetingCode: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isPrivate?: boolean;
  recipientId?: string;
}

class StorageManager {
  private users: Map<string, UserRecord> = new Map();
  private meetings: Map<string, MeetingRecord> = new Map();
  private messages: ChatMessageRecord[] = [];

  constructor() {
    this.loadAll();
    this.seedDefaultDemoUser();
  }

  private loadAll() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const list: UserRecord[] = JSON.parse(raw);
        list.forEach(u => this.users.set(u.id, u));
      }
      if (fs.existsSync(MEETINGS_FILE)) {
        const raw = fs.readFileSync(MEETINGS_FILE, 'utf-8');
        const list: MeetingRecord[] = JSON.parse(raw);
        list.forEach(m => this.meetings.set(m.id, m));
      }
      if (fs.existsSync(MESSAGES_FILE)) {
        const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
        this.messages = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load storage files:', err);
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));
    } catch (err) {
      console.error('Failed to save users:', err);
    }
  }

  private saveMeetings() {
    try {
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify(Array.from(this.meetings.values()), null, 2));
    } catch (err) {
      console.error('Failed to save meetings:', err);
    }
  }

  private saveMessages() {
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(this.messages, null, 2));
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  }

  private seedDefaultDemoUser() {
    const demoEmail = 'alex.morgan@meetspace.io';
    const exists = Array.from(this.users.values()).find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (!exists) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('Password123!', salt);
      const demoUser: UserRecord = {
        id: 'usr_demo_88219',
        email: demoEmail,
        passwordHash: hash,
        displayName: 'Alex Morgan',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(demoUser.id, demoUser);
      this.saveUsers();
    }

    // Seed default scheduled meeting if empty
    if (this.meetings.size === 0) {
      const demoMeeting: MeetingRecord = {
        id: 'sch_demo_1',
        meetingCode: 'eng-sync-dev',
        title: 'Weekly Engineering Sync & WebRTC Architecture',
        hostId: 'usr_demo_88219',
        hostName: 'Alex Morgan',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
        allowGuests: true,
        waitingRoomEnabled: true,
        participantCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.meetings.set(demoMeeting.id, demoMeeting);
      this.saveMeetings();
    }
  }

  // --- User Operations ---
  public getUserByEmail(email: string): UserRecord | undefined {
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  public getUserByResetToken(token: string): UserRecord | undefined {
    return Array.from(this.users.values()).find(
      u => u.resetToken === token && (u.resetTokenExpiry || 0) > Date.now()
    );
  }

  public createUser(email: string, passwordPlain: string, displayName: string, avatarUrl?: string): UserRecord {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    const user: UserRecord = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
      avatarUrl: avatarUrl?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.saveUsers();
    return user;
  }

  public updateUserProfile(id: string, updates: { displayName?: string; avatarUrl?: string }): UserRecord | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl.trim();
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return user;
  }

  public setResetToken(email: string, token: string, expiryMinutes = 60): boolean {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + expiryMinutes * 60 * 1000;
    this.users.set(user.id, user);
    this.saveUsers();
    return true;
  }

  public updatePassword(id: string, newPasswordPlain: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPasswordPlain, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return true;
  }

  // --- Meeting Operations ---
  public getMeetingsForUser(userId: string): MeetingRecord[] {
    return Array.from(this.meetings.values())
      .filter(m => m.hostId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMeetingByCode(code: string): MeetingRecord | undefined {
    const normalized = code.toLowerCase().trim();
    return Array.from(this.meetings.values()).find(
      m => m.meetingCode.toLowerCase() === normalized
    );
  }

  public getMeetingById(id: string): MeetingRecord | undefined {
    return this.meetings.get(id);
  }

  public createMeeting(data: {
    meetingCode: string;
    title: string;
    hostId: string;
    hostName: string;
    status?: 'SCHEDULED' | 'ACTIVE';
    scheduledAt?: string;
    allowGuests?: boolean;
    waitingRoomEnabled?: boolean;
  }): MeetingRecord {
    const meeting: MeetingRecord = {
      id: `mtg_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
      meetingCode: data.meetingCode.toLowerCase().trim(),
      title: data.title.trim() || 'Untitled Meeting',
      hostId: data.hostId,
      hostName: data.hostName,
      status: data.status || (data.scheduledAt ? 'SCHEDULED' : 'ACTIVE'),
      scheduledAt: data.scheduledAt,
      startedAt: data.scheduledAt ? undefined : new Date().toISOString(),
      allowGuests: data.allowGuests ?? true,
      waitingRoomEnabled: data.waitingRoomEnabled ?? true,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetings.set(meeting.id, meeting);
    this.saveMeetings();
    return meeting;
  }

  public updateMeeting(id: string, updates: Partial<MeetingRecord>): MeetingRecord | undefined {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    Object.assign(meeting, updates, { updatedAt: new Date().toISOString() });
    this.meetings.set(id, meeting);
    this.saveMeetings();
    return meeting;
  }

  public deleteMeeting(id: string): boolean {
    const existed = this.meetings.delete(id);
    if (existed) this.saveMeetings();
    return existed;
  }

  // --- Messages Operations ---
  public getMessagesForMeeting(meetingCode: string): ChatMessageRecord[] {
    const code = meetingCode.toLowerCase().trim();
    return this.messages.filter(m => m.meetingCode.toLowerCase() === code);
  }

  public addMessage(msg: Omit<ChatMessageRecord, 'id' | 'timestamp'>): ChatMessageRecord {
    const record: ChatMessageRecord = {
      ...msg,
      id: `msg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(record);
    if (this.messages.length > 5000) {
      this.messages = this.messages.slice(-5000);
    }
    this.saveMessages();
    return record;
  }
}

export const storage = new StorageManager();

// JWT Helpers
export function generateAuthToken(user: { id: string; email: string; displayName: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAuthToken(token: string): { id: string; email: string; displayName: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; displayName: string };
  } catch {
    return null;
  }
}
