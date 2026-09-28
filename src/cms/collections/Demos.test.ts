import { describe, expect, it, vi } from 'vitest';
import { Demos, keepOldUrl, readPublishedOrAdmin } from './Demos';
import { Redirects } from './Redirects';
import { isAdmin } from './Users';

const admin = { user: { id: 'a', role: 'admin', collection: 'users' } };
const writer = { user: { id: 'w', role: 'writer', collection: 'users' } };
const anon = { user: null };

type Field = { name?: string; type?: string; tabs?: { label: string; fields: Field[] }[]; fields?: Field[] };
function fieldNames(fields: Field[]): string[] {
  const out: string[] = [];
  for (const f of fields) {
    if (f.tabs) for (const t of f.tabs) out.push(...fieldNames(t.fields));
    else if (f.fields) out.push(...fieldNames(f.fields).map((n) => `${f.name}.${n}`));
    else if (f.name) out.push(f.name);
  }
  return out;
}

describe('Demos collection', () => {
  it('is admin-only to write, with drafts, versions and scheduled publishing', () => {
    expect(Demos.slug).toBe('demos');
    expect(Demos.access).toEqual({ create: isAdmin, read: readPublishedOrAdmin, update: isAdmin, delete: isAdmin });
    const v = Demos.versions as { drafts: { autosave: unknown; schedulePublish: boolean }; maxPerDoc: number };
    expect(v.drafts.schedulePublish).toBe(true);
    expect(v.drafts.autosave).toBeTruthy();
    expect(v.maxPerDoc).toBeGreaterThan(0);
  });

  it('lets the public read only published demos', () => {
    expect(readPublishedOrAdmin({ req: admin } as never)).toBe(true);
    expect(readPublishedOrAdmin({ req: writer } as never)).toEqual({ _status: { equals: 'published' } });
    expect(readPublishedOrAdmin({ req: anon } as never)).toEqual({ _status: { equals: 'published' } });
  });

  it('has the content, SEO and gallery fields in tabs', () => {
    const names = fieldNames(Demos.fields as Field[]);
    expect(names).toEqual(
      expect.arrayContaining([
        'title', 'slug', 'label', 'html',
        'seo.metaTitle', 'seo.description', 'seo.canonical', 'seo.noindex', 'seo.ogTitle', 'seo.ogDescription', 'seo.ogImage', 'seo.jsonLd',
        'gallery.show', 'gallery.summary', 'gallery.thumbnail', 'gallery.order',
      ]),
    );
    const tabs = (Demos.fields[0] as Field).tabs!.map((t) => t.label);
    expect(tabs).toEqual(['Content', 'SEO', 'Gallery']);
  });

  it('validates slug and html through the shared validators', () => {
    const names = fieldNames(Demos.fields as Field[]);
    expect(names).toContain('slug');
    const find = (n: string): { validate: (v: unknown) => true | string } => {
      const walk = (fs: Field[]): Field | undefined => {
        for (const f of fs) {
          if (f.name === n) return f;
          const inner = f.tabs ? f.tabs.flatMap((t) => t.fields) : f.fields;
          if (inner) {
            const r = walk(inner);
            if (r) return r;
          }
        }
      };
      return walk(Demos.fields as Field[]) as never;
    };
    expect(find('slug').validate('cms')).toMatch(/reserved/);
    expect(find('slug').validate('woodlawn')).toBe(true);
    expect(find('html').validate('<div/>')).toMatch(/full HTML/);
    expect(find('html').validate('<html><head></head><body></body></html>')).toBe(true);
  });

  it('writes a redirect when a published demo is renamed, once', async () => {
    const payload = { find: vi.fn(async () => ({ totalDocs: 0 })), create: vi.fn(async () => ({})) };
    const doc = { id: 7, slug: 'new-slug', _status: 'published' };
    await keepOldUrl({ doc, previousDoc: { slug: 'old-slug' }, operation: 'update', req: { payload } } as never);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'redirects', data: expect.objectContaining({ from: '/old-slug', to: '/new-slug', permanent: true }) }),
    );
    // Already exists → not duplicated
    payload.find.mockResolvedValueOnce({ totalDocs: 1 } as never);
    payload.create.mockClear();
    await keepOldUrl({ doc, previousDoc: { slug: 'older' }, operation: 'update', req: { payload } } as never);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('does not write redirects for drafts, creates, or unchanged slugs', async () => {
    const payload = { find: vi.fn(), create: vi.fn() };
    await keepOldUrl({ doc: { id: 1, slug: 'b', _status: 'draft' }, previousDoc: { slug: 'a' }, operation: 'update', req: { payload } } as never);
    await keepOldUrl({ doc: { id: 1, slug: 'b', _status: 'published' }, previousDoc: undefined, operation: 'create', req: { payload } } as never);
    await keepOldUrl({ doc: { id: 1, slug: 'b', _status: 'published' }, previousDoc: { slug: 'b' }, operation: 'update', req: { payload } } as never);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('Redirects collection', () => {
  it('is admin-only and validates paths', () => {
    expect(Redirects.slug).toBe('redirects');
    expect(Redirects.access).toEqual({ create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin });
    const from = Redirects.fields.find((f) => 'name' in f && f.name === 'from') as { validate: (v: unknown) => true | string; unique: boolean };
    const to = Redirects.fields.find((f) => 'name' in f && f.name === 'to') as { validate: (v: unknown) => true | string };
    expect(from.unique).toBe(true);
    expect(from.validate('old')).toMatch(/start with/);
    expect(from.validate('/old')).toBe(true);
    expect(to.validate('https://example.com/x')).toBe(true);
  });
});
