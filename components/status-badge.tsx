import { STATUS_META, type IdeaStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function StatusDot({ status }: { status: IdeaStatus }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`}
      aria-hidden="true"
    />
  );
}
