'use client';

import { useEffect, useRef, useState } from 'react';

/* Project-enquiry form. React port of the standalone contact.html (Rev M):
   a two-step wizard with inline validation, an error summary, a honeypot,
   optional file upload and a "transmittal" confirmation. The inputs are
   uncontrolled and read through the form ref (as the original did); React
   state drives only the wizard step, the per-field error text, and the
   confirmation view. */

/* ---------- Config: set before go-live ---------- */
const CONFIG = {
  endpoint: '/api/contact', // stores the lead (Neon) + emails admin (Resend). Empty = demo mode, nothing is sent.
  email: 'hello@blueprintcode.ai', // confirm this mailbox exists
  callUrl: '', // booking link (Cal.com / Calendly). Empty = falls back to an email request.
  caseStudyUrl: '/ppav-case-study',
  // Kept under Vercel's ~4.5 MB serverless request-body limit; larger files are
  // declined client-side with a prompt to email them instead (see validation).
  maxFileMB: 4,
};

type GroupType = 'radio' | 'checkbox';
const GROUPS: Record<string, { type: GroupType; options: string[] }> = {
  also: { type: 'checkbox', options: [
    'Ecommerce website or rebuild', 'Prototype or proof of concept', 'Something else',
  ] },
  stage: { type: 'radio', options: [
    'Exploring an idea', 'Have a written brief', 'Have designs or Figma files',
    'Have an existing system', 'Need an existing project improved',
  ] },
  outcome: { type: 'radio', options: [
    'More completed purchases', 'Fewer customer enquiries', 'Easier product configuration',
    'Better quotations', 'Stronger customer experience', 'Internal efficiency', 'Testing a new concept',
  ] },
  budget: { type: 'radio', options: [
    'Under £1,500', '£1,500–£3,000', '£3,000–£7,500', '£7,500–£15,000', '£15,000+', 'I need guidance',
  ] },
  timeframe: { type: 'radio', options: [
    'As soon as practical', 'Within one month', 'One to three months', 'Three months or more', 'Still exploring',
  ] },
};

