import { describe, expect, it } from 'vitest';
import { recipients } from './record';
import { isPartnerEmail, ndaCookie, ndaSecret, parseNdaInput, readCookie, signNdaSession, verifyNdaSession } from './nda';

const SECRET = 'x'.repeat(40);
const NOW = 1_800_000_000;

describe('NDA input', () => {
  it('accepts a complete Instantly submission', () => {
    const r = parseNdaInput({ name: '  Ada   Lovelace ', email: 'Ada@Instantly.ai', accepted: true, nda_version: 'v1' });
    expect(r).toEqual({ ok: true, value: { name: 'Ada Lovelace', email: 'ada@instantly.ai', accepted: true, ndaVersion: 'v1' } });
  });
  it('rejects non-Instantly addresses, missing names and an unticked box', () => {
    expect(parseNdaInput({ name: 'A', email: 'a@gmail.com', accepted: true })).toMatchObject({ ok: false });
    expect(parseNdaInput({ name: 'A', email: 'a@instantly.ai.evil.com', accepted: true })).toMatchObject({ ok: false });
    expect(parseNdaInput({ name: '', email: 'a@instantly.ai', accepted: true })).toMatchObject({ ok: false });
    expect(parseNdaInput({ name: 'A', email: 'a@instantly.ai', accepted: false })).toMatchObject({ ok: false });
    expect(parseNdaInput(null)).toMatchObject({ ok: false });
  });
  it('checks the domain exactly', () => {
    expect(isPartnerEmail('x@instantly.ai')).toBe(true);
    expect(isPartnerEmail('x@sub.instantly.ai')).toBe(false);
    expect(isPartnerEmail('x@notinstantly.ai')).toBe(false);
    expect(isPartnerEmail('x@y@instantly.ai')).toBe(false);
  });
});

describe('NDA session', () => {
  const s = { name: 'Ada', email: 'ada@instantly.ai', ndaVersion: 'v1' };
  it('round-trips and expires after a day', async () => {
    const t = await signNdaSession(s, SECRET, NOW);
    expect(await verifyNdaSession(t, SECRET, NOW + 60)).toEqual(s);
    expect(await verifyNdaSession(t, SECRET, NOW + 86400 + 1)).toBeNull();
  });
  it('rejects the wrong secret, garbage and empty tokens', async () => {
    const t = await signNdaSession(s, SECRET, NOW);
    expect(await verifyNdaSession(t, 'y'.repeat(40), NOW)).toBeNull();
    expect(await verifyNdaSession('not.a.jwt', SECRET, NOW)).toBeNull();
    expect(await verifyNdaSession(null, SECRET, NOW)).toBeNull();
  });
  it('writes a scoped HttpOnly cookie and reads it back', () => {
    const c = ndaCookie('tok', true);
    expect(c).toBe('bpc_medusa_nda=tok; Path=/medusa-instantly; HttpOnly; SameSite=Lax; Max-Age=86400; Secure');
    expect(readCookie('a=1; bpc_medusa_nda=tok; b=2', 'bpc_medusa_nda')).toBe('tok');
    expect(readCookie(null, 'bpc_medusa_nda')).toBeNull();
  });
  it('takes MEDUSA_NDA_SECRET over PAYLOAD_SECRET and refuses to run without either', () => {
    const env = (o: Record<string, string>) => o as NodeJS.ProcessEnv;
    expect(ndaSecret(env({ MEDUSA_NDA_SECRET: 'a'.repeat(20), PAYLOAD_SECRET: 'b'.repeat(20) }))).toBe('a'.repeat(20));
    expect(ndaSecret(env({ PAYLOAD_SECRET: 'b'.repeat(20) }))).toBe('b'.repeat(20));
    expect(() => ndaSecret(env({}))).toThrow();
  });
});

describe('NDA notification recipients', () => {
  it('defaults to James and accepts a comma-separated list', () => {
    expect(recipients(undefined)).toEqual(['james@blueprintcode.ai']);
    expect(recipients(' ')).toEqual(['james@blueprintcode.ai']);
    expect(recipients('a@x.com, b@x.com,,c@x.com ')).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });
});
