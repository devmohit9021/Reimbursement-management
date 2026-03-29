import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const { dark } = useTheme();
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative w-full rounded-2xl shadow-2xl border animate-fade-in',
        sizes[size],
        dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      )}>
        {/* Header */}
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b', dark ? 'border-slate-700' : 'border-gray-100')}>
          <h2 className={clsx('text-base font-semibold', dark ? 'text-white' : 'text-gray-900')}>{title}</h2>
          <button onClick={onClose} className={clsx('p-1.5 rounded-lg transition-colors', dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-100')}>
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
