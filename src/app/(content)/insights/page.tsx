import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import Link from 'next/link';
import './styles.css';
import { NOTES, authorPerson } from './notes';
import HashRedirect from './HashRedirect';

export const metadata: Metadata = {
  title: 'Field notes — Blueprint Code AI',
  description:
    'Practical field notes on product configurators, digital showrooms, ecommerce systems and commercial prototyping, from a working studio.',
  alternates: { canonical: 'https://blueprintcode.ai/insights' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Field notes — Blueprint Code AI',
    description:
      'Configurator costs, 2D versus 3D, digital showrooms, and lessons from running a multi-market retailer.',
    type: 'website',
    url: 'https://blueprintcode.ai/insights',
  },
};

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blueprint Code AI — Field Notes',
  url: 'https://blueprintcode.ai/insights',
  blogPost: NOTES.map((n) => ({
    '@type': 'BlogPosting',
    headline: n.title,
    description: n.desc,
    wordCount: n.wordCount,
    datePublished: n.datePublished,
    dateModified: n.dateModified,
    author: authorPerson(n.author),
    publisher: { '@type': 'Organization', name: 'Blueprint Code AI' },
    url: `https://blueprintcode.ai/insights/${n.slug}`,
    mainEntityOfPage: `https://blueprintcode.ai/insights/${n.slug}`,
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blueprintcode.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Field notes', item: 'https://blueprintcode.ai/insights' },
  ],
};

export default function InsightsPage() {
  return (
    <main id="main">
      <HashRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="sheet title-block">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <span aria-current="page">Field notes</span>
        </nav>
        <dl className="stamp">
          <div className="row"><dt>SERIES</dt><dd>Field notes — insights from the build</dd></div>
          <div className="row"><dt>DISCIPLINE</dt><dd>Interactive commerce</dd></div>
          <div className="row"><dt>ENTRIES</dt><dd>4 published</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Field notes.</h1>
        <p className="standfirst">Practical thinking from building product configurators, connected ecommerce systems and an international retail operation of our own. Select an entry to read it.</p>
      </div>

      <section id="index">
        <div className="sheet">
          <p className="sheet-no">INDEX — 4 ENTRIES</p>
          <div className="insights-index">
            {NOTES.map((n) => (
              <Link key={n.slug} className="entry" href={`/insights/${n.slug}`}>
                <span className="ref">{n.ref}<b>{n.refB}</b></span>
                <span>
                  <h3>{n.title}</h3>
                  <p>{n.desc}</p>
                </span>
                <span className="go">{n.read} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">START HERE</p>
          <h2>What is your product making customers work too hard to understand?</h2>
          <p>Prove the difficult part first, in a focused Prototype Sprint — £625 to £3,000 + VAT, credited in full against the build.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Discuss your project</a>
            <a className="button" href="/configurators">What we build</a>
          </div>
        </div>
      </section>
    </main>
  );
}
