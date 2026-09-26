import { describe, expect, it } from 'vitest';
import { checkDatabaseTarget } from '../scripts/db-guard.mjs';

const DEV = 'ep-dev-1234-pooler.c-2.eu-west-2.aws.neon.tech';
const PROD = 'ep-prod-9999-pooler.c-2.eu-west-2.aws.neon.tech';
const url = (host: string) => `postgresql://user:pw@${host}/neondb?sslmode=require`;

describe('db-guard', () => {
  it('allows the development branch', () => {
    expect(checkDatabaseTarget({ DATABASE_URL: url(DEV), DEV_DATABASE_HOST: DEV }).ok).toBe(true);
  });

  it('refuses any other host locally, naming both hosts', () => {
    const r = checkDatabaseTarget({ DATABASE_URL: url(PROD), DEV_DATABASE_HOST: DEV });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain(PROD);
    expect(r.reason).toContain(DEV);
  });

  it('refuses when the dev host is not configured, rather than guessing', () => {
    expect(checkDatabaseTarget({ DATABASE_URL: url(DEV) }).ok).toBe(false);
    expect(checkDatabaseTarget({ DEV_DATABASE_HOST: DEV }).ok).toBe(false);
  });

  it('lets Vercel builds through (that is where production migrations run)', () => {
    expect(checkDatabaseTarget({ VERCEL: '1', DATABASE_URL: url(PROD) }).ok).toBe(true);
  });

  it('allows a deliberate one-off against production with ALLOW_PROD_DB=1', () => {
    expect(checkDatabaseTarget({ DATABASE_URL: url(PROD), DEV_DATABASE_HOST: DEV, ALLOW_PROD_DB: '1' }).ok).toBe(true);
  });
});
