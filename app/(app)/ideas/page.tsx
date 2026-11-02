'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Lightbulb,
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
  IDEA_STATUSES,
  STATUS_META,
  type EditorValue,
  type Idea,
  type IdeaStatus,
  type RichTextDoc,
} from '@/lib/types';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<RichTextDoc | null>(null);
  const [descriptionText, setDescriptionText] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('planned');
  const [isNew, setIsNew] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IdeaStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const openIdea = useCallback((idea: Idea) => {
    setSelectedId(idea.id);
    setTitle(idea.title);
    setDescription(idea.description);
    setDescriptionText(idea.description_text);
    setStatus(idea.status);
    setIsNew(false);
    setDirty(false);
    setEditorKey((key) => key + 1);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { ideas: fetched } = await api.ideas.list();
        if (!active) return;
        setIdeas(fetched);
        if (fetched[0]) openIdea(fetched[0]);
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [openIdea]);

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
      setError('Give your idea a title before saving.');
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
        const { idea } = await api.ideas.create(payload);
        setIdeas((previous) => [...previous, idea]);
        setSelectedId(idea.id);
        setIsNew(false);
        setTitle(idea.title);
        setDescription(idea.description);
        setDescriptionText(idea.description_text);
        setStatus(idea.status);
      } else if (selectedId !== null) {
        const { idea } = await api.ideas.update(selectedId, payload);
        setIdeas((previous) =>
          previous.map((item) => (item.id === idea.id ? idea : item)),
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
      await api.ideas.remove(selectedId);
      const remaining = ideas.filter((item) => item.id !== selectedId);
      setIdeas(remaining);
      if (remaining[0]) {
        openIdea(remaining[0]);
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

  const visibleIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (filter !== 'all' && idea.status !== filter) return false;
      if (!query) return true;
      return (
        idea.title.toLowerCase().includes(query) ||
        idea.description_text.toLowerCase().includes(query)
      );
    });
  }, [ideas, filter, search]);

  const counts = useMemo(() => {
    const result: Record<IdeaStatus | 'all', number> = {
      all: ideas.length,
      planned: 0,
      in_progress: 0,
      feature_request: 0,
      completed: 0,
    };
    for (const idea of ideas) result[idea.status] += 1;
    return result;
  }, [ideas]);

  const hasSelection = isNew || selectedId !== null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitleClass}>Ideas</h1>
          <p className={pageSubtitleClass}>
            Capture an idea and give it the detail it deserves.
          </p>
        </div>
        <button type="button" onClick={handleNew} className={primaryButton}>
          <Plus className="h-4 w-4" />
          New idea
        </button>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ideas…"
                aria-label="Search ideas"
                className={`${inputClass} bg-slate-50 pl-9 dark:bg-slate-800/60`}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['all', ...IDEA_STATUSES] as const).map((value) => {
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

          <div className="p-2">
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

            {!loading && ideas.length === 0 && (
              <div className="p-2">
                <EmptyState
                  icon={Lightbulb}
                  title="No ideas yet"
                  description="Add your first idea and move it across the board as you work."
                  action={
                    <button
                      type="button"
                      onClick={handleNew}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" />
                      New idea
                    </button>
                  }
                />
              </div>
            )}

            {!loading && ideas.length > 0 && visibleIdeas.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                No ideas match this filter.
              </p>
            )}

            {!loading &&
              visibleIdeas.map((idea) => {
                const active = idea.id === selectedId && !isNew;
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => openIdea(idea)}
                    aria-current={active ? 'true' : undefined}
                    className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? 'bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:ring-indigo-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`min-w-0 flex-1 break-words text-sm font-medium ${
                          active
                            ? 'text-indigo-900 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {idea.title}
                      </span>
                      <span className="shrink-0">
                        <StatusBadge status={idea.status} />
                      </span>
                    </span>
                    {idea.description_text.trim() && (
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {truncate(idea.description_text, 56)}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Updated {relativeTime(idea.updated_at)}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="min-w-0">
          {!hasSelection ? (
            <EmptyState
              icon={Lightbulb}
              title="Select an idea"
              description="Choose an idea from the list or create a new one to see its title and rich description."
              action={
                <button
                  type="button"
                  onClick={handleNew}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  New idea
                </button>
              }
              className="min-h-[440px] bg-white dark:bg-slate-900"
            />
          ) : (
            <div className={`${cardClass} animate-rise overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isNew ? 'New idea' : 'Idea details'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {isNew
                      ? 'Give it a title and add as much detail as you need.'
                      : 'Changes are saved when you press Save idea.'}
                  </p>
                </div>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className={ghostButton}
                    title="Delete idea"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <div>
                  <label htmlFor="idea-title" className={labelClass}>
                    Title
                  </label>
                  <input
                    id="idea-title"
                    type="text"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="What is your idea?"
                    maxLength={200}
                    className={`${inputClass} text-base font-medium`}
                  />
                </div>

                <div>
                  <label htmlFor="idea-status" className={labelClass}>
                    Status
                  </label>
                  <select
                    id="idea-status"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as IdeaStatus);
                      setDirty(true);
                    }}
                    className={`${inputClass} sm:max-w-xs`}
                  >
                    {IDEA_STATUSES.map((value) => (
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
                  {saving ? 'Saving…' : 'Save idea'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this idea?"
        description="This cannot be undone."
        confirmLabel="Delete idea"
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
