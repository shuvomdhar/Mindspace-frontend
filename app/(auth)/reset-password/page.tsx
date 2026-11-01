'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { ErrorBanner } from '@/components/error-banner';
import { Spinner } from '@/components/spinner';
import { supabase } from '@/lib/supabase';
import {
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from '@/lib/styles';

type Status = 'checking' | 'ready' | 'missing' | 'success';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timeout: number | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setStatus('ready');
    });

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setStatus('ready');
        return;
      }

      // The callback page may still be finishing the PKCE exchange.
      timeout = window.setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!active) return;
        setStatus(retry.session ? 'ready' : 'missing');
      }, 1_500);
    };

    void checkSession();

    return () => {
      active = false;
      subscription.unsubscribe();
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setStatus('success');
    } catch {
      setError('Could not update your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center py-10 text-center text-slate-500 dark:text-slate-400">
        <Spinner className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <p className="mt-3 text-sm font-medium">Checking your reset link…</p>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="animate-rise text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <CircleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Reset link expired
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          This password reset link is invalid or has expired, or it was opened in
          a different browser. Request a new link and open it in the same browser
          you used to request it.
        </p>

        <div className="mt-7 space-y-3">
          <Link href="/forgot-password" className={`${primaryButton} w-full`}>
            Request a new link
          </Link>
          <Link href="/login" className={`${secondaryButton} w-full`}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="animate-rise text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Password updated
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Your new password is ready. You can continue to Mindspace now.
        </p>

        <button
          type="button"
          onClick={() => router.replace('/dashboard')}
          className={`${primaryButton} mt-7 w-full`}
        >
          Continue to Mindspace
        </button>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Use at least 8 characters. You&apos;ll use this password the next time you
        sign in.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <div>
          <label htmlFor="password" className={labelClass}>
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
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

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your new password"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
