'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  KeyRound,
  Mail,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorBanner } from '@/components/error-banner';
import { Spinner } from '@/components/spinner';
import { api, errorMessage } from '@/lib/api';
import { sendPasswordResetEmail } from '@/lib/auth';
import { toggleTheme, useIsClient, useTheme } from '@/lib/theme';
import {
  cardClass,
  dangerButton,
  inputClass,
  labelClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButton,
  secondaryButton,
} from '@/lib/styles';
import type { Profile, ProfileStatus } from '@/lib/types';

const STATUS_META: Record<ProfileStatus, { label: string; badge: string }> = {
  active: {
    label: 'Active',
    badge:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900',
  },
  failed: {
    label: 'Failed',
    badge:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
  },
  inactive: {
    label: 'Inactive',
    badge:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  },
  archived: {
    label: 'Archived',
    badge:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const theme = useTheme();
  const isClient = useIsClient();
  const isDark = isClient && theme === 'dark';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { profile: fetched } = await api.profile.get();
        if (!active) return;
        setProfile(fetched);
        setFullName(fetched.full_name ?? '');
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const { profile: updated } = await api.profile.update({
        fullName: fullName.trim() || null,
      });
      setProfile(updated);
      setFullName(updated.full_name ?? '');
      setSaved(true);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    setSendingReset(true);
    setResetSent(false);
    setError(null);

    try {
      if (!profile?.email) {
        throw new Error('No email address is available for this account.');
      }

      const { error: resetError } = await sendPasswordResetEmail(profile.email);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
    } catch (resetError) {
      setError(errorMessage(resetError));
    } finally {
      setSendingReset(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError(null);

    try {
      await api.profile.remove();
      await signOut();
      router.replace('/login');
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setDeleting(false);
      setConfirmingDeleteAccount(false);
    }
  }

  const status = profile ? STATUS_META[profile.status] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise">
        <h1 className={pageTitleClass}>Settings</h1>
        <p className={pageSubtitleClass}>
          Manage your profile and account status.
        </p>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {saved && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Your full name has been updated.
        </div>
      )}

      <section className={`${cardClass} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Profile
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Only your full name can be edited.
              </p>
            </div>
          </div>
          {status && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
            >
              {status.label}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 p-5">
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 p-5">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={profile?.email ?? ''}
                  disabled
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                Your email is managed by Supabase and cannot be changed here.
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setSaved(false);
                }}
                maxLength={120}
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className={primaryButton}
              >
                {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={`${cardClass} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
              {isDark ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Appearance
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Choose how Mindspace looks on this device.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {isDark ? 'Dark theme' : 'Light theme'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Your preference is saved in this browser.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark theme"
            onClick={toggleTheme}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25 ${
              isDark
                ? 'border-indigo-500 bg-indigo-600'
                : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'
            }`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full bg-white text-amber-500 shadow-sm transition-transform dark:bg-slate-100 dark:text-indigo-600 ${
                isDark ? 'translate-x-7' : 'translate-x-1'
              }`}
            >
              {isDark ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        </div>
      </section>

      <section className={`${cardClass} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Password
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Reset your password by email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Password reset
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              We&apos;ll send a secure reset link to {profile?.email ?? 'your email'}.
              Open it in this browser.
            </p>
            {resetSent && (
              <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Reset link sent. Check your inbox.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handlePasswordReset()}
            disabled={sendingReset || loading || !profile?.email}
            className={secondaryButton}
          >
            {sendingReset ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {sendingReset ? 'Sending…' : 'Send reset link'}
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm shadow-rose-900/[0.03] dark:border-rose-900/70 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex flex-wrap items-center gap-3 border-b border-rose-100 px-5 py-4 dark:border-rose-900/50">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <CircleAlert className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Danger zone
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                After deleting your account, you can never access this account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingDeleteAccount(true)}
            disabled={deleting}
            className={`ml-auto ${dangerButton}`}
          >
            {deleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmingDeleteAccount}
        title="Archive your account?"
        description="You will be signed out and this account cannot sign in again. Your data is kept in the database."
        confirmLabel="Archive account"
        tone="danger"
        busy={deleting}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => {
          if (!deleting) setConfirmingDeleteAccount(false);
        }}
      />
    </div>
  );
}
