import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthStatusPanel from '../../components/ui/AuthStatusPanel';
import AuthField from '../../components/ui/AuthField';
import AuthSubmitButton from '../../components/ui/AuthSubmitButton';
import AuthErrorNote from '../../components/ui/AuthErrorNote';
import usePresence from '../../components/ui/usePresence';
import useTimers from '../../components/ui/useTimers';

const MIN_VERIFY_MS = 620;
const SUCCESS_HOLD_MS = 1100;
const PANEL_EXIT_MS = 260;

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [successLabel, setSuccessLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shaking, setShaking] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(null);

  const router = useRouter();
  const { after, wait } = useTimers();

  const submittingRef = useRef(false);
  const formRef = useRef(null);

  const busy = phase !== 'idle';
  const panelMounted = usePresence(busy, PANEL_EXIT_MS);

  const measure = useCallback(() => {
    if (formRef.current) setBodyHeight(formRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined' || !formRef.current) return undefined;
    const ro = new ResizeObserver(() => {
      if (!submittingRef.current) measure();
    });
    ro.observe(formRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => {
      setShaking(true);
      after(560, () => setShaking(false));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // prevent duplicate submissions
    submittingRef.current = true;

    setErrorMsg('');
    setLoading(true);
    setPhase('verifying');
    const startedAt = Date.now();
    const holdFloor = () => wait(Math.max(0, MIN_VERIFY_MS - (Date.now() - startedAt)));

    try {
      // ── Authentication logic unchanged: same endpoint, same payload, same token handling
      const res = await api.post('/api/auth/admin/login', form);
      setAuth(res.data.token, res.data.user);

      // Exact same message this app has always shown.
      const welcomeMsg = 'Welcome back, Admin!';

      await holdFloor();
      toast.success(welcomeMsg);
      setSuccessLabel(welcomeMsg);
      setPhase('success');
      after(SUCCESS_HOLD_MS, () => router.push('/admin/dashboard'));
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      await holdFloor();
      toast.error(msg);
      setErrorMsg(msg);
      setPhase('idle');
      setLoading(false);
      triggerShake();
      submittingRef.current = false;
    }
  };

  const onChange = (key) => (e) => {
    const { value } = e.target;
    setForm((p) => (p[key] === value ? p : { ...p, [key]: value }));
    if (errorMsg) setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen noise-overlay flex items-center justify-center p-4"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0a1844 0%, #11245d 35%, #172d74 65%, #0d1e55 100%)',
      }}
    >
      {/* Soft ambient glows — same layered treatment used on the homepage hero */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(92,225,230,0.08) 0%, transparent 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 40% 40% at 15% 85%, rgba(212,175,55,0.05) 0%, transparent 60%)',
        }}
      />
      <div className={`auth-aura ${busy ? 'is-active' : ''} ${phase === 'success' ? 'is-success' : ''}`} />

      {/* Back to Home — fixed top left corner */}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#d4af37',
            fontWeight: 600,
            fontSize: '0.8rem',
            textDecoration: 'none',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.25)',
            padding: '6px 12px',
            borderRadius: 20,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.1)')}
        >
          ← Back to Home
        </Link>
      </div>

      <div className="auth-shell relative z-10">
        {/* Brand column — mirrors the institute portal so both feel like one
            product. Same wording, no logo link here (unchanged from before). */}
        <aside className="auth-brand auth-enter" style={{ '--i': 0 }}>
          <div className="auth-orbit">
            <span className="auth-orbit-ring" aria-hidden="true" />
            <span className="auth-orbit-ring" aria-hidden="true" />
            <span className="auth-orbit-ring" aria-hidden="true" />
            <img
              src="/logo.png"
              alt="SYNCOPTRAC"
              className="auth-brand-logo auth-logo"
              style={{ cursor: 'default' }}
            />
          </div>
          <h1 className="auth-brand-title">
            <span style={{ color: '#5ce1e6' }}>S</span>
            <span style={{ color: '#ffffff' }}>YNCOP</span>
            <span style={{ color: '#ffffff' }}>TRAC</span>
          </h1>
          <p className="auth-brand-portal">Admin Portal</p>
          <span className="auth-brand-rule" aria-hidden="true" />
          <p className="auth-brand-tagline">
            Where communication gets organised and nothing is missed.
          </p>
        </aside>

        <div className="auth-panel">

        <div
          className={`auth-card auth-card--glass rounded-2xl p-6 auth-enter ${
            shaking ? 'auth-shake' : ''
          } ${busy ? 'is-busy' : ''}`}
          style={{ '--i': 1 }}
        >
          <div
            className="auth-body"
            style={bodyHeight ? { minHeight: `${bodyHeight}px` } : undefined}
          >
            {/* autoComplete="off" on form + unique autocomplete values on inputs
                prevents browser from autofilling admin credentials elsewhere */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={`auth-swap ${busy ? 'is-hidden' : ''}`}
              autoComplete="off"
              aria-hidden={busy}
            >
              <fieldset disabled={busy} className="auth-fieldset">
                <div className="auth-stack">
                  <AuthField
                    label="Username"
                    name="admin-username"
                    autoComplete="username"
                    placeholder="admin"
                    value={form.username}
                    onChange={onChange('username')}
                    invalid={Boolean(errorMsg)}
                    required
                  />
                  <AuthField
                    label="Password"
                    name="admin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange('password')}
                    invalid={Boolean(errorMsg)}
                    required
                  />

                  {errorMsg && <AuthErrorNote message={errorMsg} />}

                  <AuthSubmitButton loading={loading} />
                </div>
              </fieldset>
            </form>

            {panelMounted && (
              <div className="auth-overlay">
                <AuthStatusPanel
                  phase={phase === 'success' ? 'success' : 'verifying'}
                  label={phase === 'success' ? successLabel : 'Signing in...'}
                  exiting={!busy}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 text-center space-y-2 auth-enter" style={{ '--i': 2 }}>
          <p className="text-gray-600 text-xs">
            Institute login?{' '}
            <Link href="/institute/login" className="text-brand-gold hover:underline">
              Click here
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
