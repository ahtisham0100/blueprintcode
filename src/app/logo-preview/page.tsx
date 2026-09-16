import type { Metadata } from 'next';

// Preview-only page for the transparent logo. This returns HTML, NOT an image —
// it exists so the logo can be *viewed* on different backgrounds (the browser's
// bare-file view always paints its own white/dark backdrop behind a raw PNG).
//
// Do NOT use this URL as a logo/<img>/favicon/OG source — those need the raw
// image file at /blueprintcode-transparent.png, which is already transparent.
export const metadata: Metadata = {
  title: 'Logo preview — Blueprint Code',
  description: 'Preview of the transparent Blueprint Code logo on light, dark and checkerboard backgrounds.',
  robots: { index: false, follow: false },
};

const LOGO = '/blueprintcode-transparent.png';

const swatches: { label: string; style: React.CSSProperties }[] = [
  { label: 'Light', style: { background: '#ffffff' } },
  { label: 'Dark', style: { background: '#0b1f33' } },
  { label: 'Brand blue', style: { background: '#0374fc' } },
  {
    label: 'Checkerboard (shows transparency)',
    style: {
      background:
        'repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 50% / 28px 28px',
    },
  },
];

export default function LogoPreviewPage() {
  return (
    <main
      id="main"
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '48px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Logo preview</h1>
      <p style={{ color: '#556', marginBottom: 32, lineHeight: 1.5 }}>
        The logo file is transparent. This page just renders it on different
        backgrounds so you can see that. For real use (site logo, favicon, OG
        image, email), link the raw file:{' '}
        <code style={{ background: '#f0f2f5', padding: '2px 6px', borderRadius: 4 }}>
          {LOGO}
        </code>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {swatches.map((s) => (
          <figure key={s.label} style={{ margin: 0 }}>
            <div
              style={{
                ...s.style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
                padding: 24,
                borderRadius: 12,
                border: '1px solid #e2e6ea',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="Blueprint Code logo" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
            <figcaption style={{ fontSize: 13, color: '#667', marginTop: 8 }}>
              {s.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
