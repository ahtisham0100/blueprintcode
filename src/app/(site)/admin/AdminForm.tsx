'use client';

import { useState } from 'react';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; msg: string; url: string }
  | { kind: 'err'; msg: string };

/** Read a File as bare base64 (no data: prefix), for the GitHub Contents API. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result || '');
      const comma = res.indexOf(',');
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function slugify(v: string): string {
  return v.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminForm() {
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const cleanSlug = slugify(slug);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setStatus({ kind: 'err', msg: 'Choose an HTML file first.' });
    if (!cleanSlug) return setStatus({ kind: 'err', msg: 'Enter a URL slug.' });
    if (!password) return setStatus({ kind: 'err', msg: 'Enter the admin password.' });

    setStatus({ kind: 'busy' });
    try {
      const contentBase64 = await fileToBase64(file);
      const res = await fetch('/api/deploy-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, slug: cleanSlug, contentBase64 }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({
          kind: 'ok',
          url: j.url,
          msg: `${j.updated ? 'Updated' : 'Committed'}. It goes live at ${j.url} in ~1–2 min once the deploy finishes.`,
        });
      } else {
        setStatus({ kind: 'err', msg: j.error || `Failed (${res.status}).` });
      }
    } catch (err) {
      setStatus({ kind: 'err', msg: String(err) });
    }
  }

  return (
    <main id="main" className="adm">
      <div className="adm-card">
        <p className="adm-eyebrow">BLUEPRINT CODE AI — ADMIN</p>
        <h1>Deploy a demo</h1>
        <p className="adm-lead">
          Upload an HTML file and give it a URL slug. It&apos;s committed to the site
          repository and goes live at <code>/&lt;slug&gt;</code> on the next deploy
          (about a minute or two). No config changes needed.
        </p>

        <form onSubmit={onSubmit} className="adm-form">
          <label className="adm-field">
            <span>HTML file</span>
            <input
              type="file"
              accept=".html,text/html"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !slug) setSlug(f.name.replace(/\.html?$/i, '').toLowerCase());
              }}
            />
          </label>

          <label className="adm-field">
            <span>URL slug</span>
            <input
              type="text"
              value={slug}
              placeholder="my-new-demo"
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={{ textTransform: 'lowercase' }}
            />
            {cleanSlug && (
              <small className="adm-preview">
                Will publish to <b>/{cleanSlug}</b>
              </small>
            )}
          </label>

          <label className="adm-field">
            <span>Admin password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </label>

          <button type="submit" className="adm-btn" disabled={status.kind === 'busy'}>
            {status.kind === 'busy' ? 'Publishing…' : 'Publish demo'}
          </button>
        </form>

        {status.kind === 'ok' && (
          <p className="adm-msg adm-ok">
            {status.msg}{' '}
            <a href={status.url} target="_blank" rel="noopener">
              Open {status.url}
            </a>
          </p>
        )}
        {status.kind === 'err' && <p className="adm-msg adm-err">{status.msg}</p>}
      </div>
    </main>
  );
}
