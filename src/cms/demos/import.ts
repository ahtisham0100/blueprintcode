/* Planning the import of the legacy static demos (public/<slug>/index.html)
   into the CMS: what record each file becomes. Pure; the script
   (scripts/import-static-demos.ts) reads files and writes records. Imported
   demos are DRAFTS, so nothing changes publicly until each is published. */

import { extractCanonical, extractDescription, extractNoindex, extractTitle } from './html';
import { validateDemoSlug } from './slug';

export type StaticDemoFile = { slug: string; html: string };

export type ImportPlan = {
  slug: string;
  title: string;
  html: string;
  seo: { description?: string; canonical?: string; noindex: boolean };
  notes: string[];
};

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export function planImport(file: StaticDemoFile, siteUrl: string): ImportPlan | { slug: string; skipped: string } {
  const slugError = validateDemoSlug(file.slug);
  if (slugError) return { slug: file.slug, skipped: slugError };

  const notes: string[] = [];
  const title = extractTitle(file.html) ?? titleFromSlug(file.slug);
  if (!extractTitle(file.html)) notes.push('no <title>; derived from slug');

  let description = extractDescription(file.html) ?? undefined;
  if (!description) notes.push('no meta description; needs one before publishing');
  else if (description.length > 160) {
    description = description.slice(0, 157).replace(/\s+\S*$/, '') + '…';
    notes.push('description trimmed to 160 characters');
  }

  const own = `${siteUrl}/${file.slug}`;
  const canonicalRaw = extractCanonical(file.html);
  const canonical = canonicalRaw && canonicalRaw.replace(/\/$/, '') !== own ? canonicalRaw : undefined;
  if (canonical) notes.push(`canonical points elsewhere: ${canonical}`);

  const noindex = extractNoindex(file.html);
  return { slug: file.slug, title, html: file.html, seo: { description, canonical, noindex }, notes };
}
