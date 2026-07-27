import Link from 'next/link';
import { useEffect, useState } from 'react';

/* Premium enterprise 404 - deep dark blue design system.
   Content preserved exactly: 404 / Page not found /
   The page you're looking for doesn't exist. / Go Home / Institute Login */

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={'nf' + (mounted ? ' is-in' : '')}>
      <span className="nf-grid" aria-hidden="true" />
      <span className="nf-orb nf-orb-1" aria-hidden="true" />
      <span className="nf-orb nf-orb-2" aria-hidden="true" />
      <span className="nf-beam" aria-hidden="true" />
      <span className="nf-vig" aria-hidden="true" />

      <div className="nf-inner">
        <div className="nf-numwrap">
          <div className="nf-num" aria-hidden="true">
            404
          </div>
          <div className="nf-numglow" aria-hidden="true" />
        </div>

        <h1 className="nf-title">Page not found</h1>
        <p className="nf-copy">The page you&apos;re looking for doesn&apos;t exist.</p>

        <div className="nf-cta">
          <Link href="/" className="nf-btn nf-btn-primary">
            <span className="nf-sheen" aria-hidden="true" />
            <span className="nf-btn-face">Go Home</span>
          </Link>
          <Link href="/institute/login" className="nf-btn nf-btn-ghost">
            <span className="nf-btn-face">Institute Login</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .nf {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(165deg, #071a52 0%, #0b1f4d 48%, #12356d 100%);
        }
        .nf-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.055) 1px, transparent 1px);
          background-size: 62px 62px;
          mask-image: radial-gradient(ellipse 65% 65% at 50% 45%, #000 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(
            ellipse 65% 65% at 50% 45%,
            #000 0%,
            transparent 78%
          );
        }
        .nf-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(46px);
        }
        .nf-orb-1 {
          width: 460px;
          height: 460px;
          top: -14%;
          left: -8%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.32), transparent 68%);
          animation: nfOrb1 19s ease-in-out infinite;
        }
        .nf-orb-2 {
          width: 400px;
          height: 400px;
          bottom: -16%;
          right: -8%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.26), transparent 68%);
          animation: nfOrb2 23s ease-in-out infinite;
        }
        @keyframes nfOrb1 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(52px, 36px, 0) scale(1.1);
          }
        }
        @keyframes nfOrb2 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-44px, -30px, 0) scale(1.08);
          }
        }
        .nf-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 240px;
          left: -240px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(147, 197, 253, 0.09),
            transparent
          );
          transform: skewX(-14deg);
          animation: nfBeam 11s ease-in-out infinite;
        }
        @keyframes nfBeam {
          0% {
            left: -240px;
          }
          55%,
          100% {
            left: 120%;
          }
        }
        .nf-vig {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse 90% 80% at 50% 50%,
            transparent 40%,
            rgba(4, 14, 46, 0.6) 100%
          );
        }

        .nf-inner {
          position: relative;
          z-index: 3;
          text-align: center;
          max-width: 560px;
          opacity: 0;
          transform: translateY(26px);
          filter: blur(6px);
          transition: opacity 900ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 900ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nf.is-in .nf-inner {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .nf-numwrap {
          position: relative;
          display: inline-block;
          margin-bottom: 10px;
        }
        .nf-num {
          position: relative;
          z-index: 2;
          font-size: clamp(6rem, 22vw, 10rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.05em;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #93c5fd 45%,
            rgba(37, 99, 235, 0.5) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 200%;
          animation: nfShimmer 7s ease-in-out infinite;
        }
        @keyframes nfShimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .nf-numglow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 300px;
          height: 300px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.34), transparent 66%);
          filter: blur(34px);
        }

        .nf-title {
          margin: 0 0 12px;
          font-size: clamp(1.35rem, 4.4vw, 1.7rem);
          font-weight: 800;
          letter-spacing: -0.015em;
          color: #ffffff;
        }
        .nf-copy {
          margin: 0 0 38px;
          font-size: 15px;
          line-height: 1.65;
          color: rgba(199, 215, 245, 0.76);
        }

        .nf-cta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
          justify-content: center;
        }
        .nf-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 14.5px;
          text-decoration: none;
          transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 340ms ease, background 300ms ease, border-color 300ms ease,
            color 300ms ease;
        }
        .nf-btn-face {
          position: relative;
          z-index: 2;
        }
        .nf-btn-primary {
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .nf-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.54),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .nf-sheen {
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
        .nf-btn-primary:hover .nf-sheen {
          animation: nfSheen 760ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes nfSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }
        .nf-btn-ghost {
          font-weight: 600;
          color: rgba(214, 227, 255, 0.88);
          border: 1px solid rgba(147, 197, 253, 0.26);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .nf-btn-ghost:hover {
          color: #ffffff;
          border-color: rgba(147, 197, 253, 0.5);
          background: rgba(37, 99, 235, 0.18);
          transform: translateY(-3px);
        }
        .nf-btn:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }

        @media (min-width: 520px) {
          .nf-cta {
            flex-direction: row;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-orb,
          .nf-beam,
          .nf-num {
            animation: none !important;
          }
          .nf-inner {
            transition-duration: 1ms !important;
          }
          .nf-btn-primary:hover .nf-sheen {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
