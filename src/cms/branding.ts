/* Brand facts the admin panel is built from. Kept as data so the components,
   the Payload config and the tests share one source. */

export const CMS_BRAND = {
  /** Wordmark, as on the public site's header. */
  name: 'BLUEPRINT CODE AI',
  /** Small label next to the wordmark, like the site's per-page label. */
  label: 'CMS',
  /** Browser-tab title suffix for every admin page. */
  titleSuffix: ' · BPC CMS',
  /** Admin is dark-only: the blueprint palette has no light variant. */
  theme: 'dark',
  /** Square icon used in the nav and as favicon. Served from public/. */
  iconSrc: '/logo.png',
} as const;
