import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Building2, Globe, DollarSign, Mail, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

export default function SettingsPage() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  const Row = ({ icon: Icon, label, value }) => (
    <div className={clsx('flex items-center justify-between py-4 border-b last:border-0', dark ? 'border-slate-700' : 'border-gray-100')}>
      <div className="flex items-center gap-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', dark ? 'bg-slate-700' : 'bg-gray-50')}>
          <Icon size={16} className="text-indigo-400" />
        </div>
        <div>
          <div className={clsx('text-xs text-gray-400 dark:text-slate-400')}>{label}</div>
          <div className={clsx('text-sm font-semibold mt-0.5', dark ? 'text-white' : 'text-gray-800')}>{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className={clsx('text-2xl font-bold', dark ? 'text-white' : 'text-gray-900')}>Settings</h1>
        <p className={clsx('text-sm', dark ? 'text-slate-400' : 'text-gray-400')}>Company configuration and preferences</p>
      </div>

      {/* Company Info */}
      <div className={clsx('rounded-2xl border p-5', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <h2 className={clsx('text-sm font-bold mb-4', dark ? 'text-white' : 'text-gray-900')}>Company Information</h2>
        <Row icon={Building2} label="Company Name" value={user?.companyName} />
        <Row icon={Globe} label="Country" value={user?.country} />
        <Row icon={DollarSign} label="Default Currency" value={user?.defaultCurrency} />
        <Row icon={Mail} label="Admin Email" value={user?.email} />
      </div>

      {/* Appearance */}
      <div className={clsx('rounded-2xl border p-5', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <h2 className={clsx('text-sm font-bold mb-4', dark ? 'text-white' : 'text-gray-900')}>Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', dark ? 'bg-slate-700' : 'bg-gray-50')}>
              {dark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-indigo-400" />}
            </div>
            <div>
              <div className="text-xs text-gray-400 dark:text-slate-400">Theme</div>
              <div className={clsx('text-sm font-semibold mt-0.5', dark ? 'text-white' : 'text-gray-800')}>{dark ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
          </div>
          <button
            onClick={toggle}
            className={clsx('relative w-12 h-6 rounded-full transition-colors', dark ? 'bg-indigo-600' : 'bg-gray-300')}
          >
            <span className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', dark ? 'left-7' : 'left-1')} />
          </button>
        </div>
      </div>

      {/* Version info */}
      <div className={clsx('rounded-2xl border p-5 text-center', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <p className="text-xs text-gray-400 dark:text-slate-500">ReimburseHQ v1.0.0 — Built with ❤️</p>
      </div>
    </div>
  );
}
