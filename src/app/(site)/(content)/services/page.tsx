import type { Metadata } from 'next';
import '../pricing/styles.css';
import { OG_DEFAULTS, SITE_URL } from '@/lib/seo';

/* Services hub. Exists so /services/* pages have a real parent URL (and a
   breadcrumb that matches the path), and gives each service page a crawlable
   inbound link from one place. Add a card here for every new /services/*
   or service landing page. */

const URL = `${SITE_URL}/services`;
const TITLE = 'Services — Blueprint Code AI';
const DESC =
  'Product configurators, guided selling tools and WCAG accessibility audits — each with published 2026 pricing.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESC, type: 'website', url: URL },
};

const SERVICES = [
  {
    href: '/services/wcag-compliance-audit-pricing',
    label: 'ACCESSIBILITY & COMPLIANCE',
    name: 'WCAG compliance audits',
    rate: 'Free – £7,500+',
    summary: 'WCAG 2.2 and 2.1 AA audits, code-level remediation and monitoring, mapped to the ADA, AODA, SEBI, the European Accessibility Act and UK law.',
  },
  {
    href: '/services/3d-product-configurator-development',
    label: 'SIGNATURE SERVICE',
    name: '3D product configurators',
    rate: 'from £2,500',
    summary: 'Real-time 3D configurators that let a customer build, see and price a bespoke product before they buy.',
  },
  {
    href: '/services/guided-selling-tools',
    label: 'COMMERCE TOOLS',
    name: 'Guided selling tools',
    rate: 'from £2,500',
    summary: 'Selectors and recommendation engines that turn a large, technical catalogue into a short, reasoned shortlist.',
  },
];

export default function ServicesPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${URL}#webpage`,
        url: URL,
        name: TITLE,
        description: DESC,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: SERVICES.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: s.name,
            url: `${SITE_URL}${s.href}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: URL },
        ],
      },
    ],
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>INDEX</dt><dd>Services — 2026</dd></div>
          <div className="row"><dt>PRICING</dt><dd>Published, GBP excluding VAT</dd></div>
        </dl>
        <h1>Services.</h1>
        <p className="standfirst">What we build and audit, each with its own page and published prices. The full list of rates, retainers and add-ons is on the <a href="/pricing">schedule of rates</a>.</p>
      </div>

      <section className="sheet">
        <div className="row3">
          {SERVICES.map((s) => (
            <div className="item" key={s.href}>
              <span className="lbl">{s.label}</span>
              <div className="item-top" style={{ marginTop: '14px' }}>
                <h2 style={{ fontSize: '25px', margin: 0 }}><a href={s.href}>{s.name}</a></h2>
              </div>
              <p>{s.summary}</p>
              <p className="note"><b>Rates:</b> {s.rate} · <a href={s.href}>Read more →</a></p>
            </div>
          ))}
        </div>
      </section>

      <section className="close sheet">
        <p className="sheet-no">NEXT STEP</p>
        <h2>Not sure which one you need?</h2>
        <p>Tell us what customers struggle with today and we&rsquo;ll point you at the right starting point.</p>
        <div className="ctas">
          <a className="btn solid" href="/contact">Start a project</a>
          <a className="btn" href="/pricing">Schedule of rates</a>
        </div>
      </section>
    </main>
  );
}
