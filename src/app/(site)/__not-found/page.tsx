/* The site's 404 page as a fetchable route. Route handlers (the [slug] demo
   route) cannot render not-found.tsx themselves, so on a miss they fetch
   this page and return its HTML with a 404 status. Not linked, noindex,
   absent from the sitemap. */

import type { Metadata } from 'next';
import NotFound from '../not-found';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFoundPage() {
  return <NotFound />;
}
