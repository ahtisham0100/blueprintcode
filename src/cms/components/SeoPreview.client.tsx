'use client';

/* Live search-result preview + length meters in the SEO tab of Demos and
   Posts. Reads the form directly, so it updates as the editor types.
   `pathPrefix` is where the slug lives ('/' for demos, '/blog/' for posts);
   both come from fields/seo.ts as clientProps. */

import { useFormFields } from '@payloadcms/ui';
import { CMS_ROUTES } from '../settings';

const TITLE_MAX = 60;
const DESC_MAX = 160;

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const over = value > max;
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`bpc-seo__meter${over ? ' is-over' : value === 0 ? ' is-empty' : ''}`}>
      <span>
        {label} · {value}/{max}
      </span>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export type SeoPreviewProps = { pathPrefix?: string; noun?: string };

export function SeoPreview({ pathPrefix = '/', noun = 'demo' }: SeoPreviewProps) {
  const title = useFormFields(([f]) => (f['title']?.value as string) ?? '');
  const slug = useFormFields(([f]) => (f['slug']?.value as string) ?? '');
  const metaTitle = useFormFields(([f]) => (f['seo.metaTitle']?.value as string) ?? '');
  const description = useFormFields(([f]) => (f['seo.description']?.value as string) ?? '');
  const noindex = useFormFields(([f]) => Boolean(f['seo.noindex']?.value));

  const shownTitle = (metaTitle || title || `Untitled ${noun}`).trim();
  const shownDesc = description.trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://blueprintcode.ai';
  const prefix = pathPrefix.replace(/^\/+|\/+$/g, '');
  const crumbs = [site.replace(/^https?:\/\//, ''), ...(prefix ? prefix.split('/') : []), slug || 'slug'];
  const liveUrl = `${site}/${prefix ? `${prefix}/` : ''}${slug || '…'}`;

  return (
    <div className="bpc-seo">
      <div className="bpc-seo__label">Search preview{noindex ? ' · NOINDEX — hidden from search engines' : ''}</div>
      <div className="bpc-seo__card">
        <div className="bpc-seo__url">{crumbs.join(' › ')}</div>
        <div className="bpc-seo__title">{shownTitle.length > TITLE_MAX ? shownTitle.slice(0, TITLE_MAX - 1) + '…' : shownTitle}</div>
        <div className="bpc-seo__desc">{shownDesc ? (shownDesc.length > DESC_MAX ? shownDesc.slice(0, DESC_MAX - 1) + '…' : shownDesc) : 'Add a meta description — search engines will otherwise pick text from the page.'}</div>
      </div>
      <Meter value={shownTitle.length} max={TITLE_MAX} label="Title" />
      <Meter value={shownDesc.length} max={DESC_MAX} label="Description" />
      <div className="bpc-seo__hint">
        Live URL: {liveUrl} · Admin: {CMS_ROUTES.admin}/collections/{noun === 'post' ? 'posts' : 'demos'}
      </div>
    </div>
  );
}
