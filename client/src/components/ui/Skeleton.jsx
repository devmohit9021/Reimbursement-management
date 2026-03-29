import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';

export function TableSkeleton({ rows = 5, cols = 5 }) {
  const { dark } = useTheme();
  return (
    <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')}>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className={clsx('h-5 rounded flex-1 skeleton', j === 0 ? 'max-w-[120px]' : '')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-5">
          <div className="skeleton h-3 w-24 mb-3 rounded" />
          <div className="skeleton h-7 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={clsx('skeleton h-4 rounded', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
