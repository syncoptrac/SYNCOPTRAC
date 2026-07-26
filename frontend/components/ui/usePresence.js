import { useEffect, useRef, useState } from 'react';

/**
 * usePresence — dependency-free equivalent of Framer Motion's <AnimatePresence>.
 *
 * Keeps a node mounted for `exitMs` after `active` flips to false, so the
 * element can play an exit animation instead of disappearing instantly
 * (which is what causes the "flash" / "pop" feel in most login screens).
 *
 * Returns `mounted` — render the node while this is true, and drive the
 * exit visual state from `active` itself.
 *
 *   const mounted = usePresence(busy, 260);
 *   {mounted && <Panel exiting={!busy} />}
 */
export default function usePresence(active, exitMs = 260) {
  const [mounted, setMounted] = useState(Boolean(active));
  const timerRef = useRef(null);

  useEffect(() => {
    if (active) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setMounted(true);
      return;
    }

    if (mounted && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setMounted(false);
      }, exitMs);
    }
  }, [active, exitMs, mounted]);

  // Never leave a timer behind on unmount (avoids setState-after-unmount warnings).
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return mounted;
}
