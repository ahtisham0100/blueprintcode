'use client';

import { useState } from 'react';

interface Demo {
  id: string;
  url: string;
  kind: 'page' | 'file';
  bytes: number;
  files: number;
}

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; demos: Demo[] }
  | { kind: 'err'; msg: string };

function fmtSize(b: number): string {
  if (!b) return '—';
  return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
}

export default function DemosView() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  /** id of the demo whose Delete button has been armed but not confirmed. */
  const [arming, setArming] = useState<string | null>(null);
  /** id of the demo currently being deleted. */
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    if (!password) return setState({ kind: 'err', msg: 'Enter the admin password.' });
    setState({ kind: 'busy' });
    setArming(null);
    try {
      const res = await fetch('/api/demos', { headers: { 'x-admin-password': password } });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setState({ kind: 'ok', demos: j.demos ?? [] });
      else setState({ kind: 'err', msg: j.error || `Failed (${res.status}).` });
    } catch (err) {
      setState({ kind: 'err', msg: String(err) });
    }
  }

  async function remove(demo: Demo) {
    setDeleting(demo.id);
    setNotice('');
    try {
      const res = await fetch('/api/demos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: demo.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setState((s) => (s.kind === 'ok' ? { kind: 'ok', demos: s.demos.filter((d) => d.id !== demo.id) } : s));
        setNotice(
          `Removed ${demo.url} (${j.files ?? demo.files} file${(j.files ?? demo.files) === 1 ? '' : 's'}). ` +
            'It stops serving in ~1–2 min once the deploy finishes.',
        );
      } else {
        setState({ kind: 'err', msg: j.error || `Delete failed (${res.status}).` });
      }
    } catch (err) {
      setState({ kind: 'err', msg: String(err) });
    } finally {
      setDeleting(null);
      setArming(null);
    }
  }

  const demos = state.kind === 'ok' ? state.demos : null;

  return (
    <main id="main" className="adm">
      <div className="adm-card dem-card">
        <p className="adm-eyebrow">BLUEPRINT CODE AI — ADMIN</p>
        <h1>Demos</h1>
        <p className="adm-lead">
          Every demo page currently published from the site repository. Deleting one
          commits the removal, so it stops serving at its URL on the next deploy.
          Enter the admin password to load them.
        </p>

        <form onSubmit={load} className="adm-form dem-auth">
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
            {state.kind === 'busy' ? 'Loading…' : demos ? 'Refresh' : 'Load demos'}
          </button>
        </form>

        {state.kind === 'err' && <p className="adm-msg adm-err">{state.msg}</p>}
        {notice && <p className="adm-msg adm-ok">{notice}</p>}
      </div>

      {demos && (
        <div className="dem-list">
          <p className="dem-count">
            {demos.length === 0 ? 'No demos published.' : `${demos.length} demo${demos.length === 1 ? '' : 's'}`}
          </p>
          {demos.map((d) => {
            const armed = arming === d.id;
            const busy = deleting === d.id;
            return (
              <article key={d.id} className={`dem${armed ? ' dem-armed' : ''}`}>
                <div className="dem-main">
                  <a className="dem-url" href={d.url} target="_blank" rel="noopener noreferrer">
                    {d.url}
                  </a>
                  <p className="dem-meta">
                    {d.kind === 'page' ? 'Folder' : 'Single file'} · {d.files} file{d.files === 1 ? '' : 's'} ·{' '}
                    {fmtSize(d.bytes)}
                  </p>
                </div>
                <div className="dem-actions">
                  {armed ? (
                    <>
                      <button
                        type="button"
                        className="dem-btn dem-btn-danger"
                        onClick={() => remove(d)}
                        disabled={busy}
                      >
                        {busy ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button
                        type="button"
                        className="dem-btn"
                        onClick={() => setArming(null)}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="dem-btn"
                      onClick={() => {
                        setNotice('');
                        setArming(d.id);
                      }}
                      disabled={Boolean(deleting)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {armed && (
                  <p className="dem-warn">
                    Deletes {d.files} file{d.files === 1 ? '' : 's'} from the repository. {d.url} will 404 once the
                    deploy finishes. This cannot be undone from here.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
