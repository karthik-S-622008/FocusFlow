import { AlertCircle, Lock, Mail, Timer } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError(null);
    setLoading(true);

    const { error } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password);

    setLoading(false);

    if (error) {
      setError(error);
    } else if (mode === 'signup') {
      setConfirmationSent(true);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setConfirmationSent(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft mb-4">
            <Timer className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900">FocusFlow</h1>
          <p className="text-sm text-ink-500 mt-1">Productivity &amp; Focus</p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-ink-900 text-center">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-ink-500 mt-1 text-center">
            {mode === 'signin'
              ? 'Sign in to continue your flow'
              : 'Start your productivity journey'}
          </p>

          {confirmationSent ? (
            <div className="mt-6 rounded-xl bg-success-50 border border-success-200 p-4 text-center">
              <p className="text-sm font-medium text-success-800">Check your email!</p>
              <p className="text-xs text-success-600 mt-1">
                We've sent a confirmation link to <strong>{email}</strong>. Click it to activate
                your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-error-500 shrink-0" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="label">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="label">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    className="input pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : 'Sign Up'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-ink-500 hover:text-primary-600 transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span className="font-semibold text-primary-600">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
