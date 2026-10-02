'use client';

import { useEffect, useRef, useState } from 'react';

/* Cookie consent for the one optional technology on the site: Microsoft
   Clarity (analytics + session recording). Clarity is not loaded at all until
   the visitor allows it — UK/EU rules need consent before a non-essential
   cookie is set, and Microsoft requires a consent signal for UK, EEA and Swiss
   visitors. The choice lives in a first-party cookie for six months, then the
   banner asks again.

   Withdrawing is as easy as giving: the footer "Cookie settings" button (and
   the one on /cookies) reopens the banner via openCookieSettings(). A
   withdrawal tells Clarity to erase its cookies, then reloads so the script is
   gone from the page.

   If the cookie register changes (a new optional tool), bump CONSENT_VERSION so
   everyone is asked again, and update /cookies. */

const CONSENT_COOKIE = 'bpc-consent';
const CONSENT_VERSION = '1';
const CONSENT_MAX_AGE = 182 * 24 * 60 * 60;
const CLARITY_ID = 'ylt8ejgq97';
const OPEN_EVENT = 'bpc:cookie-settings';

type Choice = 'granted' | 'denied';

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function readChoice(): Choice | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (!m) return null;
  const [version, choice] = decodeURIComponent(m[1]).split('.');
  if (version !== CONSENT_VERSION) return null;
  return choice === 'granted' || choice === 'denied' ? choice : null;
}

function writeChoice(choice: Choice) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${CONSENT_VERSION}.${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

function loadClarity() {
  if (document.getElementById('ms-clarity')) return;
  // Microsoft's standard loader: queue calls on a stub until the tag arrives.
  const c = window as Window;
  c.clarity = c.clarity || Object.assign((...args: unknown[]) => { (c.clarity!.q = c.clarity!.q || []).push(args); }, {});
  const s = document.createElement('script');
  s.id = 'ms-clarity';
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
  c.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
}

/** Belt and braces after a withdrawal: Clarity's own erase call, plus expiring
 *  its first-party cookies on this host and the parent domain directly. */
function eraseClarity() {
  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
  window.clarity?.('consent', false);
  const parent = location.hostname.split('.').slice(-2).join('.');
  for (const name of ['_clck', '_clsk']) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.${parent}`;
  }
}

export default function Consent() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const choice = readChoice();
    if (choice === 'granted') loadClarity();
    if (choice === null) setOpen(true);

    const onOpen = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      requestAnimationFrame(() => panelRef.current?.focus());
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const choose = (choice: Choice) => {
    const wasLoaded = Boolean(document.getElementById('ms-clarity'));
    writeChoice(choice);
    setOpen(false);
    returnFocus.current?.focus();
    returnFocus.current = null;
    if (choice === 'granted') {
      loadClarity();
    } else if (wasLoaded) {
      eraseClarity();
      location.reload();
    }
  };

  if (!open) return null;

  return (
    <div className="consent" role="region" aria-labelledby="consent-h" tabIndex={-1} ref={panelRef}>
      <div className="consent-inner">
        <div className="consent-copy">
          <h2 id="consent-h" className="consent-key">COOKIES &amp; ANALYTICS</h2>
          <p>
            We&rsquo;d like to use Microsoft Clarity to see how people use this site, so we can improve it. It records
            clicks, scrolling and page visits, and sets cookies. It stays off unless you allow it, and you can change
            your mind at any time. <a href="/cookies">Cookie policy</a>
          </p>
        </div>
        <div className="consent-actions">
          <button type="button" className="consent-btn" onClick={() => choose('granted')}>Allow analytics</button>
          <button type="button" className="consent-btn" onClick={() => choose('denied')}>Reject analytics</button>
        </div>
      </div>
    </div>
  );
}

/** "Cookie settings" — reopens the consent banner. For the footer and /cookies. */
export function CookieSettingsButton({ className, children = 'Cookie settings' }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}
