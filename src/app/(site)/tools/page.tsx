import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import Tools from './Tools';
import '../globals.css';
import './home.css';
import './blueprint.css';

/* /tools — BPC Tools. This is the former homepage (the blueprint-roll design:
   configurators, the Prototype Sprint, selected work, build levels), kept in
   full as the overview of the interactive systems and tools side of the
   business. The homepage at / now carries the intelligence-layer positioning
   and links here from its "Interactive Systems & Tools" card. */

export const metadata: Metadata = {
  title: 'BPC Tools — product configurators, guided selling and commerce systems',
  description:
    'Product configurators, guided selling tools and connected ecommerce systems for products too complex for a standard product page. Every build starts with a Prototype Sprint.',
  alternates: { canonical: 'https://blueprintcode.ai/tools' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'BPC Tools — product configurators, guided selling and commerce systems',
    description:
      'Product configurators, commerce and AI systems. Every build starts with a Prototype Sprint, £625–£3,000, credited against the build.',
    type: 'website',
    url: 'https://blueprintcode.ai/tools',
  },
};

export default function ToolsPage() {
  return <Tools />;
}
