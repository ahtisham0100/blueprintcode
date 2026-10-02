import type { Metadata } from 'next';
import { OG_DEFAULTS, SITE_URL } from '@/lib/seo';

/* Page metadata for the legal documents. Kept apart from company.ts, which the
   client-side footer imports. */
export function legalMetadata(path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title: `${title} — Blueprint Code AI`,
    description,
    alternates: { canonical: url },
    openGraph: { ...OG_DEFAULTS, title: `${title} — Blueprint Code AI`, description, type: 'website', url },
  };
}
