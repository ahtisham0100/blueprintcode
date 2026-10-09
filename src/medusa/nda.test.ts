import { describe, expect, it } from 'vitest';
import { accessCodeMail, ndaMail, recipients } from './record';
import {
  accessCodeHash,
  generateAccessCode,
  isPartnerEmail,
  ndaCookie,
  ndaSecret,
  normaliseAccessCode,
  parseNdaInput,
  pendingCookie,
  readCookie,
  signNdaSession,
  signPendingAccess,
  verifyNdaSession,
  verifyPendingAccess,
} from './nda';

const SECRET = 'x'.repeat(40);
const NOW = 1_800_000_000;

describe('NDA input', () => {
  it('accepts a complete Instantly submission', () => {
    const r = parseNdaInput({ name: '  Ada   Lovelace ', email: 'Ada@Instantly.ai', accepted: true, nda_version: 'v1' });
    expect(r).toEqual({ ok: true, value: { name: 'Ada Lovelace', email: 'ada@instantly.ai', company: null, role: null, accepted: true, ndaVersion: 'v1' } });
  });
  it('keeps the optional company and role', () => {
    const r = parseNdaInput({ name: 'Ada', email: 'ada@instantly.ai', company: ' Instantly ', role: '', accepted: true });
    expect(r).toMatchObject({ ok: true, value: { company: 'Instantly', role: null } });
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
    expect(isPartnerEmail('x@blueprintcode.ai')).toBe(true);
    expect(isPartnerEmail('x@blueprintcode.ai.evil.com')).toBe(false);
    expect(isPartnerEmail('mikkalayese@gmail.com')).toBe(true);
    expect(isPartnerEmail('MikkaLayese@Gmail.com')).toBe(true);
    expect(isPartnerEmail('someone-else@gmail.com')).toBe(false);
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

describe('NDA notification email', () => {
  const base = { name: 'Ada Lovelace', email: 'ada@instantly.ai', company: 'Instantly', role: null, ndaVersion: 'v1', acceptedAt: '2026-10-05T14:58:18.435Z', ip: '1.2.3.4', userAgent: 'UA <x>' };
  it('composes a branded message for an Instantly signer', () => {
    const m = ndaMail(base);
    expect(m.subject).toBe('NDA signed: Ada Lovelace (ada@instantly.ai) — Medusa × Instantly');
    expect(m.html).toContain('has signed the NDA');
    expect(m.html).toContain('5 October 2026 at 15:58 UK');
    expect(m.html).toContain('UA &lt;x&gt;');
    expect(m.text).toContain('Signed by: Ada Lovelace');
  });
  it('includes the access code when one was issued', () => {
    expect(ndaMail(base, 'ABCD-EFGH').text).toContain('Access code: ABCD-EFGH');
    expect(ndaMail(base).text).not.toContain('Access code');
  });
  it('marks a Blueprint Code AI signer as an internal preview', () => {
    const m = ndaMail({ ...base, email: 'james@blueprintcode.ai' });
    expect(m.subject).toMatch(/^\[Internal preview\] /);
    expect(m.html).toContain('previewed the NDA gate');
  });
});

describe('Access codes', () => {
  const s = { name: 'Ada', email: 'ada@instantly.ai', ndaVersion: 'v2' };
  it('generates readable XXXX-XXXX codes that normalise back', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateAccessCode();
      expect(c).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
      expect(normaliseAccessCode(c)).toBe(c.replace('-', ''));
    }
  });
  it('ignores case, spaces and dashes, and rejects anything else', () => {
    expect(normaliseAccessCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(normaliseAccessCode('ABCD EFGH')).toBe('ABCDEFGH');
    expect(normaliseAccessCode('ABCDEFG')).toBeNull();
    expect(normaliseAccessCode('ABCDEFG0')).toBeNull();
    expect(normaliseAccessCode(42)).toBeNull();
  });
  it('hashes with the secret', async () => {
    expect(await accessCodeHash('ABCDEFGH', SECRET)).toMatch(/^[0-9a-f]{64}$/);
    expect(await accessCodeHash('ABCDEFGH', SECRET)).not.toBe(await accessCodeHash('ABCDEFGH', 'y'.repeat(40)));
  });
  it('redeems the pending cookie only with its own code, for a week', async () => {
    const h = await accessCodeHash('ABCDEFGH', SECRET);
    const t = await signPendingAccess({ ...s, codeHash: h }, SECRET, NOW);
    expect(await verifyPendingAccess(t, h, SECRET, NOW + 60)).toEqual(s);
    expect(await verifyPendingAccess(t, await accessCodeHash('ABCDEFGJ', SECRET), SECRET, NOW)).toBeNull();
    expect(await verifyPendingAccess(t, h, SECRET, NOW + 7 * 86400 + 1)).toBeNull();
    // A pending token never opens the room on its own.
    expect(await verifyNdaSession(t, SECRET, NOW)).toBeNull();
  });
  it('scopes the pending cookie to the access endpoint', () => {
    expect(pendingCookie('tok', false)).toBe('bpc_medusa_pending=tok; Path=/api/medusa-instantly/access; HttpOnly; SameSite=Lax; Max-Age=604800');
  });
  it('emails the code with a link back to the gate', () => {
    const m = accessCodeMail('Ada Lovelace', 'ABCD-EFGH');
    expect(m.subject).toContain('ABCD-EFGH');
    expect(m.html).toContain('Your access code, Ada');
    expect(m.html).toContain('/medusa-instantly?access=code');
  });
});

describe('Access code email delivery', () => {
  it('BCCs the notification recipients, but not the signer themself', async () => {
    const { emailAccessCode } = await import('./record');
    const calls: { to: string[]; bcc?: string[] }[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    try {
      const env = { RESEND_API_KEY: 'k', MEDUSA_NDA_NOTIFY_TO: 'james@blueprintcode.ai, ops@blueprintcode.ai' } as unknown as NodeJS.ProcessEnv;
      expect(await emailAccessCode('ada@instantly.ai', 'Ada', 'ABCD-EFGH', env)).toBe('sent');
      expect(await emailAccessCode('james@blueprintcode.ai', 'James', 'ABCD-EFGH', env)).toBe('sent');
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(calls[0]).toMatchObject({ to: ['ada@instantly.ai'], bcc: ['james@blueprintcode.ai', 'ops@blueprintcode.ai'] });
    expect(calls[1]).toMatchObject({ to: ['james@blueprintcode.ai'], bcc: ['ops@blueprintcode.ai'] });
  });
});
