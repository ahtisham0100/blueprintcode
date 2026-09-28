#!/usr/bin/env node
/* ==========================================================================
   inject-chrome.mjs — Blueprint Code
   Injects the shared header + footer (public/partials/site-header.html and
   site-footer.html) into every static HTML page under public/, plus the
   <link> to site-chrome.css and the <script> to site-chrome.js.

   Single source of truth:
     - markup     -> public/partials/site-header.html, site-footer.html
     - styling    -> public/partials/site-chrome.css   (linked, not copied)
     - behaviour  -> public/partials/site-chrome.js     (linked, not copied)
   Re-run this script after editing the header/footer *markup*. Editing the
   CSS or JS needs no rebuild — those are linked live.

   The injection is idempotent: content sits between BPC markers, so running
   the script again replaces those regions instead of duplicating them.

   Usage:  node scripts/inject-chrome.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectChrome, metaFromSlug, stripPartialComment } from './lib/chrome.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const PARTIALS = join(PUBLIC, 'partials');
// Directories whose HTML must never receive the shared chrome. `capabilities`
// holds standalone fragments embedded as <iframe>s on the homepage; injecting a
// nav + footer into them would render the site chrome inside each card.
const SKIP_DIRS = new Set([PARTIALS, join(PUBLIC, 'capabilities')]);

/* ---- markers -------------------------------------------------------------- */
/* ---- per-page metadata (single place for labels / footer meta) ------------ */
// Keyed by path relative to public/, using forward slashes.
const CONTENT = {
  'index/index.html':                     { route: null,               label: 'BUILD SYSTEMS / 2026', doc: 'BLUEPRINT CODE',                     metaKey: 'DIRECTION',      metaVal: 'UK — MONMOUTHSHIRE' },
  'about/about.html':                     { route: '/about',           label: 'ABOUT',                doc: 'ABOUT',                              metaKey: 'DIRECTION',      metaVal: 'UK — MONMOUTHSHIRE' },
  'configurators/configurators.html':     { route: '/configurators',   label: 'CONFIGURATORS',        doc: 'CONFIGURATORS &amp; COMMERCE TOOLS', metaKey: 'WORKED EXAMPLE', metaVal: 'PP-AV — 5 CONNECTED TOOLS' },
  'insights/insights.html':               { route: '/insights',        label: 'FIELD NOTES',          doc: 'FIELD NOTES',                        metaKey: 'ENTRIES',        metaVal: '2026 — 04 PUBLISHED' },
  'pricing/pricing.html':                 { route: '/pricing',         label: 'RATES 2026',           doc: 'SCHEDULE OF RATES',                  metaKey: 'ISSUE',          metaVal: '2026 — SHEETS 01/06' },
  'prototypes/prototypes.html':           { route: '/prototypes',      label: 'PROTOTYPE REGISTER',   doc: 'PROTOTYPE REGISTER',                 metaKey: 'ISSUE',          metaVal: '2026 — 03 ENTRIES' },
  'ppav-case-study/ppav-case-study.html': { route: '/ppav-case-study', label: 'DWG PP-AV',            doc: 'PP-AV DIGITAL SHOWROOM',             metaKey: 'DISCIPLINE',     metaVal: 'INTERACTIVE COMMERCE' },
};

// Nicer labels for known demo pages (optional; anything else is derived).
const DEMO_OVERRIDES = {
  'maison-cacao-demo-suite/index.html':            { label: 'DEMO SUITE',          doc: 'MAISON CACAO — DEMO SUITE' },
  'maison-cacao-dashboard-demo/index.html':        { label: 'COMMERCE OVERVIEW',   doc: 'MAISON CACAO — DASHBOARD' },
  'maison-cacao-order-operations/index.html':      { label: 'ORDER OPERATIONS',    doc: 'MAISON CACAO — OPERATIONS' },
  'maison-cacao-customer-segmentation/index.html': { label: 'CUSTOMER SEGMENTS',   doc: 'MAISON CACAO — SEGMENTATION' },
};

/* ---- helpers -------------------------------------------------------------- */
// The injection itself lives in scripts/lib/chrome.mjs so the CMS renders
// database demos with exactly the same chrome (src/cms/demos/render.ts).
function readPartial(name) {
  return stripPartialComment(readFileSync(join(PARTIALS, name), 'utf8'));
}

const HEADER_TPL = readPartial('site-header.html');
const FOOTER_TPL = readPartial('site-footer.html');

function toPosix(p) {
  return p.split(sep).join('/');
}

function metaFor(rel) {
  if (CONTENT[rel]) return CONTENT[rel];
  const folder = rel.split('/')[0];
  const base = rel.split('/').pop().replace(/.html$/i, '');
  const stem = folder === 'demos' ? base : folder;
  return metaFromSlug(stem, DEMO_OVERRIDES[rel] || {});
}

// Exact inline burger handler shipped in the 7 content pages — remove it so it
// does not double-toggle against site-chrome.js.
const INLINE_BURGER_RE =
  /\n?[ \t]*var burger = document\.querySelector\('\.burger'\);\s*if\s*\(burger\)\s*\{[\s\S]*?burger\.setAttribute\('aria-expanded',[^\n]*\);\s*\}\);\s*\}/;

/* ---- file walking --------------------------------------------------------- */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(full)) continue; // never process partials or iframe fragments
      walk(full, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

/* ---- main ----------------------------------------------------------------- */
const files = walk(PUBLIC);
const report = [];

for (const abs of files) {
  const rel = toPosix(relative(PUBLIC, abs));
  const isContent = Boolean(CONTENT[rel]);
  const meta = metaFor(rel);
  let html = readFileSync(abs, 'utf8');
  const warnings = [];

  // 1) strip the old inline burger handler (content pages)
  html = html.replace(INLINE_BURGER_RE, '');

  // 2) shared chrome (css link, header, footer, script) via scripts/lib/chrome.mjs
  const injected = injectChrome(html, meta, { headerTpl: HEADER_TPL, footerTpl: FOOTER_TPL, isContent });
  html = injected.html;
  warnings.push(...injected.warnings);
  writeFileSync(abs, html, 'utf8');
  report.push({ rel, kind: isContent ? 'content' : 'demo', label: meta.label, warnings });
}

/* ---- summary -------------------------------------------------------------- */
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log(`Injected shared chrome into ${report.length} page(s):\n`);
for (const r of report) {
  const warn = r.warnings.length ? `  ⚠ ${r.warnings.join(', ')}` : '';
  console.log(`  [${pad(r.kind, 7)}] ${pad(r.rel, 46)} label="${r.label}"${warn}`);
}
const problems = report.filter((r) => r.warnings.length);
// Only a content page missing its anchors is a real regression worth failing the
// build over — those pages are ours. Demo pages arrive through the /admin
// uploader, and one malformed upload must not be able to break every deploy; it
// is reported and left without chrome instead. /api/deploy-demo refuses fragments
// at upload time, so this is the backstop for demos committed another way.
// (The seven content pages now live as Next routes, so nothing under public/ is
// content today — this keeps the old strictness if one ever moves back.)
const blocking = problems.filter((r) => r.kind === 'content');
if (problems.length) {
  console.log(`\n${problems.length} page(s) had warnings — check the markers above.`);
}
if (blocking.length) {
  console.log(`${blocking.length} of them are content page(s) — failing the build.`);
  process.exitCode = 1;
} else if (!problems.length) {
  console.log('\nAll pages processed cleanly.');
}
