import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { ArrowLeft, CheckCircle2, XCircle, Receipt, Calendar, Tag, DollarSign, FileText, User, Clock, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const actionColors = { APPROVED: 'text-green-600', REJECTED: 'text-red-500', PENDING: 'text-amber-500' };
const actionIcons = { APPROVED: CheckCircle2, REJECTED: XCircle, PENDING: Clock };

function fmt(n, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);
}

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [modal, setModal] = useState(null); // 'approve' | 'reject'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get(`/expenses/${id}`).then(r => r.data),
  });

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await api.post(`/approvals/${id}/${action}`, { comment });
      toast.success(action === 'approve' ? 'Expense approved!' : 'Expense rejected');
      qc.invalidateQueries(['expense', id]);
      qc.invalidateQueries(['expenses']);
      qc.invalidateQueries(['pending-approvals']);
      qc.invalidateQueries(['analytics-summary']);
      setModal(null);
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} expense`);
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async () => {
    try {
      await api.patch(`/expenses/${id}/status`, { status: 'PAID' });
      toast.success('Marked as paid!');
      qc.invalidateQueries(['expense', id]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-8 w-32 rounded-xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (!expense) return <div className="text-center py-20 text-gray-400">Expense not found</div>;

  const canApprove = user?.role !== 'EMPLOYEE' && expense.status === 'PENDING';
  const canMarkPaid = user?.role === 'ADMIN' && expense.status === 'APPROVED';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main card */}
      <div className={clsx('rounded-2xl border', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        {/* Header */}
        <div className={clsx('px-6 py-5 border-b flex items-start justify-between gap-4', dark ? 'border-slate-700' : 'border-gray-100')}>
          <div className="flex-1">
            <h1 className={clsx('text-xl font-bold mb-2', dark ? 'text-white' : 'text-gray-900')}>{expense.title}</h1>
            <StatusBadge status={expense.status} />
          </div>
          <div className="text-right">
            <div className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>{fmt(expense.convertedAmount)}</div>
            {expense.currency !== 'INR' && (
              <div className="text-xs text-gray-400">{fmt(expense.amount, expense.currency)}</div>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {[
            { icon: User, label: 'Submitted by', value: expense.user?.name },
            { icon: Tag, label: 'Category', value: expense.category },
            { icon: Calendar, label: 'Expense Date', value: new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
            { icon: Clock, label: 'Submitted', value: new Date(expense.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className={clsx('rounded-xl p-3.5', dark ? 'bg-slate-700/50' : 'bg-gray-50')}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-indigo-400" />
                <span className="text-xs text-gray-400 dark:text-slate-400 font-medium">{label}</span>
              </div>
              <div className={clsx('text-sm font-semibold', dark ? 'text-white' : 'text-gray-800')}>{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {expense.description && (
          <div className={clsx('px-6 pb-5')}>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-gray-400 dark:text-slate-400">Description</span>
            </div>
            <p className={clsx('text-sm', dark ? 'text-slate-300' : 'text-gray-600')}>{expense.description}</p>
          </div>
        )}

        {/* Receipt */}
        {expense.receiptUrl && (
          <div className={clsx('px-6 pb-5')}>
            <div className="flex items-center gap-2 mb-2">
              <Receipt size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-gray-400 dark:text-slate-400">Receipt</span>
            </div>
            <a href={expense.receiptUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-indigo-500 hover:underline">
              <ExternalLink size={12} /> View Receipt
            </a>
          </div>
        )}

        {/* Actions */}
        {(canApprove || canMarkPaid) && (
          <div className={clsx('px-6 py-4 border-t flex gap-3', dark ? 'border-slate-700' : 'border-gray-100')}>
            {canApprove && (
              <>
                <button onClick={() => setModal('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md">
                  <CheckCircle2 size={15} /> Approve
                </button>
                <button onClick={() => setModal('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md">
                  <XCircle size={15} /> Reject
                </button>
              </>
            )}
            {canMarkPaid && (
              <button onClick={markPaid}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md">
                <DollarSign size={15} /> Mark as Paid
              </button>
            )}
          </div>
        )}
      </div>

      {/* Approval Timeline */}
      {expense.approvalRecords?.length > 0 && (
        <div className={clsx('rounded-2xl border p-6', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
          <h2 className={clsx('text-sm font-bold mb-5', dark ? 'text-white' : 'text-gray-900')}>Approval Timeline</h2>
          <div className="space-y-4">
            {expense.workflow?.steps?.map((step, i) => {
              const record = expense.approvalRecords?.find(r => r.stepId === step.id);
              const action = record?.action || 'PENDING';
              const Icon = actionIcons[action];
              const isCurrentStep = expense.currentStepOrder === step.stepOrder && expense.status === 'PENDING';
              return (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                      action === 'APPROVED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                      action === 'REJECTED' ? 'bg-red-100 text-red-500 dark:bg-red-900/30' :
                      isCurrentStep ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 ring-2 ring-amber-300' :
                      'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400'
                    )}>
                      <Icon size={14} />
                    </div>
                    {i < (expense.workflow?.steps?.length - 1) && (
                      <div className={clsx('w-px flex-1 mt-1', action === 'APPROVED' ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-slate-700')} style={{ minHeight: 20 }} />
                    )}
                  </div>
                  <div className={clsx('flex-1 rounded-xl p-3.5 -mt-0.5', dark ? 'bg-slate-700/50' : 'bg-gray-50')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={clsx('text-sm font-semibold', dark ? 'text-white' : 'text-gray-900')}>{step.name}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                          Required: {step.approverRole} {isCurrentStep && <span className="text-amber-500 font-medium">(Awaiting)</span>}
                        </div>
                        {record?.approver && <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">By: {record.approver.name}</div>}
                        {record?.comment && (
                          <div className={clsx('text-xs mt-1.5 italic', dark ? 'text-slate-300' : 'text-gray-600')}>"{record.comment}"</div>
                        )}
                      </div>
                      <span className={clsx('text-xs font-semibold', actionColors[action])}>{action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'approve' ? 'Approve Expense' : 'Reject Expense'}>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {modal === 'approve'
            ? 'Are you sure you want to approve this expense? This will move it to the next approval step.'
            : 'Please provide a reason for rejection (optional).'}
        </p>
        <textarea
          className={clsx('w-full px-4 py-2.5 rounded-xl border text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
            dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'
          )}
          rows={3} placeholder="Add a comment (optional)…"
          value={comment} onChange={e => setComment(e.target.value)}
        />
        <div className="flex gap-3">
          <button onClick={() => setModal(null)}
            className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            )}>
            Cancel
          </button>
          <button
            onClick={() => handleAction(modal)}
            disabled={submitting}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors',
              modal === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            )}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {modal === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
