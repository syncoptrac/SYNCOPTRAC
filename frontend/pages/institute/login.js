import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth, getUser } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function InstituteLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [warning, setWarning] = useState('');
  const timerRef = useRef(null);
  const router = useRouter();

  // If already logged in redirect away
  useEffect(() => {
    const user = getUser();
    if (!user) return;
    if (user.role === 'institute') router.replace('/institute/dashboard');
    else if (user.role === 'admin') router.replace('/admin/dashboard');
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setLockoutSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [lockoutSeconds > 0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setLoading(true);
    setWarning('');
    try {
      const res = await api.post('/api/auth/institute/login', form);
      setAuth(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.instituteName}!`);
      router.push('/institute/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'TOO_MANY_ATTEMPTS') {
        setLockoutSeconds(data.retryAfterSeconds || 120);
        toast.error('Too many attempts — locked for 2 minutes');
      } else {
        if (data?.warning) setWarning(data.warning);
        toast.error(data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutSeconds > 0;
  const mins = Math.floor(lockoutSeconds / 60);
  const secs = lockoutSeconds % 60;
  const countdownLabel = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')} remaining`
    : `${secs}s remaining`;

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.png" alt="SYNCOPTRAC" className="h-20 w-20 object-cover rounded-2xl mx-auto mb-4 shadow-lg cursor-pointer" />
          </Link>
          <h1 className="text-2xl font-bold">
            <span style={{color:"#5ce1e6"}}>S</span><span style={{color:"#ffffff"}}>YNCOP</span>
            <span style={{color:"#ffffff"}}>TRAC</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Institute Portal</p>
          <p className="text-gray-600 text-xs italic mt-1">Where communication gets organised</p>
        </div>

        <div className="bg-brand-dark-light border border-gray-800 rounded-2xl shadow-xl p-6">
          {/* autoComplete="off" + name attributes different from admin form
              + readOnly trick on password ensures browser never autofills
              admin credentials into this institute form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Login ID</label>
              <input
                name="institute-loginid"
                autoComplete="off"
                className="w-full bg-brand-dark border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold placeholder-gray-600"
                placeholder="e.g. BRIL1234"
                value={form.loginId}
                onChange={e => setForm(p => ({ ...p, loginId: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                name="institute-password"
                type="password"
                autoComplete="new-password"
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
                className="w-full bg-brand-dark border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold placeholder-gray-600"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            {warning && (
              <p style={{ color: '#f59e0b', fontSize: '12px', textAlign: 'center', margin: '-4px 0 0' }}>
                ⚠️ {warning}
              </p>
            )}
            {isLocked && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
              }}>
                <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  🔒 Account temporarily locked
                </p>
                <p style={{ color: '#fca5a5', fontSize: '12px', margin: '4px 0 0' }}>
                  {countdownLabel}
                </p>
              </div>
            )}
            <button type="submit" disabled={loading || isLocked}
              className="w-full btn-primary py-2.5 mt-2"
              style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
              {isLocked ? `Locked — ${countdownLabel}` : loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center space-y-2">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link href="/get-started" className="text-brand-gold hover:underline">Get Started</Link>
          </p>
          <p className="text-gray-700 text-xs">
            Admin?{' '}
            <Link href="/admin/login" className="text-gray-500 hover:text-brand-gold">Admin Login</Link>
          </p>
          <p className="text-gray-700 text-xs">
            <Link href="/" className="text-gray-500 hover:text-brand-gold">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}