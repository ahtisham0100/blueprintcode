/* Rollout switches. Read at request time so a Vercel env change takes effect
   on the next deploy without a code change. */

/**
 * CMS_PUBLIC gates everything the new CMS would expose on the public site:
 * database-served demos at /<slug>, the blog, the CMS-driven sitemap and the
 * IndexNow ping on publish. Off (the default) means the CMS is admin-only and
 * the public site is exactly what it was before the CMS existed. Flip it to
 * "on" at switch-over.
 */
export function isCmsPublic(): boolean {
  const v = (process.env.CMS_PUBLIC ?? '').trim().toLowerCase();
  return v === 'on' || v === 'true' || v === '1';
}
