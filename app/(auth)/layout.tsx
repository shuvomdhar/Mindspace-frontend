'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Kanban, ListTodo, NotebookPen, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { FullPageLoader } from '@/components/spinner';

const FEATURES = [
  {
    icon: NotebookPen,
    title: 'Rich notes',
    description: 'Headings, lists, quotes and code — all in one calm editor.',
  },
  {
    icon: ListTodo,
    title: 'Focused tasks',
    description: 'A clear title and a rich description for every task.',
  },
  {
    icon: Kanban,
    title: 'Visual board',
    description: 'Move work from planned to completed with drag and drop.',
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPasswordReset = pathname === '/reset-password';

  useEffect(() => {
    if (!loading && session && !isPasswordReset) {
      router.replace('/dashboard');
    }
  }, [isPasswordReset, loading, session, router]);

  if (loading || (session && !isPasswordReset)) {
    return <FullPageLoader label="Checking your session…" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-[24rem] w-[24rem] rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative z-10">
          <Logo inverted />
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 mt-2.5 text-xs font-medium text-indigo-100 backdrop-blur">
            <Sparkles className="h-2.5 w-3.5" />
            Your thoughts, organised
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            A quiet place for
            <br />
            everything on your mind.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Capture notes, keep tasks moving and see the whole picture on one
            board.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-indigo-200 backdrop-blur">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500 mt-10">
          Mindspace · built with Next.js, Express and Supabase
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
