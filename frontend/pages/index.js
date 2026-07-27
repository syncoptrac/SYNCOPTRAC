import Link from 'next/link';
import { useRef, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AnimatedHero from '../components/ui/AnimatedHero';
import { FadeUp, FadeIn } from '../components/ui/ScrollReveal';

/* Deep dark blue brand system. */
const C = {
  header: '#071A52',
  primary: '#0B1F4D',
  secondary: '#12356D',
  accent: '#2563EB',
  accentHover: '#3B82F6',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  muted: '#6B7280',
};

const valuePoints = [
  {
    icon: '🔗',
    title: 'Centralised Communication',
    desc: 'Centralised communication where nothing gets missed — all records, messages, and updates flow through one organised system.',
  },
  {
    icon: '👁️',
    title: 'Clear Visibility',
    desc: 'Clear visibility with timely follow-ups across batches, attendance, fees, and enquiries — so nothing slips through the cracks.',
  },
  {
    icon: '📂',
    title: 'Everything in One Place',
    desc: 'All communication stays organised in one place — no scattered spreadsheets, no missed follow-ups, no confusion.',
  },
];

const howItWorks = [
  { step: '1', title: 'Submit Institute Details', desc: 'Fill in your institute details through the Get Started form.' },
  { step: '2', title: 'Instant Confirmation Email', desc: 'You will receive an immediate confirmation that your request was received.' },
  { step: '3', title: 'Review & Eligibility Check', desc: 'Our team reviews your details and checks eligibility within 24 hours.' },
  { step: '4', title: 'Plan Confirmation', desc: 'We confirm your plan and share the next steps with you directly.' },
  { step: '5', title: 'Setup & Activation', desc: 'Your institute account is configured, connected, and ready to use.' },
];

/* ------------------------------------------------------------------
   Value card - pointer-tracked spotlight, accent rail, lift on hover.
------------------------------------------------------------------ */
function ValueCard({ icon, title, desc, delay }) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef({ x: 50, y: 50 });

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    posRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const node = cardRef.current;
      if (!node) return;
      node.style.setProperty('--mx', posRef.current.x + '%');
      node.style.setProperty('--my', posRef.current.y + '%');
    });
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <FadeUp delay={delay}>
      <div ref={cardRef} onMouseMove={handleMove} className="vcard">
        <span className="vcard-rail" aria-hidden="true" />
        <span className="vcard-spot" aria-hidden="true" />
        <div className="vcard-body">
          <div className="vcard-ico" aria-hidden="true">
            <span className="vcard-glyph">{icon}</span>
          </div>
          <h3 className="vcard-title">{title}</h3>
          <p className="vcard-desc">{desc}</p>
        </div>

        <style jsx>{`
          .vcard {
            --mx: 50%;
            --my: 0%;
            position: relative;
            height: 100%;
            overflow: hidden;
            background: ${C.card};
            border: 1px solid ${C.border};
            border-radius: 20px;
            box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04), 0 8px 24px rgba(11, 31, 77, 0.045);
            transition:
              transform 480ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 480ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 320ms ease;
          }
          .vcard:hover {
            transform: translateY(-7px);
            border-color: rgba(37, 99, 235, 0.28);
            box-shadow: 0 24px 60px rgba(11, 31, 77, 0.13), 0 8px 20px rgba(11, 31, 77, 0.06);
          }

          .vcard-rail {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, ${C.accent}, ${C.accentHover}, transparent);
            opacity: 0.5;
            transition: opacity 320ms ease;
          }
          .vcard:hover .vcard-rail { opacity: 1; }

          .vcard-spot {
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0;
            background: radial-gradient(
              circle 16rem at var(--mx) var(--my),
              rgba(37, 99, 235, 0.09) 0%,
              transparent 62%
            );
            transition: opacity 380ms ease;
          }
          .vcard:hover .vcard-spot { opacity: 1; }

          .vcard-body {
            position: relative;
            z-index: 1;
            padding: 2.15rem 1.85rem;
          }

          .vcard-ico {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3.35rem;
            height: 3.35rem;
            margin-bottom: 1.35rem;
            border-radius: 16px;
            background: linear-gradient(150deg, #EFF6FF 0%, #DBEAFE 100%);
            border: 1px solid rgba(37, 99, 235, 0.14);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
            transition:
              transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 380ms ease;
          }
          .vcard:hover .vcard-ico {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 22px rgba(37, 99, 235, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.7);
          }
          .vcard-glyph {
            font-size: 1.6rem;
            line-height: 1;
            filter: saturate(0.9);
          }

          .vcard-title {
            margin: 0 0 0.6rem;
            font-size: 1.075rem;
            font-weight: 700;
            letter-spacing: -0.012em;
            color: ${C.primary};
          }
          .vcard-desc {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.72;
            color: ${C.muted};
          }

          @media (prefers-reduced-motion: reduce) {
            .vcard,
            .vcard-ico,
            .vcard-spot,
            .vcard-rail {
              transition: none;
            }
            .vcard:hover { transform: none; }
            .vcard:hover .vcard-ico { transform: none; }
          }
        `}</style>
      </div>
    </FadeUp>
  );
}

