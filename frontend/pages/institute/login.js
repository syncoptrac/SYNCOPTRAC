import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import api, { setAuth } from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthStatusPanel from '../../components/ui/AuthStatusPanel';
import AuthField from '../../components/ui/AuthField';
import AuthSubmitButton from '../../components/ui/AuthSubmitButton';
import AuthErrorNote from '../../components/ui/AuthErrorNote';
import AuthOptionsRow from '../../components/ui/AuthOptionsRow';
import usePresence from '../../components/ui/usePresence';
import useTimers from '../../components/ui/useTimers';

/* Motion timings kept in one place so both portals stay in sync. */
const MIN_VERIFY_MS = 620;  // floor for the verifying stage, so a fast API never flashes
const SUCCESS_HOLD_MS = 1100; // ring draw + tick + label, then hand off to the router
const PANEL_EXIT_MS = 260;

/* Remember-me stores the Login ID only -- never the password, never a token.
   It is a convenience for the field, not an auth mechanism. */
const REMEMBER_KEY = 'sc:remember:institute';

export default function InstituteLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [displaced, setDisplaced] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [successLabel, setSuccessLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shaking, setShaking] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(null);
  const [remember, setRemember] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const router = useRouter();
  const { after, wait } = useTimers();

  // Guards the submit path itself -- covers Enter-key double fires and any
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

  /* Restore a remembered Login ID. Client-only, so it cannot affect SSR. */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setForm((p) => ({ ...p, loginId: saved }));
        setRemember(true);
      }
    } catch (e) {
      /* storage blocked (private mode) -- the field simply starts empty */
    }
  }, []);

  /* -- Zero layout shift ------------------------------------------------
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

  /* Escape closes the forgot-password dialog. */
  useEffect(() => {
    if (!showForgot) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowForgot(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showForgot]);

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
      // -- Authentication logic unchanged: same endpoint, same payload, same token handling
      const res = await api.post('/api/auth/institute/login', form);
      setAuth(res.data.token, res.data.user);

      // Login ID convenience only. Nothing secret is ever written here.
      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, form.loginId);
        else window.localStorage.removeItem(REMEMBER_KEY);
      } catch (storageErr) {
        /* non-fatal: never block a successful sign-in on storage */
      }

      // Exact same message this app has always shown -- just staged inside
      // the success animation instead of only appearing as a toast.
      const welcomeMsg = `Welcome, ${res.data.user.instituteName}!`;

      await holdFloor();
      toast.success(welcomeMsg);
      setSuccessLabel(welcomeMsg);
      setPhase('success');
      // submittingRef intentionally stays true -- the page is navigating away.
      after(SUCCESS_HOLD_MS, () => router.replace('/institute/dashboard'));
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
    <div className="auth">
      {/* ================= BRAND SIDE =================
          On wide screens this owns the left half of the viewport. On phones it
          collapses to a compact banner so the form is reachable without
          scrolling. Wording is unchanged from the previous version. */}
      <aside className="brand">
        <div className="art" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="mesh" />
        </div>

        <div className="brand-inner">
          <Link href="/" className="brand-lock">
            <img src="/logo.png" alt="SYNCOPTRAC" className="logo" width="34" height="34" />
            <span className="wordmark">
              <span className="wm-c">S</span>YNCOPTRAC
            </span>
          </Link>

          <div className="brand-copy">
            <span className="eyebrow">Institute Portal</span>
            <h1 className="headline">
              Where communication gets organised and nothing is missed.
            </h1>
            <span className="rule" aria-hidden="true" />
            <ul className="points">
              <li>
                <Tick /> Attendance, fees and enquiries in one place
              </li>
              <li>
                <Tick /> Built for coaching institutes and schools
              </li>
              <li>
                <Tick /> Your data stays private to your institute
              </li>
            </ul>
          </div>

          <p className="brand-foot">Trusted by institutes to run every day.</p>
        </div>
      </aside>

      {/* ================= FORM SIDE ================= */}
      <main className="pane">
        <div className="pane-top">
          <Link href="/" className="back">
            &#8592; Back to Home
          </Link>
        </div>

        <div className="form-wrap">
          <header className="intro">
            <h2 className="title">Welcome back</h2>
            <p className="sub">Sign in to continue to your institute workspace.</p>
          </header>

          {displaced && (
            <div className="displaced" role="alert">
              <span className="dsp-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </span>
              <div>
                <p className="dsp-title">Session Ended</p>
                <p className="dsp-body">
                  Someone else logged into this account on another device. Please log in again to
                  continue.
                </p>
              </div>
            </div>
          )}

          <div className={`card ${shaking ? 'is-shaking' : ''} ${busy ? 'is-busy' : ''}`}>
            <div className="body" style={bodyHeight ? { minHeight: `${bodyHeight}px` } : undefined}>
              {/* The form stays mounted the whole time -- it only cross-fades out.
                  That keeps typed values and avoids remount cost / re-renders. */}
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className={`swap ${busy ? 'is-hidden' : ''}`}
                autoComplete="off"
                aria-hidden={busy}
                noValidate={false}
              >
                {/* autoComplete="off" + name attributes different from admin form
                    + readOnly trick on password ensures browser never autofills
                    admin credentials into this institute form */}
                <fieldset disabled={busy} className="fieldset">
                  <div className="stack">
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
                      placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                      value={form.password}
                      onChange={onChange('password')}
                      invalid={Boolean(errorMsg)}
                      noAutofill
                      required
                    />

                    <AuthOptionsRow
                      remember={remember}
                      onRememberChange={setRemember}
                      onForgot={() => setShowForgot(true)}
                      disabled={busy}
                    />

                    {errorMsg && <AuthErrorNote message={errorMsg} />}

                    <AuthSubmitButton loading={loading} />
                  </div>
                </fieldset>
              </form>

              {panelMounted && (
                <div className="overlay">
                  <AuthStatusPanel
                    phase={phase === 'success' ? 'success' : 'verifying'}
                    label={phase === 'success' ? successLabel : 'Signing in...'}
                    exiting={!busy}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="links">
            <p className="lk-1">
              Don&apos;t have an account?{' '}
              <Link href="/get-started" className="lk-strong">
                Get Started
              </Link>
            </p>
            <p className="lk-2">
              Admin?{' '}
              <Link href="/admin/login" className="lk-muted">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Forgot password: informational only. This product has no self-serve
          reset endpoint, so the dialog routes the user to a human instead of
          pretending an email was sent. */}
      {showForgot && (
        <div className="scrim" onClick={() => setShowForgot(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dlg-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="dlg-title" id="forgot-title">
              Forgot your password?
            </h3>
            <p className="dlg-body">
              Institute passwords are reset by your Syncoptrac administrator. Contact your admin
              with your Login ID and a new password will be issued to you.
            </p>
            <div className="dlg-foot">
              <button type="button" className="dlg-btn" onClick={() => setShowForgot(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .auth {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          min-height: 100vh;
          background: #f8fafc;
          color: #111827;
        }

        /* ---------------- brand side ---------------- */
        .brand {
          position: relative;
          overflow: hidden;
          background: linear-gradient(155deg, #0b1f4d 0%, #12306e 52%, #0b1f4d 100%);
          display: flex;
          align-items: center;
          padding: 56px 56px 48px;
        }
        .art {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
        }
        .orb-1 {
          width: 460px;
          height: 460px;
          top: -140px;
          right: -150px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.34) 0%, transparent 68%);
          animation: drift 22s ease-in-out infinite;
        }
        .orb-2 {
          width: 380px;
          height: 380px;
          bottom: -130px;
          left: -110px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 66%);
          animation: drift 26s ease-in-out infinite reverse;
        }
        /* Fine grid: gives the panel structure without any imagery to load. */
        .mesh {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 54px 54px;
          mask-image: radial-gradient(ellipse 75% 65% at 35% 40%, #000 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(ellipse 75% 65% at 35% 40%, #000 0%, transparent 78%);
        }
        @keyframes drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(22px, -26px, 0) scale(1.06); }
        }

        .brand-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
          max-width: 30rem;
          margin-left: auto;
          margin-right: auto;
        }
        .brand-lock {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          width: fit-content;
        }
        .logo {
          width: 34px;
          height: 34px;
          border-radius: 9px;
        }
        .wordmark {
          font-size: 1.0625rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #ffffff;
        }
        /* Cyan survives here only -- the wordmark is the brand, not the UI. */
        .wm-c {
          color: #5ce1e6;
        }

        .eyebrow {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #93c5fd;
          margin-bottom: 18px;
        }
        .headline {
          font-size: clamp(1.75rem, 3vw, 2.375rem);
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0;
        }
        .rule {
          display: block;
          width: 54px;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0));
          margin: 26px 0 22px;
        }
        .points {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .points li {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: rgba(226, 232, 240, 0.88);
        }
        .brand-foot {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(148, 163, 184, 0.72);
          margin: 0;
        }

        /* ---------------- form side ---------------- */
        .pane {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 22px 24px 40px;
        }
        .pane-top {
          display: flex;
          justify-content: flex-end;
        }
        .back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #4b5563;
          text-decoration: none;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 9px 15px;
          border-radius: 999px;
          transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease,
            transform 0.18s ease;
        }
        .back:hover {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .form-wrap {
          width: 100%;
          max-width: 25.5rem;
          margin: auto;
          padding: 32px 0 0;
        }
        .intro {
          margin-bottom: 26px;
        }
        .title {
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #111827;
          margin: 0 0 7px;
        }
        .sub {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .displaced {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 20px;
          padding: 14px 15px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.07);
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: rise 0.44s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dsp-ico {
          color: #ef4444;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .dsp-title {
          font-size: 0.875rem;
          font-weight: 800;
          color: #b91c1c;
          margin: 0 0 3px;
        }
        .dsp-body {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #991b1b;
          margin: 0;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 26px 24px;
          box-shadow: 0 4px 8px rgba(11, 31, 77, 0.04), 0 18px 40px rgba(11, 31, 77, 0.07);
          animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
          transition: box-shadow 0.3s ease;
        }
        .card.is-busy {
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.06), 0 18px 44px rgba(37, 99, 235, 0.14);
        }
        .card.is-shaking {
          animation: shake 0.56s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-7px); }
          40%, 60% { transform: translateX(7px); }
        }

        .body {
          position: relative;
        }
        .fieldset {
          border: 0;
          margin: 0;
          padding: 0;
          min-width: 0;
        }
        .stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        /* Cross-fade rather than unmount, so typed values survive the swap. */
        .swap {
          transition: opacity 0.26s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
            filter 0.26s ease;
        }
        .swap.is-hidden {
          opacity: 0;
          transform: scale(0.985);
          filter: blur(1px);
          pointer-events: none;
        }
        .overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .links {
          margin-top: 22px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .lk-1 {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        .lk-2 {
          font-size: 0.8125rem;
          color: #9ca3af;
          margin: 0;
        }
        .links :global(.lk-strong) {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }
        .links :global(.lk-strong:hover) {
          text-decoration: underline;
        }
        .links :global(.lk-muted) {
          color: #6b7280;
          font-weight: 600;
          text-decoration: none;
        }
        .links :global(.lk-muted:hover) {
          color: #2563eb;
        }

        /* ---------------- forgot dialog ---------------- */
        .scrim {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(11, 31, 77, 0.42);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fade 0.2s ease both;
        }
        .dialog {
          width: 100%;
          max-width: 25rem;
          background: #ffffff;
          border-radius: 20px;
          padding: 26px 24px 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.24);
          animation: dlgIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dlg-ico {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 16px;
        }
        .dlg-title {
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.015em;
          color: #111827;
          margin: 0 0 8px;
        }
        .dlg-body {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #6b7280;
          margin: 0;
        }
        .dlg-foot {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .dlg-btn {
          border: 0;
          border-radius: 11px;
          background: #2563eb;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 11px 20px;
          min-height: 44px;
          cursor: pointer;
          transition: background-color 0.18s ease, transform 0.18s ease;
        }
        .dlg-btn:hover {
          background: #1d4ed8;
        }
        .dlg-btn:active {
          transform: scale(0.98);
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dlgIn {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ---------------- responsive ---------------- */
        @media (max-width: 1080px) {
          .brand {
            padding: 44px 40px;
          }
          .brand-inner {
            gap: 30px;
          }
        }

        /* Below 900px the split becomes a stack: brand banner, then the form. */
        @media (max-width: 900px) {
          .auth {
            grid-template-columns: 1fr;
          }
          .brand {
            padding: 26px 22px 24px;
            align-items: flex-start;
          }
          .brand-inner {
            gap: 18px;
            max-width: none;
            margin: 0;
          }
          .headline {
            font-size: 1.375rem;
          }
          .rule {
            margin: 16px 0 0;
          }
          /* The value props and footer are desktop luxuries -- on a phone they
             push the actual form below the fold. */
          .points,
          .brand-foot {
            display: none;
          }
          .eyebrow {
            margin-bottom: 12px;
          }
          .pane {
            padding: 16px 18px 36px;
          }
          .form-wrap {
            padding-top: 20px;
          }
          .pane-top {
            justify-content: flex-start;
          }
        }

        @media (max-width: 560px) {
          .card {
            padding: 22px 18px;
            border-radius: 20px;
          }
          .title {
            font-size: 1.625rem;
          }
          .form-wrap {
            padding-top: 14px;
          }
          /* Dialog becomes a bottom sheet, which is the native pattern. */
          .scrim {
            align-items: flex-end;
            padding: 0;
          }
          .dialog {
            max-width: none;
            border-radius: 22px 22px 0 0;
            padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
            animation: sheetIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes sheetIn {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-1, .orb-2, .card, .displaced, .dialog, .scrim, .swap, .back {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* Small inline tick used by the brand value props. */
function Tick() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#3b82f6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <polyline points="4 12.5 9.5 18 20 6" />
    </svg>
  );
}
