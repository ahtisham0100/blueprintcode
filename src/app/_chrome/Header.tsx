'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { chromeFor, NAV } from './pages';

/* Global site header. Plain <a> links are intentional: navigation between the
   homepage design world and the content-page design world does a full document
   load, which cleanly swaps stylesheets and avoids cross-route CSS bleed. */
export default function Header() {
  const pathname = usePathname();
  const meta = chromeFor(pathname);
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      document.body.classList.toggle('nav-open', next);
      return next;
    });
  };

  return (
    <header className="head">
      <div className="sheet">
        <a className="mark" href="/">
          <b>BLUEPRINT CODE</b>
          <span>{meta.label}</span>
        </a>
        <button
          className="burger"
          type="button"
          aria-expanded={open}
          aria-label="Menu"
          onClick={toggle}
        >
          Menu
        </button>
        <nav>
          {NAV.map((item) => (
            <a
              key={item.key}
              href={item.href}
              {...(meta.current === item.key ? { 'aria-current': 'page' } : {})}
            >
              {item.label}
            </a>
          ))}
          <a className="button" href="#contact">
            Start a project
          </a>
        </nav>
      </div>
    </header>
  );
}
