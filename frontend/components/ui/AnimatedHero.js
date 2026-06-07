import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function CinematicCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 768;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    function makeCluster(anchorX, anchorY, baseSize, vx, vy) {
      const offsets = [
        { dx: 0,           dy: 0           },
        { dx: -baseSize * 1.55, dy: -baseSize * 0.9 },
        { dx:  baseSize * 1.55, dy: -baseSize * 0.9 },
        { dx:  0,           dy:  baseSize * 1.75 },
      ];
      const sizes = [baseSize, baseSize * 0.85, baseSize * 0.75, baseSize * 0.7];
      return {
        x: anchorX, y: anchorY, vx, vy,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0015,
        offsets, sizes,
      };
    }

    const clusters = isMobile ? [
      makeCluster(W * 0.28, H * 0.2, 38, 0.08, 0.06),
      makeCluster(W * 0.68, H * 0.65, 30, -0.07, -0.05),
    ] : [
      makeCluster(W * 0.22, H * 0.22, 52, 0.08, 0.07),
      makeCluster(W * 0.72, H * 0.62, 42, -0.09, -0.06),
      makeCluster(W * 0.78, H * 0.18, 28, -0.05, 0.08),
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

    function draw() {
      timeRef.current += 0.008;
      ctx.clearRect(0, 0, W, H);

      clusters.forEach(cl => {
        cl.x += cl.vx;
        cl.y += cl.vy;
        cl.phase += 0.006;
        cl.rotation += cl.rotSpeed;

        if (cl.x < -200) cl.x = W + 200;
        if (cl.x > W + 200) cl.x = -200;
        if (cl.y < -200) cl.y = H + 200;
        if (cl.y > H + 200) cl.y = -200;

        const pulse = Math.sin(cl.phase) * 0.05 + 0.95;

        const positions = cl.offsets.map((o, i) => ({
          x: cl.x + o.dx,
          y: cl.y + o.dy,
          r: cl.sizes[i] * pulse,
        }));

        // Connection lines — white/light
        for (let i = 1; i < positions.length; i++) {
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[i].x, positions[i].y);
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        for (let i = 1; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Draw hexagons — all turquoise
        positions.forEach((pos, i) => {
          drawHex(pos.x, pos.y, pos.r, cl.rotation + i * 0.08);
          ctx.strokeStyle = 'rgba(92,225,230,0.75)';
          ctx.lineWidth = i === 0 ? 1.6 : 1.2;
          ctx.stroke();
        });
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.85 }}
    />
  );
}

function CinematicText({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <Tag
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.98)',
        filter: visible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) 0ms,
                     transform 1s cubic-bezier(0.16,1,0.3,1) 0ms,
                     filter 0.9s cubic-bezier(0.16,1,0.3,1) 0ms`,
      }}
    >
      {children}
    </Tag>
  );
}

export default function AnimatedHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: 'linear-gradient(160deg, #0a1844 0%, #11245d 35%, #172d74 65%, #0d1e55 100%)',
        minHeight: '94vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {mounted && <CinematicCanvas />}

      {/* Atmospheric gradient layers */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 75% 55% at 50% 45%, rgba(92,225,230,0.07) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 40% 40% at 20% 70%, rgba(212,175,55,0.04) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 30% 30% at 80% 20%, rgba(92,225,230,0.05) 0%, transparent 60%)',
      }} />

      {/* Floating orbs */}
      <div className="absolute pointer-events-none" style={{
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(92,225,230,0.055) 0%, transparent 65%)',
        top: '-15%', left: '-12%',
        animation: 'cinOrb1 12s ease-in-out infinite',
        willChange: 'transform',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 450, height: 450, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.045) 0%, transparent 65%)',
        bottom: '-8%', right: '-8%',
        animation: 'cinOrb2 15s ease-in-out infinite',
        willChange: 'transform',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(92,225,230,0.04) 0%, transparent 70%)',
        top: '30%', right: '15%',
        animation: 'cinOrb3 9s ease-in-out infinite',
        willChange: 'transform',
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(10,24,68,0.7) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center w-full">

        <CinematicText delay={280} className="mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
            <span style={{ color: '#f0f6ff' }}>Run Your Educational</span>
            <br />
            <span style={{ color: '#dde8ff' }}>or Training Institute</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(92deg, #d4af37 0%, #f0c040 40%, #ffe07a 70%, #d4af37 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'goldShimmer 4s linear infinite',
                display: 'inline-block',
              }}
            >
              with Clarity
            </span>
          </h1>
        </CinematicText>

        <CinematicText delay={460} className="mb-12">
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(200,215,255,0.9)', fontWeight: 600 }}
          >
            Manage students, attendance, fees, and enquiries in one structured system —
            designed to reduce scattered records and manual tracking.
            <br />
            <span style={{ color: 'rgba(200,215,255,0.75)', fontSize: '0.95em', fontWeight: 600 }}>
              A simple way to keep your daily operations organized and easier to manage.
            </span>
          </p>
        </CinematicText>

        <CinematicText delay={620}>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/get-started"
              className="group relative inline-flex items-center justify-center gap-2.5 font-bold px-10 py-4 rounded-xl text-base overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
                backgroundSize: '200% auto',
                color: '#11245d',
                boxShadow: '0 0 32px rgba(212,175,55,0.32), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '0.01em',
                animation: 'btnGlow 3s ease-in-out infinite',
                textDecoration: 'none',
                width: '260px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 60px rgba(212,175,55,0.55), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.backgroundPosition = '100% center';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 32px rgba(212,175,55,0.32), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.backgroundPosition = '0% center';
              }}
            >
              Get Started
              <span style={{ transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }} className="group-hover:translate-x-1.5">→</span>
            </Link>

            <Link
              href="/features"
              className="group inline-flex items-center justify-center gap-2.5 font-bold px-10 py-4 rounded-xl text-base"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
                backgroundSize: '200% auto',
                color: '#11245d',
                boxShadow: '0 0 20px rgba(212,175,55,0.18), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '0.01em',
                textDecoration: 'none',
                width: '260px',
                opacity: 0.88,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 48px rgba(212,175,55,0.45), 0 8px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.18), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.opacity = '0.88';
              }}
            >
              See Features
              <span style={{ transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }} className="group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </CinematicText>

        <CinematicText delay={1100}>
          <div className="mt-16 flex justify-center">
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: 0.35, animation: 'scrollBob 2.5s ease-in-out infinite',
            }}>
              <div style={{ width: 1, height: 32, background: 'linear-gradient(180deg, rgba(92,225,230,0.8), transparent)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#5ce1e6' }} />
            </div>
          </div>
        </CinematicText>
      </div>

      <style jsx global>{`
        @keyframes cinOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(30px, -20px) scale(1.06); }
          70%       { transform: translate(-15px, 15px) scale(0.96); }
        }
        @keyframes cinOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          35%       { transform: translate(-25px, -18px) scale(1.04); }
          70%       { transform: translate(20px, 22px) scale(0.97); }
        }
        @keyframes cinOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(18px, -12px) scale(1.08); }
        }
        @keyframes goldShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 0 32px rgba(212,175,55,0.32), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25); }
          50%       { box-shadow: 0 0 48px rgba(212,175,55,0.46), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25); }
        }
        @keyframes scrollBob {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50%       { transform: translateY(6px); opacity: 0.55; }
        }
        @keyframes heroPing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}