'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  GripVertical,
  Kanban,
  Plus,
  X,
} from 'lucide-react';
import { ErrorBanner } from '@/components/error-banner';
import { Spinner } from '@/components/spinner';
import { StatusBadge } from '@/components/status-badge';
import { api, errorMessage } from '@/lib/api';
import { relativeTime, truncate } from '@/lib/format';
import {
  cardClass,
  inputClass,
  pageSubtitleClass,
  pageTitleClass,
  secondaryButton,
} from '@/lib/styles';
import {
  STATUS_META,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from '@/lib/types';

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { tasks: fetched } = await api.tasks.list();
        if (!active) return;
        setTasks(fetched);
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

  const grouped = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      planned: [],
      in_progress: [],
      feature_request: [],
      completed: [],
    };
    for (const task of tasks) {
      result[task.status].push(task);
    }
    for (const status of TASK_STATUSES) {
      result[status].sort((a, b) => a.position - b.position);
    }
    return result;
  }, [tasks]);

  async function moveTask(id: number, nextStatus: TaskStatus) {
    const existing = tasks.find((task) => task.id === id);
    if (!existing || existing.status === nextStatus) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, status: nextStatus } : task,
      ),
    );
    setError(null);

    try {
      const { task: updated } = await api.tasks.move(id, nextStatus);
      setTasks((previous) =>
        previous.map((task) => (task.id === id ? updated : task)),
      );
    } catch (moveError) {
      setTasks((previous) =>
        previous.map((task) => (task.id === id ? existing : task)),
      );
      setError(errorMessage(moveError));
    }
  }

  async function handleQuickAdd(status: TaskStatus) {
    const title = newTitle.trim();
    if (!title) return;

    setCreating(true);
    setError(null);
    try {
      const { task } = await api.tasks.create({ title, status });
      setTasks((previous) => [...previous, task]);
      setNewTitle('');
      setAddingTo(null);
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitleClass}>Board</h1>
          <p className={pageSubtitleClass}>
            Drag cards between columns, or use the status menu on a card.
          </p>
        </div>
        <Link href="/tasks" className={secondaryButton}>
          Manage tasks
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <div
              key={status}
              className={`${cardClass} min-h-[420px] p-3`}
            >
              <div className="h-5 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const columnTasks = grouped[status];
            const isOver = dragOver === status;

            return (
              <section
                key={status}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOver(status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragOver((current) =>
                      current === status ? null : current,
                    );
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const raw =
                    event.dataTransfer.getData('text/plain') ||
                    String(draggingId ?? '');
                  const id = Number(raw);
                  setDragOver(null);
                  setDraggingId(null);
                  if (Number.isInteger(id) && id > 0) {
                    void moveTask(id, status);
                  }
                }}
                className={`flex min-h-[440px] flex-col rounded-2xl border p-3 transition ${meta.column} ${
                  isOver
                    ? 'ring-2 ring-indigo-400/70 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <h2 className={`text-sm font-semibold ${meta.columnHeader}`}>
                      {meta.label}
                    </h2>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:ring-slate-700">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTo(addingTo === status ? null : status);
                      setNewTitle('');
                    }}
                    aria-label={`Add a task to ${meta.label}`}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    {addingTo === status ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {addingTo === status && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
                    <input
                      autoFocus
                      type="text"
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleQuickAdd(status);
                        }
                        if (event.key === 'Escape') {
                          setAddingTo(null);
                          setNewTitle('');
                        }
                      }}
                      placeholder="Task title, then Enter"
                      maxLength={200}
                      className={`${inputClass} px-2.5 py-2 text-xs`}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTo(null);
                          setNewTitle('');
                        }}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleQuickAdd(status)}
                        disabled={creating || !newTitle.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {creating ? <Spinner className="h-3 w-3" /> : null}
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex-1 space-y-2">
                  {columnTasks.length === 0 && addingTo !== status && (
                    <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-white/40 px-3 text-center dark:border-slate-700 dark:bg-slate-900/40">
                      <Kanban className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        Drop a task here or add one.
                      </p>
                    </div>
                  )}

                  {columnTasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggingId(task.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData(
                          'text/plain',
                          String(task.id),
                        );
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      className={`group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-slate-600 ${
                        draggingId === task.id
                          ? 'cursor-grabbing opacity-40'
                          : 'cursor-grab'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <Link
                            href="/tasks"
                            className="line-clamp-2 text-sm font-medium leading-5 text-slate-800 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                          >
                            {task.title}
                          </Link>
                          {task.description_text.trim() && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
                              {truncate(task.description_text, 90)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                        <StatusBadge status={task.status} />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {relativeTime(task.updated_at)}
                        </span>
                      </div>

                      <label className="mt-2 block">
                        <span className="sr-only">
                          Move “{task.title}” to another column
                        </span>
                        <select
                          value={task.status}
                          onChange={(event) =>
                            void moveTask(
                              task.id,
                              event.target.value as TaskStatus,
                            )
                          }
                          onMouseDown={(event) => event.stopPropagation()}
                          className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 outline-none transition hover:bg-slate-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:border-indigo-600"
                        >
                          {TASK_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              Move to {STATUS_META[value].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