export default function HomePage() {
  // "How It Works" timeline - the rail fills as you scroll through the
  // section. rAF-throttled scroll listener, same model as before.
  const timelineWrapRef = useRef(null);
  const timelineFillRef = useRef(null);
  const timelineRafRef = useRef(null);

  useEffect(() => {
    const updateFill = () => {
      timelineRafRef.current = null;
      const wrap = timelineWrapRef.current;
      const fill = timelineFillRef.current;
      if (!wrap || !fill) return;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;   // begins filling once the section is 85% down the viewport
      const end = vh * 0.35;     // fully filled once the bottom nears 35% up
      const total = rect.height + (start - end);
      const traveled = start - rect.top;
      const progress = Math.max(0, Math.min(1, total > 0 ? traveled / total : 0));
      fill.style.height = (progress * 100) + '%';
    };
    const onScroll = () => {
      if (timelineRafRef.current) return;
      timelineRafRef.current = requestAnimationFrame(updateFill);
    };
    updateFill();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (timelineRafRef.current) cancelAnimationFrame(timelineRafRef.current);
    };
  }, []);

  return (
    <div className="hp min-h-screen flex flex-col">
      <Navbar />

      <AnimatedHero />

      {/* CORE VALUE POINTS */}
      <section className="sec sec-value">
        <div className="shell">
          <FadeUp className="head">
            <div className="pill pill-dark">
              <span className="pill-w">Why </span>
              <span className="pill-c">S</span>
              <span className="pill-w">YNCOPTRAC</span>
            </div>
            <h2 className="h2">Built Around One Simple Idea</h2>
            <p className="lede">
              Keep everything organised, keep everyone informed, and let nothing fall through the cracks.
            </p>
          </FadeUp>

          <div className="vgrid">
            {valuePoints.map((v, i) => (
              <ValueCard key={v.title} {...v} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec sec-steps">
        <div className="dots" aria-hidden="true" />
        <div className="dots-fade" aria-hidden="true" />

        <div className="shell shell-rel">
          <FadeUp className="head">
            <div className="pill pill-light">How It Works</div>
            <h2 className="h2">From Request to Ready in 5 Steps</h2>
            <p className="lede lede-sm">
              A structured onboarding process so your institute is set up correctly, every time.
            </p>
          </FadeUp>

          <div className="tl" ref={timelineWrapRef}>
            <FadeIn>
              <div className="tl-rail" aria-hidden="true" />
            </FadeIn>
            <div className="tl-fill" ref={timelineFillRef} aria-hidden="true" />

            <div className="tl-list">
              {howItWorks.map((s, i) => (
                <FadeUp key={s.step} delay={i * 110}>
                  <div className={'tl-row ' + (i % 2 === 0 ? 'is-left' : 'is-right')}>
                    <div className="tl-side">
                      <div className="scard">
                        <span className="scard-edge" aria-hidden="true" />
                        {/* Mobile step marker */}
                        <div className="scard-mob">
                          <div className="node node-sm">{s.step}</div>
                        </div>
                        <h3 className="scard-title">{s.title}</h3>
                        <p className="scard-desc">{s.desc}</p>
                      </div>
                    </div>

                    {/* Desktop step marker on the rail */}
                    <div className="tl-node">
                      <div className="node">
                        <span className="node-ring" aria-hidden="true" />
                        {s.step}
                      </div>
                    </div>

                    <div className="tl-spacer" />
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec sec-cta">
        <div className="cta-glow" aria-hidden="true" />
        <div className="cta-grid" aria-hidden="true" />
        <div className="cta-vig" aria-hidden="true" />

        <FadeUp className="cta-inner">
          <div className="pill pill-onnavy">Get Started</div>
          <h2 className="h2 h2-invert">Ready to Get Organised?</h2>
          <p className="lede lede-invert">
            Tell us about your institute and we will get everything set up for you.
          </p>
          <Link href="/get-started" className="cbtn">
            <span className="cbtn-sheen" aria-hidden="true" />
            <span className="cbtn-face">
              Get Started
              <span className="cbtn-arrow">→</span>
            </span>
          </Link>
        </FadeUp>
      </section>

      <Footer />

      <style jsx>{`
        .hp { overflow-x: hidden; background: ${C.bg}; }

        .sec { position: relative; padding: 7rem 1rem; }
        .shell { max-width: 64rem; margin: 0 auto; }
        .shell-rel { position: relative; z-index: 1; }

        /* ---- Section heads ---- */
        .hp :global(.head) { text-align: center; margin-bottom: 3.6rem; }

        .pill {
          display: inline-block;
          margin-bottom: 1.15rem;
          padding: 0.42rem 0.95rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-radius: 999px;
        }
        .pill-dark {
          background: linear-gradient(135deg, ${C.header} 0%, ${C.secondary} 100%);
          border: 1px solid rgba(37, 99, 235, 0.32);
          box-shadow: 0 6px 18px rgba(11, 31, 77, 0.18);
        }
        .pill-w { color: #ffffff; }
        .pill-c { color: #5CE1E6; }
        .pill-light {
          color: ${C.accent};
          background: #EFF6FF;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .pill-onnavy {
          color: #BFDBFE;
          background: rgba(59, 130, 246, 0.14);
          border: 1px solid rgba(147, 197, 253, 0.26);
        }

        .h2 {
          margin: 0;
          font-size: clamp(1.75rem, 3.6vw, 2.5rem);
          font-weight: 800;
          line-height: 1.16;
          letter-spacing: -0.025em;
          color: ${C.primary};
        }
        .h2-invert { color: #ffffff; }

        .lede {
          max-width: 36rem;
          margin: 1.05rem auto 0;
          font-size: 1.075rem;
          line-height: 1.72;
          color: ${C.muted};
        }
        .lede-sm { font-size: 1rem; }
        .lede-invert { color: rgba(199, 215, 245, 0.75); }

        /* ---- Value section ---- */
        .sec-value { background: ${C.bg}; }
        .vgrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.35rem;
        }

        /* ---- Steps section ---- */
        .sec-steps { background: ${C.card}; overflow: hidden; }
        .dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle at 1px 1px, rgba(11, 31, 77, 0.06) 1px, transparent 0);
          background-size: 38px 38px;
        }
        .dots-fade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 78% 62% at 50% 50%, transparent 45%, ${C.card} 100%);
        }

        .tl { position: relative; margin-top: 3.5rem; }
        .tl-rail {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            transparent,
            rgba(11, 31, 77, 0.14) 14%,
            rgba(11, 31, 77, 0.14) 86%,
            transparent
          );
        }
        .tl-fill {
          position: absolute;
          left: 50%;
          top: 0;
          width: 3px;
          height: 0%;
          transform: translateX(-50%);
          border-radius: 3px;
          background: linear-gradient(180deg, ${C.accent}, ${C.accentHover});
          box-shadow: 0 0 16px rgba(37, 99, 235, 0.45);
          transition: height 0.08s linear;
        }

        .tl-list { display: block; }
        .tl-row {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .tl-row.is-right { flex-direction: row-reverse; }
        .tl-side { flex: 1; min-width: 0; }
        .tl-row.is-left .tl-side { text-align: right; padding-right: 2rem; }
        .tl-row.is-right .tl-side { text-align: left; padding-left: 2rem; }
        .tl-spacer { flex: 1; }

        .scard {
          position: relative;
          overflow: hidden;
          padding: 1.5rem 1.65rem;
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 16px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04), 0 6px 18px rgba(11, 31, 77, 0.04);
          transition:
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 300ms ease;
        }
        .scard:hover {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.26);
          box-shadow: 0 18px 44px rgba(11, 31, 77, 0.11);
        }
        .scard-edge {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, ${C.accent}, ${C.accentHover});
          opacity: 0;
          transition: opacity 300ms ease;
        }
        .tl-row.is-left .scard-edge { right: 0; }
        .tl-row.is-right .scard-edge { left: 0; }
        .scard:hover .scard-edge { opacity: 1; }

        .scard-mob { display: none; margin-bottom: 0.85rem; }
        .scard-title {
          margin: 0 0 0.4rem;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: ${C.primary};
        }
        .scard-desc {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.68;
          color: ${C.muted};
        }

        .tl-node { position: relative; z-index: 1; flex-shrink: 0; }
        .node {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3.25rem;
          height: 3.25rem;
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
          border-radius: 50%;
          background: linear-gradient(140deg, ${C.secondary} 0%, ${C.accent} 100%);
          box-shadow:
            0 0 0 6px ${C.card},
            0 10px 26px rgba(37, 99, 235, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .node-sm {
          width: 2.25rem;
          height: 2.25rem;
          font-size: 0.8125rem;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.26);
        }
        .node-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(37, 99, 235, 0.3);
          animation: ping 3.4s ease-out infinite;
        }

        /* ---- CTA ---- */
        .sec-cta {
          overflow: hidden;
          text-align: center;
          padding: 6.5rem 1rem;
          background: linear-gradient(160deg, ${C.header} 0%, ${C.primary} 42%, ${C.secondary} 74%, ${C.header} 100%);
        }
        .cta-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 55% 58% at 50% 45%, rgba(37, 99, 235, 0.2) 0%, transparent 68%);
        }
        .cta-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(147, 197, 253, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 197, 253, 0.045) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 76%);
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 76%);
        }
        .cta-vig {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 58%, rgba(7, 26, 82, 0.6) 100%);
        }
        .hp :global(.cta-inner) { position: relative; z-index: 1; }

        .hp :global(.cbtn) {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 2.5rem;
          min-height: 3.5rem;
          padding: 0 2.35rem;
          overflow: hidden;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.008em;
          color: #ffffff;
          text-decoration: none;
          border-radius: 14px;
          background: linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%);
          box-shadow:
            0 12px 34px rgba(37, 99, 235, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition:
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hp :global(.cbtn:hover) {
          transform: translateY(-3px);
          box-shadow:
            0 20px 52px rgba(37, 99, 235, 0.52),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .hp :global(.cbtn:focus-visible) {
          outline: 2px solid #93C5FD;
          outline-offset: 3px;
        }
        .hp :global(.cbtn-face) {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
        }
        .hp :global(.cbtn-arrow) {
          display: inline-block;
          transition: transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hp :global(.cbtn:hover .cbtn-arrow) { transform: translateX(6px); }
        .hp :global(.cbtn-sheen) {
          position: absolute;
          top: 0;
          left: -60%;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
          transform: skewX(-18deg);
          transition: left 640ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hp :global(.cbtn:hover .cbtn-sheen) { left: 118%; }

        @keyframes ping {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .vgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
          .sec { padding: 4.75rem 1rem; }
          .sec-cta { padding: 5rem 1rem; }
          .hp :global(.head) { margin-bottom: 2.5rem; }
          .vgrid { grid-template-columns: minmax(0, 1fr); gap: 1.1rem; }

          .tl { margin-top: 2.25rem; }
          .tl-rail, .tl-fill, .tl-node, .tl-spacer { display: none; }
          .tl-row {
            display: block;
            margin-bottom: 1.1rem;
          }
          .tl-row.is-left .tl-side,
          .tl-row.is-right .tl-side {
            text-align: left;
            padding: 0;
          }
          .scard-mob { display: block; }
          .tl-row.is-left .scard-edge,
          .tl-row.is-right .scard-edge { left: 0; right: auto; opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .scard, .hp :global(.cbtn), .hp :global(.cbtn-arrow), .hp :global(.cbtn-sheen) {
            transition: none;
          }
          .scard:hover { transform: none; }
          .node-ring { animation: none; }
          .tl-fill { transition: none; }
        }
      `}</style>
    </div>
  );
}
