#!/usr/bin/env node
/* ==========================================================================
   inject-noindex.mjs — Blueprint Code
   Stamps a robots noindex tag into every standalone demo page under public/.

   Why: the static demos in public/<slug>/index.html are served at /<slug>
   (see next.config.ts rewrites) and are linked from the site, so crawlers can
   reach them. They are prototypes, not marketing pages, and must stay out of
   search results. Only the real Next.js content routes (the ones listed in
   src/app/sitemap.ts) should be indexable.

   A <meta name="robots" content="noindex, nofollow"> travels with the file no
   matter how it is served, and — unlike a robots.txt Disallow — leaves the page
   crawlable so the noindex is actually seen and honoured.

   Idempotent: a page that already carries a robots meta (ours or hand-written)
   is left untouched, so re-running never duplicates the tag. Fragments without
   a <head> (public/partials/*) are skipped — the tag belongs in a document head.

   This runs in `prebuild` alongside inject-chrome.mjs, so every build re-stamps
   all demos and a newly added public/<slug>/index.html is covered with no extra
   step. The admin uploader (src/app/api/deploy-demo/route.ts) stamps the same
   tag at upload time for the same reason.

   Usage:  node scripts/inject-noindex.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const ROBOTS_TAG = '<meta name="robots" content="noindex, nofollow">';

/** Recursively collect every *.html file under `dir`. */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

/** Insert the robots meta into an HTML document if it has a <head> and no
 *  robots meta yet. Returns the (possibly unchanged) markup. */
function injectNoindex(html) {
  if (/<meta[^>]+name=["']robots["']/i.test(html)) return html; // already has one
  const headOpen = html.match(/<head\b[^>]*>/i);
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length;
    return html.slice(0, at) + ROBOTS_TAG + html.slice(at);
  }
  const closeIdx = html.toLowerCase().indexOf('</head>');
  if (closeIdx !== -1) return html.slice(0, closeIdx) + ROBOTS_TAG + html.slice(closeIdx);
  return html; // no <head> — a fragment, not a page; leave it alone
}

let changed = 0;
let skipped = 0;
for (const file of htmlFiles(PUBLIC)) {
  const before = readFileSync(file, 'utf8');
  const after = injectNoindex(before);
  const rel = relative(ROOT, file);
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`  noindex + ${rel}`);
    changed++;
  } else {
    skipped++;
  }
}
console.log(`inject-noindex: stamped ${changed} page(s), ${skipped} already covered / not a page.`);
