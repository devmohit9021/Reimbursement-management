import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CheckSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function ApprovalsPage() {
  const { dark } = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-approvals-page', page],
    queryFn: () => api.get('/expenses/pending', { params: { page, limit: 15 } }).then(r => r.data),
    keepPreviousData: true,
  });

  const filtered = (data?.expenses || []).filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>Pending Approvals</h1>
        <p className={clsx('text-sm mt-0.5', dark ? 'text-slate-400' : 'text-gray-400')}>
          {data?.total || 0} expenses awaiting your review
        </p>
      </div>

      {data?.total === 0 && !isLoading ? (
        <div className={clsx('rounded-2xl border border-dashed p-14 text-center', dark ? 'border-slate-600' : 'border-gray-200')}>
          <CheckSquare size={36} className="mx-auto text-green-300 dark:text-green-700 mb-3" />
          <h3 className={clsx('font-semibold mb-1', dark ? 'text-slate-300' : 'text-gray-700')}>All caught up!</h3>
          <p className="text-sm text-gray-400">No expenses pending your approval</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className={clsx('rounded-2xl border p-4', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search by employee or expense title…"
                value={search} onChange={e => setSearch(e.target.value)}
                className={clsx('w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
                  dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
            </div>
          </div>

          {isLoading ? <TableSkeleton rows={6} cols={6} /> : (
            <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={clsx('text-xs border-b', dark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400')}>
                      {['Employee', 'Expense Title', 'Amount', 'Category', 'Date Submitted', 'Step', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(exp => (
                      <tr key={exp.id} className={clsx('border-t transition-colors', dark ? 'border-slate-700 hover:bg-slate-700/40' : 'border-gray-50 hover:bg-amber-50/50')}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                              {exp.user?.name?.charAt(0)}
                            </div>
                            <div>
                              <div className={clsx('font-medium', dark ? 'text-white' : 'text-gray-800')}>{exp.user?.name}</div>
                              <div className="text-xs text-gray-400">{exp.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={clsx('font-medium', dark ? 'text-white' : 'text-gray-900')}>{exp.title}</div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-700 dark:text-slate-200">{fmt(exp.convertedAmount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={clsx('text-xs px-2 py-1 rounded-lg', dark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}>{exp.category}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(exp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-1 rounded-lg">Step {exp.currentStepOrder}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link to={`/expenses/${exp.id}`}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data?.totalPages > 1 && (
                <div className={clsx('flex items-center justify-between px-5 py-3 border-t', dark ? 'border-slate-700' : 'border-gray-100')}>
                  <p className="text-xs text-gray-400">Page {data?.page} of {data?.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className={clsx('p-1.5 rounded-lg border disabled:opacity-40', dark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-600')}>
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}
                      className={clsx('p-1.5 rounded-lg border disabled:opacity-40', dark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-600')}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
