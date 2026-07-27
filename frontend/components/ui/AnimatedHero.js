import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* Deep dark blue brand system. Cyan appears only in the wordmark. */
const C = {
  header: '#071A52',
  primary: '#0B1F4D',
  secondary: '#12356D',
  accent: '#2563EB',
  accentHover: '#3B82F6',
};

/* ------------------------------------------------------------------
   Constellation canvas - hexagon clusters, recoloured from turquoise
   to the blue brand range. Same motion model, calmer and more
   enterprise: slower drift, thinner strokes, depth via alpha.
------------------------------------------------------------------ */
function ConstellationCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.innerWidth < 768;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    function makeCluster(anchorX, anchorY, baseSize, vx, vy, depth) {
      const offsets = [
        { dx: 0, dy: 0 },
        { dx: -baseSize * 1.55, dy: -baseSize * 0.9 },
        { dx: baseSize * 1.55, dy: -baseSize * 0.9 },
        { dx: 0, dy: baseSize * 1.75 },
      ];
      const sizes = [baseSize, baseSize * 0.85, baseSize * 0.75, baseSize * 0.7];
      return {
        x: anchorX, y: anchorY, vx, vy, depth,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0011,
        offsets, sizes,
      };
    }

    const clusters = isMobile
      ? [
          makeCluster(W * 0.26, H * 0.2, 36, 0.05, 0.04, 1),
          makeCluster(W * 0.7, H * 0.68, 28, -0.045, -0.032, 0.6),
        ]
      : [
          makeCluster(W * 0.18, H * 0.24, 50, 0.05, 0.045, 1),
          makeCluster(W * 0.74, H * 0.62, 40, -0.055, -0.038, 0.72),
          makeCluster(W * 0.8, H * 0.18, 26, -0.032, 0.05, 0.5),
        ];

    function drawHex(x, y, r, rotation) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation + Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);

      clusters.forEach(cl => {
        if (!reduce) {
          cl.x += cl.vx;
          cl.y += cl.vy;
          cl.phase += 0.005;
          cl.rotation += cl.rotSpeed;
        }

        if (cl.x < -220) cl.x = W + 220;
        if (cl.x > W + 220) cl.x = -220;
        if (cl.y < -220) cl.y = H + 220;
        if (cl.y > H + 220) cl.y = -220;

        const pulse = Math.sin(cl.phase) * 0.04 + 0.96;
        const d = cl.depth;

        const positions = cl.offsets.map((o, i) => ({
          x: cl.x + o.dx,
          y: cl.y + o.dy,
          r: cl.sizes[i] * pulse,
        }));

        // Spokes from the anchor node
        for (let i = 1; i < positions.length; i++) {
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[i].x, positions[i].y);
          ctx.strokeStyle = 'rgba(191,219,254,' + (0.2 * d).toFixed(3) + ')';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
        // Web between satellites
        for (let i = 1; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = 'rgba(147,197,253,' + (0.09 * d).toFixed(3) + ')';
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }

        positions.forEach((pos, i) => {
          drawHex(pos.x, pos.y, pos.r, cl.rotation + i * 0.07);
          ctx.strokeStyle = i === 0
            ? 'rgba(96,165,250,' + (0.62 * d).toFixed(3) + ')'
            : 'rgba(147,197,253,' + (0.4 * d).toFixed(3) + ')';
          ctx.lineWidth = i === 0 ? 1.4 : 1;
          ctx.stroke();

          // Soft node at each vertex centre for a jewelled feel
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(219,234,254,' + (0.5 * d).toFixed(3) + ')';
          ctx.fill();
        });
      });

      if (!reduce) rafRef.current = requestAnimationFrame(paint);
    }

    paint();

    const handleResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      if (reduce) paint();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}

/* Staged entrance: blur + lift, honouring reduced motion. */
function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <Tag className={className + (visible ? ' is-in' : '') + ' reveal'}>
      {children}
    </Tag>
  );
}

