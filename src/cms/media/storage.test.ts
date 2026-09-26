import { describe, expect, it } from 'vitest';
import { r2Config, r2Env, resolveR2 } from './storage';

const env = {
  R2_ACCOUNT_ID: 'acct123',
  R2_ACCESS_KEY_ID: 'AKIA',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'blueprintcode-media-dev',
};

describe('r2Env', () => {
  it('reads the four R2 variables', () => {
    expect(r2Env(env)).toEqual({ accountId: 'acct123', accessKeyId: 'AKIA', secretAccessKey: 'secret', bucket: 'blueprintcode-media-dev' });
  });
  it('accepts the S3 API URL Cloudflare displays and reduces it to the bucket name', () => {
    expect(r2Env({ ...env, R2_BUCKET: 'https://acct123.r2.cloudflarestorage.com/bpc-cms' }).bucket).toBe('bpc-cms');
    expect(r2Env({ ...env, R2_BUCKET: 'https://acct123.r2.cloudflarestorage.com/bpc-cms/' }).bucket).toBe('bpc-cms');
    expect(() => r2Env({ ...env, R2_BUCKET: 'https://acct123.r2.cloudflarestorage.com/' })).toThrow(/R2_BUCKET/);
  });

  it('names the missing variable instead of failing later with an opaque S3 error', () => {
    expect(() => r2Env({ ...env, R2_BUCKET: '' })).toThrow(/R2_BUCKET/);
    expect(() => r2Env({})).toThrow(/R2_ACCOUNT_ID/);
  });
});

describe('resolveR2', () => {
  it('reports configured with real values', () => {
    expect(resolveR2(env)).toEqual({ r2: r2Env(env), configured: true });
  });
  it('falls back to placeholders instead of disabling the plugin, so the schema never depends on env', () => {
    // The storage plugin adds columns to the media table; a build without
    // R2_* must still produce the same schema as one with them.
    const out = resolveR2({});
    expect(out.configured).toBe(false);
    expect(out.r2.bucket).toBe('unconfigured');
    expect(() => r2Config(out.r2)).not.toThrow();
  });
});

describe('r2Config', () => {
  it('targets the account S3 endpoint with the settings R2 requires', () => {
    const c = r2Config(r2Env(env));
    expect(c.endpoint).toBe('https://acct123.r2.cloudflarestorage.com');
    expect(c.region).toBe('auto');
    expect(c.forcePathStyle).toBe(true);
    expect(c.credentials).toEqual({ accessKeyId: 'AKIA', secretAccessKey: 'secret' });
  });
});
