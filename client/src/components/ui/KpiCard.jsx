import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }) {
  const { dark } = useTheme();

  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    slate:  'bg-slate-100 text-slate-500',
  };

  return (
    <div className={clsx(
      'rounded-2xl p-5 border transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200',
      dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={clsx('text-xs font-semibold uppercase tracking-wide mb-1', dark ? 'text-slate-400' : 'text-gray-400')}>
            {title}
          </p>
          <p className={clsx('text-2xl font-bold truncate', dark ? 'text-white' : 'text-gray-900')}>
            {value}
          </p>
          {subtitle && (
            <p className={clsx('text-xs mt-1', dark ? 'text-slate-400' : 'text-gray-400')}>{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={clsx('text-xs font-medium mt-1.5', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
