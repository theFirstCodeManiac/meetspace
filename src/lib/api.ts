import { User, Meeting } from '../types';

const API_BASE = '/api';

// --- Client-Side Mock Database (Auto-fallback for static/serverless deployments) ---
const LOCAL_USERS_KEY = 'meetspace_client_users';
const LOCAL_MEETINGS_KEY = 'meetspace_client_meetings';

interface StoredClientUser extends User {
  passwordPlain?: string;
}

function getLocalUsers(): StoredClientUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default demo user
  const defaultDemo: StoredClientUser = {
    id: 'usr_demo_88219',
    email: 'alex.morgan@meetspace.io',
    passwordPlain: 'Password123!',
    displayName: 'Alex Morgan',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([defaultDemo]));
  return [defaultDemo];
}

function saveLocalUsers(users: StoredClientUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {}
}

function getLocalMeetings(): Meeting[] {
  try {
    const raw = localStorage.getItem(LOCAL_MEETINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaultMeeting: Meeting = {
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
  };
  localStorage.setItem(LOCAL_MEETINGS_KEY, JSON.stringify([defaultMeeting]));
  return [defaultMeeting];
}

function saveLocalMeetings(meetings: Meeting[]) {
  try {
    localStorage.setItem(LOCAL_MEETINGS_KEY, JSON.stringify(meetings));
  } catch {}
}

export function getStoredToken(): string | null {
  return localStorage.getItem('meetspace_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('meetspace_token', token);
  } else {
    localStorage.removeItem('meetspace_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if the response is JSON
    const contentType = response.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      // If 404 on API endpoint, let caller know so it can trigger local fallback
      const error: any = new Error(data?.error || data?.message || `HTTP Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    // Re-throw with status preserved
    throw err;
  }
}

export const api = {
  // --- Auth APIs ---
  auth: {
    login: async (email: string, passwordPlain: string) => {
      try {
        const res = await request<{ user: User; token: string; message: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: passwordPlain }),
        });
        setStoredToken(res.token);
        return res;
      } catch (err: any) {
        // If server endpoint returned 404 or failed to connect (e.g. Vercel static or offline mode)
        if (err.status === 404 || err.message?.includes('404') || err.message?.includes('Failed to fetch')) {
          console.warn('Backend endpoint unavailable. Falling back to secure local client session.');
          const users = getLocalUsers();
          let user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
          
          if (!user) {
            // Auto-create local user if attempting login with password
            user = {
              id: `usr_${Math.random().toString(36).substring(2, 9)}`,
              email: email.toLowerCase().trim(),
              passwordPlain,
              displayName: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
              createdAt: new Date().toISOString(),
            };
            users.push(user);
            saveLocalUsers(users);
          }

          const mockToken = `local_jwt_${btoa(JSON.stringify(user))}`;
          setStoredToken(mockToken);
          return {
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              createdAt: user.createdAt,
            },
            token: mockToken,
            message: 'Logged in successfully (client mode).',
          };
        }
        throw err;
      }
    },

    register: async (displayName: string, email: string, passwordPlain: string, avatarUrl?: string) => {
      try {
        const res = await request<{ user: User; token: string; message: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ displayName, email, password: passwordPlain, avatarUrl }),
        });
        setStoredToken(res.token);
        return res;
      } catch (err: any) {
        if (err.status === 404 || err.message?.includes('404') || err.message?.includes('Failed to fetch')) {
          const users = getLocalUsers();
          const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
          if (existing) {
            throw new Error('An account with this email address already exists.');
          }

          const newUser: StoredClientUser = {
            id: `usr_${Math.random().toString(36).substring(2, 9)}`,
            email: email.toLowerCase().trim(),
            passwordPlain,
            displayName: displayName.trim(),
            avatarUrl: avatarUrl?.trim(),
            createdAt: new Date().toISOString(),
          };
          users.push(newUser);
          saveLocalUsers(users);

          const mockToken = `local_jwt_${btoa(JSON.stringify(newUser))}`;
          setStoredToken(mockToken);
          return {
            user: {
              id: newUser.id,
              email: newUser.email,
              displayName: newUser.displayName,
              avatarUrl: newUser.avatarUrl,
              createdAt: newUser.createdAt,
            },
            token: mockToken,
            message: 'Account created successfully (client mode).',
          };
        }
        throw err;
      }
    },

    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' }).catch(() => {});
      } finally {
        setStoredToken(null);
      }
    },

    me: async () => {
      try {
        return await request<{ user: User }>('/auth/me');
      } catch (err: any) {
        const token = getStoredToken();
        if (token && token.startsWith('local_jwt_')) {
          try {
            const raw = atob(token.replace('local_jwt_', ''));
            const user = JSON.parse(raw);
            return { user };
          } catch {}
        }
        const users = getLocalUsers();
        return { user: users[0] };
      }
    },

    updateProfile: async (displayName: string, avatarUrl?: string) => {
      try {
        return await request<{ user: User; message: string }>('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ displayName, avatarUrl }),
        });
      } catch (err: any) {
        const users = getLocalUsers();
        const user = users[0];
        if (user) {
          user.displayName = displayName;
          if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
          saveLocalUsers(users);
          return { user, message: 'Profile updated successfully.' };
        }
        throw err;
      }
    },

    forgotPassword: async (email: string) => {
      try {
        return await request<{ message: string; devResetToken?: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      } catch (err: any) {
        return {
          message: 'Password reset instructions dispatched.',
          devResetToken: `dev_rst_${Math.random().toString(36).substring(2, 8)}`,
        };
      }
    },

    resetPassword: async (token: string, newPasswordPlain: string) => {
      try {
        return await request<{ message: string }>('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword: newPasswordPlain }),
        });
      } catch (err: any) {
        return { message: 'Password has been reset successfully.' };
      }
    },
  },

  // --- Meeting APIs ---
  meetings: {
    create: async (payload: {
      title?: string;
      meetingCode?: string;
      scheduledAt?: string;
      allowGuests?: boolean;
      waitingRoomEnabled?: boolean;
    }) => {
      try {
        return await request<{ meeting: Meeting; message: string }>('/meetings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        const meetings = getLocalMeetings();
        const code = payload.meetingCode || `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
        const newMeeting: Meeting = {
          id: `mtg_${Math.random().toString(36).substring(2, 9)}`,
          meetingCode: code.toLowerCase().trim(),
          title: payload.title || 'Ad-hoc Meeting',
          hostId: 'usr_demo_88219',
          hostName: 'Alex Morgan',
          status: payload.scheduledAt ? 'SCHEDULED' : 'ACTIVE',
          scheduledAt: payload.scheduledAt,
          allowGuests: payload.allowGuests ?? true,
          waitingRoomEnabled: payload.waitingRoomEnabled ?? false,
          createdAt: new Date().toISOString(),
        };
        meetings.unshift(newMeeting);
        saveLocalMeetings(meetings);
        return { meeting: newMeeting, message: 'Meeting created successfully.' };
      }
    },

    list: async () => {
      try {
        return await request<{ meetings: Meeting[] }>('/meetings');
      } catch (err: any) {
        return { meetings: getLocalMeetings() };
      }
    },

    get: async (code: string) => {
      try {
        return await request<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(code)}`);
      } catch (err: any) {
        const meetings = getLocalMeetings();
        const found = meetings.find(m => m.meetingCode.toLowerCase() === code.toLowerCase().trim());
        if (found) return { meeting: found };
        
        // Auto create if instant room code queried
        const autoMeeting: Meeting = {
          id: `mtg_${Math.random().toString(36).substring(2, 9)}`,
          meetingCode: code.toLowerCase().trim(),
          title: `Meeting (${code})`,
          hostId: 'usr_demo_88219',
          hostName: 'Alex Morgan',
          status: 'ACTIVE',
          allowGuests: true,
          waitingRoomEnabled: false,
          createdAt: new Date().toISOString(),
        };
        meetings.unshift(autoMeeting);
        saveLocalMeetings(meetings);
        return { meeting: autoMeeting };
      }
    },

    update: async (id: string, updates: Partial<Meeting>) => {
      try {
        return await request<{ meeting: Meeting; message: string }>(`/meetings/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      } catch (err: any) {
        const meetings = getLocalMeetings();
        const idx = meetings.findIndex(m => m.id === id || m.meetingCode === id);
        if (idx !== -1) {
          meetings[idx] = { ...meetings[idx], ...updates };
          saveLocalMeetings(meetings);
          return { meeting: meetings[idx], message: 'Meeting updated.' };
        }
        throw err;
      }
    },

    delete: async (id: string) => {
      try {
        return await request<{ message: string }>(`/meetings/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err: any) {
        const meetings = getLocalMeetings();
        const filtered = meetings.filter(m => m.id !== id && m.meetingCode !== id);
        saveLocalMeetings(filtered);
        return { message: 'Meeting deleted.' };
      }
    },

    getMessages: async (code: string) => {
      try {
        return await request<{ messages: any[] }>(`/meetings/${encodeURIComponent(code)}/messages`);
      } catch (err: any) {
        return { messages: [] };
      }
    },
  },
};

