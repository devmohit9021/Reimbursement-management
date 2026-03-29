import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/ui/Modal';
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const RULE_TYPES = ['PERCENTAGE', 'SPECIFIC', 'HYBRID'];
const ruleColors = { PERCENTAGE: 'bg-blue-100 text-blue-700', SPECIFIC: 'bg-purple-100 text-purple-700', HYBRID: 'bg-orange-100 text-orange-700' };

const defaultConfig = { PERCENTAGE: { threshold: 60 }, SPECIFIC: { userId: '' }, HYBRID: { percentage: 60, userId: '' } };
const emptyForm = { name: '', description: '', type: 'PERCENTAGE', config: defaultConfig.PERCENTAGE };

export default function RulesPage() {
  const { dark } = useTheme();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get('/rules').then(r => r.data),
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setConfig = (k, v) => setForm(f => ({ ...f, config: { ...f.config, [k]: v } }));

  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, config: defaultConfig[type] }));
  };

  const openCreate = () => { setForm(emptyForm); setSelected(null); setModal('form'); };
  const openEdit = (r) => {
    setSelected(r);
    setForm({ name: r.name, description: r.description || '', type: r.type, config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config });
    setModal('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selected) {
        await api.put(`/rules/${selected.id}`, form);
        toast.success('Rule updated!');
      } else {
        await api.post('/rules', form);
        toast.success('Rule created!');
      }
      qc.invalidateQueries(['rules']);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRule = async (r) => {
    try {
      await api.put(`/rules/${r.id}`, { isActive: !r.isActive });
      qc.invalidateQueries(['rules']);
    } catch { toast.error('Failed to toggle'); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.delete(`/rules/${id}`);
      toast.success('Deleted');
      qc.invalidateQueries(['rules']);
    } catch { toast.error('Failed'); }
  };

  const inp = clsx('w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
    dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-200 text-gray-900'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>Approval Rules</h1>
          <p className={clsx('text-sm', dark ? 'text-slate-400' : 'text-gray-400')}>Conditional logic to override or augment workflows</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus size={16} /> New Rule
        </button>
      </div>

      <div className={clsx('rounded-2xl border p-4 text-sm', dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800')}>
        <strong>Rule Types:</strong> <strong>PERCENTAGE</strong> = X% of managers must approve. <strong>SPECIFIC</strong> = A specific person must approve. <strong>HYBRID</strong> = Percentage OR specific person.
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : rules?.length === 0 ? (
        <div className={clsx('rounded-2xl border-dashed border-2 p-12 text-center', dark ? 'border-slate-600' : 'border-gray-200')}>
          <Zap size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className={clsx('font-semibold', dark ? 'text-slate-300' : 'text-gray-600')}>No rules configured</h3>
          <p className="text-sm text-gray-400 mt-1">Add conditional approval rules</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => {
            const config = typeof r.config === 'string' ? JSON.parse(r.config) : r.config;
            return (
              <div key={r.id} className={clsx('rounded-2xl border p-5 flex items-start gap-4', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm', !r.isActive && 'opacity-60')}>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', dark ? 'bg-slate-700' : 'bg-gray-50')}>
                  <Zap size={18} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('font-semibold', dark ? 'text-white' : 'text-gray-900')}>{r.name}</span>
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', ruleColors[r.type])}>{r.type}</span>
                    {!r.isActive && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Disabled</span>}
                  </div>
                  {r.description && <p className="text-xs text-gray-400 dark:text-slate-400 mb-1">{r.description}</p>}
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {r.type === 'PERCENTAGE' && `${config.threshold}% approval threshold`}
                    {r.type === 'SPECIFIC' && `Requires specific user approval`}
                    {r.type === 'HYBRID' && `${config.percentage}% threshold OR specific user`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(r)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                    {r.isActive ? <ToggleRight size={22} className="text-indigo-500" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => openEdit(r)} className={clsx('p-2 rounded-xl', dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-100')}><Pencil size={14} /></button>
                  <button onClick={() => deleteRule(r.id)} className={clsx('p-2 rounded-xl', dark ? 'text-slate-400 hover:bg-red-900/20 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500')}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={selected ? 'Edit Rule' : 'New Rule'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Rule Name</label>
            <input type="text" required value={form.name} onChange={set('name')} className={inp} placeholder="e.g. Senior Approval Threshold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={set('description')} className={inp} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Rule Type</label>
            <div className="grid grid-cols-3 gap-2">
              {RULE_TYPES.map(t => (
                <button type="button" key={t} onClick={() => handleTypeChange(t)}
                  className={clsx('py-2 rounded-xl text-xs font-semibold border transition-all',
                    form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {form.type === 'PERCENTAGE' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Threshold % (0–100)</label>
              <input type="number" min="1" max="100" value={form.config.threshold || 60} onChange={e => setConfig('threshold', parseInt(e.target.value))} className={inp} />
            </div>
          )}
          {form.type === 'HYBRID' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Percentage Threshold %</label>
              <input type="number" min="1" max="100" value={form.config.percentage || 60} onChange={e => setConfig('percentage', parseInt(e.target.value))} className={inp} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)}
              className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-medium', dark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-700')}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {selected ? 'Save' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
