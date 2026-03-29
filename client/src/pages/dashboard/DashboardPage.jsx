import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { Receipt, CheckSquare, Clock, DollarSign, Users, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

function fmt(n, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { dark } = useTheme();

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary').then(r => r.data),
    enabled: user?.role !== 'EMPLOYEE',
    refetchInterval: 30000,
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => api.get('/analytics/trends').then(r => r.data),
    enabled: user?.role !== 'EMPLOYEE',
  });

  const { data: byCategory } = useQuery({
    queryKey: ['analytics-category'],
    queryFn: () => api.get('/analytics/by-category').then(r => r.data),
    enabled: user?.role !== 'EMPLOYEE',
  });

  const { data: myExpenses, isLoading: expLoading } = useQuery({
    queryKey: ['my-expenses'],
    queryFn: () => api.get('/expenses?limit=5').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: pending } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => api.get('/expenses/pending?limit=5').then(r => r.data),
    enabled: user?.role !== 'EMPLOYEE',
    refetchInterval: 30000,
  });

  const tooltipStyle = {
    backgroundColor: dark ? '#1E293B' : '#fff',
    border: `1px solid ${dark ? '#334155' : '#E5E7EB'}`,
    borderRadius: 12,
    color: dark ? '#E2E8F0' : '#111827',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className={clsx('text-sm mt-1', dark ? 'text-slate-400' : 'text-gray-500')}>
          Here's what's happening with your expenses today
        </p>
      </div>

      {/* KPI Cards */}
      {user?.role !== 'EMPLOYEE' ? (
        sumLoading ? <CardSkeleton count={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Expenses" value={summary?.total || 0} icon={Receipt} color="indigo" subtitle="All time" />
            <KpiCard title="Pending Approval" value={summary?.pending || 0} icon={Clock} color="amber" subtitle={summary?.pendingForMe ? `${summary.pendingForMe} need your review` : 'In queue'} />
            <KpiCard title="Approved" value={summary?.approved || 0} icon={CheckSquare} color="green" />
            <KpiCard title="Total Reimbursed" value={fmt(summary?.totalApprovedAmount, user?.defaultCurrency)} icon={DollarSign} color="indigo" />
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard title="My Expenses" value={myExpenses?.total || 0} icon={Receipt} color="indigo" />
          <KpiCard title="Pending" value={myExpenses?.expenses?.filter(e => e.status === 'PENDING').length || 0} icon={Clock} color="amber" />
          <KpiCard title="Approved" value={myExpenses?.expenses?.filter(e => e.status === 'APPROVED').length || 0} icon={CheckSquare} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        {user?.role !== 'EMPLOYEE' && (
          <div className={clsx('lg:col-span-2 rounded-2xl border p-5', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={clsx('text-sm font-semibold', dark ? 'text-white' : 'text-gray-900')}>Expense Trends</h3>
                <p className={clsx('text-xs', dark ? 'text-slate-400' : 'text-gray-400')}>Last 6 months</p>
              </div>
              <TrendingUp size={18} className="text-indigo-400" />
            </div>
            {trends?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#F3F4F6'} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? '#94A3B8' : '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: dark ? '#94A3B8' : '#9CA3AF' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="submitted" name="Submitted" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No trend data yet</div>
            )}
          </div>
        )}

        {/* Category Breakdown */}
        {user?.role !== 'EMPLOYEE' && byCategory?.length ? (
          <div className={clsx('rounded-2xl border p-5', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={clsx('text-sm font-semibold', dark ? 'text-white' : 'text-gray-900')}>By Category</h3>
              <BarChart3 size={18} className="text-indigo-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ category }) => category?.slice(0, 6)}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {/* Pending Approvals table — Manager/Admin */}
      {user?.role !== 'EMPLOYEE' && pending?.expenses?.length > 0 && (
        <div className={clsx('rounded-2xl border', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className={clsx('font-semibold text-sm', dark ? 'text-white' : 'text-gray-900')}>
              Pending Approvals <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pending.total}</span>
            </h3>
            <Link to="/approvals" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={clsx('text-xs', dark ? 'text-slate-400' : 'text-gray-400')}>
                  {['Employee', 'Title', 'Amount', 'Category', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.expenses.map(exp => (
                  <tr key={exp.id} className={clsx('border-t transition-colors', dark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-50 hover:bg-gray-50')}>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{exp.user?.name}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-300">{exp.title}</td>
                    <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200">{fmt(exp.convertedAmount)}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{exp.category}</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-slate-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Link to={`/expenses/${exp.id}`} className="text-xs text-indigo-500 hover:underline">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Recent Expenses */}
      {expLoading ? <TableSkeleton rows={3} /> : myExpenses?.expenses?.length > 0 && (
        <div className={clsx('rounded-2xl border', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className={clsx('font-semibold text-sm', dark ? 'text-white' : 'text-gray-900')}>
              {user?.role === 'EMPLOYEE' ? 'My Recent Expenses' : 'Recent Expenses'}
            </h3>
            <Link to="/expenses" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={clsx('text-xs', dark ? 'text-slate-400' : 'text-gray-400')}>
                  {['Title', 'Amount', 'Category', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myExpenses.expenses.slice(0, 5).map(exp => (
                  <tr key={exp.id} className={clsx('border-t transition-colors', dark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-50 hover:bg-gray-50')}>
                    <td className="px-5 py-3">
                      <Link to={`/expenses/${exp.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">{exp.title}</Link>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200">{fmt(exp.convertedAmount)}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{exp.category}</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-slate-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={exp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee quick action */}
      {user?.role === 'EMPLOYEE' && !myExpenses?.expenses?.length && !expLoading && (
        <div className={clsx('rounded-2xl border border-dashed p-10 text-center', dark ? 'border-slate-600' : 'border-gray-200')}>
          <Receipt size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className={clsx('font-semibold mb-1', dark ? 'text-slate-300' : 'text-gray-700')}>No expenses yet</h3>
          <p className={clsx('text-sm mb-4', dark ? 'text-slate-400' : 'text-gray-400')}>Submit your first reimbursement request</p>
          <Link to="/expenses/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
            <Receipt size={16} /> Submit Expense
          </Link>
        </div>
      )}
    </div>
  );
}
