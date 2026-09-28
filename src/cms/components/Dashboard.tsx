/* Home screen of the CMS (admin.components.beforeDashboard): what changed
   recently, what is still a draft, quick actions, and the site status. */

import type { ServerProps } from 'payload';
import { isCmsPublic } from '@/lib/flags';
import { CMS_ROUTES } from '../settings';

type Demo = { id: number | string; title: string; slug: string; _status?: string | null; updatedAt: string };
type MediaDoc = { id: number | string; alt?: string | null; filename?: string | null; thumbnailURL?: string | null; mimeType?: string | null; updatedAt: string };

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export async function Dashboard(props: ServerProps) {
  const { payload, user } = props;
  const role = (user as { role?: string } | null)?.role;
  const admin = `${CMS_ROUTES.admin}`;

  const [demos, drafts, media] = await Promise.all([
    payload.find({ collection: 'demos', limit: 6, sort: '-updatedAt', depth: 0, draft: true, overrideAccess: true }),
    payload.count({ collection: 'demos', where: { _status: { equals: 'draft' } }, overrideAccess: true }),
    payload.find({ collection: 'media', limit: 6, sort: '-updatedAt', depth: 0, overrideAccess: true }),
  ]);
  const published = await payload.count({ collection: 'demos', where: { _status: { equals: 'published' } }, overrideAccess: true });

  return (
    <section className="bpc-dash">
      <header className="bpc-dash__head">
        <h1>Dashboard</h1>
        <div className="bpc-dash__actions">
          {role === 'admin' && (
            <a className="btn btn--style-primary btn--size-medium" href={`${admin}/collections/demos/create`}>
              New demo
            </a>
          )}
          <a className="btn btn--style-secondary btn--size-medium" href={`${admin}/collections/media`}>
            Upload media
          </a>
        </div>
      </header>

      <div className="bpc-dash__grid">
        <div className="bpc-dash__panel">
          <div className="bpc-dash__label">Demos</div>
          <div className="bpc-dash__stats">
            <div>
              <b>{published.totalDocs}</b>
              <span>published</span>
            </div>
            <div>
              <b>{drafts.totalDocs}</b>
              <span>drafts</span>
            </div>
          </div>
          <ul className="bpc-dash__list">
            {(demos.docs as Demo[]).map((d) => (
              <li key={d.id}>
                <a href={`${admin}/collections/demos/${d.id}`}>{d.title}</a>
                <span className={`bpc-pill is-${d._status ?? 'draft'}`}>{d._status ?? 'draft'}</span>
                <small>/{d.slug} · {when(d.updatedAt)}</small>
              </li>
            ))}
            {demos.docs.length === 0 && <li className="bpc-dash__empty">No demos yet.</li>}
          </ul>
        </div>

        <div className="bpc-dash__panel">
          <div className="bpc-dash__label">Recent media</div>
          <ul className="bpc-dash__media">
            {(media.docs as MediaDoc[]).map((m) => (
              <li key={m.id}>
                <a href={`${admin}/collections/media/${m.id}`} title={m.alt ?? m.filename ?? ''}>
                  {m.thumbnailURL && m.mimeType?.startsWith('image/') ? <img src={m.thumbnailURL} alt={m.alt ?? ''} loading="lazy" /> : <span>{(m.filename ?? '').split('.').pop()?.toUpperCase()}</span>}
                </a>
              </li>
            ))}
            {media.docs.length === 0 && <li className="bpc-dash__empty">No files yet.</li>}
          </ul>
        </div>

        <div className="bpc-dash__panel">
          <div className="bpc-dash__label">Site status</div>
          <dl className="bpc-dash__kv">
            <dt>CMS demos on the public site</dt>
            <dd>{isCmsPublic() ? <span className="bpc-pill is-published">live</span> : <span className="bpc-pill is-draft">off (CMS_PUBLIC)</span>}</dd>
            <dt>Environment</dt>
            <dd>{process.env.VERCEL_ENV ?? 'local'}</dd>
            <dt>Signed in as</dt>
            <dd>
              {(user as { email?: string } | null)?.email} · {role}
            </dd>
          </dl>
        </div>
      </div>
    </section>
  );
}
