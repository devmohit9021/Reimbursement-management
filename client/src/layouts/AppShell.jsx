import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Receipt, CheckSquare, Users, Settings,
  LogOut, Moon, Sun, Menu, X, ChevronRight, Wallet,
  BarChart3, FileText
} from 'lucide-react';
import clsx from 'clsx';

const navItems = {
  ADMIN: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'All Expenses' },
    { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/workflows', icon: FileText, label: 'Workflows' },
    { to: '/admin/rules', icon: BarChart3, label: 'Rules' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
  MANAGER: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'My Expenses' },
    { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
  ],
  EMPLOYEE: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'My Expenses' },
    { to: '/expenses/new', icon: Wallet, label: 'Submit Expense' },
  ],
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('px-6 py-5 border-b flex items-center gap-3',
        dark ? 'border-slate-700' : 'border-indigo-100'
      )}>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <div className={clsx('font-bold text-sm leading-tight', dark ? 'text-white' : 'text-gray-900')}>ReimburseHQ</div>
          <div className="text-xs text-indigo-400 font-medium truncate max-w-[120px]">{user?.companyName}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className={clsx('text-xs font-semibold uppercase tracking-widest px-3 pb-2',
          dark ? 'text-slate-500' : 'text-gray-400'
        )}>Navigation</div>
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : dark
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
              )}
            >
              <Icon size={18} className={active ? 'text-white' : 'group-hover:text-indigo-500 transition-colors'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-indigo-300" />}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className={clsx('p-4 border-t', dark ? 'border-slate-700' : 'border-gray-100')}>
        <div className={clsx('rounded-xl p-3 flex items-center gap-3', dark ? 'bg-slate-700' : 'bg-gray-50')}>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className={clsx('text-sm font-semibold truncate', dark ? 'text-white' : 'text-gray-800')}>{user?.name}</div>
            <div className={clsx('text-xs truncate', dark ? 'text-slate-400' : 'text-gray-400')}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={clsx('flex h-screen overflow-hidden', dark ? 'bg-slate-900' : 'bg-gray-50')}>
      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col w-64 flex-shrink-0 border-r shadow-xl shadow-gray-900/5',
        dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className={clsx(
            'relative flex flex-col w-64 animate-slide-in shadow-2xl',
            dark ? 'bg-slate-800' : 'bg-white'
          )}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className={clsx(
          'flex items-center gap-4 px-4 lg:px-6 h-16 border-b flex-shrink-0',
          dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={clsx('lg:hidden p-2 rounded-lg', dark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100')}
          >
            <Menu size={20} />
          </button>

          {/* Page title area */}
          <div className="flex-1">
            <div className={clsx('text-sm font-medium', dark ? 'text-slate-400' : 'text-gray-400')}>
              {user?.companyName}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className={clsx(
                'p-2.5 rounded-xl transition-all',
                dark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Avatar */}
            <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl', dark ? 'bg-slate-700' : 'bg-gray-50')}>
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className={clsx('text-sm font-medium hidden sm:block', dark ? 'text-slate-200' : 'text-gray-700')}>
                {user?.name?.split(' ')[0]}
              </span>
              <span className={clsx(
                'text-xs font-semibold px-1.5 py-0.5 rounded-md hidden sm:block',
                user?.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                user?.role === 'MANAGER' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'
              )}>
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
