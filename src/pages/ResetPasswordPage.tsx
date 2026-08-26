import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, KeyRound, Check, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token.trim()) {
      setFormError('Please enter your recovery token.');
      return;
    }
    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token.trim(), newPassword);
      success('Password Updated', 'Your password has been reset successfully. You can now sign in.');
      navigate('login');
    } catch (err: any) {
      const msg = err?.message || 'Invalid or expired token.';
      setFormError(msg);
      error('Reset Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set new password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your verification token and choose a strong password.
          </p>
        </div>

        <Card padding="lg" className="shadow-lg border-slate-200/80 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {formError}
              </div>
            )}

            <Input
              id="reset-token"
              type="text"
              label="Reset Token"
              placeholder="Paste token received from forgot password"
              value={token}
              onChange={e => setToken(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <Input
              id="reset-new-password"
              type="password"
              label="New Password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              id="reset-confirm-password"
              type="password"
              label="Confirm New Password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              leftIcon={<Check className="w-4 h-4" />}
              required
            />

            <Button
              id="reset-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-md shadow-indigo-600/20"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
