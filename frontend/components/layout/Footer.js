import Link from 'next/link';
import { FadeUp } from '../ui/ScrollReveal';

/* Premium enterprise footer - deep dark blue design system.
   Every string, link and route is identical to the previous footer. */

const QUICK_LINKS = [
  ['/', 'Home'],
  ['/features', 'Features'],
  ['/get-started', 'Get Started'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/privacy', 'Privacy & Data Handling'],
];

export default function Footer() {
  return (
    <footer className="ft">
      <span className="ft-top" aria-hidden="true" />
      <span className="ft-aura" aria-hidden="true" />
      <span className="ft-grid" aria-hidden="true" />

      <div className="ft-inner">
        <FadeUp>
          <div className="ft-cols">
            {/* Brand */}
            <div className="ft-brandcol">
              <div className="ft-brand">
                <span className="ft-logo" aria-hidden="true">
                  <img src="/logo.png" alt="SYNCOPTRAC" className="ft-logo-img" width="44" height="44" />
                </span>
                <span className="ft-word">
                  <span className="ft-mark">
                    <span className="ft-mark-s">S</span>
                    <span className="ft-mark-rest">YNCOPTRAC</span>
                  </span>
                  <span className="ft-tag">
                    WHERE COMMUNICATION GETS ORGANISED AND NOTHING IS MISSED.
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="ft-col">
              <h4 className="ft-head">
                Quick Links
                <span className="ft-head-rail" aria-hidden="true" />
              </h4>
              <div className="ft-list">
                {QUICK_LINKS.map(([href, label]) => (
                  <Link key={href} href={href} className="ft-link">
                    <span className="ft-link-arrow" aria-hidden="true" />
                    <span className="ft-link-face">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="ft-col">
              <h4 className="ft-head">
                Contact
                <span className="ft-head-rail" aria-hidden="true" />
              </h4>
              <div className="ft-list">
                <a href="mailto:syncoptrac@gmail.com" className="ft-link">
                  <span className="ft-link-arrow" aria-hidden="true" />
                  <span className="ft-link-face">syncoptrac@gmail.com</span>
                </a>
                <p className="ft-note">
                  <span className="ft-pulse" aria-hidden="true" />
                  We respond within 24 hours
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        <div className="ft-base">
          <p className="ft-copy">© 2026 SYNCOPTRAC. All rights reserved.</p>
          <p className="ft-made">Made in India.</p>
        </div>
      </div>

      <style jsx>{`
        .ft {
          position: relative;
          overflow: hidden;
          margin-top: auto;
          padding: 72px 0 40px;
          background: linear-gradient(180deg, #0b1f4d 0%, #071a52 100%);
          color: rgba(190, 209, 247, 0.72);
        }
        .ft-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(37, 99, 235, 0.6),
            rgba(59, 130, 246, 0.85),
            rgba(37, 99, 235, 0.6),
            transparent
          );
        }
        .ft-aura {
          position: absolute;
          top: -120px;
          left: 50%;
          width: 720px;
          height: 320px;
          transform: translateX(-50%);
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.18) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .ft-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.05) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(
            ellipse 70% 80% at 50% 0%,
            #000 0%,
            transparent 75%
          );
        }
        .ft-inner {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .ft-cols {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }

        .ft-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ft-logo {
          position: relative;
          display: block;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 14px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.7),
            rgba(37, 99, 235, 0.15)
          );
        }
        .ft-logo-img {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: 13px;
          object-fit: cover;
        }
        .ft-word {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ft-mark {
          font-size: 17px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.04em;
        }
        .ft-mark-s {
          color: #5ce1e6;
        }
        .ft-mark-rest {
          color: #ffffff;
        }
        .ft-tag {
          font-size: 10.5px;
          line-height: 1.5;
          font-style: italic;
          letter-spacing: 0.05em;
          color: rgba(190, 209, 247, 0.45);
          max-width: 320px;
        }

        .ft-head {
          position: relative;
          display: inline-block;
          margin: 0 0 22px;
          padding-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(235, 243, 255, 0.92);
        }
        .ft-head-rail {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 28px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
        }
        .ft-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
          font-size: 13.5px;
        }
        .ft-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0;
          width: fit-content;
          color: rgba(190, 209, 247, 0.66);
          text-decoration: none;
          transition: color 260ms ease, transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ft-link-arrow {
          width: 0;
          height: 1.5px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          opacity: 0;
          transition: width 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease,
            margin-right 320ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ft-link:hover {
          color: #ffffff;
        }
        .ft-link:hover .ft-link-arrow {
          width: 12px;
          opacity: 1;
          margin-right: 8px;
        }
        .ft-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 2px 0 0;
          font-size: 11.5px;
          color: rgba(190, 209, 247, 0.45);
        }
        .ft-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #3b82f6;
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
          animation: ftPulse 2.4s ease-out infinite;
        }
        @keyframes ftPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.55);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        .ft-base {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 26px;
          border-top: 1px solid rgba(147, 197, 253, 0.14);
        }
        .ft-copy,
        .ft-made {
          margin: 0;
          font-size: 11.5px;
        }
        .ft-copy {
          color: rgba(190, 209, 247, 0.5);
        }
        .ft-made {
          font-style: italic;
          color: rgba(190, 209, 247, 0.4);
        }

        .ft-link:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
          border-radius: 4px;
        }

        @media (min-width: 768px) {
          .ft-cols {
            grid-template-columns: 2fr 1fr 1fr;
            gap: 48px;
          }
          .ft-base {
            flex-direction: row;
          }
        }
        @media (max-width: 480px) {
          .ft-inner {
            padding: 0 16px;
          }
          .ft {
            padding-top: 56px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ft-pulse {
            animation: none;
          }
          .ft-link,
          .ft-link-arrow {
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </footer>
  );
}
