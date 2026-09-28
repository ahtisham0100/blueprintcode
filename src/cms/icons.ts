/* The CMS icon set: one source for the sidebar, the dashboard and any admin
   component. Drawn for this project in the blueprint line style: 24px grid,
   1.5 stroke, square caps, mitred joins, like Payload's own icons and the
   site's drafting motifs. Colour always comes from currentColor. Pure. */

import type { AdminCollectionSlug } from './collectionSlugs';

export const ICONS = {
  // collections
  posts: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6"/><path d="M9 15h6"/><path d="M9 18h3"/>',
  categories: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.25"/>',
  authors: '<circle cx="10" cy="7.5" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5"/><path d="M14 21l.8-3.2 5.2-5.2 2.4 2.4-5.2 5.2z"/>',
  demos: '<rect x="3" y="4" width="18" height="16"/><path d="M3 8h18"/><path d="M10 11v6l5-3z"/>',
  media: '<rect x="3" y="4" width="18" height="16"/><circle cx="8.5" cy="9.5" r="1.75"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
  redirects: '<path d="M4 7h10.5a4.5 4.5 0 0 1 0 9H6"/><path d="M9 13l-3 3 3 3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 13.9c2.1.9 3.5 3.1 3.5 6.1"/>',
  // actions and states
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  upload: '<path d="M12 15V4"/><path d="M7 8.5L12 4l5 4.5"/><path d="M4 15v5h16v-5"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
} as const;

export type IconName = keyof typeof ICONS;

export const COLLECTION_ICONS: Record<AdminCollectionSlug, IconName> = {
  posts: 'posts',
  categories: 'categories',
  authors: 'authors',
  demos: 'demos',
  media: 'media',
  redirects: 'redirects',
  users: 'users',
};

/** A complete SVG document for an icon. */
export function iconSvg(name: IconName, opts: { stroke?: string } = {}): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${opts.stroke ?? 'currentColor'}" ` +
    `stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${ICONS[name]}</svg>`
  );
}

/** CSS url() of the icon, drawn in black, for use as a mask (the element's colour shows through). */
export function iconDataUri(name: IconName): string {
  return `url("data:image/svg+xml,${encodeURIComponent(iconSvg(name, { stroke: '#000' }))}")`;
}

function maskRule(selector: string, name: IconName, size: number): string {
  const uri = iconDataUri(name);
  return (
    `${selector}{content:"";flex:0 0 ${size}px;width:${size}px;height:${size}px;display:inline-block;background-color:currentColor;` +
    `-webkit-mask-image:${uri};mask-image:${uri};-webkit-mask-size:contain;mask-size:contain;` +
    `-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}`
  );
}

/** Icons for the admin's own markup, attached by the element ids and classes Payload renders:
 *  sidebar links (#nav-<slug>), dashboard cards (#card-<slug>) and list page titles. */
export function collectionIconCss(): string {
  const rules: string[] = [];
  for (const [slug, name] of Object.entries(COLLECTION_ICONS) as [AdminCollectionSlug, IconName][]) {
    rules.push(maskRule(`#nav-${slug}::before`, name, 16));
    rules.push(maskRule(`#card-${slug} .card__title::before`, name, 22));
    rules.push(maskRule(`.collection-list--${slug} .list-header__title::before`, name, 26));
  }
  return rules.join('\n');
}
