import { describe, expect, it } from 'vitest';
import { parseAdminHosts, resolveAdminRequest, adminResponseHeaders } from './adminHost';

const ADMIN = ['admin.blueprintcode.ai'];
const SITE = 'https://blueprintcode.ai';

function resolve(host: string, pathname: string, adminHosts = ADMIN) {
  return resolveAdminRequest({ host, pathname, adminHosts, siteUrl: SITE });
}

describe('parseAdminHosts', () => {
  it('returns an empty list when the env var is unset or blank', () => {
    expect(parseAdminHosts(undefined)).toEqual([]);
    expect(parseAdminHosts('')).toEqual([]);
    expect(parseAdminHosts('  ')).toEqual([]);
  });

  it('splits a comma-separated list, trims, lowercases and drops ports', () => {
    expect(parseAdminHosts(' Admin.BluePrintCode.ai , admin.localhost:5000 ,,')).toEqual([
      'admin.blueprintcode.ai',
      'admin.localhost',
    ]);
  });
});

describe('resolveAdminRequest on the main site', () => {
  it('lets public pages, the old /admin and its APIs through untouched', () => {
    for (const p of ['/', '/about', '/prototypes', '/some-demo', '/admin', '/admin/leads', '/api/deploy-demo', '/api/contact']) {
      expect(resolve('blueprintcode.ai', p)).toEqual({ kind: 'next' });
    }
  });

  it('hides the new CMS: /cms and /api/cms do not exist on the main domain', () => {
    for (const p of ['/cms', '/cms/', '/cms/collections/demos', '/api/cms', '/api/cms/users/login']) {
      expect(resolve('blueprintcode.ai', p)).toEqual({ kind: 'notFound' });
    }
  });

  it('does not confuse look-alike paths with the CMS', () => {
    expect(resolve('blueprintcode.ai', '/cmsx')).toEqual({ kind: 'next' });
    expect(resolve('blueprintcode.ai', '/api/cmsx')).toEqual({ kind: 'next' });
    expect(resolve('blueprintcode.ai', '/pricing/cms')).toEqual({ kind: 'next' });
  });

  it('treats www and every other non-admin host as the main site', () => {
    expect(resolve('www.blueprintcode.ai', '/cms')).toEqual({ kind: 'notFound' });
    expect(resolve('bpcode.vercel.app', '/about')).toEqual({ kind: 'next' });
  });

  it('treats every host as the main site when no admin host is configured', () => {
    expect(resolve('admin.blueprintcode.ai', '/', [])).toEqual({ kind: 'next' });
    expect(resolve('admin.blueprintcode.ai', '/cms', [])).toEqual({ kind: 'notFound' });
  });
});

describe('resolveAdminRequest on the admin host', () => {
  it('serves the CMS at the root of the admin host', () => {
    expect(resolve('admin.blueprintcode.ai', '/')).toEqual({ kind: 'rewrite', to: '/cms' });
  });

  it('passes CMS pages and the CMS API straight through', () => {
    for (const p of ['/cms', '/cms/login', '/cms/collections/demos', '/api/cms', '/api/cms/users/me']) {
      expect(resolve('admin.blueprintcode.ai', p)).toEqual({ kind: 'next' });
    }
  });

  it('serves a private robots.txt for the admin host', () => {
    expect(resolve('admin.blueprintcode.ai', '/robots.txt')).toEqual({ kind: 'rewrite', to: '/cms/robots.txt' });
  });

  it('sends every public page, the old /admin and its APIs back to the main site permanently', () => {
    for (const p of ['/about', '/prototypes', '/some-demo', '/admin', '/admin/leads', '/api/contact', '/api/deploy-demo', '/sitemap.xml']) {
      expect(resolve('admin.blueprintcode.ai', p)).toEqual({ kind: 'redirect', to: `${SITE}${p}`, status: 301 });
    }
  });

  it('keeps the query string when redirecting', () => {
    expect(
      resolveAdminRequest({ host: 'admin.blueprintcode.ai', pathname: '/about', search: '?utm=x', adminHosts: ADMIN, siteUrl: SITE }),
    ).toEqual({ kind: 'redirect', to: `${SITE}/about?utm=x`, status: 301 });
  });

  it('matches the host case-insensitively and ignores the port', () => {
    expect(resolve('ADMIN.blueprintcode.ai', '/')).toEqual({ kind: 'rewrite', to: '/cms' });
    expect(resolve('admin.localhost:5000', '/', ['admin.localhost'])).toEqual({ kind: 'rewrite', to: '/cms' });
  });

  it('accepts any host in the configured list (for preview deployments)', () => {
    const hosts = ['admin.blueprintcode.ai', 'admin-preview.blueprintcode.ai'];
    expect(resolve('admin-preview.blueprintcode.ai', '/', hosts)).toEqual({ kind: 'rewrite', to: '/cms' });
  });

  it('handles a missing host header as the main site', () => {
    expect(resolve('', '/cms')).toEqual({ kind: 'notFound' });
  });
});

describe('adminResponseHeaders', () => {
  it('marks admin responses noindex and uncacheable', () => {
    expect(adminResponseHeaders()).toEqual({
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    });
  });
});