export default function AnimatedHero() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef(null);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 50, y: 50 });

  useEffect(() => { setMounted(true); }, []);

  // Pointer-reactive lighting. rAF-throttled, writes CSS vars only.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const apply = () => {
      rafRef.current = null;
      el.style.setProperty('--hx', targetRef.current.x + '%');
      el.style.setProperty('--hy', targetRef.current.y + '%');
    };
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      targetRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
    };
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero">
      {/* Depth stack -------------------------------------------------- */}
      <div className="hero-grid" aria-hidden="true" />
      {mounted && <ConstellationCanvas />}
      <div className="hero-spot" aria-hidden="true" />
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />
      <div className="hero-beam" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      {/* Content ------------------------------------------------------ */}
      <div className="hero-inner">
        <Reveal delay={280} className="hero-title-wrap">
          <h1 className="hero-title">
            <span className="hl-1">Run Your Educational</span>
            <br />
            <span className="hl-2">or Training Institute</span>
            <br />
            <span className="hl-3">with Clarity</span>
          </h1>
        </Reveal>

        <Reveal delay={460} className="hero-copy-wrap">
          <p className="hero-copy">
            Manage students, attendance, fees, and enquiries in one structured system —
            designed to reduce scattered records and manual tracking.
            <br />
            <span className="hero-copy-sub">
              A simple way to keep your daily operations organized and easier to manage.
            </span>
          </p>
        </Reveal>

        <Reveal delay={620}>
          <div className="hero-cta">
            <Link href="/get-started" className="hbtn hbtn-primary">
              <span className="hbtn-sheen" aria-hidden="true" />
              <span className="hbtn-face">
                Get Started
                <span className="hbtn-arrow">→</span>
              </span>
            </Link>

            <Link href="/features" className="hbtn hbtn-ghost">
              <span className="hbtn-face">
                See Features
                <span className="hbtn-arrow">→</span>
              </span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={1100}>
          <div className="hero-scroll" aria-hidden="true">
            <span className="hero-scroll-line" />
            <span className="hero-scroll-dot" />
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        .hero {
          --hx: 50%;
          --hy: 40%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          min-height: 94vh;
          color: #ffffff;
          background:
            linear-gradient(165deg, ${C.header} 0%, ${C.primary} 38%, ${C.secondary} 68%, ${C.primary} 100%);
        }

        /* Engineering grid, fades out toward the edges */
        .hero-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(147, 197, 253, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 197, 253, 0.055) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 35%, transparent 78%);
          -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 35%, transparent 78%);
        }

        .hero :global(.hero-canvas) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.9;
        }

        /* Pointer-follow light */
        .hero-spot {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            circle 34rem at var(--hx) var(--hy),
            rgba(37, 99, 235, 0.18) 0%,
            rgba(37, 99, 235, 0.07) 38%,
            transparent 68%
          );
          transition: background 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform;
        }
        .hero-orb-1 {
          width: 620px;
          height: 620px;
          top: -16%;
          left: -12%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, transparent 66%);
          animation: orb1 16s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 470px;
          height: 470px;
          right: -9%;
          bottom: -10%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.13) 0%, transparent 66%);
          animation: orb2 19s ease-in-out infinite;
        }
        .hero-orb-3 {
          width: 300px;
          height: 300px;
          top: 28%;
          right: 14%;
          background: radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
          animation: orb3 13s ease-in-out infinite;
        }

        /* Slow sweeping light bar for a sense of depth */
        .hero-beam {
          position: absolute;
          top: -40%;
          left: -30%;
          width: 45%;
          height: 180%;
          pointer-events: none;
          transform: rotate(14deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(147, 197, 253, 0.05),
            transparent
          );
          animation: beam 14s ease-in-out infinite;
        }

        .hero-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse 100% 100% at 50% 50%,
            transparent 52%,
            rgba(7, 26, 82, 0.72) 100%
          );
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 62rem;
          margin: 0 auto;
          padding: 6.5rem 1.5rem;
          text-align: center;
        }

        /* Entrance */
        .hero :global(.reveal) {
          opacity: 0;
          transform: translateY(26px) scale(0.985);
          filter: blur(7px);
          transition:
            opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
            transform 1s cubic-bezier(0.16, 1, 0.3, 1),
            filter 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero :global(.reveal.is-in) {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .hero-title-wrap { margin-bottom: 1.6rem; }

        .hero-title {
          margin: 0;
          font-size: clamp(2.4rem, 6.4vw, 4.6rem);
          font-weight: 800;
          line-height: 1.06;
          letter-spacing: -0.032em;
        }
        .hl-1 { color: #ffffff; }
        .hl-2 { color: #C7D7F5; }
        .hl-3 {
          display: inline-block;
          position: relative;
          background: linear-gradient(96deg, #60A5FA 0%, #93C5FD 42%, #FFFFFF 72%, #60A5FA 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 6s linear infinite;
        }
        /* Underline flourish that draws itself in */
        .hl-3::after {
          content: '';
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: -0.14em;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, ${C.accentHover}, transparent);
          transform: scaleX(0);
          transform-origin: center;
          animation: draw 1.1s cubic-bezier(0.16, 1, 0.3, 1) 1.15s forwards;
        }

        .hero-copy-wrap { margin-bottom: 2.9rem; }
        .hero-copy {
          max-width: 44rem;
          margin: 0 auto;
          font-size: clamp(1rem, 1.6vw, 1.175rem);
          font-weight: 500;
          line-height: 1.72;
          color: rgba(214, 227, 255, 0.92);
        }
        .hero-copy-sub {
          display: inline-block;
          margin-top: 0.55rem;
          font-size: 0.95em;
          color: rgba(190, 209, 247, 0.72);
        }

        /* CTAs - side by side on desktop, stacked on small screens */
        .hero-cta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .hero :global(.hbtn) {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 13.5rem;
          min-height: 3.4rem;
          padding: 0 1.9rem;
          overflow: hidden;
          font-size: 0.975rem;
          font-weight: 700;
          letter-spacing: 0.008em;
          text-decoration: none;
          border-radius: 14px;
          transition:
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1),
            background 260ms ease,
            border-color 260ms ease;
        }
        .hero :global(.hbtn-face) {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }
        .hero :global(.hbtn-arrow) {
          display: inline-block;
          transition: transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero :global(.hbtn:hover .hbtn-arrow) { transform: translateX(5px); }

        .hero :global(.hbtn-primary) {
          color: #ffffff;
          background: linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%);
          box-shadow:
            0 10px 30px rgba(37, 99, 235, 0.36),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .hero :global(.hbtn-primary:hover) {
          transform: translateY(-3px);
          box-shadow:
            0 18px 46px rgba(37, 99, 235, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        /* Sheen wipes across on hover */
        .hero :global(.hbtn-sheen) {
          position: absolute;
          top: 0;
          left: -60%;
          width: 45%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.28),
            transparent
          );
          transform: skewX(-18deg);
          transition: left 620ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero :global(.hbtn-primary:hover .hbtn-sheen) { left: 115%; }

        .hero :global(.hbtn-ghost) {
          color: #E3ECFF;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(147, 197, 253, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .hero :global(.hbtn-ghost:hover) {
          transform: translateY(-3px);
          color: #ffffff;
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(147, 197, 253, 0.55);
          box-shadow: 0 14px 34px rgba(7, 26, 82, 0.45);
        }
        .hero :global(.hbtn:focus-visible) {
          outline: 2px solid #93C5FD;
          outline-offset: 3px;
        }

        .hero-scroll {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-top: 3.6rem;
          animation: bob 2.6s ease-in-out infinite;
        }
        .hero-scroll-line {
          width: 1px;
          height: 34px;
          background: linear-gradient(180deg, rgba(147, 197, 253, 0.75), transparent);
        }
        .hero-scroll-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${C.accentHover};
        }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(34px, -22px) scale(1.06); }
          70% { transform: translate(-16px, 16px) scale(0.96); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          35% { transform: translate(-28px, -20px) scale(1.05); }
          70% { transform: translate(22px, 24px) scale(0.97); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -14px) scale(1.08); }
        }
        @keyframes beam {
          0%, 100% { transform: translateX(0) rotate(14deg); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: translateX(260%) rotate(14deg); }
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 220% center; }
        }
        @keyframes draw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); opacity: 0.38; }
          50% { transform: translateY(7px); opacity: 0.62; }
        }

        @media (max-width: 620px) {
          .hero { min-height: 88vh; }
          .hero-inner { padding: 5rem 1.25rem; }
          .hero-cta { flex-direction: column; }
          .hero :global(.hbtn) { width: 100%; max-width: 20rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero :global(.reveal) {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }
          .hero-orb,
          .hero-beam,
          .hero-scroll,
          .hl-3,
          .hl-3::after {
            animation: none;
          }
          .hl-3::after { transform: scaleX(1); }
          .hero-spot { transition: none; }
        }
      `}</style>
    </section>
  );
}
