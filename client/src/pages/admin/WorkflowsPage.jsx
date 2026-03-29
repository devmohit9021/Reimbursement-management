import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/ui/Modal';
import { Plus, Trash2, Star, ArrowUp, ArrowDown, GitBranch, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN'];

const emptyStep = { name: '', approverRole: 'MANAGER', specificUserId: '' };
const emptyForm = { name: '', description: '', isDefault: false, isManagerApprover: true, steps: [{ ...emptyStep }] };

export default function WorkflowsPage() {
  const { dark } = useTheme();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows').then(r => r.data),
  });

  const openCreate = () => { setForm(emptyForm); setSelected(null); setModal('create'); };
  const openEdit = (w) => {
    setSelected(w);
    setForm({ name: w.name, description: w.description || '', isDefault: w.isDefault, isManagerApprover: w.isManagerApprover !== false, steps: w.steps.map(s => ({ name: s.name, approverRole: s.approverRole, specificUserId: s.specificUserId || '' })) });
    setModal('edit');
  };

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { ...emptyStep }] }));
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  const setStep = (i, k, v) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  const moveStep = (i, dir) => {
    const steps = [...form.steps];
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    setForm(f => ({ ...f, steps }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.steps.length === 0) return toast.error('Add at least one step');
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await api.post('/workflows', form);
        toast.success('Workflow created!');
      } else {
        await api.put(`/workflows/${selected.id}`, form);
        toast.success('Workflow updated!');
      }
      qc.invalidateQueries(['workflows']);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      toast.success('Deleted');
      qc.invalidateQueries(['workflows']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
    }
  };

  const setDefault = async (id) => {
    try {
      await api.patch(`/workflows/${id}/default`);
      toast.success('Default workflow updated');
      qc.invalidateQueries(['workflows']);
    } catch {
      toast.error('Failed');
    }
  };

  const inp = clsx('w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
    dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-200 text-gray-900'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>Approval Workflows</h1>
          <p className={clsx('text-sm', dark ? 'text-slate-400' : 'text-gray-400')}>Configure multi-step expense approval chains</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : workflows?.length === 0 ? (
        <div className={clsx('rounded-2xl border-dashed border-2 p-12 text-center', dark ? 'border-slate-600' : 'border-gray-200')}>
          <GitBranch size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className={clsx('font-semibold', dark ? 'text-slate-300' : 'text-gray-600')}>No workflows yet</h3>
          <p className="text-sm text-gray-400 mt-1">Create your first approval workflow</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map(w => (
            <div key={w.id} className={clsx('rounded-2xl border p-5', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-indigo-900/30' : 'bg-indigo-50')}>
                    <GitBranch size={18} className="text-indigo-500" />
                  </div>
                  <div>
                    <div className={clsx('font-bold flex items-center gap-2', dark ? 'text-white' : 'text-gray-900')}>
                      {w.name}
                      {w.isDefault && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={10} /> Default</span>}
                      {w.isManagerApprover !== false && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">Manager First</span>}
                    </div>
                    {w.description && <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{w.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!w.isDefault && (
                    <button onClick={() => setDefault(w.id)} className="text-xs text-gray-400 hover:text-indigo-500 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                      Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(w)} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-100')}>
                    <Pencil size={14} />
                  </button>
                  {!w.isDefault && (
                    <button onClick={() => handleDelete(w.id)} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-slate-400 hover:bg-red-900/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500')}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-2 flex-wrap">
                {w.steps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border',
                      dark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                    )}>
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        dark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                      )}>{i + 1}</span>
                      {step.name} <span className="text-gray-400 ml-1">({step.approverRole})</span>
                    </div>
                    {i < w.steps.length - 1 && <span className="text-gray-300 dark:text-slate-600">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New Workflow' : 'Edit Workflow'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-300' : 'text-gray-600')}>Workflow Name</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="e.g. Standard Approval" />
            </div>
            <div>
              <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-300' : 'text-gray-600')}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} placeholder="Brief description" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer border px-4 py-2.5 rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex-1">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className={clsx('text-sm font-medium', dark ? 'text-slate-300' : 'text-gray-700')}>Set as Default Workflow</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer border px-4 py-2.5 rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex-1" title="Routes 'MANAGER' steps exclusively to the user's specific manager">
              <input type="checkbox" checked={form.isManagerApprover} onChange={e => setForm(f => ({ ...f, isManagerApprover: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <div className="flex flex-col">
                <span className={clsx('text-sm font-medium', dark ? 'text-slate-300' : 'text-gray-700')}>Is Manager Approver</span>
                <span className="text-xs text-gray-400">Routes to submitter's manager</span>
              </div>
            </label>
          </div>

          <div className={clsx('border-t pt-4', dark ? 'border-slate-700' : 'border-gray-100')}>
            <div className="flex items-center justify-between mb-3">
              <label className={clsx('text-xs font-semibold uppercase tracking-wide', dark ? 'text-slate-400' : 'text-gray-400')}>Approval Steps</label>
              <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
                <Plus size={12} /> Add Step
              </button>
            </div>
            <div className="space-y-3">
              {form.steps.map((step, i) => (
                <div key={i} className={clsx('flex items-center gap-3 p-3 rounded-xl border', dark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200')}>
                  <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    dark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                  )}>{i + 1}</span>
                  <input type="text" required value={step.name} onChange={e => setStep(i, 'name', e.target.value)}
                    placeholder="Step name" className={clsx(inp, 'flex-1')} />
                  <select value={step.approverRole} onChange={e => setStep(i, 'approverRole', e.target.value)} className={clsx(inp, 'w-36')}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => removeStep(i)} disabled={form.steps.length === 1} className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)}
              className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-medium', dark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-700')}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {modal === 'create' ? 'Create Workflow' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
