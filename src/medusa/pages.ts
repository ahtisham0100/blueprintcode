/* The two partner pages are hand-built HTML documents kept verbatim in this
   folder (their design is the deliverable), served by route handlers so they
   skip the site's React layout, header and footer. Listed in next.config's
   outputFileTracingIncludes so they ship with the serverless functions. */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src', 'medusa');
const cache = new Map<string, string>();

function load(file: string): string {
  // Re-read in dev so an edit to the HTML shows up without a restart.
  const cached = cache.get(file);
  if (cached && process.env.NODE_ENV === 'production') return cached;
  const html = readFileSync(path.join(DIR, file), 'utf8');
  cache.set(file, html);
  return html;
}

export const partnershipHtml = () => load('partnership.html');
export const partnerRoomHtml = () => load('partner-room.html');

/** Private pages: never indexed, never kept by a shared cache. */
export const PRIVATE_HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'private, no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive',
} as const;
