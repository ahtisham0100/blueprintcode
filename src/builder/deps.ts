/* Real wiring for the builder API and pages: env vars, Neon, Resend and the
   built app page on disk. Nothing here is unit-tested; the logic it feeds
   is (api.test.ts, pages.test.ts). */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cmsServerUrl, publicSiteOrigin } from '@/cms/settings';
import type { ApiDeps } from './api';
import { resendMailer } from './mail';
import type { PageDeps } from './pages';
import { builderSecret } from './settings';
import { neonStore, type BuilderStore } from './store';

let store: BuilderStore | null = null;
export function builderStore(): BuilderStore {
  store ??= neonStore();
  return store;
}

/** The origin the browser used, from the Host header (req.url is normalised
 *  to localhost in dev). */
function arrivalOrigin(req: Request): string | null {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return null;
  const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function apiDeps(req: Request): ApiDeps {
  const siteOrigin = publicSiteOrigin();
  const arrival = arrivalOrigin(req);
  return {
    store: builderStore(),
    mail: resendMailer(),
    secret: builderSecret(),
    siteOrigin,
    alsoAllowOrigins: arrival ? [arrival] : [],
    cmsOrigin: cmsServerUrl(),
    secure: siteOrigin.startsWith('https://'),
    from: process.env.BUILDER_FROM || process.env.LEADS_FROM || 'Blueprint Code AI <onboarding@resend.dev>',
    notifyTo: process.env.BUILDER_NOTIFY_TO || process.env.LEADS_NOTIFY_TO || 'hello@blueprintcode.ai',
    now: () => new Date(),
    devLinksInLog: process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY,
  };
}

const APP_FILE = path.join(process.cwd(), 'builder', 'dist', 'blueprint-builder.html');
let appCache: string | null = null;

function appHtml(): string | null {
  // Re-read in dev so `node builder/build.mjs` shows up without a restart.
  if (appCache && process.env.NODE_ENV === 'production') return appCache;
  try {
    appCache = readFileSync(APP_FILE, 'utf8');
    return appCache;
  } catch {
    return null;
  }
}

export function pageDeps(): PageDeps {
  const siteOrigin = publicSiteOrigin();
  return { secret: builderSecret(), secure: siteOrigin.startsWith('https://'), siteOrigin, appHtml };
}
