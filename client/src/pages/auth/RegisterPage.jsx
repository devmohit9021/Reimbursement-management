import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wallet, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', country: '', defaultCurrency: 'USD' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(r => r.json())
      .then(data => {
        const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      })
      .catch((err) => {
        console.error("Failed to load countries", err);
        // Fallback options
        setCountries([
          { name: { common: 'United States' }, currencies: { USD: {} } },
          { name: { common: 'United Kingdom' }, currencies: { GBP: {} } },
          { name: { common: 'India' }, currencies: { INR: {} } },
        ]);
      })
      .finally(() => setCountriesLoading(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryData = countries.find(c => c.name.common === countryName);
    let currency = form.defaultCurrency;
    
    // Automatically select the first currency of that country
    if (countryData && countryData.currencies) {
      currency = Object.keys(countryData.currencies)[0];
    }
    
    setForm(f => ({ ...f, country: countryName, defaultCurrency: currency }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Company created! Welcome to ReimburseHQ 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, name, type = 'text', placeholder, required = true }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input
        type={type} required={required}
        value={form[name]} onChange={set(name)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900 dark:text-white">ReimburseHQ</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create your company</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">You'll be set up as the Admin of your organisation</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Your Name" name="name" placeholder="Alice Smith" />
              <InputField label="Work Email" name="email" type="email" placeholder="alice@company.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={set('password')}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company Details</p>
              <InputField label="Company Name" name="companyName" placeholder="Acme Corporation" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Country</label>
                <select
                  required
                  value={form.country} onChange={handleCountryChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="" disabled>{countriesLoading ? 'Loading...' : 'Select Country'}</option>
                  {countries.map(c => (
                    <option key={c.name.common} value={c.name.common}>{c.name.common}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Default Currency</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={form.defaultCurrency}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Creating…' : 'Create Company & Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
