/* Host-based split between the public site and the new CMS.
 *
 * The CMS (Payload, mounted at /cms with its API at /api/cms) is only
 * reachable on the admin host(s) listed in ADMIN_HOST — e.g.
 * admin.blueprintcode.ai in production, admin.localhost for `next dev`. On
 * the main domain those paths do not exist, so demo HTML pasted into the CMS
 * can never run on the same origin as an admin session.
 *
 * Kept free of Next imports so the rules are plain-function testable; proxy.ts
 * turns the result into a NextResponse. The old /admin (password-gated, commits
 * to GitHub) is deliberately untouched until the CMS replaces it.
 */

import { CMS_ROUTES } from '@/cms/settings';

export const CMS_PATH: string = CMS_ROUTES.admin;
export const CMS_API_PATH: string = CMS_ROUTES.api;

export type AdminDecision =
  | { kind: 'next' }
  | { kind: 'notFound' }
  | { kind: 'rewrite'; to: string }
  | { kind: 'redirect'; to: string; status: 301 };

/** Parse ADMIN_HOST: comma-separated, case-insensitive, ports ignored. */
export function parseAdminHosts(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((h) => normalizeHost(h))
    .filter(Boolean);
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '');
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export function resolveAdminRequest(input: {
  host: string;
  pathname: string;
  search?: string;
  adminHosts: string[];
  siteUrl: string;
}): AdminDecision {
  const { pathname, adminHosts, siteUrl } = input;
  const isCmsPath = isUnder(pathname, CMS_PATH) || isUnder(pathname, CMS_API_PATH);
  const onAdminHost = adminHosts.includes(normalizeHost(input.host));

  if (!onAdminHost) {
    return isCmsPath ? { kind: 'notFound' } : { kind: 'next' };
  }

  if (isCmsPath) return { kind: 'next' };
  if (pathname === '/') return { kind: 'rewrite', to: CMS_PATH };
  if (pathname === '/robots.txt') return { kind: 'rewrite', to: `${CMS_PATH}/robots.txt` };

  // Anything else on the admin host is a public page that would otherwise be a
  // duplicate of the main site: send it home for good.
  return { kind: 'redirect', to: `${siteUrl}${pathname}${input.search ?? ''}`, status: 301 };
}

/** Response headers for everything served on the admin host. */
export function adminResponseHeaders(): Record<string, string> {
  return {
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
  };
}
