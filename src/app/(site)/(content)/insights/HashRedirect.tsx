'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NOTES } from './notes';

/* Old links opened a note via the URL hash (e.g. /insights#configurator-cost).
   Each note is now its own page, so if we land on /insights with a known note
   hash, forward to that page and preserve the deep link. */
export default function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const slug = window.location.hash.replace('#', '');
    if (slug && NOTES.some((n) => n.slug === slug)) {
      router.replace(`/insights/${slug}`);
    }
  }, [router]);

  return null;
}
