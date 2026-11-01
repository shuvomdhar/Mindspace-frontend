'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Spinner } from '@/components/spinner';
import { googleAuthErrorMessage, safeNextPath } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const nextPath = safeNextPath(query.get('next'));
    const oauthError =
      query.get('error_description') ??
      query.get('error') ??
      hash.get('error_description') ??
      hash.get('error');

    if (oauthError) {
      const errorTimer = window.setTimeout(() => {
        if (!cancelled) setError(googleAuthErrorMessage(oauthError));
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(errorTimer);
      };
    }

    const goToDestination = () => {
      if (!cancelled) router.replace(nextPath);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goToDestination();
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) goToDestination();
      })
      .catch(() => {
        // The timeout below surfaces a friendly error.
      });

    const timeout = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        goToDestination();
      } else if (!cancelled) {
        setError(
          'We could not complete the request. The link may have expired — please try again.',
        );
      }
    }, 10_000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-5 dark:bg-slate-950">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <CircleAlert className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              We couldn&apos;t complete that
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
            <Spinner className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-medium">Finishing up…</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              You will be redirected in a moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
