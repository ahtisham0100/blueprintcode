/* The site header/footer templates, read from public/partials at runtime
   (next.config's outputFileTracingIncludes ships them to the serverless
   function). Cached per process. */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stripPartialComment } from '../../../scripts/lib/chrome.mjs';

let cached: { headerTpl: string; footerTpl: string } | undefined;

export function chromeTemplates(): { headerTpl: string; footerTpl: string } {
  if (cached) return cached;
  const dir = path.join(process.cwd(), 'public', 'partials');
  cached = {
    headerTpl: stripPartialComment(readFileSync(path.join(dir, 'site-header.html'), 'utf8')),
    footerTpl: stripPartialComment(readFileSync(path.join(dir, 'site-footer.html'), 'utf8')),
  };
  return cached;
}
