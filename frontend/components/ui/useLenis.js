import { useEffect } from 'react';

// ── Lenis smooth scroll — lightweight, no CDN needed ─────────────────────────
// We implement a minimal native-JS smooth scroll enhancer using requestAnimationFrame
// that works without installing the full Lenis package, keeping bundle small.
// If you install 'lenis' via npm, replace this with the official hook.

let lenisInstance = null;

export function useLenis() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lenisInstance) return; // Only one instance

    // Only on desktop — mobile has native smooth scroll
    if (window.innerWidth < 768) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let rafId = null;
    const LERP = 0.085; // smoothness: lower = smoother

    const onWheel = (e) => {
      e.preventDefault();
      targetY += e.deltaY;
      targetY = Math.max(0, Math.min(targetY, document.body.scrollHeight - window.innerHeight));
    };

    const tick = () => {
      const dist = targetY - currentY;
      if (Math.abs(dist) > 0.5) {
        currentY += dist * LERP;
        window.scrollTo(0, currentY);
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    rafId = requestAnimationFrame(tick);
    lenisInstance = true;

    return () => {
      window.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(rafId);
      lenisInstance = null;
    };
  }, []);
}