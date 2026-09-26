import type { Metadata } from 'next';

/* Root layout for the CMS at /cms — served only on the admin host (see
   src/proxy.ts). Deliberately minimal and separate from the public site's
   root layout in (site)/: no header, footer, analytics or site JSON-LD, and
   Payload will supply its own admin shell inside it. */

export const metadata: Metadata = {
  title: 'BPC CMS',
  robots: { index: false, follow: false },
};

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
