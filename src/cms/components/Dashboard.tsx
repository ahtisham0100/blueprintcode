/* Home screen of the CMS (admin.components.beforeDashboard): what changed
   recently, what is still a draft, quick actions, and the site status.
   Writers see the blog and media; demos are admin-only. */

import type { ServerProps } from 'payload';
import { isBlogPublic, isCmsPublic } from '@/lib/flags';
import { CMS_ROUTES } from '../settings';

type Demo = { id: number | string; title: string; slug: string; _status?: string | null; updatedAt: string };
type Post = { id: number | string; title: string; slug: string; _status?: string | null; updatedAt: string; publishedAt?: string | null };
type MediaDoc = { id: number | string; alt?: string | null; filename?: string | null; thumbnailURL?: string | null; mimeType?: string | null; updatedAt: string };

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Stats({ items }: { items: [number, string][] }) {
  return (
    <div className="bpc-dash__stats">
      {items.map(([n, label]) => (
        <div key={label}>
          <b>{n}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Pill({ live, on, off }: { live: boolean; on: string; off: string }) {
  return live ? <span className="bpc-pill is-published">{on}</span> : <span className="bpc-pill is-draft">{off}</span>;
}

export async function Dashboard(props: ServerProps) {
  const { payload, user } = props;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === 'admin';
  const admin = `${CMS_ROUTES.admin}`;
  const count = (collection: 'demos' | 'posts', status: 'draft' | 'published') =>
    payload.count({ collection, where: { _status: { equals: status } }, overrideAccess: true });

  const [posts, postsPublished, postsDraft, scheduled, media, demos, demosPublished, demosDraft] = await Promise.all([
    // Not draft:true — a live post with unsaved autosave changes should still read "published".
    payload.find({ collection: 'posts', limit: 6, sort: '-updatedAt', depth: 0, overrideAccess: true }),
    count('posts', 'published'),
    count('posts', 'draft'),
    payload.count({ collection: 'payload-jobs', where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { 'input.doc.relationTo': { equals: 'posts' } }] }, overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
    payload.find({ collection: 'media', limit: 6, sort: '-updatedAt', depth: 0, overrideAccess: true }),
    isAdmin ? payload.find({ collection: 'demos', limit: 6, sort: '-updatedAt', depth: 0, draft: true, overrideAccess: true }) : null,
    isAdmin ? count('demos', 'published') : null,
    isAdmin ? count('demos', 'draft') : null,
  ]);

  return (
    <section className="bpc-dash">
      <header className="bpc-dash__head">
        <h1>Dashboard</h1>
        <div className="bpc-dash__actions">
          <a className="btn btn--style-primary btn--size-medium" href={`${admin}/collections/posts/create`}>
            New post
          </a>
          {isAdmin && (
            <a className="btn btn--style-secondary btn--size-medium" href={`${admin}/collections/demos/create`}>
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
          <div className="bpc-dash__label">Blog posts</div>
          <Stats items={[[postsPublished.totalDocs, 'published'], [postsDraft.totalDocs, 'drafts'], [scheduled.totalDocs, 'scheduled']]} />
          <ul className="bpc-dash__list">
            {(posts.docs as Post[]).map((p) => (
              <li key={p.id}>
                <a href={`${admin}/collections/posts/${p.id}`}>{p.title}</a>
                <span className={`bpc-pill is-${p._status ?? 'draft'}`}>{p._status ?? 'draft'}</span>
                <small>
                  /blog/{p.slug} · {when(p.updatedAt)}
                </small>
              </li>
            ))}
            {posts.docs.length === 0 && <li className="bpc-dash__empty">No posts yet.</li>}
          </ul>
        </div>

        {demos && (
          <div className="bpc-dash__panel">
            <div className="bpc-dash__label">Demos</div>
            <Stats items={[[demosPublished!.totalDocs, 'published'], [demosDraft!.totalDocs, 'drafts']]} />
            <ul className="bpc-dash__list">
              {(demos.docs as Demo[]).map((d) => (
                <li key={d.id}>
                  <a href={`${admin}/collections/demos/${d.id}`}>{d.title}</a>
                  <span className={`bpc-pill is-${d._status ?? 'draft'}`}>{d._status ?? 'draft'}</span>
                  <small>
                    /{d.slug} · {when(d.updatedAt)}
                  </small>
                </li>
              ))}
              {demos.docs.length === 0 && <li className="bpc-dash__empty">No demos yet.</li>}
            </ul>
          </div>
        )}

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
            <dt>Blog on the public site</dt>
            <dd>
              <Pill live={isBlogPublic()} on="live" off="off (BLOG_PUBLIC)" />
            </dd>
            {isAdmin && (
              <>
                <dt>CMS demos on the public site</dt>
                <dd>
                  <Pill live={isCmsPublic()} on="live" off="off (CMS_PUBLIC)" />
                </dd>
              </>
            )}
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
