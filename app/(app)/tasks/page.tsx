'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ListTodo,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Spinner } from '@/components/spinner';
import { StatusBadge } from '@/components/status-badge';
import { api, errorMessage } from '@/lib/api';
import { relativeTime, truncate } from '@/lib/format';
import {
  cardClass,
  ghostButton,
  inputClass,
  labelClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButton,
} from '@/lib/styles';
import {
  createEmptyDoc,
  STATUS_META,
  TASK_STATUSES,
  type EditorValue,
  type RichTextDoc,
  type Task,
  type TaskStatus,
} from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<RichTextDoc | null>(null);
  const [descriptionText, setDescriptionText] = useState('');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [isNew, setIsNew] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const openTask = useCallback((task: Task) => {
    setSelectedId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDescriptionText(task.description_text);
    setStatus(task.status);
    setIsNew(false);
    setDirty(false);
    setEditorKey((key) => key + 1);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { tasks: fetched } = await api.tasks.list();
        if (!active) return;
        setTasks(fetched);
        if (fetched[0]) openTask(fetched[0]);
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [openTask]);

  function handleNew() {
    setSelectedId(null);
    setTitle('');
    setDescription(createEmptyDoc());
    setDescriptionText('');
    setStatus(filter === 'all' ? 'planned' : filter);
    setIsNew(true);
    setDirty(false);
    setEditorKey((key) => key + 1);
    setError(null);
  }

  const handleDescriptionChange = useCallback((value: EditorValue) => {
    setDescription(value.json);
    setDescriptionText(value.text);
    setDirty(true);
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      setError('Give your task a title before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        status,
        ...(description
          ? { description: { json: description, text: descriptionText } }
          : {}),
      };

      if (isNew) {
        const { task } = await api.tasks.create(payload);
        setTasks((previous) => [...previous, task]);
        setSelectedId(task.id);
        setIsNew(false);
        setTitle(task.title);
        setDescription(task.description);
        setDescriptionText(task.description_text);
        setStatus(task.status);
      } else if (selectedId !== null) {
        const { task } = await api.tasks.update(selectedId, payload);
        setTasks((previous) =>
          previous.map((item) => (item.id === task.id ? task : item)),
        );
      }

      setDirty(false);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (selectedId === null) return;

    setDeleting(true);
    try {
      await api.tasks.remove(selectedId);
      const remaining = tasks.filter((item) => item.id !== selectedId);
      setTasks(remaining);
      if (remaining[0]) {
        openTask(remaining[0]);
      } else {
        setSelectedId(null);
        setIsNew(false);
        setTitle('');
        setDescription(null);
        setDescriptionText('');
        setStatus('planned');
        setDirty(false);
      }
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filter !== 'all' && task.status !== filter) return false;
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) ||
        task.description_text.toLowerCase().includes(query)
      );
    });
  }, [tasks, filter, search]);

  const counts = useMemo(() => {
    const result: Record<TaskStatus | 'all', number> = {
      all: tasks.length,
      planned: 0,
      in_progress: 0,
      feature_request: 0,
      completed: 0,
    };
    for (const task of tasks) result[task.status] += 1;
    return result;
  }, [tasks]);

  const hasSelection = isNew || selectedId !== null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitleClass}>Tasks</h1>
          <p className={pageSubtitleClass}>
            A title and a rich description for everything you need to do.
          </p>
        </div>
        <button type="button" onClick={handleNew} className={primaryButton}>
          <Plus className="h-4 w-4" />
          New task
        </button>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className={`${cardClass} flex min-h-[440px] flex-col overflow-hidden`}>
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
                className={`${inputClass} bg-slate-50 pl-9 dark:bg-slate-800/60`}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['all', ...TASK_STATUSES] as const).map((value) => {
                const active = filter === value;
                const label =
                  value === 'all' ? 'All' : STATUS_META[value].short;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {label} · {counts[value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(100vh-20rem)] flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="space-y-2 p-1">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            )}

            {!loading && tasks.length === 0 && (
              <div className="p-2">
                <EmptyState
                  icon={ListTodo}
                  title="No tasks yet"
                  description="Add your first task and move it across the board as you work."
                  action={
                    <button
                      type="button"
                      onClick={handleNew}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" />
                      New task
                    </button>
                  }
                />
              </div>
            )}

            {!loading && tasks.length > 0 && visibleTasks.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                No tasks match this filter.
              </p>
            )}

            {!loading &&
              visibleTasks.map((task) => {
                const active = task.id === selectedId && !isNew;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => openTask(task)}
                    aria-current={active ? 'true' : undefined}
                    className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? 'bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:ring-indigo-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`truncate text-sm font-medium ${
                          active
                            ? 'text-indigo-900 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {task.title}
                      </span>
                      <StatusBadge status={task.status} />
                    </span>
                    {task.description_text.trim() && (
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {truncate(task.description_text, 56)}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Updated {relativeTime(task.updated_at)}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="min-w-0">
          {!hasSelection ? (
            <EmptyState
              icon={ListTodo}
              title="Select a task"
              description="Choose a task from the list or create a new one to see its title and rich description."
              action={
                <button
                  type="button"
                  onClick={handleNew}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              }
              className="min-h-[440px] bg-white dark:bg-slate-900"
            />
          ) : (
            <div className={`${cardClass} animate-rise overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isNew ? 'New task' : 'Task details'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {isNew
                      ? 'Give it a title and add as much detail as you need.'
                      : 'Changes are saved when you press Save task.'}
                  </p>
                </div>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className={ghostButton}
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <div>
                  <label htmlFor="task-title" className={labelClass}>
                    Title
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="What needs to be done?"
                    maxLength={200}
                    className={`${inputClass} text-base font-medium`}
                  />
                </div>

                <div>
                  <label htmlFor="task-status" className={labelClass}>
                    Status
                  </label>
                  <select
                    id="task-status"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as TaskStatus);
                      setDirty(true);
                    }}
                    className={`${inputClass} sm:max-w-xs`}
                  >
                    {TASK_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_META[value].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className={labelClass}>Description</span>
                  <RichTextEditor
                    contentKey={`${selectedId ?? 'new'}-${editorKey}`}
                    initialContent={description}
                    onChange={handleDescriptionChange}
                    placeholder="Add context, checklists, links — anything useful…"
                    minHeightClass="min-h-[220px]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p
                  className={`text-xs ${
                    dirty ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {dirty ? 'Unsaved changes' : 'All changes saved'}
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={primaryButton}
                >
                  {saving ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving…' : 'Save task'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this task?"
        description="This cannot be undone."
        confirmLabel="Delete task"
        tone="danger"
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setConfirmingDelete(false);
        }}
      />
    </div>
  );
}
