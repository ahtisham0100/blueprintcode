import { describe, expect, it } from 'vitest';
import { r2Config, r2Env } from './storage';

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
  it('names the missing variable instead of failing later with an opaque S3 error', () => {
    expect(() => r2Env({ ...env, R2_BUCKET: '' })).toThrow(/R2_BUCKET/);
    expect(() => r2Env({})).toThrow(/R2_ACCOUNT_ID/);
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
