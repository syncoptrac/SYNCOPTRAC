import { useState } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/admin/login', form);
      setAuth(res.data.token, res.data.user);
      toast.success('Welcome back, Admin!');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">

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

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SYNCOPTRAC" className="h-20 w-20 object-cover rounded-2xl mx-auto mb-4 shadow-lg" />
          <h1 className="text-2xl font-bold">
            <span style={{color:"#5ce1e6"}}>S</span><span style={{color:"#ffffff"}}>YNCOP</span>
            <span style={{color:"#ffffff"}}>TRAC</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Admin Portal</p>
          <p className="text-gray-600 text-xs italic mt-1">Where communication gets organised</p>
        </div>

        <div className="bg-brand-dark-light border border-brand-dark-light rounded-2xl p-6 shadow-xl">
          {/* autoComplete="off" on form + unique autocomplete values on inputs
              prevents browser from autofilling admin credentials elsewhere */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                name="admin-username"
                autoComplete="username"
                className="w-full bg-brand-dark border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold placeholder-gray-600"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                name="admin-password"
                type="password"
                autoComplete="current-password"
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
          <p className="text-gray-600 text-xs">
            Institute login?{' '}
            <Link href="/institute/login" className="text-brand-gold hover:underline">Click here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}