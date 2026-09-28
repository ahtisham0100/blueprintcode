/* Ping IndexNow (Bing, Yandex, Seznam, Naver, Yep) with changed URLs.
 *
 * Run AFTER a production deploy — engines fetch the pages (and the key file)
 * from the live site, so pinging before the deploy is live is wasted.
 *
 *   npm run indexnow                      # every URL in the live sitemap
 *   npm run indexnow -- /pricing /about   # just these paths (or full URLs)
 *
 * The key file public/<KEY>.txt proves ownership; it must stay deployed.
 */

import { INDEXNOW_HOST as HOST, INDEXNOW_KEY as KEY, submitIndexNow } from './lib/indexnow.mjs';
const SITE_URL = `https://${HOST}`;

async function sitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((a) => (a.startsWith('http') ? a : `${SITE_URL}/${a.replace(/^\//, '')}`))
  : await sitemapUrls();

if (!urlList.length) {
  console.error('No URLs to submit.');
  process.exit(1);
}

// Sanity check: the key file must be live, or every engine rejects the ping (403).
const keyRes = await fetch(`${SITE_URL}/${KEY}.txt`);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  console.error(`Key file ${SITE_URL}/${KEY}.txt is not live — deploy it first.`);
  process.exit(1);
}

const res = await submitIndexNow(urlList);
// 200 = accepted, 202 = accepted, key validation pending. Anything else is an error.
console.log(`IndexNow: HTTP ${res.status} for ${res.submitted} URL(s)`);
if (!res.ok) process.exit(1);
