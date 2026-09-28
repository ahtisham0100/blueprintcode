/* Shared site chrome injection — the single implementation used by
 * scripts/inject-chrome.mjs (static pages under public/, at build time) and
 * by the CMS (database demos, at render time; src/cms/demos/render.ts).
 *
 * Idempotent: each block lives between <!--BPC:NAME:START/END--> markers and
 * is replaced when present, inserted when not. Pure: templates are passed in.
 */

export const CSS_LINK = '<link rel="stylesheet" href="/partials/site-chrome.css">';
export const JS_TAG = '<script defer src="/partials/site-chrome.js"></script>';
export const WATERMARK_TAG = '<script src="/partials/watermark.js" defer></script>';

const M = (name) => ({ start: `<!--BPC:${name}:START-->`, end: `<!--BPC:${name}:END-->` });
export const MARKERS = { ASSETS: M('ASSETS'), HEADER: M('HEADER'), FOOTER: M('FOOTER'), SCRIPT: M('SCRIPT') };

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function regionRe(marker) {
  return new RegExp(esc(marker.start) + '[\\s\\S]*?' + esc(marker.end));
}
function wrap(marker, block) {
  return `${marker.start}\n${block}\n${marker.end}`;
}
/** Replace an existing marker region if present, otherwise run insert(). */
export function upsert(html, marker, block, insert) {
  const re = regionRe(marker);
  const wrapped = wrap(marker, block);
  if (re.test(html)) return html.replace(re, wrapped);
  return insert(html, wrapped);
}

/** Strip the leading authoring comment from a partial file's contents. */
export function stripPartialComment(raw) {
  return raw.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();
}

export function buildHeader(headerTpl, meta) {
  let h = headerTpl.replace('__LABEL__', meta.label);
  if (meta.route) h = h.replace(`href="${meta.route}"`, `href="${meta.route}" aria-current="page"`);
  return h;
}

export function buildFooter(footerTpl, meta) {
  return footerTpl.replace('__DOC__', meta.doc).replace('__METAKEY__', meta.metaKey).replace('__METAVAL__', meta.metaVal);
}

/** Derive header/footer labels from a slug: "maison-cacao-demo" → "MAISON CACAO DEMO". */
export function metaFromSlug(slug, overrides = {}) {
  const derived = slug.replace(/[-_]+/g, ' ').replace(/\(\d+\)/g, '').trim().toUpperCase();
  return {
    route: null,
    label: overrides.label || derived,
    doc: overrides.doc || derived,
    metaKey: overrides.metaKey || 'FORMAT',
    metaVal: overrides.metaVal || 'LIVE DEMO',
  };
}

/**
 * Inject the chrome into a full HTML document.
 * @param {string} html
 * @param {{label:string, doc:string, metaKey:string, metaVal:string, route?:string|null}} meta
 * @param {{headerTpl:string, footerTpl:string, isContent?:boolean, watermark?:boolean}} opts
 * @returns {{html:string, warnings:string[]}}
 */
export function injectChrome(html, meta, opts) {
  const { headerTpl, footerTpl, isContent = false, watermark = false } = opts;
  const warnings = [];

  html = upsert(html, MARKERS.ASSETS, CSS_LINK, (h, wrapped) => {
    if (/<\/head>/i.test(h)) return h.replace(/<\/head>/i, `${wrapped}\n</head>`);
    warnings.push('no </head>');
    return h;
  });

  html = upsert(html, MARKERS.HEADER, buildHeader(headerTpl, meta), (h, wrapped) => {
    const native = /<header class="head">[\s\S]*?<\/header>/;
    if (isContent && native.test(h)) return h.replace(native, wrapped);
    if (/<body[^>]*>/i.test(h)) return h.replace(/(<body[^>]*>)/i, `$1\n${wrapped}`);
    warnings.push('no <body>');
    return h;
  });

  html = upsert(html, MARKERS.FOOTER, buildFooter(footerTpl, meta), (h, wrapped) => {
    const native = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;
    if (isContent && native.test(h)) return h.replace(native, wrapped);
    if (/<\/body>/i.test(h)) return h.replace(/<\/body>/i, `${wrapped}\n</body>`);
    warnings.push('no </body> (footer)');
    return h;
  });

  html = upsert(html, MARKERS.SCRIPT, JS_TAG, (h, wrapped) => {
    if (/<\/body>/i.test(h)) return h.replace(/<\/body>/i, `${wrapped}\n</body>`);
    warnings.push('no </body> (script)');
    return h;
  });

  if (watermark && !html.includes('/partials/watermark.js')) {
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${WATERMARK_TAG}\n</head>`);
    else warnings.push('no </head> (watermark)');
  }

  return { html, warnings };
}
