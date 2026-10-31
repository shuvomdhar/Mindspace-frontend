'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Kanban,
  ListTodo,
  NotebookPen,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { ErrorBanner } from '@/components/error-banner';
import { StatusBadge } from '@/components/status-badge';
import { api, errorMessage } from '@/lib/api';
import { pluralize, relativeTime, truncate } from '@/lib/format';
import {
  cardClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButton,
  secondaryButton,
} from '@/lib/styles';
import {
  STATUS_META,
  TASK_STATUSES,
  type NoteSummary,
  type Task,
} from '@/lib/types';

const TONES = {
  indigo:
    'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900',
  amber:
    'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900',
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [notesResult, tasksResult] = await Promise.all([
          api.notes.list(),
          api.tasks.list(),
        ]);
        if (!active) return;
        setNotes(notesResult.notes);
        setTasks(tasksResult.tasks);
        setError(null);
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

  const metadata = user?.user_metadata ?? {};
  const name =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'there';

  const completed = tasks.filter((task) => task.status === 'completed').length;
  const openTasks = tasks.length - completed;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  const focusTasks = tasks
    .filter((task) => task.status !== 'completed')
    .slice(0, 4);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {greeting}, {name}
          </p>
          <h1 className={pageTitleClass}>Your space at a glance</h1>
          <p className={pageSubtitleClass}>
            {loading
              ? 'Gathering your notes and tasks…'
              : `${pluralize(notes.length, 'note')} · ${pluralize(tasks.length, 'task')} · ${completionRate}% complete`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/notes" className={primaryButton}>
            <Plus className="h-4 w-4" />
            New note
          </Link>
          <Link href="/board" className={secondaryButton}>
            Open board
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={NotebookPen}
          label="Notes"
          value={loading ? '—' : notes.length}
          hint="Thoughts captured in rich text"
          tone="indigo"
        />
        <StatCard
          icon={ListTodo}
          label="Open tasks"
          value={loading ? '—' : openTasks}
          hint="Planned, in progress or requested"
          tone="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={loading ? '—' : completed}
          hint="Moved across the finish line"
          tone="emerald"
        />
        <StatCard
          icon={ArrowUpRight}
          label="Completion"
          value={loading ? '—' : `${completionRate}%`}
          hint="Across your whole board"
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className={`${cardClass} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Board overview
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                How your work is distributed
              </p>
            </div>
            <Link
              href="/board"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View board
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {TASK_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              const count = tasks.filter((task) => task.status === status).length;
              const percent =
                tasks.length === 0 ? 0 : Math.round((count / tasks.length) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-slate-400">
                      {count} · {percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick actions
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Jump in
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              href="/notes"
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300">
                <NotebookPen className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Write a note
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                  Capture a thought or plan
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
            </Link>

            <Link
              href="/tasks"
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300">
                <ListTodo className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Add a task
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                  Give your next step a title
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
            </Link>

            <Link
              href="/board"
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-300">
                <Kanban className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Open the board
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                  Drag work across the columns
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent notes
            </h2>
            <Link
              href="/notes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              All notes
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {loading &&
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}

            {!loading && notes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  No notes yet
                </p>
                <Link
                  href="/notes"
                  className="mt-2 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Create your first note
                </Link>
              </div>
            )}

            {!loading &&
              notes.slice(0, 3).map((note) => (
                <Link
                  key={note.id}
                  href="/notes"
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <NotebookPen className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {note.title || 'Untitled note'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {note.content_text.trim()
                        ? `${truncate(note.content_text, 44)} · `
                        : ''}
                      Updated {relativeTime(note.updated_at)}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
                </Link>
              ))}
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              In focus
            </h2>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              All tasks
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {loading &&
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}

            {!loading && focusTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Nothing on your plate
                </p>
                <Link
                  href="/tasks"
                  className="mt-2 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Add a task
                </Link>
              </div>
            )}

            {!loading &&
              focusTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {task.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-[11px] text-slate-400">
                        {relativeTime(task.updated_at)}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
