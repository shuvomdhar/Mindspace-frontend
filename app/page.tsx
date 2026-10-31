'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { Spinner } from '@/components/spinner';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? '/dashboard' : '/login');
  }, [loading, session, router]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5 text-white">
        <Logo compact />
        <p className="text-sm font-medium text-slate-300">Opening your space…</p>
        <Spinner className="h-5 w-5 text-indigo-300" />
      </div>
    </div>
  );
}
