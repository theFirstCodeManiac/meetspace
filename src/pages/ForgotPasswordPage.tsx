import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [returnedToken, setReturnedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      setIsSubmitted(true);
      if (res.devResetToken) {
        setReturnedToken(res.devResetToken);
      }
      success('Reset instructions sent', 'Check your email inbox or copy the token below.');
    } catch (err: any) {
      error('Request failed', err?.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your email and we'll send you recovery instructions.
          </p>
        </div>

        <Card padding="lg" className="shadow-lg border-slate-200/80 dark:border-slate-800">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recovery Token Dispatched
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Password reset instructions generated for <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
                </p>
              </div>

              {returnedToken && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-left space-y-1">
                  <p className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
                    Generated Reset Token (Preview Environment):
                  </p>
                  <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all select-all">
                    {returnedToken}
                  </p>
                </div>
              )}

              <div className="pt-3 space-y-2">
                <Button
                  id="forgot-to-reset-btn"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('reset-password')}
                >
                  Enter Reset Token
                </Button>
                <Button
                  id="forgot-back-login-btn"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('login')}
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="forgot-email"
                type="email"
                label="Registered Email"
                placeholder="alex.morgan@meetspace.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                id="forgot-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md shadow-indigo-600/20"
                isLoading={isLoading}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>

              <button
                type="button"
                id="forgot-return-login"
                onClick={() => navigate('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white py-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
