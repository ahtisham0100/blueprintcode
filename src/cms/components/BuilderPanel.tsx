/* Dashboard panel (admins only): Blueprint Builder projects, submitted ones
   first, each opening a BPC review session on the public site through
   /api/cms/builder-review/<id> (cms/builder/review.ts). */

import { isBuilderPublic } from '@/lib/flags';
import type { RecentProject } from '@/builder/store';
import { CMS_ROUTES } from '../settings';
import { Glyph } from './Glyph';

export type BuilderSummary = { counts: { clients: number; projects: number; submitted: number }; recent: RecentProject[] };

/** Null when the builder tables can't be read (no database, migration not
 *  applied yet): the dashboard then simply leaves the panel out. */
export async function loadBuilderSummary(): Promise<BuilderSummary | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { builderStore } = await import('@/builder/deps');
    const store = builderStore();
    const [counts, recent] = await Promise.all([store.counts(), store.recentProjects(6)]);
    return { counts, recent };
  } catch {
    return null;
  }
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' });

export function BuilderPanel({ data }: { data: BuilderSummary }) {
  const live = isBuilderPublic();
  return (
    <div className="bpc-dash__panel">
      <div className="bpc-dash__label">
        <Glyph name="builder" size={15} />
        <span>Blueprint Builder</span>
      </div>
      <dl className="bpc-dash__kv">
        <dt>Projects sent to us</dt>
        <dd>{data.counts.submitted}</dd>
        <dt>Projects in progress</dt>
        <dd>{data.counts.projects - data.counts.submitted}</dd>
        <dt>Client accounts</dt>
        <dd>{data.counts.clients}</dd>
        <dt>On the public site</dt>
        <dd>{live ? <span className="bpc-pill is-published">live</span> : <span className="bpc-pill is-draft">off (BUILDER_PUBLIC)</span>}</dd>
      </dl>
      <ul className="bpc-dash__list" style={{ marginTop: '0.75rem' }}>
        {data.recent.map((p) => (
          <li key={p.id}>
            <a href={`${CMS_ROUTES.api}/builder-review/${p.id}`} target="_blank" rel="noopener noreferrer" title="Open for BPC review on the public site">
              {p.name || 'Untitled project'}
            </a>
            {p.submittedAt ? <span className="bpc-pill is-published">sent</span> : <span className="bpc-pill is-draft">in progress</span>}
            <small>
              {p.id} · {p.clientEmail} · {p.submittedAt ? `sent ${day(p.submittedAt)}` : `updated ${day(p.updatedAt)}`}
              {p.submissions > 1 ? ` · sent ${p.submissions} times` : ''}
            </small>
          </li>
        ))}
        {data.recent.length === 0 && (
          <li className="bpc-dash__empty">
            <Glyph name="builder" size={28} />
            <span>No projects yet.</span>
          </li>
        )}
      </ul>
    </div>
  );
}
