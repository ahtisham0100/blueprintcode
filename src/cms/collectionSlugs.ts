/* Every collection slug shown in the admin, dependency-free (payload.config
   pulls in Payload, sharp and Lexical). Tests check it against the config. */

export const ADMIN_COLLECTION_SLUGS = ['posts', 'categories', 'authors', 'demos', 'media', 'redirects', 'users'] as const;
export type AdminCollectionSlug = (typeof ADMIN_COLLECTION_SLUGS)[number];

export default ADMIN_COLLECTION_SLUGS;
