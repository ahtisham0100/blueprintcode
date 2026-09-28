import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NOT_FOUND_PAGE_PATH } from './route';
import { RESERVED_SLUGS } from '@/cms/demos/slug';

describe('[slug] route 404 fallback', () => {
  it('points at a routable page (no underscore-prefixed, i.e. private, folder)', () => {
    expect(NOT_FOUND_PAGE_PATH.startsWith('/_')).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'src/app/(site)', NOT_FOUND_PAGE_PATH.slice(1), 'page.tsx'))).toBe(true);
  });
  it('reserves that path so no demo can be published on top of it', () => {
    expect(RESERVED_SLUGS.has(NOT_FOUND_PAGE_PATH.slice(1))).toBe(true);
  });
});
