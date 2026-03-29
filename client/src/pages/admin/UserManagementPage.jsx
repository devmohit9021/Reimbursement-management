import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Plus, Pencil, Trash2, Users, Shield, Mail, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
const roleColors = {
  ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  MANAGER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EMPLOYEE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const defaultForm = { name: '', email: '', password: '', role: 'EMPLOYEE', managerId: '' };

export default function UserManagementPage() {
  const { dark } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: () => api.get('/users/managers').then(r => r.data),
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openCreate = () => { setForm(defaultForm); setSelected(null); setModal('create'); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, managerId: u.managerId || '' });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await api.post('/users', { ...form, managerId: form.managerId || null });
        toast.success('User created!');
      } else {
        const { password, email, ...rest } = form;
        await api.patch(`/users/${selected.id}`, { ...rest, managerId: form.managerId || null });
        toast.success('User updated!');
      }
      qc.invalidateQueries(['users']);
      qc.invalidateQueries(['managers']);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('User deleted');
      qc.invalidateQueries(['users']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filtered = (users || []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const inp = clsx('w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
    dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-200 text-gray-900'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>User Management</h1>
          <p className={clsx('text-sm mt-0.5', dark ? 'text-slate-400' : 'text-gray-400')}>{users?.length || 0} team members</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {ROLES.map(role => (
          <div key={role} className={clsx('rounded-2xl border p-4 flex items-center gap-3', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', roleColors[role].split(' ').slice(0, 2).join(' '))}>
              {role === 'ADMIN' ? <Shield size={18} /> : <Users size={18} />}
            </div>
            <div>
              <div className={clsx('text-lg font-bold', dark ? 'text-white' : 'text-gray-900')}>
                {users?.filter(u => u.role === role).length || 0}
              </div>
              <div className="text-xs text-gray-400 capitalize">{role.toLowerCase()}s</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={clsx('rounded-2xl border p-4', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
            className={clsx('w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
              dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'
            )} />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={5} /> : (
        <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
          <table className="w-full text-sm">
            <thead>
              <tr className={clsx('text-xs border-b', dark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400')}>
                {['Name', 'Email', 'Role', 'Manager', 'Joined', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={clsx('border-t transition-colors', dark ? 'border-slate-700 hover:bg-slate-700/40' : 'border-gray-50 hover:bg-gray-50')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                        {u.name?.charAt(0)}
                      </div>
                      <span className={clsx('font-medium', dark ? 'text-white' : 'text-gray-800')}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                      <Mail size={12} /> {u.email}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', roleColors[u.role])}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 dark:text-slate-400 text-sm">{u.manager?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400 dark:text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add New User' : 'Edit User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Full Name</label>
              <input type="text" required value={form.name} onChange={set('name')} className={inp} placeholder="Alice Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Email</label>
              <input type="email" required={modal === 'create'} value={form.email} onChange={set('email')} disabled={modal === 'edit'} className={clsx(inp, modal === 'edit' ? 'opacity-60' : '')} placeholder="alice@company.com" />
            </div>
          </div>
          {modal === 'create' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={set('password')} className={inp} placeholder="Min 8 characters" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Role</label>
              <select value={form.role} onChange={set('role')} className={inp}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">Reports To</label>
              <select value={form.managerId} onChange={set('managerId')} className={inp}>
                <option value="">None</option>
                {(managers || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)}
              className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-medium', dark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-700')}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {modal === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
