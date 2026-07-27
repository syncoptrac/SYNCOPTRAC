import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

/* Premium enterprise onboarding form - shared deep dark blue design system.
   Business logic untouched: same state shape, same /health warm-up, same
   POST to /api/leads, same 15s AbortController, same error strings, same
   labels, options, placeholders and button labels. */

const instituteTypes = [
  'Coaching Institute',
  'Tuition / Academic Classes',
  'Computer Training Centre',
  'Skill Development Institute',
  'Competitive Exam Coaching',
  'Language Training Institute',
  'Other',
];

const studentCounts = [
  'Up to 50 students',
  '51–100 students',
  '101–150 students',
  '151–300 students',
  '300+ students',
];

export default function GetStartedPage() {
  const [form, setForm] = useState({
    instituteName: '',
    ownerName: '',
    email: '',
    instituteType: '',
    numberOfStudents: '',
    phone: '',
    message: '',
  });
  const [focused, setFocused] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Wake up Render free-tier backend as soon as page loads
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/health`, { method: 'GET' }).catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const res = await fetch(`${backendUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError(
          'Request timed out. Please check your connection or email us at syncoptrac@gmail.com'
        );
      } else {
        setError(
          'Something went wrong. Please try emailing us directly at syncoptrac@gmail.com'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = (name) => 'gf-shell' + (focused === name ? ' is-focus' : '');

  return (
    <div className="pg">
      <Navbar />

      {/* Page header */}
      <section className="ph">
        <span className="ph-grid" aria-hidden="true" />
        <span className="ph-orb ph-orb-1" aria-hidden="true" />
        <span className="ph-orb ph-orb-2" aria-hidden="true" />
        <span className="ph-beam" aria-hidden="true" />
        <span className="ph-fade" aria-hidden="true" />
        <div className="ph-inner">
          <div className="ph-badge">
            <span className="ph-badge-dot" aria-hidden="true" />
            Get Started
          </div>
          <h1 className="ph-title">Tell Us About Your Institute</h1>
          <p className="ph-lede">
            Fill in your institute details. We will review your request and contact you
            within 24 hours.
          </p>
        </div>
      </section>

      {/* Form section */}
      <section className="gs">
        <span className="gs-wash" aria-hidden="true" />
        <div className="gs-inner">
          {submitted ? (
            <FadeUp>
              <div className="gok">
                <span className="gok-glow" aria-hidden="true" />
                <div className="gok-badge" aria-hidden="true">
                  <span className="gok-ring" />
                  <span className="gok-glyph">✅</span>
                </div>
                <h2 className="gok-title">Request Received</h2>
                <p className="gok-copy">
                  Thank you for reaching out. We have received your details and will review
                  your request and contact you within <strong>24 hours</strong>.
                </p>
                <p className="gok-note">
                  If you need to reach us sooner, email us at{' '}
                  <a href="mailto:syncoptrac@gmail.com" className="gok-link">
                    syncoptrac@gmail.com
                  </a>
                </p>
              </div>
            </FadeUp>
          ) : (
            <FadeUp>
              <div className="gcard">
                <span className="gcard-rail" aria-hidden="true" />
                <form onSubmit={handleSubmit} className="gform">
                  {/* Required fields */}
                  <div className="glegend">
                    <span className="glegend-txt">Institute Details</span>
                    <span className="glegend-line" aria-hidden="true" />
                  </div>

                  <div className="gstack">
                    <div className="gf">
                      <label className="gf-label" htmlFor="instituteName">
                        Institute Name <span className="gf-req">*</span>
                      </label>
                      <div className={fieldCls('instituteName')}>
                        <input
                          id="instituteName"
                          name="instituteName"
                          type="text"
                          required
                          placeholder="e.g. Sharma Coaching Centre"
                          value={form.instituteName}
                          onChange={handleChange}
                          onFocus={() => setFocused('instituteName')}
                          onBlur={() => setFocused('')}
                          className="gf-input"
                        />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="gf">
                      <label className="gf-label" htmlFor="ownerName">
                        Owner / Contact Name <span className="gf-req">*</span>
                      </label>
                      <div className={fieldCls('ownerName')}>
                        <input
                          id="ownerName"
                          name="ownerName"
                          type="text"
                          required
                          placeholder="Your full name"
                          value={form.ownerName}
                          onChange={handleChange}
                          onFocus={() => setFocused('ownerName')}
                          onBlur={() => setFocused('')}
                          className="gf-input"
                        />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="gf">
                      <label className="gf-label" htmlFor="email">
                        Email Address <span className="gf-req">*</span>
                      </label>
                      <div className={fieldCls('email')}>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused('')}
                          className="gf-input"
                        />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="gf">
                      <label className="gf-label" htmlFor="instituteType">
                        Institute Type <span className="gf-req">*</span>
                      </label>
                      <div className={fieldCls('instituteType') + ' is-select'}>
                        <select
                          id="instituteType"
                          name="instituteType"
                          required
                          value={form.instituteType}
                          onChange={handleChange}
                          onFocus={() => setFocused('instituteType')}
                          onBlur={() => setFocused('')}
                          className="gf-input gf-select"
                        >
                          <option value="">Select institute type...</option>
                          {instituteTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="gf-caret" aria-hidden="true" />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="gf">
                      <label className="gf-label" htmlFor="studentCount">
                        Number of Students <span className="gf-req">*</span>
                      </label>
                      <div className={fieldCls('studentCount') + ' is-select'}>
                        <select
                          id="studentCount"
                          name="numberOfStudents"
                          required
                          value={form.numberOfStudents}
                          onChange={handleChange}
                          onFocus={() => setFocused('studentCount')}
                          onBlur={() => setFocused('')}
                          className="gf-input gf-select"
                        >
                          <option value="">Select student count...</option>
                          {studentCounts.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <span className="gf-caret" aria-hidden="true" />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div className="glegend glegend-2">
                    <span className="glegend-txt">Optional</span>
                    <span className="glegend-line" aria-hidden="true" />
                  </div>

                  <div className="gstack">
                    <div className="gf">
                      <label className="gf-label" htmlFor="phone">
                        Phone Number
                      </label>
                      <div className={fieldCls('phone')}>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder=""
                          value={form.phone}
                          onChange={handleChange}
                          onFocus={() => setFocused('phone')}
                          onBlur={() => setFocused('')}
                          className="gf-input"
                        />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="gf">
                      <label className="gf-label" htmlFor="message">
                        Message
                      </label>
                      <div className={fieldCls('message')}>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          placeholder="Anything else you'd like us to know about your institute..."
                          value={form.message}
                          onChange={handleChange}
                          onFocus={() => setFocused('message')}
                          onBlur={() => setFocused('')}
                          className="gf-input gf-area"
                        />
                        <span className="gf-under" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {error && <div className="gerr">{error}</div>}

                  <button type="submit" disabled={loading} className="gbtn">
                    <span className="gbtn-sheen" aria-hidden="true" />
                    <span className="gbtn-face">
                      {loading ? 'Submitting...' : 'Submit Request →'}
                    </span>
                  </button>

                  <p className="gsla">
                    We review every request and respond within 24 hours.
                  </p>

                  <p className="gterms">
                    By submitting this form, you agree that <strong>SYNCOPTRAC</strong> may
                    use the information provided to contact you, set up your account, and
                    provide related services.
                  </p>
                </form>
              </div>
            </FadeUp>
          )}
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .pg {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
          overflow-x: clip;
          background: #f8fafc;
        }

        /* ---- page header ---- */
        .ph {
          position: relative;
          overflow: hidden;
          padding: 96px 24px 104px;
          text-align: center;
          background: linear-gradient(165deg, #071a52 0%, #0b1f4d 52%, #12356d 100%);
          color: #ffffff;
        }
        .ph-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.06) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.06) 1px, transparent 1px);
          background-size: 62px 62px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, #000 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(
            ellipse 70% 70% at 50% 40%,
            #000 0%,
            transparent 78%
          );
        }
        .ph-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(44px);
        }
        .ph-orb-1 {
          width: 420px;
          height: 420px;
          top: -30%;
          left: -6%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.32), transparent 68%);
          animation: phOrb1 20s ease-in-out infinite;
        }
        .ph-orb-2 {
          width: 360px;
          height: 360px;
          bottom: -34%;
          right: -5%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.24), transparent 68%);
          animation: phOrb2 25s ease-in-out infinite;
        }
        @keyframes phOrb1 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(46px, 30px, 0) scale(1.1);
          }
        }
        @keyframes phOrb2 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-40px, -26px, 0) scale(1.08);
          }
        }
        .ph-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -220px;
          width: 220px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(147, 197, 253, 0.08),
            transparent
          );
          transform: skewX(-14deg);
          animation: phBeam 13s ease-in-out infinite;
        }
        @keyframes phBeam {
          0% {
            left: -220px;
          }
          55%,
          100% {
            left: 120%;
          }
        }
        .ph-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 120px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, #f8fafc);
        }
        .ph-inner {
          position: relative;
          z-index: 3;
          max-width: 700px;
          margin: 0 auto;
        }
        .ph-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #bfdbfe;
          background: rgba(37, 99, 235, 0.18);
          border: 1px solid rgba(147, 197, 253, 0.28);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .ph-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          animation: phPulse 2.4s ease-out infinite;
        }
        @keyframes phPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.55);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .ph-title {
          margin: 0 0 18px;
          font-size: clamp(2rem, 5.8vw, 3.2rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 55%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ph-lede {
          max-width: 540px;
          margin: 0 auto;
          font-size: clamp(0.98rem, 2.4vw, 1.1rem);
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.82);
        }

        /* ---- form ---- */
        .gs {
          position: relative;
          flex: 1;
          padding: 8px 24px 88px;
          background: #f8fafc;
        }
        .gs-wash {
          position: absolute;
          top: -40px;
          left: 50%;
          width: 760px;
          height: 300px;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.07),
            transparent 70%
          );
        }
        .gs-inner {
          position: relative;
          z-index: 2;
          max-width: 620px;
          margin: 0 auto;
        }

        .gcard {
          position: relative;
          overflow: hidden;
          padding: 42px 40px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 22px 54px rgba(11, 31, 77, 0.08);
        }
        .gcard-rail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
        }

        .glegend {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .glegend-2 {
          margin-top: 32px;
        }
        .glegend-txt {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2563eb;
          white-space: nowrap;
        }
        .glegend-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #bfdbfe, transparent);
        }

        .gstack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .gf-label {
          display: block;
          margin-bottom: 7px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #374151;
        }
        .gf-req {
          color: #ef4444;
        }
        .gf-shell {
          position: relative;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          transition: border-color 260ms ease, background 260ms ease,
            box-shadow 260ms ease;
        }
        .gf-shell.is-focus {
          background: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
        .gf-input {
          width: 100%;
          padding: 13px 16px;
          border: none;
          outline: none;
          background: transparent;
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: inherit;
          color: #111827;
          box-sizing: border-box;
        }
        .gf-input::placeholder {
          color: #9ca3af;
        }
        .gf-select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          padding-right: 40px;
        }
        .gf-caret {
          position: absolute;
          right: 16px;
          top: 50%;
          width: 8px;
          height: 8px;
          margin-top: -5px;
          pointer-events: none;
          border-right: 2px solid #6b7280;
          border-bottom: 2px solid #6b7280;
          transform: rotate(45deg);
          transition: border-color 240ms ease, transform 300ms ease;
        }
        .gf-shell.is-focus .gf-caret {
          border-color: #2563eb;
        }
        .gf-area {
          resize: vertical;
          min-height: 104px;
          line-height: 1.6;
        }
        .gf-under {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gf-shell.is-focus .gf-under {
          transform: scaleX(1);
        }

        .gerr {
          margin-top: 18px;
          padding: 13px 16px;
          border-radius: 11px;
          font-size: 0.875rem;
          color: #b91c1c;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.24);
          animation: gErr 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes gErr {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gbtn {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-top: 28px;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          font-family: inherit;
          letter-spacing: 0.01em;
          color: #ffffff;
          cursor: pointer;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 14px 34px rgba(37, 99, 235, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 320ms ease, opacity 240ms ease;
        }
        .gbtn-face {
          position: relative;
          z-index: 2;
        }
        .gbtn-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -60%;
          width: 45%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-18deg);
        }
        .gbtn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 20px 46px rgba(37, 99, 235, 0.54),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .gbtn:hover:not(:disabled) .gbtn-sheen {
          animation: gSheen 760ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes gSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }
        .gbtn:disabled {
          cursor: not-allowed;
          opacity: 0.72;
          box-shadow: none;
        }

        .gsla {
          margin: 14px 0 0;
          text-align: center;
          font-size: 0.8rem;
          color: #6b7280;
        }
        .gterms {
          margin: 18px 0 0;
          padding-top: 18px;
          text-align: center;
          font-size: 0.75rem;
          line-height: 1.65;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
        .gterms strong {
          color: #6b7280;
        }

        /* ---- success ---- */
        .gok {
          position: relative;
          overflow: hidden;
          padding: 56px 42px;
          border-radius: 24px;
          text-align: center;
          background: #ffffff;
          border: 1px solid #bbf7d0;
          box-shadow: 0 22px 54px rgba(34, 197, 94, 0.12);
        }
        .gok-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          width: 420px;
          height: 260px;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(34, 197, 94, 0.16),
            transparent 68%
          );
        }
        .gok-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 88px;
          height: 88px;
          margin-bottom: 22px;
        }
        .gok-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.16), transparent 68%);
          animation: gokRing 2.6s ease-out infinite;
        }
        @keyframes gokRing {
          0% {
            transform: scale(0.85);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.25);
            opacity: 0;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }
        .gok-glyph {
          position: relative;
          z-index: 2;
          font-size: 3.4rem;
          line-height: 1;
        }
        .gok-title {
          position: relative;
          z-index: 2;
          margin: 0 0 12px;
          font-size: 1.55rem;
          font-weight: 900;
          letter-spacing: -0.025em;
          color: #111827;
        }
        .gok-copy {
          position: relative;
          z-index: 2;
          max-width: 440px;
          margin: 0 auto;
          font-size: 0.95rem;
          line-height: 1.78;
          color: #4b5563;
        }
        .gok-copy strong {
          color: #111827;
        }
        .gok-note {
          position: relative;
          z-index: 2;
          margin: 18px 0 0;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .gok-link {
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
        }
        .gok-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .gbtn:focus-visible,
        .gf-input:focus-visible,
        .gok-link:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
        }

        @media (max-width: 560px) {
          .ph {
            padding: 74px 18px 88px;
          }
          .gs {
            padding: 8px 18px 64px;
          }
          .gcard {
            padding: 30px 22px;
          }
          .gok {
            padding: 44px 24px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ph-orb,
          .ph-beam,
          .ph-badge-dot,
          .gok-ring,
          .gerr {
            animation: none !important;
          }
          .gf-shell,
          .gf-under,
          .gbtn {
            transition-duration: 1ms !important;
          }
          .gbtn:hover:not(:disabled) .gbtn-sheen {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
