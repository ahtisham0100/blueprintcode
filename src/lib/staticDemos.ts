/* The legacy static demos: public/<slug>/index.html, served at /<slug>.
 *
 * next.config.ts turns this list into an explicit afterFiles rewrite, so
 * only these slugs are rewritten to their index.html. Every other
 * single-segment path reaches the dynamic [slug] route, where demos
 * published from the CMS live. When a slug exists in both, the static file
 * wins — the intended order until the static demos are retired. */

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** public/ folders that hold no standalone page. */
export const NON_DEMO_DIRS = new Set(['partials', 'assets', 'media', 'capabilities']);

export function listStaticDemoSlugs(publicDir: string): string[] {
  if (!existsSync(publicDir)) return [];
  return readdirSync(publicDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !NON_DEMO_DIRS.has(d.name) && existsSync(path.join(publicDir, d.name, 'index.html')))
    .map((d) => d.name)
    .sort();
}

function escapeForPathToRegexp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** path-to-regexp source matching exactly these slugs, or null when none. */
export function staticDemoRewriteSource(slugs: string[]): string | null {
  if (!slugs.length) return null;
  return `/:slug(${slugs.map(escapeForPathToRegexp).join('|')})`;
}
