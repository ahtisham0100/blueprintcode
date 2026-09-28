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

type MediaDoc = { id: number | string; alt?: string | null; filename?: string | null; thumbnailURL?: string | null; mimeType?: string | null; updatedAt: string };


type Stat = { n: number; label: string; href: string };

/** The numbers, each opening the list filtered to what it counts. */
function Stats({ items }: { items: Stat[] }) {
  return (
    <div className="bpc-dash__stats">
      {items.map((s) => (
        <a key={s.label} href={s.href}>
          <b>{s.n}</b>
          <span>{s.label}</span>
        </a>
      ))}
    </div>
  );
}

/** List URL filtered by publish status (Payload reads where[] from the query string). */
export function statusListHref(adminRoute: string, collection: 'posts' | 'demos', status?: 'draft' | 'published'): string {
  const base = `${adminRoute}/collections/${collection}`;
  return status ? `${base}?where%5B_status%5D%5Bequals%5D=${status}` : base;
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

  const [postsPublished, postsDraft, scheduled, media, demosPublished, demosDraft] = await Promise.all([
    count('posts', 'published'),
    count('posts', 'draft'),
    payload.count({ collection: 'payload-jobs', where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { 'input.doc.relationTo': { equals: 'posts' } }] }, overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
    payload.find({ collection: 'media', limit: 6, sort: '-updatedAt', depth: 0, overrideAccess: true }),
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
          <Stats
            items={[
              { n: postsPublished.totalDocs, label: 'published', href: statusListHref(admin, 'posts', 'published') },
              { n: postsDraft.totalDocs, label: 'drafts', href: statusListHref(admin, 'posts', 'draft') },
              { n: scheduled.totalDocs, label: 'scheduled', href: statusListHref(admin, 'posts') },
            ]}
          />
        </div>

        {isAdmin && demosPublished && demosDraft && (
          <div className="bpc-dash__panel">
            <PanelLabel icon="demos" href={`${admin}/collections/demos`}>
              Demos
            </PanelLabel>
            <Stats
              items={[
                { n: demosPublished.totalDocs, label: 'published', href: statusListHref(admin, 'demos', 'published') },
                { n: demosDraft.totalDocs, label: 'drafts', href: statusListHref(admin, 'demos', 'draft') },
              ]}
            />
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
