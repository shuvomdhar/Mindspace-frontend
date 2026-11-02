import type { JSONContent } from '@tiptap/react';

export type IdeaStatus =
  | 'planned'
  | 'in_progress'
  | 'feature_request'
  | 'completed';

export const IDEA_STATUSES: IdeaStatus[] = [
  'planned',
  'in_progress',
  'feature_request',
  'completed',
];

export interface StatusMeta {
  label: string;
  short: string;
  badge: string;
  dot: string;
  bar: string;
  column: string;
  columnHeader: string;
}

export const STATUS_META: Record<IdeaStatus, StatusMeta> = {
  planned: {
    label: 'Planned',
    short: 'Planned',
    badge:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    column:
      'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60',
    columnHeader: 'text-slate-600 dark:text-slate-300',
  },
  in_progress: {
    label: 'In Progress',
    short: 'In progress',
    badge:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    column:
      'border-blue-200 bg-blue-50/50 dark:border-blue-900/70 dark:bg-blue-950/30',
    columnHeader: 'text-blue-700 dark:text-blue-300',
  },
  feature_request: {
    label: 'Feature Request',
    short: 'Feature',
    badge:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    column:
      'border-amber-200 bg-amber-50/50 dark:border-amber-900/70 dark:bg-amber-950/30',
    columnHeader: 'text-amber-700 dark:text-amber-300',
  },
  completed: {
    label: 'Completed',
    short: 'Done',
    badge:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    column:
      'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/70 dark:bg-emerald-950/30',
    columnHeader: 'text-emerald-700 dark:text-emerald-300',
  },
};

/** Tiptap / ProseMirror JSON document. */
export type RichTextDoc = JSONContent;

export function createEmptyDoc(): RichTextDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export type ProfileStatus = 'failed' | 'active' | 'inactive' | 'archived';

export type NoteStatus = 'active' | 'archived';

export interface Profile {
  id: number;
  user_id: string;
  email: string;
  full_name: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface NoteSummary {
  id: number;
  title: string;
  content_text: string;
  status: NoteStatus;
  created_at: string;
  updated_at: string;
}

export interface Note extends NoteSummary {
  user_id: string;
  content: RichTextDoc;
}

export interface Idea {
  id: number;
  user_id: string;
  title: string;
  description: RichTextDoc;
  description_text: string;
  status: IdeaStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface EditorValue {
  json: RichTextDoc;
  text: string;
}
