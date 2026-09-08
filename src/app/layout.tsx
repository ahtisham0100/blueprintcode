import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blueprint Code — Services & Pricing 2026',
  description:
    'Blueprint Code: web development, e-commerce infrastructure, bespoke 3D product configurators, and AI automation for UK, US and European businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
