import type { Metadata } from 'next';
import Home from './Home';
import './globals.css';
import './home.css';
import './blueprint.css';

export const metadata: Metadata = {
  title: 'Product configurator development — Blueprint Code AI',
  description:
    "We build product configurators, guided selling tools and connected ecommerce systems for products too complex for a standard product page.",
  alternates: { canonical: 'https://blueprintcode.ai/' },
  openGraph: {
    title: 'Product configurator development — Blueprint Code AI',
    description:
      'Product configurators, commerce and AI systems. Every build starts with a Prototype Sprint, £625–£3,000, credited against the build.',
    type: 'website',
    url: 'https://blueprintcode.ai/',
  },
};

export default function HomePage() {
  return <Home />;
}
