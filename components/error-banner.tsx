'use client';

import { TriangleAlert, X } from 'lucide-react';

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-md p-0.5 text-rose-500 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/60 dark:hover:text-rose-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
