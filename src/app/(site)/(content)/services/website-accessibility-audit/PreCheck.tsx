'use client';

import { useRef, useState } from 'react';

/* Free WCAG 2.2 AA pre-check request. The automated scanner isn't connected
   yet, so for now this files the request as a lead through /api/contact (same
   store + Resend notification as the contact form) and the findings go out by
   email. When the scanner API exists, run it here first and keep the email step
   for the full results.

   Note: /api/contact treats a field named "website" as its bot honeypot, so the
   site address travels as project_link — never as "website". */
export default function PreCheck() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const site = String(data.get('site_url') || '').trim();

    const fd = new FormData();
    fd.set('email', String(data.get('email') || '').trim());
    fd.set('project_link', site);
    fd.set('groups', 'Audit & Improve — Accessibility');
    fd.set('description', `Free WCAG 2.2 AA pre-check requested for ${site}`);
    fd.set('website', String(data.get('hp_field') || ''));
    fd.set('enquiry_ref', `BPC-A11Y-${Date.now().toString(36).toUpperCase()}`);
    fd.set('submitted_at', new Date().toISOString());

    setState('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      setState(res.ok ? 'sent' : 'error');
      if (res.ok) form.reset();
    } catch {
      setState('error');
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  return (
    <form className="scanner" onSubmit={onSubmit}>
      <span className="lbl">BLUEPRINT CODE / ACCESSIBILITY SCANNER</span>
      <h3>WCAG 2.2 AA pre-check</h3>

      <label className="field-label" htmlFor="site_url">Website address</label>
      <input id="site_url" name="site_url" type="url" inputMode="url" autoComplete="url" placeholder="https://example.com" required />

      <label className="field-label" htmlFor="pc_email">Email for the results</label>
      <input id="pc_email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />

      <div className="hp" aria-hidden="true">
        <label htmlFor="hp_field">Leave this empty</label>
        <input id="hp_field" name="hp_field" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="button solid" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request free pre-check →'}
      </button>

      <p className="scan-note">Automated pre-check · WCAG 2.2 A &amp; AA · results by email. We&rsquo;ll email you the results and may contact you about that review. No mailing list. See our <a href="/tool-terms">tool terms</a> and <a href="/privacy">Privacy Policy</a>.</p>

      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={state === 'error' ? 'scan-status err' : state === 'sent' ? 'scan-status' : undefined}
      >
        {state === 'sent' && 'Request received. We’ll run the pre-check and email the findings to you.'}
        {state === 'error' && (
          <>
            That didn&rsquo;t go through. Email <a href="mailto:hello@blueprintcode.ai">hello@blueprintcode.ai</a> with your site address and we&rsquo;ll run it for you.
          </>
        )}
      </p>
    </form>
  );
}
