import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import clsx from 'clsx';

const STATUSES = ['', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'];
const CATEGORIES = ['', 'Travel', 'Food & Dining', 'Accommodation', 'Office Supplies', 'Equipment', 'Software', 'Training', 'Medical', 'Entertainment', 'Other'];

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function ExpensesListPage() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { status, category, page }],
    queryFn: () => api.get('/expenses', { params: { status: status || undefined, category: category || undefined, page, limit: 15 } }).then(r => r.data),
    keepPreviousData: true,
  });

  const filtered = (data?.expenses || []).filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sel = 'px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ' +
    (dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-700');

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>
            {user?.role === 'EMPLOYEE' ? 'My Expenses' : 'All Expenses'}
          </h1>
          <p className={clsx('text-sm mt-0.5', dark ? 'text-slate-400' : 'text-gray-400')}>
            {data?.total || 0} total expenses
          </p>
        </div>
        {user?.role === 'EMPLOYEE' && (
          <Link to="/expenses/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
            <Plus size={16} /> New Expense
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className={clsx('rounded-2xl border p-4 flex flex-col sm:flex-row gap-3', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by title or employee…"
            value={search} onChange={e => setSearch(e.target.value)}
            className={clsx('w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
              dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-100 text-gray-900'
            )}
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={sel}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className={sel}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={32} className="mx-auto text-gray-200 dark:text-slate-600 mb-3" />
              <h3 className={clsx('font-medium', dark ? 'text-slate-300' : 'text-gray-500')}>No expenses found</h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={clsx('text-xs border-b', dark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400')}>
                      {(user?.role !== 'EMPLOYEE' ? ['Employee', 'Title', 'Amount', 'Category', 'Date', 'Status', ''] : ['Title', 'Amount', 'Category', 'Date', 'Status', '']).map(h => (
                        <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(exp => (
                      <tr key={exp.id} className={clsx('border-t transition-colors', dark ? 'border-slate-700 hover:bg-slate-700/40' : 'border-gray-50 hover:bg-gray-50/80')}>
                        {user?.role !== 'EMPLOYEE' && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                                {exp.user?.name?.charAt(0)}
                              </div>
                              <span className={clsx('text-sm font-medium', dark ? 'text-white' : 'text-gray-800')}>{exp.user?.name}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <Link to={`/expenses/${exp.id}`} className={clsx('font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors', dark ? 'text-white' : 'text-gray-900')}>
                            {exp.title}
                          </Link>
                          {exp.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-[180px]">{exp.description}</p>}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700 dark:text-slate-200">{fmt(exp.convertedAmount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={clsx('text-xs px-2 py-1 rounded-lg', dark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}>{exp.category}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 dark:text-slate-500 text-xs">{new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={exp.status} /></td>
                        <td className="px-5 py-3.5">
                          <Link to={`/expenses/${exp.id}`} className="text-xs text-indigo-500 hover:underline font-medium">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className={clsx('flex items-center justify-between px-5 py-3 border-t', dark ? 'border-slate-700' : 'border-gray-100')}>
                  <p className="text-xs text-gray-400">Page {data?.page} of {data?.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className={clsx('p-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors',
                        dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}>
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(data?.totalPages, p + 1))} disabled={page === data?.totalPages}
                      className={clsx('p-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors',
                        dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
