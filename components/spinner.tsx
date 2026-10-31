import { LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={`animate-spin ${className}`}
    />
  );
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Spinner className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </span>
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
