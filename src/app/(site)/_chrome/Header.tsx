'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { chromeFor, NAV, type NavItem } from './pages';

/* Global site header. Plain <a> links are intentional: navigation between the
   homepage design world and the content-page design world does a full document
   load, which cleanly swaps stylesheets and avoids cross-route CSS bleed.

   An item with children (Tools) renders as a hover/focus dropdown on desktop —
   pure CSS, see .nav-group in chrome.css — and as an indented group inside the
   burger menu on mobile. The item itself stays a working link, so the group is
   reachable without hovering. */
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

  const isCurrent = (key: NavItem['key']) => meta.current === key;

  return (
    <header className="head">
      <div className="sheet">
        <a className="mark" href="/">
          <b>BLUEPRINT CODE AI</b>
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
          {NAV.map((item) =>
            item.children ? (
              <div
                key={item.key}
                className={`nav-group${item.children.some((c) => isCurrent(c.key)) ? ' is-current' : ''}`}
              >
                <a
                  href={item.href}
                  className="nav-group-link"
                  {...(isCurrent(item.key) ? { 'aria-current': 'page' } : {})}
                >
                  {item.label}
                  <span className="nav-caret" aria-hidden="true" />
                </a>
                <div className="nav-menu">
                  <div className="nav-menu-panel">
                    {item.children.map((child) => (
                      <a
                        key={child.key}
                        href={child.href}
                        {...(isCurrent(child.key) ? { 'aria-current': 'page' } : {})}
                      >
                        <b>{child.label}</b>
                        {child.note && <small>{child.note}</small>}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={item.key}
                href={item.href}
                {...(isCurrent(item.key) ? { 'aria-current': 'page' } : {})}
              >
                {item.label}
              </a>
            ),
          )}
          <a className="button" href="/contact">
            Start a project
          </a>
        </nav>
      </div>
    </header>
  );
}
