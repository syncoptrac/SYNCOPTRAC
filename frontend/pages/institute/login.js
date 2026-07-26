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

/* Motion timings kept in one place so both portals stay in sync. */
const MIN_VERIFY_MS = 620;  // floor for the verifying stage, so a fast API never flashes
const SUCCESS_HOLD_MS = 1100; // ring draw + tick + label, then hand off to the router
const PANEL_EXIT_MS = 260;

export default function InstituteLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [displaced, setDisplaced] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [successLabel, setSuccessLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shaking, setShaking] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(null);

  const router = useRouter();
  const { after, wait } = useTimers();

  // Guards the submit path itself — covers Enter-key double fires and any
  // race the disabled attribute alone would not catch.
  const submittingRef = useRef(false);
  const formRef = useRef(null);

  const busy = phase !== 'idle';
  const panelMounted = usePresence(busy, PANEL_EXIT_MS);

  useEffect(() => {
    if (router.isReady) {
      setDisplaced(router.query.reason === 'displaced');
    }
  }, [router.isReady, router.query.reason]);

  /* ── Zero layout shift ───────────────────────────────────────────
     The form's real height is measured and locked onto the swap container, so
     the status panel occupies exactly the same box. The card never resizes,
     which is what removes the "page jump" between states. */
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
    // One frame of "off" so the animation can replay on consecutive failures.
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
      const res = await api.post('/api/auth/institute/login', form);
      setAuth(res.data.token, res.data.user);

      // Exact same message this app has always shown — just staged inside
      // the success animation instead of only appearing as a toast.
      const welcomeMsg = `Welcome, ${res.data.user.instituteName}!`;

      await holdFloor();
      toast.success(welcomeMsg);
      setSuccessLabel(welcomeMsg);
      setPhase('success');
      // submittingRef intentionally stays true — the page is navigating away.
      after(SUCCESS_HOLD_MS, () => router.push('/institute/dashboard'));
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
      {/* Breathing aura behind the card — intensifies while authenticating */}
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
        {/* Brand column — on wide screens this occupies the space that used to
            sit empty beside the card. Exactly the same wording as before, just
            given room to breathe. On mobile it collapses back to the original
            centred stack. */}
        <aside className="auth-brand auth-enter" style={{ '--i': 0 }}>
          <div className="auth-orbit">
            <span className="auth-orbit-ring" aria-hidden="true" />
            <span className="auth-orbit-ring" aria-hidden="true" />
            <span className="auth-orbit-ring" aria-hidden="true" />
            <Link href="/">
              <img src="/logo.png" alt="SYNCOPTRAC" className="auth-brand-logo auth-logo" />
            </Link>
          </div>
          <h1 className="auth-brand-title">
            <span style={{ color: '#5ce1e6' }}>S</span>
            <span style={{ color: '#ffffff' }}>YNCOP</span>
            <span style={{ color: '#ffffff' }}>TRAC</span>
          </h1>
          <p className="auth-brand-portal">Institute Portal</p>
          <span className="auth-brand-rule" aria-hidden="true" />
          <p className="auth-brand-tagline">
            Where communication gets organised and nothing is missed.
          </p>
        </aside>

        <div className="auth-panel">

        {displaced && (
          <div
            className="auth-enter"
            style={{
              '--i': 1,
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p
                style={{
                  color: '#fca5a5',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  marginBottom: 2,
                }}
              >
                Session Ended
              </p>
              <p style={{ color: 'rgba(252,165,165,0.8)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Someone else logged into this account on another device. Please log in again to
                continue.
              </p>
            </div>
          </div>
        )}

        {/* Login card */}
        <div
          className={`auth-card auth-card--glass rounded-2xl p-6 auth-enter ${
            shaking ? 'auth-shake' : ''
          } ${busy ? 'is-busy' : ''}`}
          style={{ '--i': 2 }}
        >
          <div
            className="auth-body"
            style={bodyHeight ? { minHeight: `${bodyHeight}px` } : undefined}
          >
            {/* The form stays mounted the whole time — it only cross-fades out.
                That keeps typed values and avoids remount cost / re-renders. */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={`auth-swap ${busy ? 'is-hidden' : ''}`}
              autoComplete="off"
              aria-hidden={busy}
              noValidate={false}
            >
              {/* autoComplete="off" + name attributes different from admin form
                  + readOnly trick on password ensures browser never autofills
                  admin credentials into this institute form */}
              <fieldset disabled={busy} className="auth-fieldset">
                <div className="auth-stack">
                  <AuthField
                    label="Login ID"
                    name="institute-loginid"
                    autoComplete="off"
                    placeholder="e.g. BRIL1234"
                    value={form.loginId}
                    onChange={onChange('loginId')}
                    invalid={Boolean(errorMsg)}
                    required
                  />
                  <AuthField
                    label="Password"
                    name="institute-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange('password')}
                    invalid={Boolean(errorMsg)}
                    noAutofill
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

        <div className="mt-5 text-center space-y-2 auth-enter" style={{ '--i': 3 }}>
          <p className="text-gray-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/get-started" className="text-brand-gold hover:underline">
              Get Started
            </Link>
          </p>
          <p className="text-gray-700 text-xs">
            Admin?{' '}
            <Link href="/admin/login" className="text-gray-500 hover:text-brand-gold">
              Admin Login
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
