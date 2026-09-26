'use client';

import { useEffect } from 'react';

/* Ports the inline behaviour that ships with the static content pages:
   - live demos (.media[data-src]) load their iframe only when the .media-launch
     button is clicked, so several Three.js prototypes don't boot at once;
   - looping interface films are paused for reduced-motion users.
   Render this once on any page that contains .media frames. */
export default function MediaLauncher() {
  useEffect(() => {
    const onClick = (btn: Element) => () => {
      const frame = btn.closest('.media');
      const src = frame?.getAttribute('data-src');
      if (!frame || !src) return;
      const f = document.createElement('iframe');
      f.src = src;
      f.loading = 'lazy';
      f.title = frame.getAttribute('data-title') || 'Live prototype';
      f.setAttribute('allow', 'fullscreen');
      frame.appendChild(f);
      frame.setAttribute('data-live', '');
    };

    const cleanups: (() => void)[] = [];
    document.querySelectorAll('.media-launch').forEach((btn) => {
      const handler = onClick(btn);
      btn.addEventListener('click', handler);
      cleanups.push(() => btn.removeEventListener('click', handler));
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document
        .querySelectorAll<HTMLVideoElement>('.media--loop video')
        .forEach((v) => v.pause());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
