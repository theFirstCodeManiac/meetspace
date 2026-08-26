import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, Mail, Video, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    try {
      const ok = await login(email, password);
      if (ok) {
        success('Welcome back!', 'Successfully signed in to MeetSpace.');
        navigate('dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Please check your credentials and try again.';
      setFormError(msg);
      error('Login Failed', msg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
            <Video className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to MeetSpace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your email and password to access your meetings.
          </p>
        </div>

        {/* Card Form */}
        <Card padding="lg" className="shadow-lg border-slate-200/80 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {formError}
              </div>
            )}

            <Input
              id="login-email"
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="login-forgot-link"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-md shadow-indigo-600/20 mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer link to register */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <button
            id="login-register-link"
            onClick={() => navigate('register')}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};
