import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
}

export function Logo({ href = '/', compact = false, inverted = false }: LogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/25">
        <Sparkles size={18} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span
          className={`text-lg font-semibold tracking-tight ${
            inverted ? 'text-white' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          Mindspace
        </span>
      )}
    </Link>
  );
}
