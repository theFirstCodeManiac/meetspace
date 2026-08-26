import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage, generateAuthToken } from './storage';
import { requireAuth, AuthenticatedRequest } from './authMiddleware';

export const authRouter = Router();

function extractBody(req: any): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

// 1. Register
authRouter.post('/register', (req, res: Response) => {
  try {
    const body = extractBody(req);
    const { email, password, displayName, avatarUrl } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name is required.' });
    }

    const existing = storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const user = storage.createUser(email, password, displayName, avatarUrl);
    const token = generateAuthToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error during registration.' });
  }
});

// 2. Login
authRouter.post('/login', (req, res: Response) => {
  try {
    const body = extractBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let isMatch = false;
    try {
      if (user.passwordHash) {
        if (user.passwordHash === password) {
          isMatch = true;
        } else {
          isMatch = bcrypt.compareSync(password, user.passwordHash);
        }
      }
    } catch (bcryptErr) {
      console.warn('Password compare fallback:', bcryptErr);
      isMatch = user.passwordHash === password;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateAuthToken(user);

    return res.json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error during login.' });
  }
});

// 3. Logout
authRouter.post('/logout', (req, res: Response) => {
  return res.json({ message: 'Logged out successfully.' });
});

// 4. Get Current User (Me)
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
});

// 5. Update Profile
authRouter.patch('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = extractBody(req);
    const { displayName, avatarUrl } = body;

    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return res.status(400).json({ error: 'Display name cannot be empty.' });
    }

    const updated = storage.updateUserProfile(user.id, { displayName, avatarUrl });
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error updating profile.' });
  }
});

// 6. Forgot Password (generate reset token)
authRouter.post('/forgot-password', (req, res: Response) => {
  try {
    const body = extractBody(req);
    const { email } = body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = storage.getUserByEmail(email);
    if (!user) {
      return res.json({
        message: 'If the email exists in our records, a password reset link has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    storage.setResetToken(user.email, resetToken, 60);

    return res.json({
      message: 'Password reset instructions dispatched.',
      devResetToken: resetToken,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error processing request.' });
  }
});

// 7. Reset Password
authRouter.post('/reset-password', (req, res: Response) => {
  try {
    const body = extractBody(req);
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = storage.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    storage.updatePassword(user.id, newPassword);

    return res.json({
      message: 'Password has been updated successfully. You can now log in.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error resetting password.' });
  }
});
