import { describe, expect, it, vi } from 'vitest';
import { googleSessionStrategy } from './strategy';
import { SESSION_COOKIE, signSession } from './session';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';

function fakePayload(user: Record<string, unknown> | null) {
  return {
    secret: SECRET,
    findByID: vi.fn(async () => {
      if (!user) throw new Error('NotFound');
      return user;
    }),
  };
}

const authed = (headers: Headers, payload: ReturnType<typeof fakePayload>) =>
  googleSessionStrategy.authenticate({ headers, payload } as never);

describe('googleSessionStrategy', () => {
  it('is registered under a stable name', () => {
    expect(googleSessionStrategy.name).toBe('google-session');
  });

  it('returns no user without our cookie', async () => {
    const p = fakePayload({ id: 'u1' });
    await expect(authed(new Headers(), p)).resolves.toEqual({ user: null });
    expect(p.findByID).not.toHaveBeenCalled();
  });

  it('returns no user for an invalid cookie', async () => {
    const p = fakePayload({ id: 'u1' });
    await expect(authed(new Headers({ cookie: `${SESSION_COOKIE}=nope` }), p)).resolves.toEqual({ user: null });
    expect(p.findByID).not.toHaveBeenCalled();
  });

  it('loads the user from the users collection for a valid cookie', async () => {
    const doc = { id: 'u1', email: 'a@blueprintcode.ai', role: 'admin', active: true };
    const p = fakePayload(doc);
    const token = await signSession({ userId: 'u1', email: doc.email }, SECRET);
    const res = await authed(new Headers({ cookie: `${SESSION_COOKIE}=${token}` }), p);
    expect(res).toEqual({ user: { collection: 'users', ...doc } });
    expect(p.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'users', id: 'u1', overrideAccess: true }));
  });

  it('refuses a user that has since been deactivated or deleted', async () => {
    const token = await signSession({ userId: 'u1', email: 'a@blueprintcode.ai' }, SECRET);
    const h = new Headers({ cookie: `${SESSION_COOKIE}=${token}` });
    await expect(authed(h, fakePayload({ id: 'u1', active: false }))).resolves.toEqual({ user: null });
    await expect(authed(h, fakePayload(null))).resolves.toEqual({ user: null });
  });
});
