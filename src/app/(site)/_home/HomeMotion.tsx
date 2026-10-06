'use client';

import { useEffect } from 'react';

/* Scroll-reveal for the homepage. Renders nothing: it marks <main> as
   script-enabled (so the .reveal rest state only applies when something will
   lift it) and adds .is-in to each .reveal element as it enters the viewport.
   Without JS, or with reduced motion, every element is simply visible. */
export default function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.bpc-home');
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce || !('IntersectionObserver' in window) || items.length === 0) return;

    // Anything already on screen when the script runs is shown at once, in the
    // same style pass that enables the rest state, so nothing visible dips
    // and fades back in. Only elements below the fold get the reveal.
    const viewportBottom = window.innerHeight;
    const pending: HTMLElement[] = [];
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.top < viewportBottom && r.bottom > 0) el.classList.add('is-in');
      else pending.push(el);
    }
    root.classList.add('has-motion');
    if (pending.length === 0) return () => root.classList.remove('has-motion');

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
    pending.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove('has-motion');
    };
  }, []);

  return null;
}
