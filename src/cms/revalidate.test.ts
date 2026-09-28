import { describe, expect, it, vi } from 'vitest';
import { isOutsideNextRequest, revalidateTargets } from './revalidate';

describe('revalidateTargets', () => {
  it('passes targets through and does nothing for an empty list', async () => {
    const run = vi.fn(async () => {});
    const logger = { warn: vi.fn() };
    await revalidateTargets([], logger, run);
    expect(run).not.toHaveBeenCalled();
    await revalidateTargets([{ path: '/blog' }, { path: '/blog/[slug]', type: 'page' }], logger, run);
    expect(run).toHaveBeenCalledWith([{ path: '/blog' }, { path: '/blog/[slug]', type: 'page' }]);
  });

  it('stays quiet outside a Next request (CLI scripts) but logs real failures', async () => {
    const logger = { warn: vi.fn() };
    await revalidateTargets([{ path: '/blog' }], logger, async () => {
      throw new Error('Invariant: static generation store missing in revalidatePath /blog');
    });
    expect(logger.warn).not.toHaveBeenCalled();
    await revalidateTargets([{ path: '/blog' }], logger, async () => {
      throw new Error('boom');
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ msg: 'cms: could not revalidate', err: 'Error: boom' }));
    expect(isOutsideNextRequest(new Error('x'))).toBe(false);
  });
});
