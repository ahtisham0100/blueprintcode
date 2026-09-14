import type { Metadata } from 'next';
import './chrome.css';
import Header from './_chrome/Header';
import Footer from './_chrome/Footer';

export const metadata: Metadata = {
  title: 'Blueprint Code — Services & Pricing 2026',
  description:
    'Blueprint Code: web development, e-commerce infrastructure, bespoke 3D product configurators, and AI automation for UK, US and European businesses.',
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
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
