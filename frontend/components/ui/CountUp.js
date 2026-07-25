import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up (or down) to `value` whenever it changes.
 * Pure requestAnimationFrame — no dependency. Drop-in replacement for a
 * plain `{value}` render anywhere a KPI/stat number is shown.
 *
 * <CountUp value={12500} prefix="₹" />
 * <CountUp value={87} suffix="%" />
 */
export default function CountUp({ value = 0, duration = 900, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const to = Number(value) || 0;
    // First mount: count up from 0 for the "reveal" feel. Later updates
    // animate from whatever was last on screen, so a live refresh doesn't
    // re-play the whole count from zero.
    const from = mountedRef.current ? fromRef.current : 0;
    mountedRef.current = true;

    if (from === to) { setDisplay(to); return; }

    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // ease-out cubic

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('en-IN');

  return <>{prefix}{formatted}{suffix}</>;
}