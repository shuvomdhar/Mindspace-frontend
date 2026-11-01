'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { ErrorBanner } from '@/components/error-banner';
import { GoogleIcon } from '@/components/google-icon';
import { Spinner } from '@/components/spinner';
import {
  emailAuthErrorMessage,
  googleAuthErrorMessage,
  resendConfirmationEmail,
  signInWithGoogle,
} from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from '@/lib/styles';

export default function LoginPage() {
  const router = useRouter();
  const { accountError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setResendNotice(null);

    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to frontend/.env.local.',
      );
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setNeedsConfirmation(true);
        }
        setError(emailAuthErrorMessage(signInError.message));
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('Could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResendNotice(null);
    setResendLoading(true);

    try {
      const { error: resendError } = await resendConfirmationEmail(email.trim());

      if (resendError) {
        setError(emailAuthErrorMessage(resendError.message));
        return;
      }

      setResendNotice(
        'Confirmation email resent. Check your inbox and spam folder for the new link.',
      );
    } catch {
      setError('Could not resend the confirmation email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to frontend/.env.local.',
      );
      return;
    }

    setGoogleLoading(true);
    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError(googleAuthErrorMessage(oauthError.message));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Sign in to pick up where you left off.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Supabase keys are missing. Copy{' '}
          <code className="font-mono text-xs">frontend/.env.example</code> to{' '}
          <code className="font-mono text-xs">.env.local</code> and add your
          project URL and anon key.
        </div>
      )}

      {accountError && (
        <div className="mt-6">
          <ErrorBanner message={accountError} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {needsConfirmation && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-slate-600 dark:text-slate-300">
              Did not receive the email? Check your spam folder, then request a
              new confirmation link.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {resendLoading ? <Spinner className="h-3.5 w-3.5" /> : null}
              {resendLoading
                ? 'Sending…'
                : 'Resend confirmation email'}
            </button>
            {resendNotice && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {resendNotice}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setNeedsConfirmation(false);
                setResendNotice(null);
              }}
              placeholder="you@example.com"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pl-10 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className={`${secondaryButton} w-full`}
      >
        {googleLoading ? <Spinner className="h-4 w-4" /> : <GoogleIcon />}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        New to Mindspace?{' '}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
