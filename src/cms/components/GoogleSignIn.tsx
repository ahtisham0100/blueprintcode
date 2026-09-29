'use client';

/* Rendered on Payload's login view (admin.components.beforeLogin). The
   email/password form is hidden because the users collection disables the
   local strategy, so the Google link is the only way in. Beside it sits a
   short welcome: a "Studio online" tag with the local time, a greeting for
   the time of day and a rotating headline. Nothing here reads CMS data,
   since the visitor isn't signed in yet. Styled via .bpc-login in
   (cms)/custom.css; every animation stops under prefers-reduced-motion. */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CMS_BRAND } from '../branding';

const SIGN_IN_HREF = '/api/cms/oauth/google';

const HEADLINES = ['draft a post.', 'ship a demo.', 'tidy media.', 'fix a link.', 'make magic.'];

function greetingFor(hour: number): string {
  if (hour < 5) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Working late';
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Types each headline out, holds it, deletes it, moves on. */
function useTypewriter(words: string[]): string {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let word = 0;
    let len = words[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (deleting) {
        len -= 1;
        if (len <= 0) {
          deleting = false;
          word = (word + 1) % words.length;
        }
      } else {
        len += 1;
      }
      setText(words[word].slice(0, Math.max(len, 0)));
      let delay = deleting ? 35 : 75;
      if (!deleting && len >= words[word].length) {
        deleting = true;
        delay = 2200;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 2400);
    return () => clearTimeout(timer);
  }, [words]);
  return text;
}

export function GoogleSignIn() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState('Welcome back');
  const [clock, setClock] = useState('');
  const [going, setGoing] = useState(false);
  const headline = useTypewriter(HEADLINES);

  // Time-dependent copy is set after mount so server and client HTML match.
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setGreeting(greetingFor(now.getHours()));
      setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  // Spotlight follows the pointer across the blueprint grid.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const move = (e: PointerEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  // "G" shortcut to sign in.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      setGoing(true);
      window.location.href = SIGN_IN_HREF;
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div className="bpc-login" ref={rootRef}>
      <div className="bpc-login__bg" aria-hidden="true">
        <div className="bpc-login__grid" />
        <div className="bpc-login__spot" />
        <span className="bpc-login__float bpc-login__float--a">+</span>
        <span className="bpc-login__float bpc-login__float--b">◯</span>
        <span className="bpc-login__float bpc-login__float--c">△</span>
        <span className="bpc-login__float bpc-login__float--d">⌗</span>
      </div>

      <section className="bpc-login__hero">
        <p className="bpc-login__eyebrow bpc-login__in" style={{ '--d': 0 } as CSSProperties}>
          <span className="bpc-login__pulse" /> Studio online{clock ? ` · ${clock}` : ''}
        </p>
        <h1 className="bpc-login__title bpc-login__in" style={{ '--d': 1 } as CSSProperties}>
          <span className="bpc-login__greet">{greeting},</span>
          <span className="bpc-login__type">
            let&rsquo;s {headline}
            <i className="bpc-login__caret" aria-hidden="true" />
          </span>
        </h1>
      </section>

      <aside className="bpc-login__card bpc-login__in" style={{ '--d': 2 } as CSSProperties}>
        <svg className="bpc-login__draft" viewBox="0 0 220 120" aria-hidden="true">
          <rect x="10" y="10" width="200" height="100" />
          <path d="M10 40h200M70 40v70" />
          <circle cx="140" cy="75" r="22" />
          <path d="M118 75h44M140 53v44" />
          <path d="M20 55h38M20 67h30M20 79h40M20 91h24" />
        </svg>
        <p className="bpc-login__brand">
          <b>{CMS_BRAND.name}</b>
          <span>{CMS_BRAND.label}</span>
        </p>
        <h2 className="bpc-login__card-title">Sign in to the studio</h2>
        <a
          href={SIGN_IN_HREF}
          className={`btn btn--style-primary btn--size-large bpc-login__go${going ? ' is-going' : ''}`}
          onClick={() => setGoing(true)}
        >
          <svg className="bpc-login__g" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>{going ? 'Opening Google…' : 'Sign in with Google'}</span>
          <span className="bpc-login__arrow" aria-hidden="true">→</span>
        </a>
        <p className="bpc-login__hint">
          Use your company Google Workspace account. Access is limited to people an admin has added.
          <span className="bpc-login__kbd">
            or press <kbd>G</kbd>
          </span>
        </p>
      </aside>
    </div>
  );
}
