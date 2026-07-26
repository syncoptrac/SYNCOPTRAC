import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthStatusPanel from '../../components/ui/AuthStatusPanel';

export default function InstituteLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [displaced, setDisplaced] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [successLabel, setSuccessLabel] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      setDisplaced(router.query.reason === 'displaced');
    }
  }, [router.isReady, router.query.reason]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPhase('verifying');
    try {
      const res = await api.post('/api/auth/institute/login', form);
      setAuth(res.data.token, res.data.user);
      // Exact same message this app has always shown — just staged inside
      // the success animation instead of only appearing as a toast.
      const welcomeMsg = `Welcome, ${res.data.user.instituteName}!`;
      toast.success(welcomeMsg);
      setSuccessLabel(welcomeMsg);
      setPhase('success');
      setTimeout(() => router.push('/institute/dashboard'), 900);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
      setPhase('idle');
      setLoading(false);
      setShakeKey(k => k + 1);
    }
  };

  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center p-4" style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #0a1844 0%, #11245d 35%, #172d74 65%, #0d1e55 100%)',
    }}>
      {/* Soft ambient glows — same layered treatment used on the homepage hero */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(92,225,230,0.08) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 40% 40% at 15% 85%, rgba(212,175,55,0.05) 0%, transparent 60%)',
      }} />

      {/* Back to Home — fixed top left corner */}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#d4af37', fontWeight: 600, fontSize: '0.8rem',
          textDecoration: 'none',
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.25)',
          padding: '6px 12px', borderRadius: 20,
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
        >
          ← Back to Home
        </Link>
      </div>

      <div className="w-full max-w-sm relative z-10">

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
          <p className="text-gray-600 text-xs italic mt-1">Where communication gets organised and nothing is missed.</p>
        </div>

        {displaced && (
          <div style={{
            marginBottom: 16, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.875rem', marginBottom: 2 }}>
                Session Ended
              </p>
              <p style={{ color: 'rgba(252,165,165,0.8)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Someone else logged into this account on another device. Please log in again to continue.
              </p>
            </div>
          </div>
        )}

        {/* Login card */}
        <div key={shakeKey} className={`bg-brand-dark-light border border-gray-800 rounded-2xl shadow-xl p-6 ${shakeKey > 0 ? 'auth-shake' : ''}`}>
          {phase !== 'idle' ? (
            <AuthStatusPanel phase={phase} label={phase === 'verifying' ? 'Signing in...' : successLabel} />
          ) : (
          /* autoComplete="off" + name attributes different from admin form
              + readOnly trick on password ensures browser never autofills
              admin credentials into this institute form */
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="auth-field">
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
            <div className="auth-field">
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
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          )}
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
        </div>
      </div>
    </div>
  );
}