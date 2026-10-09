import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

/* Root layout for the Medusa Heads pages (currently /medusa-partner/pricing).
   A separate route group from (site) so these pages carry Medusa's own header,
   footer and type rather than the Blueprint Code AI chrome — the same
   multiple-root-layouts arrangement (site) and (cms) already use. Fonts are
   loaded the way the (site) layout does it, via a stylesheet link. */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function MedusaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
