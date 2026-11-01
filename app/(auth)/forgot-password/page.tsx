'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { ErrorBanner } from '@/components/error-banner';
import { Spinner } from '@/components/spinner';
import { sendPasswordResetEmail } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from '@/lib/styles';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to frontend/.env.local.',
      );
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await sendPasswordResetEmail(email.trim());

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSentTo(email.trim());
    } catch {
      setError('Could not send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="animate-rise">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          If an account exists for{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {sentTo}
          </span>
          , we sent a password reset link. It may take a minute to arrive. Open
          the link in the same browser you used to request it.
        </p>

        <div className="mt-7 space-y-3">
          <Link href="/login" className={`${primaryButton} w-full`}>
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
            className={`${secondaryButton} w-full`}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Enter the email address for your Mindspace account and we&apos;ll send you
        a reset link.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Supabase keys are missing. Copy{' '}
          <code className="font-mono text-xs">frontend/.env.example</code> to{' '}
          <code className="font-mono text-xs">.env.local</code> and add your
          project URL and anon key.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? 'Sending…' : 'Send reset link'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
