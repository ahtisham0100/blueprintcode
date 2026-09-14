import type { Metadata } from 'next';
import './styles.css';
import Reader from './Reader';

export const metadata: Metadata = {
  title: 'Field notes — Blueprint Code',
  description:
    'Practical field notes on product configurators, digital showrooms, ecommerce systems and commercial prototyping, from a studio that runs its own retail operation.',
  alternates: { canonical: 'https://blueprintcode.ai/insights' },
  openGraph: {
    title: 'Field notes — Blueprint Code',
    description:
      'Configurator costs, 2D versus 3D, digital showrooms, and lessons from running a multi-market retailer.',
    type: 'website',
    url: 'https://blueprintcode.ai/insights',
  },
};

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blueprint Code — Field Notes',
  url: 'https://blueprintcode.ai/insights',
  blogPost: [
    {
      '@type': 'BlogPosting',
      headline: 'What does a product configurator cost in 2026?',
      description:
        'Realistic price bands, the variables that move them, and how to avoid paying production money before the difficult idea is proven.',
      wordCount: 729,
      author: { '@type': 'Organization', name: 'Blueprint Code' },
      publisher: { '@type': 'Organization', name: 'Blueprint Code' },
      mainEntityOfPage: 'https://blueprintcode.ai/insights#configurator-cost',
    },
    {
      '@type': 'BlogPosting',
      headline: '2D vs 3D product configurators',
      description:
        'When images and rules are enough, when real-time 3D earns its cost, and how to choose without buying technology for its own sake.',
      wordCount: 680,
      author: { '@type': 'Organization', name: 'Blueprint Code' },
      publisher: { '@type': 'Organization', name: 'Blueprint Code' },
      mainEntityOfPage: 'https://blueprintcode.ai/insights#2d-vs-3d',
    },
    {
      '@type': 'BlogPosting',
      headline: 'Why complex products need a digital showroom',
      description:
        'A product page displays information. A digital showroom turns uncertainty into a guided, commercially useful buying journey.',
      wordCount: 698,
      author: { '@type': 'Organization', name: 'Blueprint Code' },
      publisher: { '@type': 'Organization', name: 'Blueprint Code' },
      mainEntityOfPage: 'https://blueprintcode.ai/insights#digital-showroom',
    },
    {
      '@type': 'BlogPosting',
      headline: 'From an eBay account to a multi-market retailer',
      description:
        'Six lessons from growing PP-AV into an international commerce operation with five connected sales tools.',
      wordCount: 778,
      author: { '@type': 'Organization', name: 'Blueprint Code' },
      publisher: { '@type': 'Organization', name: 'Blueprint Code' },
      mainEntityOfPage: 'https://blueprintcode.ai/insights#ppav-growth',
    },
  ],
};

export default function InsightsPage() {
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>SERIES</dt><dd>Field notes — insights from the build</dd></div>
          <div className="row"><dt>DISCIPLINE</dt><dd>Interactive commerce</dd></div>
          <div className="row"><dt>ENTRIES</dt><dd>4 published</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Field notes.</h1>
        <p className="standfirst">Practical thinking from building product configurators, connected ecommerce systems and an international retail operation of our own. Select an entry to read it.</p>
      </div>

      <Reader />

      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">START HERE</p>
          <h2>What is your product making customers work too hard to understand?</h2>
          <p>Prove the difficult part first, in a focused Prototype Sprint — £625 to £3,000 + VAT, credited in full against the build.</p>
          <div className="actions">
            <a className="button solid" href="mailto:james@blueprintcode.ai?subject=Prototype Sprint enquiry">Discuss your project</a>
            <a className="button" href="/configurators">What we build</a>
          </div>
        </div>
      </section>
    </main>
  );
}
