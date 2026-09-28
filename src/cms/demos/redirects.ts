/* When a published demo's slug changes, its old URL must keep working. Pure
   planner; the Demos afterChange hook writes the redirect row. */

export type SlugChange = { from: string; to: string; permanent: true } | null;

export function redirectForSlugChange(previous: { slug?: string | null } | undefined, next: { slug?: string | null }): SlugChange {
  const from = previous?.slug;
  const to = next.slug;
  if (!from || !to || from === to) return null;
  return { from: `/${from}`, to: `/${to}`, permanent: true };
}

/** Redirect rows are site paths ("/old") or absolute URLs for `to`. */
export function validateRedirectPath(value: unknown, opts: { allowAbsolute?: boolean } = {}): string | null {
  if (typeof value !== 'string' || !value) return 'Required.';
  if (opts.allowAbsolute && /^https?:\/\//i.test(value)) return null;
  if (!value.startsWith('/')) return 'Must start with "/".';
  if (/\s/.test(value)) return 'No spaces.';
  if (value.startsWith('//')) return 'Not a valid site path.';
  return null;
}
