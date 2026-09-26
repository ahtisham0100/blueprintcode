import { describe, expect, it } from 'vitest';
import { CMS_COOKIE_PREFIX, CMS_DB_SCHEMA, CMS_ROUTES, cmsServerUrl } from './settings';
import { CMS_API_PATH, CMS_PATH } from '@/lib/adminHost';
import { SESSION_COOKIE } from './auth/session';

describe('cms settings', () => {
  it('mounts the admin at /cms and the API at /api/cms, and the proxy agrees', () => {
    expect(CMS_ROUTES).toEqual({ admin: '/cms', api: '/api/cms' });
    expect(CMS_PATH).toBe(CMS_ROUTES.admin);
    expect(CMS_API_PATH).toBe(CMS_ROUTES.api);
  });

  it('names the session cookie after the Payload cookie prefix so Payload logout clears it', () => {
    expect(CMS_COOKIE_PREFIX).toBe('bpc');
    expect(SESSION_COOKIE).toBe(`${CMS_COOKIE_PREFIX}-token`);
  });

  it('keeps Payload tables in their own schema, away from the existing leads table', () => {
    expect(CMS_DB_SCHEMA).toBe('cms');
    expect(CMS_DB_SCHEMA).not.toBe('public');
  });

  it('derives the admin origin from CMS_SERVER_URL with a local default', () => {
    expect(cmsServerUrl({ CMS_SERVER_URL: 'https://admin.blueprintcode.ai/' })).toBe('https://admin.blueprintcode.ai');
    expect(cmsServerUrl({})).toBe('http://admin.localhost:5000');
  });
});
