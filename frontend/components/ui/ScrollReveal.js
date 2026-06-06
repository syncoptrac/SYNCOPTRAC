import { useEffect, useRef, useState } from 'react';

// ── Hook: fires when element enters viewport ──────────────────────────────────
export function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.IntersectionObserver) { setInView(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ── FadeUp — blur-to-clear cinematic reveal ───────────────────────────────────
export function FadeUp({ children, delay = 0, className = '', threshold = 0.12, distance = 28 }) {
  const [ref, inView] = useInView(threshold);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : `translateY(${distance}px) scale(0.99)`,
        filter: inView ? 'blur(0px)' : 'blur(4px)',
        transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     filter 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </div>
  );
}

// ── FadeIn — pure opacity ────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity',
      }}
    >
      {children}
    </div>
  );
}

// ── StaggerChildren ──────────────────────────────────────────────────────────
export function StaggerChildren({ children, baseDelay = 0, stagger = 90, className = '' }) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <FadeUp key={i} delay={baseDelay + i * stagger}>{child}</FadeUp>
          ))
        : <FadeUp delay={baseDelay}>{children}</FadeUp>
      }
    </div>
  );
}

// ── SlideIn — horizontal entry ───────────────────────────────────────────────
export function SlideIn({ children, delay = 0, className = '', from = 'left' }) {
  const [ref, inView] = useInView(0.1);
  const dir = from === 'left' ? '-24px' : '24px';
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : `translateX(${dir})`,
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}