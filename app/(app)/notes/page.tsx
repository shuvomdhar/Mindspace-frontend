'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FileText,
  NotebookPen,
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
import { api, errorMessage } from '@/lib/api';
import { formatDay, relativeTime, truncate } from '@/lib/format';
import {
  cardClass,
  ghostButton,
  inputClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButton,
} from '@/lib/styles';
import type {
  EditorValue,
  Note,
  NoteSummary,
  RichTextDoc,
} from '@/lib/types';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState<RichTextDoc | null>(null);
  const [draftText, setDraftText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const editVersion = useRef(0);
  const selectSeq = useRef(0);

  const loadNote = useCallback(async (id: number) => {
    const seq = ++selectSeq.current;
    setSelectedId(id);
    setLoadingNote(true);
    setError(null);

    try {
      const { note: fetched } = await api.notes.get(id);
      if (seq !== selectSeq.current) return;
      setNote(fetched);
      setTitle(fetched.title);
      setDraft(fetched.content);
      setDraftText(fetched.content_text);
      setSavedAt(new Date(fetched.updated_at));
      setDirty(false);
      editVersion.current = 0;
    } catch (loadError) {
      if (seq === selectSeq.current) {
        setError(errorMessage(loadError));
      }
    } finally {
      if (seq === selectSeq.current) {
        setLoadingNote(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { notes: fetched } = await api.notes.list();
        if (!active) return;
        setNotes(fetched);
        if (fetched[0]) {
          void loadNote(fetched[0].id);
        }
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadNote]);

  const persist = useCallback(
    async (id: number, nextTitle: string, content: RichTextDoc, text: string) => {
      setSaving(true);
      try {
        const { note: updated } = await api.notes.update(id, {
          title: nextTitle.trim() || 'Untitled note',
          content: { json: content, text },
        });
        const summary: NoteSummary = {
          id: updated.id,
          title: updated.title,
          content_text: updated.content_text,
          status: updated.status,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        };
        setNotes((previous) => [
          summary,
          ...previous.filter((item) => item.id !== updated.id),
        ]);
        setNote((current) =>
          current && current.id === updated.id ? updated : current,
        );
        setTitle((current) => (current.trim() ? current : updated.title));
        setSavedAt(new Date(updated.updated_at));
        setError(null);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Autosave one second after the user stops typing.
  useEffect(() => {
    if (!dirty || selectedId === null || !draft || saving) return;

    const version = editVersion.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await persist(selectedId, title, draft, draftText);
          if (editVersion.current === version) {
            setDirty(false);
          }
        } catch (saveError) {
          setError(errorMessage(saveError));
        }
      })();
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [dirty, selectedId, title, draft, draftText, saving, persist]);

  const handleTitleChange = useCallback((value: string) => {
    editVersion.current += 1;
    setTitle(value);
    setDirty(true);
  }, []);

  const handleEditorChange = useCallback((value: EditorValue) => {
    editVersion.current += 1;
    setDraft(value.json);
    setDraftText(value.text);
    setDirty(true);
  }, []);

  async function flushCurrent() {
    if (
      dirty &&
      selectedId !== null &&
      draft !== null &&
      !saving
    ) {
      try {
        await persist(selectedId, title, draft, draftText);
        setDirty(false);
      } catch (saveError) {
        setError(errorMessage(saveError));
        throw saveError;
      }
    }
  }

  async function handleSelect(id: number) {
    if (id === selectedId) return;
    try {
      await flushCurrent();
    } catch {
      return;
    }
    await loadNote(id);
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      await flushCurrent();
      const { note: created } = await api.notes.create();
      setNotes((previous) => [
        {
          id: created.id,
          title: created.title,
          content_text: created.content_text,
          status: created.status,
          created_at: created.created_at,
          updated_at: created.updated_at,
        },
        ...previous,
      ]);
      setSelectedId(created.id);
      setNote(created);
      setTitle(created.title);
      setDraft(created.content);
      setDraftText(created.content_text);
      setSavedAt(new Date(created.updated_at));
      setDirty(false);
      editVersion.current = 0;
      setSearch('');
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveNow() {
    if (selectedId === null || !draft) return;
    const version = editVersion.current;
    try {
      await persist(selectedId, title, draft, draftText);
      if (editVersion.current === version) {
        setDirty(false);
      }
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  async function handleDelete() {
    if (selectedId === null) return;

    setDeleting(true);
    const id = selectedId;
    try {
      await api.notes.remove(id);
      const remaining = notes.filter((item) => item.id !== id);
      setNotes(remaining);
      setNote(null);
      setTitle('');
      setDraft(null);
      setDraftText('');
      setDirty(false);
      setSavedAt(null);

      if (remaining[0]) {
        await loadNote(remaining[0].id);
      } else {
        selectSeq.current += 1;
        setSelectedId(null);
        setLoadingNote(false);
      }
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content_text.toLowerCase().includes(query),
    );
  }, [notes, search]);

  const saveLabel = saving
    ? 'Saving…'
    : dirty
      ? 'Unsaved changes'
      : savedAt
        ? `Saved ${relativeTime(savedAt)}`
        : 'All changes saved';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitleClass}>Notes</h1>
          <p className={pageSubtitleClass}>
            A single rich-text space for every thought.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className={primaryButton}
        >
          {creating ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {creating ? 'Creating…' : 'New note'}
        </button>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
                className={`${inputClass} bg-slate-50 pl-9 dark:bg-slate-800/60`}
              />
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

            {!loading && notes.length === 0 && (
              <div className="p-2">
                <EmptyState
                  icon={NotebookPen}
                  title="No notes yet"
                  description="Create your first note and start capturing ideas."
                  action={
                    <button
                      type="button"
                      onClick={handleCreate}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" />
                      New note
                    </button>
                  }
                />
              </div>
            )}

            {!loading && notes.length > 0 && filteredNotes.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                No notes match “{search}”.
              </p>
            )}

            {!loading &&
              filteredNotes.map((item) => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleSelect(item.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? 'bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:ring-indigo-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <FileText
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          active
                            ? 'text-indigo-500 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span
                        className={`min-w-0 flex-1 break-words text-sm font-medium ${
                          active
                            ? 'text-indigo-900 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title || 'Untitled note'}
                      </span>
                    </span>
                    <span className="mt-1 block truncate pl-5 text-[11px] text-slate-400">
                      {item.content_text.trim()
                        ? `${truncate(item.content_text, 40)} · `
                        : ''}
                      {relativeTime(item.updated_at)}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="min-w-0">
          {loadingNote ? (
            <div className={`${cardClass} p-6`}>
              <div className="h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : !note || !draft ? (
            <EmptyState
              icon={NotebookPen}
              title="Select a note"
              description="Pick a note from the list or create a new one to start writing."
              action={
                <button
                  type="button"
                  onClick={handleCreate}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  New note
                </button>
              }
              className="min-h-[420px] bg-white dark:bg-slate-900"
            />
          ) : (
            <div className={`${cardClass} animate-rise overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Note · {formatDay(note.created_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Last edited {relativeTime(note.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className={ghostButton}
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <label htmlFor="note-title" className="sr-only">
                  Note title
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  maxLength={200}
                  placeholder="Note title"
                  className="mb-3 w-full border-0 bg-transparent px-1 text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-600"
                />
                <RichTextEditor
                  contentKey={selectedId ?? 'none'}
                  initialContent={draft}
                  onChange={handleEditorChange}
                  placeholder="Write anything — a thought, a plan, a quote…"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p
                  className={`flex items-center gap-1.5 text-xs ${
                    dirty ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {saving && <Spinner className="h-3 w-3" />}
                  {saveLabel}
                </p>
                <button
                  type="button"
                  onClick={handleSaveNow}
                  disabled={!dirty || saving}
                  className={primaryButton}
                >
                  {saving ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save now
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this note?"
        description="It will be permanently removed from your notes list"
        confirmLabel="Delete note"
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
