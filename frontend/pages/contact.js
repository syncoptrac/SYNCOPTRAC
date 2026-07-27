import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';
import Link from 'next/link';

/* Premium enterprise contact page - shared deep dark blue design system.
   Every heading, paragraph, label, emoji and route is preserved exactly. */

export default function ContactPage() {
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
            Contact
          </div>
          <h1 className="ph-title">Contact Us</h1>
          <p className="ph-lede">
            For any queries related to setup, features, or pricing, feel free to reach out.
          </p>
        </div>
      </section>

      {/* Contact info */}
      <section className="cs">
        <span className="cs-wash" aria-hidden="true" />
        <div className="cs-inner">
          <FadeUp>
            <div className="cs-grid">
              {/* Email card */}
              <article className="cc">
                <span className="cc-rail" aria-hidden="true" />
                <span className="cc-sheen" aria-hidden="true" />
                <div className="cc-ico" aria-hidden="true">
                  <span className="cc-ico-glyph">📧</span>
                </div>
                <h3 className="cc-title">Email</h3>
                <a href="mailto:syncoptrac@gmail.com" className="cc-mail">
                  syncoptrac@gmail.com
                </a>
                <p className="cc-note">
                  <span className="cc-pulse" aria-hidden="true" />
                  We respond within 24 hours
                </p>
              </article>

              {/* Call timing card */}
              <article className="cc">
                <span className="cc-rail" aria-hidden="true" />
                <span className="cc-sheen" aria-hidden="true" />
                <div className="cc-ico" aria-hidden="true">
                  <span className="cc-ico-glyph">📞</span>
                </div>
                <h3 className="cc-title">Call Requests</h3>
                <p className="cc-copy">
                  To request a call, email us your phone number. We will review your request
                  and contact you to arrange a suitable time for a call.
                </p>
                <div className="cc-hours">
                  <span className="cc-hours-txt">
                    Calling Hours: Monday – Saturday &nbsp;·&nbsp; 5:00 PM – 9:00 PM
                  </span>
                </div>
              </article>
            </div>
          </FadeUp>

          {/* Bottom CTA */}
          <FadeUp delay={120}>
            <div className="cb">
              <span className="cb-glow" aria-hidden="true" />
              <p className="cb-copy">
                Looking to set up your institute? Use the form to submit your details and we
                will get in touch.
              </p>
              <Link href="/get-started" className="cb-btn">
                <span className="cb-btn-sheen" aria-hidden="true" />
                <span className="cb-btn-face">Get Started →</span>
              </Link>
            </div>
          </FadeUp>
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

        /* ---- shared page header ---- */
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
          background: radial-gradient(circle, rgba(37, 99, 235, 0.34), transparent 68%);
          animation: phOrb1 20s ease-in-out infinite;
        }
        .ph-orb-2 {
          width: 360px;
          height: 360px;
          bottom: -34%;
          right: -5%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.26), transparent 68%);
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
          max-width: 720px;
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
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
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
          font-size: clamp(2.1rem, 6vw, 3.2rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 55%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ph-lede {
          max-width: 520px;
          margin: 0 auto;
          font-size: clamp(0.98rem, 2.4vw, 1.1rem);
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.82);
        }

        /* ---- cards ---- */
        .cs {
          position: relative;
          flex: 1;
          padding: 8px 24px 88px;
          background: #f8fafc;
        }
        .cs-wash {
          position: absolute;
          top: -40px;
          left: 50%;
          width: 780px;
          height: 320px;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.07),
            transparent 70%
          );
        }
        .cs-inner {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }
        .cs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .cc {
          position: relative;
          overflow: hidden;
          padding: 34px 30px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 12px 30px rgba(11, 31, 77, 0.05);
          transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease;
        }
        .cc-rail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
          transform: scaleX(0.34);
          transform-origin: left center;
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cc-sheen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            420px circle at 88% 0%,
            rgba(37, 99, 235, 0.09),
            transparent 62%
          );
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .cc:hover {
          transform: translateY(-7px);
          border-color: #bfdbfe;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.05),
            0 26px 54px rgba(37, 99, 235, 0.16);
        }
        .cc:hover .cc-rail {
          transform: scaleX(1);
        }
        .cc:hover .cc-sheen {
          opacity: 1;
        }
        .cc-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          margin-bottom: 20px;
          border-radius: 17px;
          background: linear-gradient(140deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cc-ico-glyph {
          font-size: 1.7rem;
          line-height: 1;
        }
        .cc:hover .cc-ico {
          transform: scale(1.09) rotate(-4deg);
        }
        .cc-title {
          margin: 0 0 10px;
          font-size: 1.06rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #111827;
        }
        .cc-mail {
          display: block;
          font-size: 0.96rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          transition: color 240ms ease;
        }
        .cc-mail:hover {
          color: #1d4ed8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .cc-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0 0;
          font-size: 0.8rem;
          color: #6b7280;
        }
        .cc-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          animation: ccPulse 2.6s ease-out infinite;
        }
        @keyframes ccPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .cc-copy {
          margin: 0 0 14px;
          font-size: 0.885rem;
          line-height: 1.7;
          color: #4b5563;
        }
        .cc-hours {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 11px;
          background: linear-gradient(135deg, #eff6ff, #f8fafc);
          border: 1px solid #bfdbfe;
        }
        .cc-hours-txt {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #1d4ed8;
        }

        /* ---- bottom CTA ---- */
        .cb {
          position: relative;
          overflow: hidden;
          margin-top: 22px;
          padding: 38px 30px;
          border-radius: 22px;
          text-align: center;
          background: linear-gradient(150deg, #0b1f4d 0%, #071a52 100%);
          border: 1px solid rgba(147, 197, 253, 0.18);
          box-shadow: 0 20px 50px rgba(11, 31, 77, 0.24);
        }
        .cb-glow {
          position: absolute;
          top: -60%;
          left: 50%;
          width: 520px;
          height: 220%;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.3),
            transparent 68%
          );
        }
        .cb-copy {
          position: relative;
          z-index: 2;
          max-width: 460px;
          margin: 0 auto 22px;
          font-size: 0.96rem;
          line-height: 1.7;
          color: rgba(214, 227, 255, 0.88);
        }
        .cb-btn {
          position: relative;
          z-index: 2;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 340ms ease;
        }
        .cb-btn-face {
          position: relative;
          z-index: 2;
        }
        .cb-btn-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -60%;
          width: 45%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.42),
            transparent
          );
          transform: skewX(-18deg);
        }
        .cb-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 42px rgba(37, 99, 235, 0.56),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .cb-btn:hover .cb-btn-sheen {
          animation: cbSheen 760ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cbSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }

        .cc-mail:focus-visible,
        .cb-btn:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
          border-radius: 6px;
        }

        @media (min-width: 720px) {
          .cs-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .ph {
            padding: 72px 18px 88px;
          }
          .cs {
            padding: 8px 18px 64px;
          }
          .cc {
            padding: 28px 22px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ph-orb,
          .ph-beam,
          .ph-badge-dot,
          .cc-pulse {
            animation: none !important;
          }
          .cc,
          .cc-ico,
          .cc-rail,
          .cb-btn {
            transition-duration: 1ms !important;
          }
          .cb-btn:hover .cb-btn-sheen {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
