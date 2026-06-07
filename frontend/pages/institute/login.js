import { useState } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function InstituteLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const displaced = router.query.reason === 'displaced';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/institute/login', form);
      setAuth(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.instituteName}!`);
      router.push('/institute/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Session displaced warning */}
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
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
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