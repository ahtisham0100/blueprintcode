/* CMS constants shared by payload.config.ts and the proxy/routing code, so the
   two can never disagree about where the CMS lives. Kept dependency-free
   (importing payload.config pulls in Payload, sharp and Lexical). */

/** Payload routes. The proxy exposes exactly these on the admin host. */
export const CMS_ROUTES = { admin: '/cms', api: '/api/cms' } as const;

/** Prefix for Payload's cookies → the session cookie is `bpc-token`. */
export const CMS_COOKIE_PREFIX = 'bpc';

/** Postgres schema that holds every Payload table, away from `public.leads`. */
export const CMS_DB_SCHEMA = 'cms';

/** Origin of the admin host, from CMS_SERVER_URL, without a trailing slash. */
export function cmsServerUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.CMS_SERVER_URL ?? 'http://admin.localhost:5000').replace(/\/$/, '');
}
