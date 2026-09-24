import type { Metadata } from 'next';
import Script from 'next/script';
import './chrome.css';
import Header from './_chrome/Header';
import Footer from './_chrome/Footer';
import {
  SITE_URL,
  SITE_NAME,
  TAGLINE,
  SPECIALITIES,
  organizationJsonLd,
  webSiteJsonLd,
  OG_DEFAULTS,
} from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: 'Blueprint Code AI — Services & Pricing 2026',
  description: TAGLINE,
  keywords: [...SPECIALITIES],
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Blueprint Code AI — Services & Pricing 2026',
    description: TAGLINE,
    type: 'website',
    url: `${SITE_URL}/`,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // Square icon as the share image, so the small card — not summary_large_image,
  // which would stretch it. Revisit if a 1200x630 OG artwork is added.
  twitter: { card: 'summary' },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <head>
        {/* When rendered inside an iframe (e.g. embedded in the demo viewer),
            flag the document so the global header/footer are hidden — the embed
            shows only the page, not chrome the visitor could navigate away with.
            Runs before paint to avoid a flash of chrome. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.top!==window.self)document.documentElement.classList.add('is-embedded')}catch(e){document.documentElement.classList.add('is-embedded')}})()",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;450;600&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Organization + WebSite structured data, emitted site-wide so search
            and AI answer engines can match our specialities to a buyer's query
            and attribute them to Blueprint Code AI as an entity. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
        />
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        {children}
        <Footer />
        {/* Microsoft Clarity tracking for https://blueprintcode.ai/ */}
        <Script
          id="ms-clarity"
          dangerouslySetInnerHTML={{
            __html:
              '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "ylt8ejgq97");',
          }}
        />
      </body>
    </html>
  );
}