/* Five tool groups: same names and order as the group sheets */
const HATCH = '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="var(--line)" stroke-width=".6"/></pattern></defs>';
const TOOL_GROUPS = [
  { id: 'g1', n: '01', name: 'Configure & Visualise', line: 'Let customers build, personalise and see the product before they buy.',
    art: HATCH + '<g fill="none" stroke="var(--line)"><path d="M130 250L260 300L390 250L260 200Z"/><path d="M130 250L130 150L260 100L390 150L390 250"/><path d="M260 200L260 100" stroke-dasharray="4 5"/></g><path d="M130 150L260 200L390 150L260 100Z" fill="url(#hatch)" stroke="var(--ink-3)"/><path d="M130 250L260 300L390 250" fill="none" stroke="var(--ink)" stroke-width="2"/><g transform="translate(130,340)" fill="none" stroke="var(--line)" stroke-width="1.5"><rect width="44" height="30" stroke="var(--ink)" stroke-width="2"/><rect x="58" width="44" height="30"/><rect x="116" width="44" height="30" fill="url(#hatch)"/><rect x="174" width="44" height="30"/><rect x="232" width="44" height="30"/></g>' },
  { id: 'g2', n: '02', name: 'Select & Recommend', line: 'Guide customers to the right product without the technical detail.',
    art: '<path d="M40 60L480 60L370 190L370 340L190 300L190 190Z" fill="none" stroke="var(--line)" stroke-width="1.5"/><g stroke="var(--line)"><path d="M40 60L190 190"/><path d="M480 60L370 190"/></g><g transform="translate(196,210)" fill="none" stroke-width="2"><rect width="168" height="30" stroke="var(--ink)"/><rect y="40" width="168" height="30" stroke="var(--line)"/></g><g stroke="var(--ink-3)" stroke-width="2"><path d="M100 90L420 90"/><path d="M160 130L360 130"/></g>' },
  { id: 'g3', n: '03', name: 'Plan & Calculate', line: 'Turn measurements and requirements into plans and useful results.',
    art: '<g fill="none" stroke="var(--line)" stroke-width="1.5"><rect x="90" y="60" width="300" height="210"/><path d="M90 220L390 220" stroke-dasharray="5 6"/><circle cx="240" cy="112" r="18"/></g><g stroke="var(--ink-3)" stroke-width="1.5"><path d="M90 296L390 296"/><path d="M90 288L90 304"/><path d="M390 288L390 304"/><path d="M60 60L60 270"/><path d="M52 60L68 60"/><path d="M52 270L68 270"/></g><rect x="90" y="326" width="300" height="40" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M110 346L200 346M230 346L370 346" stroke="var(--ink-3)" stroke-width="2"/>' },
  { id: 'g4', n: '04', name: 'Quote & Convert', line: 'Turn selections into live prices, quotes, checkout or enquiries.',
    art: '<g fill="none" stroke="var(--line)" stroke-width="1.5"><rect x="130" y="30" width="260" height="340"/><path d="M130 86L390 86"/><path d="M130 300L390 300"/></g><g stroke="var(--line)" stroke-width="1.5"><path d="M150 130L370 130"/><path d="M150 170L370 170"/><path d="M150 210L370 210"/><path d="M150 250L370 250"/></g><g stroke="var(--ink-3)" stroke-width="2"><path d="M150 60L260 60"/><path d="M150 118L300 118M340 118L360 118"/><path d="M150 158L280 158M340 158L360 158"/><path d="M150 198L250 198M340 198L360 198"/></g><path d="M150 336L210 336M290 336L370 336" stroke="var(--ink)" stroke-width="3"/><rect x="130" y="30" width="6" height="340" fill="var(--ink)"/>' },
  { id: 'g5', n: '05', name: 'Connect & Automate', line: 'Link your tools to the systems and teams that run the business.',
    art: '<g fill="none" stroke="var(--line)" stroke-width="1.5"><rect x="40" y="62" width="110" height="36"/><rect x="40" y="130" width="110" height="36"/><rect x="40" y="198" width="110" height="36"/><rect x="40" y="266" width="110" height="36"/><rect x="370" y="62" width="110" height="36"/><rect x="370" y="130" width="110" height="36"/><rect x="370" y="198" width="110" height="36"/><rect x="370" y="266" width="110" height="36"/><path d="M150 80L210 150M150 148L210 170M150 216L210 200M150 284L210 222M310 150L370 80M310 170L370 148M310 200L370 216M310 222L370 284"/></g><rect x="210" y="120" width="100" height="120" fill="none" stroke="var(--ink)" stroke-width="2.5"/><g stroke="var(--ink-3)" stroke-dasharray="4 5" stroke-width="1.5"><path d="M260 120L260 70"/><path d="M260 240L260 330"/></g>' },
  { id: 'g0', n: '??', name: 'Not sure yet', line: 'Describe the problem below and we’ll recommend the right kind of tool.',
    art: '<rect x="110" y="50" width="300" height="300" fill="none" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="6 7"/><path d="M110 200L410 200M260 50L260 350" stroke="var(--line)" stroke-dasharray="3 6"/><circle cx="260" cy="200" r="70" fill="none" stroke="var(--ink-3)" stroke-width="1.5"/><path d="M232 176a28 28 0 1 1 40 25c-8 4-12 9-12 17v6" fill="none" stroke="var(--ink)" stroke-width="5"/><rect x="255" y="238" width="10" height="10" fill="var(--ink)"/>' },
];

// SVG presentation attributes can't read CSS variables, so move them into style.
const varAttrs = (svg: string) =>
  svg.replace(/\b(stroke|fill)="var\((--[\w-]+)\)"/g, 'style="$1:var($2)"');

