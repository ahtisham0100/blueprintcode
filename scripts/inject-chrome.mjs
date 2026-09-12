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

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const PARTIALS = join(PUBLIC, 'partials');
// Directories whose HTML must never receive the shared chrome. `capabilities`
// holds standalone fragments embedded as <iframe>s on the homepage; injecting a
// nav + footer into them would render the site chrome inside each card.
const SKIP_DIRS = new Set([PARTIALS, join(PUBLIC, 'capabilities')]);

/* ---- markers -------------------------------------------------------------- */
const M = (name) => ({
  start: `<!--BPC:${name}:START-->`,
  end: `<!--BPC:${name}:END-->`,
});
const ASSETS = M('ASSETS');
const HEADER = M('HEADER');
const FOOTER = M('FOOTER');
const SCRIPT = M('SCRIPT');

const CSS_LINK = '<link rel="stylesheet" href="/partials/site-chrome.css">';
const JS_TAG = '<script defer src="/partials/site-chrome.js"></script>';

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
function readPartial(name) {
  const raw = readFileSync(join(PARTIALS, name), 'utf8');
  // Drop the leading authoring comment so it is not injected into pages.
  return raw.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();
}

const HEADER_TPL = readPartial('site-header.html');
const FOOTER_TPL = readPartial('site-footer.html');

function toPosix(p) {
  return p.split(sep).join('/');
}

function metaFor(rel) {
  if (CONTENT[rel]) return CONTENT[rel];
  const folder = rel.split('/')[0];
  const base = rel.split('/').pop().replace(/\.html$/i, '');
  const stem = folder === 'demos' ? base : folder;
  const derived = stem.replace(/[-_]+/g, ' ').replace(/\(\d+\)/g, '').trim().toUpperCase();
  const o = DEMO_OVERRIDES[rel] || {};
  return {
    route: null,
    label: o.label || derived,
    doc: o.doc || derived,
    metaKey: o.metaKey || 'FORMAT',
    metaVal: o.metaVal || 'LIVE DEMO',
  };
}

function buildHeader(meta) {
  let h = HEADER_TPL.replace('__LABEL__', meta.label);
  if (meta.route) {
    h = h.replace(`href="${meta.route}"`, `href="${meta.route}" aria-current="page"`);
  }
  return h;
}

function buildFooter(meta) {
  return FOOTER_TPL
    .replace('__DOC__', meta.doc)
    .replace('__METAKEY__', meta.metaKey)
    .replace('__METAVAL__', meta.metaVal);
}

function regionRe(marker) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(esc(marker.start) + '[\\s\\S]*?' + esc(marker.end));
}

function wrap(marker, block) {
  return `${marker.start}\n${block}\n${marker.end}`;
}

/* Replace an existing marker region if present, otherwise run insert(). */
function upsert(html, marker, block, insert) {
  const re = regionRe(marker);
  const wrapped = wrap(marker, block);
  if (re.test(html)) return html.replace(re, wrapped);
  return insert(html, wrapped);
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

  // 2) CSS link in <head>
  html = upsert(html, ASSETS, CSS_LINK, (h, wrapped) => {
    if (/<\/head>/i.test(h)) return h.replace(/<\/head>/i, `${wrapped}\n</head>`);
    warnings.push('no </head>');
    return h;
  });

  // 3) header
  html = upsert(html, HEADER, buildHeader(meta), (h, wrapped) => {
    const native = /<header class="head">[\s\S]*?<\/header>/;
    if (isContent && native.test(h)) return h.replace(native, wrapped);
    if (/<body[^>]*>/i.test(h)) return h.replace(/(<body[^>]*>)/i, `$1\n${wrapped}`);
    warnings.push('no <body>');
    return h;
  });

  // 4) footer
  html = upsert(html, FOOTER, buildFooter(meta), (h, wrapped) => {
    const native = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;
    if (isContent && native.test(h)) return h.replace(native, wrapped);
    if (/<\/body>/i.test(h)) return h.replace(/<\/body>/i, `${wrapped}\n</body>`);
    warnings.push('no </body> (footer)');
    return h;
  });

  // 5) chrome script before </body>
  html = upsert(html, SCRIPT, JS_TAG, (h, wrapped) => {
    if (/<\/body>/i.test(h)) return h.replace(/<\/body>/i, `${wrapped}\n</body>`);
    warnings.push('no </body> (script)');
    return h;
  });

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
if (problems.length) {
  console.log(`\n${problems.length} page(s) had warnings — check the markers above.`);
  process.exitCode = 1;
} else {
  console.log('\nAll pages processed cleanly.');
}
