/* Rollout switches. Read at request time so a Vercel env change takes effect
   on the next deploy without a code change. */

function flagOn(name: string): boolean {
  const v = (process.env[name] ?? '').trim().toLowerCase();
  return v === 'on' || v === 'true' || v === '1';
}

/**
 * CMS_PUBLIC gates everything the new CMS would expose on the public site in
 * place of something that already exists there: database-served demos at
 * /<slug>, the CMS-driven sitemap entries for them and the IndexNow ping on
 * publish. Off (the default) means the CMS is admin-only and the public site
 * is exactly what it was before the CMS existed. Flip it to "on" at
 * switch-over.
 */
export function isCmsPublic(): boolean {
  return flagOn('CMS_PUBLIC');
}

/**
 * BLOG_PUBLIC gates the blog (Phase 5): /blog, /blog/<slug>, categories, the
 * RSS feed and the blog's sitemap entries. The blog has no static
 * predecessor, so it launches on its own switch, independent of CMS_PUBLIC.
 * Off (the default) means every public blog URL is a 404.
 */
export function isBlogPublic(): boolean {
  return flagOn('BLOG_PUBLIC');
}
