import { describe, expect, it } from 'vitest';
import { POSTS_PER_PAGE, blogPageHref, pageCount, parsePageParam } from './paginate';

describe('pagination helpers', () => {
  it('shows 12 posts per page and never fewer than one page', () => {
    expect(POSTS_PER_PAGE).toBe(12);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
    expect(pageCount(25, 12)).toBe(3);
  });

  it('parses only whole page numbers of 2 or more from the URL', () => {
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('10')).toBe(10);
    // Page 1 is /blog itself; anything else is not a page.
    for (const v of ['1', '0', '-3', '1.5', 'abc', '', undefined, '02', '2e1']) expect(parsePageParam(v)).toBeNull();
  });

  it('links page 1 to the base path and later pages under /page/n', () => {
    expect(blogPageHref('/blog', 1)).toBe('/blog');
    expect(blogPageHref('/blog', 0)).toBe('/blog');
    expect(blogPageHref('/blog', 3)).toBe('/blog/page/3');
    expect(blogPageHref('/blog/category/strategy', 2)).toBe('/blog/category/strategy/page/2');
  });
});
