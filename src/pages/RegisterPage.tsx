import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, Mail, User, Video, ArrowRight, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPasswordStrong = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordStrong) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (!agreeTerms) {
      setFormError('You must agree to the Terms and Privacy Policy.');
      return;
    }

    try {
      const ok = await register(name.trim(), email, password);
      if (ok) {
        success('Account Created!', 'Welcome to MeetSpace.');
        navigate('dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not create account. Please try again.';
      setFormError(msg);
      error('Registration Failed', msg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
            <Video className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Start hosting instant and scheduled HD video meetings.
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
              id="register-name"
              type="text"
              label="Full Name"
              placeholder="Elena Rostova"
              value={name}
              onChange={e => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <Input
              id="register-email"
              type="email"
              label="Email Address"
              placeholder="elena@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div className="space-y-1.5">
              <Input
                id="register-password"
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                required
              />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`inline-flex items-center gap-1 ${isPasswordStrong ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> 8+ characters
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="register-agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="register-agree-terms" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                I agree to the MeetSpace Terms of Service and Privacy Policy.
              </label>
            </div>

            <Button
              id="register-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-md shadow-indigo-600/20 mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Free
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button
            id="register-login-link"
            onClick={() => navigate('login')}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
};
