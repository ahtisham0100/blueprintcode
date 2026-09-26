import { describe, expect, it } from 'vitest';
import { Users, isAdmin, isAdminOrSelf } from './Users';

const adminReq = { user: { id: 'a', role: 'admin', collection: 'users' } };
const writerReq = { user: { id: 'w', role: 'writer', collection: 'users' } };
const anon = { user: null };

describe('Users collection', () => {
  it('is the admin auth collection, with local (password) auth disabled and only our strategy', () => {
    expect(Users.slug).toBe('users');
    const auth = Users.auth as { disableLocalStrategy: boolean; strategies: { name: string }[] };
    expect(auth.disableLocalStrategy).toBe(true);
    expect(auth.strategies.map((s) => s.name)).toEqual(['google-session']);
  });

  it('has email, role and active fields with safe defaults', () => {
    const names = Users.fields.map((f) => ('name' in f ? f.name : '')).filter(Boolean);
    expect(names).toEqual(expect.arrayContaining(['email', 'name', 'role', 'active']));
    const role = Users.fields.find((f) => 'name' in f && f.name === 'role') as { options: { value: string }[]; defaultValue: string };
    expect(role.options.map((o) => o.value)).toEqual(['admin', 'writer']);
    expect(role.defaultValue).toBe('writer');
    const active = Users.fields.find((f) => 'name' in f && f.name === 'active') as { defaultValue: boolean };
    expect(active.defaultValue).toBe(true);
  });

  it('only admins manage users; writers may read themselves', () => {
    expect(isAdmin({ req: adminReq } as never)).toBe(true);
    expect(isAdmin({ req: writerReq } as never)).toBe(false);
    expect(isAdmin({ req: anon } as never)).toBe(false);

    expect(isAdminOrSelf({ req: adminReq } as never)).toBe(true);
    expect(isAdminOrSelf({ req: writerReq } as never)).toEqual({ id: { equals: 'w' } });
    expect(isAdminOrSelf({ req: anon } as never)).toBe(false);

    expect(Users.access).toEqual({ create: isAdmin, delete: isAdmin, read: isAdminOrSelf, update: isAdmin, admin: expect.any(Function) });
  });

  it('lets only active users into the admin panel', () => {
    const adminGate = Users.access!.admin as (args: { req: { user: unknown } }) => boolean;
    expect(adminGate({ req: { user: { id: 'a', role: 'writer', active: true } } })).toBe(true);
    expect(adminGate({ req: { user: { id: 'a', role: 'admin', active: false } } })).toBe(false);
    expect(adminGate({ req: { user: null } })).toBe(false);
  });
});