const LABELS: Record<string, string> = {
  build: 'What would you like to build?', stage: 'Where are you currently?',
  description: 'Tell us briefly about the project', project_link: 'Existing website or reference link',
  outcome: 'What outcome matters most?', budget: 'Indicative budget', timeframe: 'Preferred timeframe',
  name: 'Name', company: 'Company', email: 'Work email', phone: 'Telephone number',
  location: 'Country / time zone', brief_file: 'Supporting file',
};

const STEP_FIELDS: Record<1 | 2, string[]> = {
  1: ['build', 'stage', 'description', 'project_link'],
  2: ['outcome', 'budget', 'timeframe', 'name', 'company', 'email', 'phone', 'location', 'brief_file'],
};

function normaliseUrl(v: string): string | null {
  try {
    const u = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(v) ? v : 'https://' + v);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

function makeRef(): string {
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `BPC-${ymd}-${rand}`;
}

interface DoneState {
  ref: string;
  rows: [string, string, boolean?][];
  callHref: string;
  callExternal: boolean;
}

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const tzRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryShown, setSummaryShown] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [showBuildOther, setShowBuildOther] = useState(false);
  const [descLen, setDescLen] = useState(0);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<{ email: string; ref: string } | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);

  const stepNames: Record<1 | 2, string> = { 1: 'Your project', 2: 'Practical details' };

  /* ---------- Value helpers (read the uncontrolled form) ---------- */
  const val = (name: string): string => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
    if (!el) return '';
    const v = 'value' in el ? (el.value as string) : '';
    return (v || '').trim();
  };
  const checked = (name: string): string[] =>
    Array.from(formRef.current?.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`) ?? []).map((i) => i.value);
  const fileEl = () => formRef.current?.querySelector<HTMLInputElement>('#brief_file') ?? null;

  /* ---------- Validation rules ---------- */
  const RULES: Record<1 | 2, Record<string, () => string>> = {
    1: {
      build: () => (checked('groups').length || checked('also').length ? '' : 'Choose at least one area, or “Not sure yet”.'),
      stage: () => (checked('stage').length ? '' : 'Choose where you are currently.'),
      description: () => (val('description') ? '' : 'Add a sentence or two about the project.'),
      project_link: () => (!val('project_link') || normaliseUrl(val('project_link')) ? '' : 'Enter a web address, such as yourshop.co.uk, or leave this blank.'),
    },
    2: {
      outcome: () => (checked('outcome').length ? '' : 'Choose the outcome that matters most.'),
      budget: () => (checked('budget').length ? '' : 'Choose a budget range, or “I need guidance”.'),
      timeframe: () => (checked('timeframe').length ? '' : 'Choose a timeframe, or “Still exploring”.'),
      name: () => (val('name') ? '' : 'Enter your name.'),
      company: () => (val('company') ? '' : 'Enter your company name. A working name is fine.'),
      email: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email')) ? '' : 'Enter an email address we can reply to, such as name@company.com.'),
      phone: () => {
        const v = val('phone');
        if (!v) return '';
        return /^[\d\s+().-]+$/.test(v) && v.replace(/\D/g, '').length >= 7 ? '' : 'Enter a telephone number using digits, or leave this blank.';
      },
      location: () => (val('location') ? '' : 'Enter your country or time zone so we reply at a sensible hour.'),
      brief_file: () => {
        const f = fileEl()?.files?.[0];
        return !f || f.size <= CONFIG.maxFileMB * 1048576 ? '' : `This file is larger than ${CONFIG.maxFileMB} MB. Attach a smaller version, or email it to ${CONFIG.email}.`;
      },
    },
  };

  const stepOf = (name: string): 1 | 2 => (RULES[1][name] ? 1 : 2);

  /* Validate a whole step: set error text, reveal the summary, return first bad field. */
  function validate(s: 1 | 2): string | null {
    const next: Record<string, string> = {};
    const bad: string[] = [];
    for (const [name, rule] of Object.entries(RULES[s])) {
      const msg = rule();
      next[name] = msg;
      if (msg) bad.push(name);
    }
    setErrors((prev) => ({ ...prev, ...next }));
    setSummaryShown((prev) => ({ ...prev, [s]: true }));
    return bad[0] || null;
  }

  /* Re-check a single field that is currently invalid (live clearing). */
  function revalidateField(name: string) {
    const s = stepOf(name);
    setErrors((prev) => (prev[name] ? { ...prev, [name]: RULES[s][name]() } : prev));
  }

  function focusField(name: string) {
    const f = formRef.current?.querySelector<HTMLElement>(`[data-field="${name}"]`);
    if (!f) return;
    const target = f.querySelector<HTMLElement>('input:not([type=hidden]), textarea');
    f.scrollIntoView({ block: 'center' });
    target?.focus({ preventScroll: true });
  }

  function goStep(n: 1 | 2) {
    setStep(n);
    const sheet = document.querySelector('.sheet');
    if (sheet) {
      const top = sheet.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) sheet.scrollIntoView({ block: 'start' });
    }
    // Focus the heading of the panel we moved to, after it renders.
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-panel="${n}"] .step-title`)?.focus({ preventScroll: true });
    });
  }

  function continueToStep2() {
    const bad = validate(1);
    if (bad) { focusField(bad); return; }
    goStep(2);
  }

  /* ---------- Effects ---------- */
  useEffect(() => {
    try {
      if (tzRef.current) tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch { /* ignore */ }
  }, []);

  /* ---------- Field-level handlers ---------- */
  const onFormInput = (e: React.FormEvent<HTMLFormElement>) => {
    const t = e.target as HTMLElement;
    if (t.id === 'description') setDescLen((t as HTMLTextAreaElement).value.length);
    const field = t.closest<HTMLElement>('[data-field]');
    if (field?.dataset.field) revalidateField(field.dataset.field);
  };

  const onFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const t = e.target as HTMLInputElement;
    const field = t.closest<HTMLElement>('[data-field]');
    if (field?.dataset.field) revalidateField(field.dataset.field);
    if (t.name === 'also' && t.value === 'Something else') {
      setShowBuildOther(t.checked);
    }
  };

  const onFileChange = () => {
    const f = fileEl()?.files?.[0];
    setFileInfo(f ? { name: f.name, size: f.size } : null);
    revalidateField('brief_file');
    setErrors((prev) => ({ ...prev, brief_file: RULES[2].brief_file() }));
  };
  const clearFile = () => {
    const el = fileEl();
    if (el) el.value = '';
    setFileInfo(null);
    setErrors((prev) => ({ ...prev, brief_file: '' }));
    formRef.current?.querySelector<HTMLElement>('label[for="brief_file"]')?.focus();
  };

  /* ---------- Submit ---------- */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) return continueToStep2();
    setSendError(null);

    const bad1 = validate(1);
    if (bad1) { goStep(1); return focusField(bad1); }
    const bad2 = validate(2);
    if (bad2) return focusField(bad2);

    const form = formRef.current!;
    const ref = makeRef();
    const summary = {
      build: checked('groups').concat(
        checked('also').map((v) => (v === 'Something else' && val('build_other') ? `Something else: ${val('build_other')}` : v)),
      ),
      stage: checked('stage')[0],
      outcome: checked('outcome')[0],
      budget: checked('budget')[0],
      timeframe: checked('timeframe')[0],
    };

    // Bot filled the honeypot: show success, send nothing.
    if (val('website')) return showDone(ref, summary);

    const fd = new FormData(form);
    fd.delete('website');
    if (val('project_link')) fd.set('project_link', normaliseUrl(val('project_link'))!);
    if (!fileEl()?.files?.[0]) fd.delete('brief_file');
    if (!checked('also').includes('Something else')) fd.delete('build_other');
    fd.set('enquiry_ref', ref);
    fd.set('submitted_at', new Date().toISOString());
    fd.set('_subject', `Project enquiry ${ref}: ${val('company')}`);
    fd.set('_replyto', val('email'));

    setSending(true);

    try {
      if (!CONFIG.endpoint) {
        await new Promise((r) => setTimeout(r, 700));
        const preview: Record<string, unknown> = {};
        fd.forEach((v, k) => {
          preview[k] = v instanceof File ? `${v.name} (${v.size} bytes)` : (preview[k] ? ([] as unknown[]).concat(preview[k], v) : v);
        });
        console.info('[BPC enquiry] Demo mode: nothing sent. Payload:', preview);
      } else {
        const res = await fetch(CONFIG.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      }
      showDone(ref, summary);
    } catch (err) {
      console.error('[BPC enquiry]', err);
      setSendError({ email: CONFIG.email, ref });
      setSending(false);
    }
  }

  function showDone(ref: string, s: { build: string[]; stage?: string; outcome?: string; budget?: string; timeframe?: string }) {
    const received = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const rows: [string, string, boolean?][] = [
      ['Reference', ref, true],
      ['Received', received, true],
      ['Building', s.build.join(', ')],
      ['Current stage', s.stage || ''],
      ['Main outcome', s.outcome || ''],
      ['Budget', s.budget || ''],
      ['Timeframe', s.timeframe || ''],
    ];
    const callHref = CONFIG.callUrl
      ? CONFIG.callUrl
      : `mailto:${CONFIG.email}?subject=${encodeURIComponent('Introductory call: ' + ref)}&body=${encodeURIComponent('Please suggest a time for a short introductory call about enquiry ' + ref + '.')}`;

    setDone({ ref, rows, callHref, callExternal: Boolean(CONFIG.callUrl) });
    setSending(false);
    requestAnimationFrame(() => {
      const sheet = document.querySelector('.sheet');
      if (sheet && sheet.getBoundingClientRect().top < 0) sheet.scrollIntoView({ block: 'start' });
      document.querySelector<HTMLElement>('.done h2')?.focus({ preventScroll: true });
    });
  }

  /* ---------- Render helpers ---------- */
  const badFor = (s: 1 | 2) => STEP_FIELDS[s].filter((k) => errors[k]);

  const renderOpts = (key: string, describedby: string, compact = false) => {
    const g = GROUPS[key];
    return (
      <div className={`opts${compact ? ' compact' : ''}`} data-options={key} role={g.type === 'radio' ? 'radiogroup' : 'group'} aria-describedby={describedby}>
        {g.options.map((label) => (
          <label className="opt" key={label}>
            <input type={g.type} name={key} value={label} />
            <span className="opt-box"><span className="opt-mark" aria-hidden="true" /><span>{label}</span></span>
          </label>
        ))}
      </div>
    );
  };

  const Summary = ({ s }: { s: 1 | 2 }) => {
    const bad = badFor(s);
    if (!summaryShown[s] || !bad.length) return null;
    const n = bad.length;
    return (
      <div className="summary" role="alert">
        <p>{n === 1 ? 'One answer needs' : n + ' answers need'} attention before you continue:</p>
        <ul>
          {bad.map((k) => (
            <li key={k}>
              <a href="#" onClick={(e) => { e.preventDefault(); focusField(k); }}>{LABELS[k]}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const fieldClass = (name: string, base = 'field') => `${base}${errors[name] ? ' is-invalid' : ''}`;
  const fmtSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

  return (
    <main className="enquiry" id="main">
      {/* Left: reassurance */}
      <section className="intro" aria-labelledby="page-title">
        <h1 id="page-title">Let’s turn your concept into something people can use.</h1>
        <p className="lede">Tell us what you’re building, where you are in the process and what success looks like. We’ll review it personally and recommend the most sensible next step.</p>
        <ul className="assure">
          {['No-pressure initial conversation', 'NDA available where required', 'Normally replies within one working day'].map((t) => (
            <li key={t}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <rect x=".75" y=".75" width="16.5" height="16.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.8 9.3l2.7 2.7 5.7-5.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Right: enquiry sheet */}
      <section className="sheet" aria-label="Project enquiry">
        <span className="crop tl" aria-hidden="true" /><span className="crop tr" aria-hidden="true" />
        <span className="crop bl" aria-hidden="true" /><span className="crop br" aria-hidden="true" />

        {!done && (
          <ol className="steps" id="steps">
            <li data-step="1" data-state={step === 1 ? 'current' : 'done'}><span className="n">01</span><span>Your project <span className="tick" aria-hidden="true">✓</span></span></li>
            <li data-step="2" data-state={step === 2 ? 'current' : 'todo'}><span className="n">02</span><span>Practical details <span className="tick" aria-hidden="true">✓</span></span></li>
          </ol>
        )}
        <p className="vh" id="step-status" aria-live="polite">
          {done ? `Enquiry sent. Reference ${done.ref}` : `Step ${step} of 2: ${stepNames[step]}`}
        </p>

        <form id="enquiry-form" ref={formRef} noValidate hidden={!!done} onSubmit={onSubmit} onInput={onFormInput} onChange={onFormChange}>
          {/* Honeypot: left empty by people, filled by bots */}
          <div className="vh" aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="browser_timezone" id="browser_timezone" ref={tzRef} />

          {/* STEP 1 */}
          <div className="step" data-panel="1" hidden={step !== 1}>
            <h2 className="step-title" tabIndex={-1}>Your project</h2>
            <p className="step-intro">Plain language is fine. You don’t need to know the technical answer yet — that’s our job.</p>

            <fieldset className={fieldClass('build')} data-field="build">
              <legend>What would you like to build?</legend>
              <span className="hint" id="build-hint">Choose the areas that fit. Not sure? Pick the closest and we’ll refine it together.</span>
              <div className="tiles" id="tiles" role="group" aria-describedby="build-hint err-build">
                {TOOL_GROUPS.map((g) => (
                  <label className="tile" key={g.id}>
                    <input type="checkbox" name="groups" value={g.name} />
                    <span className="tile-box">
                      <span className="tile-art" aria-hidden="true">
                        <svg viewBox="0 0 520 400" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: varAttrs(g.art) }} />
                      </span>
                      <span className="tile-body">
                        <span className="tile-name">{g.id !== 'g0' && <span className="n">{g.n}</span>}{g.name}</span>
                        <span className="tile-line">{g.line}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="also">
                <span className="sub-label" id="also-label">Also, or instead</span>
                <div className="chips" data-options="also" aria-labelledby="also-label">
                  {GROUPS.also.options.map((label) => (
                    <label className="opt" key={label}>
                      <input type="checkbox" name="also" value={label} />
                      <span className="opt-box"><span className="opt-mark" aria-hidden="true" /><span>{label}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="other" id="build-other-wrap" hidden={!showBuildOther}>
                <label className="vh" htmlFor="build_other">Describe what else you’d like to build</label>
                <input className="input" type="text" id="build_other" name="build_other" maxLength={160} placeholder="What else? A few words is enough" />
              </div>
              <p className="err" id="err-build">{errors.build}</p>
            </fieldset>

            <fieldset className={fieldClass('stage')} data-field="stage">
              <legend>Where are you currently?</legend>
              <span className="hint" id="stage-hint">Choose one</span>
              {renderOpts('stage', 'stage-hint err-stage')}
              <p className="err" id="err-stage">{errors.stage}</p>
            </fieldset>

            <div className={fieldClass('description')} data-field="description">
              <label className="label" htmlFor="description">Tell us briefly about the project</label>
              <textarea className="input" id="description" name="description" maxLength={6000} aria-describedby="err-description description-count"
                aria-invalid={errors.description ? true : undefined}
                placeholder="What do you sell, what choices must the customer make, and what currently makes the process difficult?" />
              <div className="counter" id="description-count" aria-hidden="true">{descLen.toLocaleString('en-GB')} / 6,000</div>
              <p className="err" id="err-description">{errors.description}</p>
            </div>

            <div className={fieldClass('project_link')} data-field="project_link">
              <label className="label" htmlFor="project_link">Existing website or reference link <span className="optional">Optional</span></label>
              <input className="input" type="text" inputMode="url" autoComplete="url" id="project_link" name="project_link" placeholder="yourshop.co.uk"
                aria-describedby="err-project_link" aria-invalid={errors.project_link ? true : undefined} />
              <p className="err" id="err-project_link">{errors.project_link}</p>
            </div>

            <Summary s={1} />
            <div className="actions">
              <button type="button" className="btn btn-primary" id="to-step-2" onClick={continueToStep2}>Continue to practical details</button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="step" data-panel="2" hidden={step !== 2}>
            <h2 className="step-title" tabIndex={-1}>Practical details</h2>
            <p className="step-intro">Rough answers help us point you in the right direction. None of this commits you to anything.</p>

            <fieldset className={fieldClass('outcome')} data-field="outcome">
              <legend>What outcome matters most?</legend>
              <span className="hint" id="outcome-hint">Choose the one that matters most</span>
              {renderOpts('outcome', 'outcome-hint err-outcome')}
              <p className="err" id="err-outcome">{errors.outcome}</p>
            </fieldset>

            <fieldset className={fieldClass('budget')} data-field="budget">
              <legend>Indicative budget</legend>
              <span className="hint" id="budget-hint">GBP, excluding VAT. A range is all we need.</span>
              {renderOpts('budget', 'budget-hint err-budget', true)}
              <p className="err" id="err-budget">{errors.budget}</p>
            </fieldset>

            <fieldset className={fieldClass('timeframe')} data-field="timeframe">
              <legend>Preferred timeframe</legend>
              <span className="hint" id="timeframe-hint">Choose one</span>
              {renderOpts('timeframe', 'timeframe-hint err-timeframe', true)}
              <p className="err" id="err-timeframe">{errors.timeframe}</p>
            </fieldset>

            <fieldset>
              <legend>Your details</legend>
              <span className="hint">So we know who to reply to</span>

              <div className="row">
                <div className={fieldClass('name')} data-field="name">
                  <label className="label" htmlFor="name">Name</label>
                  <input className="input" type="text" id="name" name="name" autoComplete="name" aria-describedby="err-name" aria-invalid={errors.name ? true : undefined} />
                  <p className="err" id="err-name">{errors.name}</p>
                </div>
                <div className={fieldClass('company')} data-field="company">
                  <label className="label" htmlFor="company">Company</label>
                  <input className="input" type="text" id="company" name="company" autoComplete="organization" aria-describedby="err-company" aria-invalid={errors.company ? true : undefined} />
                  <p className="err" id="err-company">{errors.company}</p>
                </div>
              </div>

              <div className="row">
                <div className={fieldClass('email')} data-field="email">
                  <label className="label" htmlFor="email">Work email</label>
                  <input className="input" type="email" id="email" name="email" autoComplete="email" inputMode="email" aria-describedby="err-email" aria-invalid={errors.email ? true : undefined} />
                  <p className="err" id="err-email">{errors.email}</p>
                </div>
                <div className={fieldClass('phone')} data-field="phone">
                  <label className="label" htmlFor="phone">Telephone number <span className="optional">Optional</span></label>
                  <input className="input" type="tel" id="phone" name="phone" autoComplete="tel" aria-describedby="err-phone" aria-invalid={errors.phone ? true : undefined} />
                  <p className="err" id="err-phone">{errors.phone}</p>
                </div>
              </div>

              <div className={fieldClass('location')} data-field="location">
                <label className="label" htmlFor="location">Country / time zone</label>
                <input className="input" type="text" id="location" name="location" autoComplete="country-name" placeholder="United Kingdom, GMT" aria-describedby="err-location" aria-invalid={errors.location ? true : undefined} />
                <p className="err" id="err-location">{errors.location}</p>
              </div>
            </fieldset>

            <div className={fieldClass('brief_file')} data-field="brief_file">
              <span className="label" id="file-label">Upload a brief or supporting file <span className="optional">Optional</span></span>
              <span className="hint" id="file-hint">PDF, Word, PowerPoint, images or ZIP, up to 10 MB</span>
              <div className="file">
                <input type="file" id="brief_file" name="brief_file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.key,.pages,.txt,.rtf,.png,.jpg,.jpeg,.webp,.zip"
                  aria-labelledby="file-label" aria-describedby="file-hint file-status err-brief_file" onChange={onFileChange} />
                <label htmlFor="brief_file" className="btn btn-secondary">Choose file</label>
                <span className={`file-status${fileInfo ? ' has-file' : ''}`} id="file-status">
                  {fileInfo ? `${fileInfo.name} (${fmtSize(fileInfo.size)})` : 'No file chosen'}
                </span>
                <button type="button" className="btn btn-quiet file-clear" id="file-clear" hidden={!fileInfo} onClick={clearFile}>Remove</button>
              </div>
              <p className="err" id="err-brief_file">{errors.brief_file}</p>
            </div>

            <Summary s={2} />
            <div className="actions">
              <button type="submit" className="btn btn-primary" id="send" disabled={sending}>
                {sending ? 'Sending your brief…' : 'Send My Project Brief'}
              </button>
              <button type="button" className="btn btn-quiet" id="to-step-1" onClick={() => goStep(1)}>Back to your project</button>
            </div>
            <p className="privacy">Your enquiry goes directly to the BPC project team. We don’t use your details for unrelated marketing.</p>
            {sendError && (
              <p className="send-error" id="send-error" role="alert">
                Your brief didn’t send. Check your connection and select Send again, or email{' '}
                <a href={`mailto:${sendError.email}?subject=${encodeURIComponent('Project enquiry ' + sendError.ref)}`}>{sendError.email}</a> quoting {sendError.ref}.
              </p>
            )}
          </div>
        </form>

        {/* AFTER SUBMISSION */}
        {done && (
          <div className="done" id="done">
            <h2 tabIndex={-1}>Your project is with us.</h2>
            <p>We’ll review the requirements and respond with initial observations and the most appropriate next step — normally within one working day.</p>

            <table className="transmittal">
              <caption>Transmittal record — keep the reference if you contact us before we reply</caption>
              <tbody id="transmittal-body">
                {done.rows.map(([k, v, mono]) => (
                  <tr key={k}><th scope="row">{k}</th><td className={mono ? 'mono' : undefined}>{v}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="actions">
              <a className="btn btn-primary" id="case-study-link" href={CONFIG.caseStudyUrl}>View Our PP‑AV Case Study</a>
              <a className="btn btn-secondary" id="call-link" href={done.callHref} {...(done.callExternal ? { target: '_blank', rel: 'noopener' } : {})}>Book an Introductory Call</a>
            </div>
            <p className="next-note">The call is optional. If you’d rather wait for our written reply, there’s nothing more you need to do.</p>
          </div>
        )}
      </section>

      {/* Left, lower: direct contact */}
      <aside className="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Prefer email?</h2>
        <p>Write to us directly and we’ll pick it up the same way.</p>
        <a className="email" href={`mailto:${CONFIG.email}`}>{CONFIG.email}</a>
        <p>Blueprint Code AI Ltd</p>

        <table className="titleblock" aria-label="Drawing details">
          <tbody>
            <tr><th scope="row">Drawing</th><td>Project enquiry</td></tr>
            <tr><th scope="row">Ref</th><td>BPC-ENQ</td></tr>
            <tr><th scope="row">Stages</th><td>2</td></tr>
            <tr><th scope="row">Rev</th><td>M</td></tr>
          </tbody>
        </table>
      </aside>
    </main>
  );
}
