import { User, Meeting } from '../types';

const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // --- Auth APIs ---
  auth: {
    login: async (email: string, passwordPlain: string) => {
      const res = await request<{ user: User; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: passwordPlain }),
      });
      setStoredToken(res.token);
      return res;
    },

    register: async (displayName: string, email: string, passwordPlain: string, avatarUrl?: string) => {
      const res = await request<{ user: User; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password: passwordPlain, avatarUrl }),
      });
      setStoredToken(res.token);
      return res;
    },

    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },

    me: async () => {
      return request<{ user: User }>('/auth/me');
    },

    updateProfile: async (displayName: string, avatarUrl?: string) => {
      return request<{ user: User; message: string }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, avatarUrl }),
      });
    },

    forgotPassword: async (email: string) => {
      return request<{ message: string; devResetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (token: string, newPasswordPlain: string) => {
      return request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: newPasswordPlain }),
      });
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
      return request<{ meeting: Meeting; message: string }>('/meetings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    list: async () => {
      return request<{ meetings: Meeting[] }>('/meetings');
    },

    get: async (code: string) => {
      return request<{ meeting: Meeting }>(`/meetings/${encodeURIComponent(code)}`);
    },

    update: async (id: string, updates: Partial<Meeting>) => {
      return request<{ meeting: Meeting; message: string }>(`/meetings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string) => {
      return request<{ message: string }>(`/meetings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    getMessages: async (code: string) => {
      return request<{ messages: any[] }>(`/meetings/${encodeURIComponent(code)}/messages`);
    },
  },
};
