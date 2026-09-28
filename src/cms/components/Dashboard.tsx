/* Home screen of the CMS (admin.components.beforeDashboard): what changed
   recently, what is still a draft, quick actions, and the site status.
   Writers see the blog and media; demos are admin-only. Icons from
   cms/icons.ts via <Glyph>. */

import type { ServerProps } from 'payload';
import type { ReactNode } from 'react';
import { isBlogPublic, isCmsPublic } from '@/lib/flags';
import type { IconName } from '../icons';
import { CMS_ROUTES, publicSiteOrigin } from '../settings';
import { Glyph } from './Glyph';

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

function PanelLabel({ icon, children, href, hrefLabel }: { icon: IconName; children: ReactNode; href?: string; hrefLabel?: string }) {
  return (
    <div className="bpc-dash__label">
      <Glyph name={icon} size={15} />
      <span>{children}</span>
      {href && (
        <a className="bpc-dash__label-link" href={href}>
          {hrefLabel ?? 'View all'} →
        </a>
      )}
    </div>
  );
}

function Empty({ icon, children, href, action }: { icon: IconName; children: ReactNode; href?: string; action?: string }) {
  return (
    <li className="bpc-dash__empty">
      <Glyph name={icon} size={28} />
      <span>{children}</span>
      {href && action && <a href={href}>{action}</a>}
    </li>
  );
}

/** Small "open on the site" link, only for published items in a section that is public. */
function LiveLink({ href, show }: { href: string; show: boolean }) {
  if (!show) return null;
  return (
    <a className="bpc-dash__live" href={href} target="_blank" rel="noopener noreferrer" title="Open on the site" aria-label="Open on the site">
      <Glyph name="external" size={13} />
    </a>
  );
}

export async function Dashboard(props: ServerProps) {
  const { payload, user } = props;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === 'admin';
  const admin = `${CMS_ROUTES.admin}`;
  const site = publicSiteOrigin();
  const blogLive = isBlogPublic();
  const demosLive = isCmsPublic();
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
          <a className="btn btn--style-primary btn--size-medium bpc-btn-icon" href={`${admin}/collections/posts/create`}>
            <Glyph name="plus" size={14} />
            New post
          </a>
          {isAdmin && (
            <a className="btn btn--style-secondary btn--size-medium bpc-btn-icon" href={`${admin}/collections/demos/create`}>
              <Glyph name="plus" size={14} />
              New demo
            </a>
          )}
          <a className="btn btn--style-secondary btn--size-medium bpc-btn-icon" href={`${admin}/collections/media`}>
            <Glyph name="upload" size={14} />
            Upload media
          </a>
        </div>
      </header>

      <div className="bpc-dash__grid">
        <div className="bpc-dash__panel">
          <PanelLabel icon="posts" href={`${admin}/collections/posts`}>
            Blog posts
          </PanelLabel>
          <Stats items={[[postsPublished.totalDocs, 'published'], [postsDraft.totalDocs, 'drafts'], [scheduled.totalDocs, 'scheduled']]} />
          <ul className="bpc-dash__list">
            {(posts.docs as Post[]).map((p) => (
              <li key={p.id}>
                <a href={`${admin}/collections/posts/${p.id}`}>{p.title}</a>
                <span className="bpc-dash__meta-right">
                  <LiveLink href={`${site}/blog/${p.slug}`} show={blogLive && p._status === 'published'} />
                  <span className={`bpc-pill is-${p._status ?? 'draft'}`}>{p._status ?? 'draft'}</span>
                </span>
                <small>
                  /blog/{p.slug} · {when(p.updatedAt)}
                </small>
              </li>
            ))}
            {posts.docs.length === 0 && (
              <Empty icon="posts" href={`${admin}/collections/posts/create`} action="Write the first post →">
                No posts yet.
              </Empty>
            )}
          </ul>
        </div>

        {demos && (
          <div className="bpc-dash__panel">
            <PanelLabel icon="demos" href={`${admin}/collections/demos`}>
              Demos
            </PanelLabel>
            <Stats items={[[demosPublished!.totalDocs, 'published'], [demosDraft!.totalDocs, 'drafts']]} />
            <ul className="bpc-dash__list">
              {(demos.docs as Demo[]).map((d) => (
                <li key={d.id}>
                  <a href={`${admin}/collections/demos/${d.id}`}>{d.title}</a>
                  <span className="bpc-dash__meta-right">
                    <LiveLink href={`${site}/${d.slug}`} show={demosLive && d._status === 'published'} />
                    <span className={`bpc-pill is-${d._status ?? 'draft'}`}>{d._status ?? 'draft'}</span>
                  </span>
                  <small>
                    /{d.slug} · {when(d.updatedAt)}
                  </small>
                </li>
              ))}
              {demos.docs.length === 0 && (
                <Empty icon="demos" href={`${admin}/collections/demos/create`} action="Add a demo →">
                  No demos yet.
                </Empty>
              )}
            </ul>
          </div>
        )}

        <div className="bpc-dash__panel">
          <PanelLabel icon="media" href={`${admin}/collections/media`}>
            Recent media
          </PanelLabel>
          <ul className="bpc-dash__media">
            {(media.docs as MediaDoc[]).map((m) => (
              <li key={m.id}>
                <a href={`${admin}/collections/media/${m.id}`} title={m.alt ?? m.filename ?? ''}>
                  {m.thumbnailURL && m.mimeType?.startsWith('image/') ? <img src={m.thumbnailURL} alt={m.alt ?? ''} loading="lazy" /> : <span>{(m.filename ?? '').split('.').pop()?.toUpperCase()}</span>}
                </a>
              </li>
            ))}
            {media.docs.length === 0 && (
              <Empty icon="media" href={`${admin}/collections/media`} action="Upload files →">
                No files yet.
              </Empty>
            )}
          </ul>
        </div>

        <div className="bpc-dash__panel">
          <PanelLabel icon="pulse">Site status</PanelLabel>
          <dl className="bpc-dash__kv">
            <dt>Blog on the public site</dt>
            <dd>
              <Pill live={blogLive} on="live" off="off (BLOG_PUBLIC)" />
            </dd>
            {isAdmin && (
              <>
                <dt>CMS demos on the public site</dt>
                <dd>
                  <Pill live={demosLive} on="live" off="off (CMS_PUBLIC)" />
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
          <a className="bpc-dash__site" href={site} target="_blank" rel="noopener noreferrer">
            <Glyph name="globe" size={14} />
            Open {site.replace(/^https?:\/\//, '')}
            <Glyph name="external" size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}
