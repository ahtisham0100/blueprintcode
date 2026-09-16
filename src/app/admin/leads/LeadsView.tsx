'use client';

import { useState } from 'react';

interface Lead {
  id: number;
  ref: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  projectLink: string;
  groups: string[];
  also: string[];
  buildOther: string;
  stage: string;
  outcome: string;
  budget: string;
  timeframe: string;
  browserTimezone: string;
  fileName: string | null;
  fileSize: number | null;
  emailStatus: string;
}

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; leads: Lead[] }
  | { kind: 'err'; msg: string };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtSize(b: number | null): string {
  if (!b) return '';
  return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="lead-row">
      <span className="lead-k">{label}</span>
      <span className="lead-v">{value}</span>
    </div>
  );
}

export default function LeadsView() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    if (!password) return setState({ kind: 'err', msg: 'Enter the admin password.' });
    setState({ kind: 'busy' });
    try {
      const res = await fetch('/api/leads', { headers: { 'x-admin-password': password } });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setState({ kind: 'ok', leads: j.leads ?? [] });
      else setState({ kind: 'err', msg: j.error || `Failed (${res.status}).` });
    } catch (err) {
      setState({ kind: 'err', msg: String(err) });
    }
  }

  const leads = state.kind === 'ok' ? state.leads : null;

  return (
    <main id="main" className="adm">
      <div className="adm-card lead-card">
        <p className="adm-eyebrow">BLUEPRINT CODE — ADMIN</p>
        <h1>Leads</h1>
        <p className="adm-lead">Contact-form enquiries, newest first. Enter the admin password to load them.</p>

        <form onSubmit={load} className="adm-form lead-auth">
          <label className="adm-field">
            <span>Admin password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="adm-btn" disabled={state.kind === 'busy'}>
            {state.kind === 'busy' ? 'Loading…' : leads ? 'Refresh' : 'Load leads'}
          </button>
        </form>

        {state.kind === 'err' && <p className="adm-msg adm-err">{state.msg}</p>}
      </div>

      {leads && (
        <div className="lead-list">
          <p className="lead-count">
            {leads.length === 0 ? 'No leads yet.' : `${leads.length} lead${leads.length === 1 ? '' : 's'}`}
          </p>
          {leads.map((l) => {
            const build = [...l.groups, ...l.also].filter(Boolean);
            if (l.buildOther) build.push(`Something else: ${l.buildOther}`);
            return (
              <article key={l.id} className="lead">
                <header className="lead-head">
                  <span className="lead-ref">{l.ref}</span>
                  <span className="lead-when">{fmtDate(l.createdAt)}</span>
                </header>
                <h2 className="lead-name">
                  {l.company || l.name || 'Enquiry'}
                  {l.company && l.name ? <span className="lead-sub"> · {l.name}</span> : null}
                </h2>
                <div className="lead-body">
                  <Row label="Email" value={l.email} />
                  <Row label="Phone" value={l.phone} />
                  <Row label="Location" value={l.location} />
                  <Row label="Building" value={build.join(', ')} />
                  <Row label="Stage" value={l.stage} />
                  <Row label="Outcome" value={l.outcome} />
                  <Row label="Budget" value={l.budget} />
                  <Row label="Timeframe" value={l.timeframe} />
                  <Row label="Link" value={l.projectLink} />
                  <Row label="Time zone" value={l.browserTimezone} />
                  <Row label="File" value={l.fileName ? `${l.fileName} (${fmtSize(l.fileSize)})` : ''} />
                  <Row label="Notify" value={l.emailStatus} />
                </div>
                {l.description && <p className="lead-desc">{l.description}</p>}
                <div className="lead-actions">
                  {l.email && (
                    <a className="lead-link" href={`mailto:${l.email}?subject=${encodeURIComponent('Re: enquiry ' + l.ref)}`}>
                      Reply
                    </a>
                  )}
                  {l.projectLink && (
                    <a className="lead-link" href={l.projectLink} target="_blank" rel="noopener noreferrer">
                      Open link
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
