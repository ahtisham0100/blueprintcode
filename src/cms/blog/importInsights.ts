/* Planning the import of the legacy /insights field notes into the blog:
   what post, category and author each note becomes. Pure; the script
   (scripts/import-insights.ts) renders each note's JSX to HTML, calls this,
   and writes records. Imported posts are DRAFTS with their original
   publish dates, so nothing changes publicly until each is published — and
   the /insights pages keep serving until switch-over (then add redirects
   /insights/<slug> → /blog/<slug>; see redirectsForSwitchOver). */

import { EXCERPT_MAX_LENGTH } from './limits';
import { htmlToLexical } from './htmlToLexical';
import { readingTimeMinutes } from './readingTime';
import { slugify, validatePostSlug } from './slug';

export type InsightNote = {
  slug: string;
  refB: string;
  title: string;
  desc: string;
  author: string;
  datePublished: string;
  dateModified: string;
};

export type InsightAuthor = { name: string; jobTitle: string; url: string; image: string; sameAs?: string[] };

export type CategoryPlan = { name: string; slug: string };
export type AuthorPlan = { name: string; slug: string; title?: string; links: { label: string; url: string }[]; imagePath?: string };

export type PostPlan = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  body: ReturnType<typeof htmlToLexical>;
  readingTime: number;
  category: CategoryPlan;
  authorName: string;
  seo: { description?: string };
  notes: string[];
};

/** "COST & SCOPE" → { name: "Cost & scope", slug: "cost-scope" } */
export function categoryFromRef(refB: string): CategoryPlan {
  const lower = refB.trim().toLowerCase();
  const name = lower.charAt(0).toUpperCase() + lower.slice(1);
  return { name, slug: slugify(lower.replace(/&/g, ' ')) };
}

/** The AUTHORS entry in notes.tsx → an Authors record. Images under the site root become an upload. */
export function authorPlan(a: InsightAuthor): AuthorPlan {
  const links = (a.sameAs ?? []).map((url) => ({ label: /linkedin\.com/i.test(url) ? 'LinkedIn' : new URL(url).hostname.replace(/^www\./, ''), url }));
  const imagePath = a.image.startsWith('https://blueprintcode.ai/') ? a.image.slice('https://blueprintcode.ai/'.length) : undefined;
  // The About page anchors (#james-michaelson) are the author slugs, so /about#<slug> keeps working.
  const anchor = a.url.includes('#') ? a.url.split('#')[1] : slugify(a.name);
  return { name: a.name, slug: anchor, title: a.jobTitle, links, imagePath };
}

/** "2026-08-19" → "2026-08-19T09:00:00.000Z" (morning UK time, so the date never shifts). */
export function publishDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error(`Not an ISO date: ${isoDate}`);
  return `${isoDate}T09:00:00.000Z`;
}

export function planInsightPost(note: InsightNote, html: string): PostPlan | { slug: string; skipped: string } {
  const slugError = validatePostSlug(note.slug);
  if (slugError) return { slug: note.slug, skipped: slugError };

  const notes: string[] = [];
  const body = htmlToLexical(html);
  if (!body.root.children.length) return { slug: note.slug, skipped: 'empty body' };

  let excerpt = note.desc.trim();
  if (excerpt.length > EXCERPT_MAX_LENGTH) {
    excerpt = excerpt.slice(0, EXCERPT_MAX_LENGTH - 1).replace(/\s+\S*$/, '') + '…';
    notes.push(`excerpt trimmed to ${EXCERPT_MAX_LENGTH} characters`);
  }
  const description = note.desc.trim().length <= 160 ? note.desc.trim() : undefined;
  if (!description) notes.push('description longer than 160 characters; meta description left empty (excerpt is used)');
  if (note.dateModified !== note.datePublished) notes.push(`was updated ${note.dateModified}; the CMS records its own updatedAt`);

  return {
    slug: note.slug,
    title: note.title,
    excerpt,
    publishedAt: publishDate(note.datePublished),
    body,
    readingTime: readingTimeMinutes(body),
    category: categoryFromRef(note.refB),
    authorName: note.author,
    seo: description ? { description } : {},
    notes,
  };
}

/** The redirect rows to add at switch-over (NOT at import time). */
export function redirectsForSwitchOver(slugs: string[]): { from: string; to: string; permanent: true }[] {
  return slugs.map((s) => ({ from: `/insights/${s}`, to: `/blog/${s}`, permanent: true }));
}
