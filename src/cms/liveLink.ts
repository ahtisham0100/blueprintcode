/* What the "View live" control in a post's or demo's edit header shows.
   Pure; components/LiveLink.client.tsx supplies the document state. The
   link always uses the PUBLISHED slug (a rename saved only as a draft is
   not live yet). */

export function liveUrl(opts: { siteUrl: string; pathPrefix: string; slug: string }): string {
  const prefix = opts.pathPrefix.replace(/^\/+|\/+$/g, '');
  return `${opts.siteUrl.replace(/\/+$/, '')}/${prefix ? `${prefix}/` : ''}${opts.slug}`;
}

export type LiveLinkState = { kind: 'none' } | { kind: 'live'; href: string } | { kind: 'off'; href: string; reason: string };

export function liveLinkState(opts: {
  siteUrl: string;
  pathPrefix: string;
  hasPublishedDoc: boolean;
  publishedSlug: string | null | undefined;
  sectionPublic: boolean;
  flagName?: string;
}): LiveLinkState {
  if (!opts.hasPublishedDoc || !opts.publishedSlug) return { kind: 'none' };
  const href = liveUrl({ siteUrl: opts.siteUrl, pathPrefix: opts.pathPrefix, slug: opts.publishedSlug });
  if (opts.sectionPublic) return { kind: 'live', href };
  return { kind: 'off', href, reason: `Published, but not on the site yet: ${opts.flagName ?? 'the section'} is off.` };
}
