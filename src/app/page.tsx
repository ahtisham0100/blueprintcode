import type { Metadata } from 'next';
import Home from './Home';
import './globals.css';
import './home.css';
import './blueprint.css';

export const metadata: Metadata = {
  title: 'Blueprint Code AI — Product configurators, commerce & AI systems',
  description:
    "Blueprint Code AI builds product configurators, recommendation engines and connected ecommerce systems for businesses whose products can't be explained by a standard product page.",
  alternates: { canonical: 'https://blueprintcode.ai/' },
  openGraph: {
    title: 'Blueprint Code AI — Product configurators, commerce & AI systems',
    description:
      'Product configurators, commerce and AI systems. Every build starts with a Prototype Sprint, £625–£3,000, credited against the build.',
    type: 'website',
    url: 'https://blueprintcode.ai/',
  },
};

export default function HomePage() {
  return <Home />;
}
