'use client';

import { useEffect, useState } from 'react';

/* "On this page" sidebar for long service pages. Server-rendered as plain
   anchor links (so it works with no JS and is readable by crawlers); on the
   client it highlights the section in view and collapses behind a toggle on
   narrow screens. Deliberately not a <nav> element: site.css styles bare
   `nav` as the global header menu, fixed-position on mobile. */
export default function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    let frame = 0;

    // Active = the last section whose heading has scrolled past a line 30% down
    // the viewport, i.e. the one being read, not the tail of the one before.
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s;
        else break;
      }
      if (current) setActive(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <aside className="toc" role="navigation" aria-labelledby="toc-title" data-open={open || undefined}>
      <button
        type="button"
        className="toc-toggle"
        aria-expanded={open}
        aria-controls="toc-list"
        onClick={() => setOpen((v) => !v)}
      >
        <span>On this page</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <p id="toc-title" className="lbl toc-title">ON THIS PAGE</p>
      <ol id="toc-list" className="toc-list">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="toc-no">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
