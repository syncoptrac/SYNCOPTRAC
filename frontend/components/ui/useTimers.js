import { useEffect, useRef } from 'react';

/**
 * useTimers — safe setTimeout scheduling inside a component.
 *
 * Every timer created through the returned `after()` helper is tracked and
 * cleared automatically on unmount, so an in-flight login animation can never
 * fire a router.push() or setState() after the page has gone away.
 */
export default function useTimers() {
  const timersRef = useRef([]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const after = (ms, fn) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  };

  /** Promise-based delay that is also cleaned up on unmount. */
  const wait = (ms) => new Promise((resolve) => after(ms, resolve));

  return { after, wait };
}
