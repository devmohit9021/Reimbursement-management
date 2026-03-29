import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { Upload, Loader2, ArrowLeft, Scan, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CATEGORIES = ['Travel', 'Food & Dining', 'Accommodation', 'Office Supplies', 'Equipment', 'Software', 'Training', 'Medical', 'Entertainment', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'JPY', 'AED'];

export default function SubmitExpensePage() {
  const { dark } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', amount: '', currency: 'USD',
    category: '', expenseDate: new Date().toISOString().split('T')[0],
  });
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  const { data: rates } = useQuery({
    queryKey: ['currency-rates', form.currency],
    queryFn: () => api.get(`/currencies/rates?base=${form.currency}`).then(r => r.data),
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setReceipt(file);
    setPreview(URL.createObjectURL(file));
    setOcrDone(false);

    // Auto-run OCR
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const { data } = await api.post('/ocr/extract', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.amount) setForm(f => ({ ...f, amount: String(data.amount) }));
      if (data.currency) setForm(f => ({ ...f, currency: data.currency }));
      if (data.date) setForm(f => ({ ...f, expenseDate: data.date }));
      if (data.merchant && !form.title) setForm(f => ({ ...f, title: data.merchant.slice(0, 60) }));
      if (data.category) setForm(f => ({ ...f, category: data.category }));
      setOcrDone(true);
      toast.success('Receipt scanned! Fields auto-filled');
    } catch {
      toast.error('OCR failed — please fill in manually');
    } finally {
      setOcrLoading(false);
    }
  }, [form.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    if (parseFloat(form.amount) <= 0) return toast.error('Amount must be greater than 0');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (receipt) fd.append('receipt', receipt);

      await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Expense submitted for approval!');
      navigate('/expenses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  const label = 'block text-sm font-medium mb-1.5 ' + (dark ? 'text-slate-300' : 'text-gray-700');
  const input = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ' +
    (dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400');

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className={clsx('rounded-2xl border p-6', dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm')}>
        <h1 className={clsx('text-lg font-bold mb-1', dark ? 'text-white' : 'text-gray-900')}>Submit Expense</h1>
        <p className={clsx('text-sm mb-6', dark ? 'text-slate-400' : 'text-gray-500')}>Upload a receipt for auto-fill, or enter details manually</p>

        {/* Receipt Drop Zone */}
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-6',
            isDragActive ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : dark ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
          )}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Receipt" className="max-h-32 max-w-full rounded-xl mx-auto object-contain" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setReceipt(null); setPreview(null); setOcrDone(false); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                <X size={12} />
              </button>
              {ocrLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <div className="text-white text-xs flex items-center gap-2">
                    <Scan size={14} className="animate-pulse" /> Scanning receipt…
                  </div>
                </div>
              )}
              {ocrDone && !ocrLoading && (
                <div className="mt-2 text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} /> Auto-filled from receipt
                </div>
              )}
            </div>
          ) : (
            <div>
              <Upload size={28} className={clsx('mx-auto mb-2', isDragActive ? 'text-indigo-500' : 'text-gray-300 dark:text-slate-500')} />
              <p className={clsx('text-sm font-medium', dark ? 'text-slate-300' : 'text-gray-600')}>
                {isDragActive ? 'Drop receipt here' : 'Drag & drop receipt, or click to browse'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">JPG, PNG, PDF up to 10MB — OCR will auto-fill fields</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Expense Title *</label>
            <input type="text" required value={form.title} onChange={set('title')} placeholder="e.g. Team Lunch at Pizza Palace" className={input} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Amount *</label>
              <input type="number" required step="0.01" min="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" className={input} />
            </div>
            <div>
              <label className={label}>Currency *</label>
              <select value={form.currency} onChange={set('currency')} className={input}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {rates && form.amount && form.currency !== 'INR' && (
            <p className="text-xs text-indigo-500 -mt-2">
              ≈ {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                parseFloat(form.amount) * (rates?.rates?.INR || 1)
              )} INR
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Category *</label>
              <select value={form.category} onChange={set('category')} className={input} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Expense Date *</label>
              <input type="date" required value={form.expenseDate} onChange={set('expenseDate')} className={input} />
            </div>
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea rows={3} value={form.description} onChange={set('description')}
              placeholder="Additional notes or context..." className={clsx(input, 'resize-none')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              )}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
