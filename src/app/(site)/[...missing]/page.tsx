import { notFound } from 'next/navigation';

/* Catch-all so an unmatched URL renders the site's own 404 (not-found.tsx,
   inside the site layout). Needed since the app has two root layouts —
   (site)/ and (cms)/ — and Next cannot pick one for a URL that matches
   nothing, so it would fall back to its built-in bare 404 page.

   Static demos are unaffected: the /:slug → /:slug/index.html rewrite in
   next.config.ts runs before dynamic routes, so only paths with no file and
   no route reach here. */

export default function Missing() {
  notFound();
}
