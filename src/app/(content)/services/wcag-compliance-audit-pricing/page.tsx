import type { Metadata } from 'next';
import '../../pricing/styles.css';
import './styles.css';
import AccessibilityStages from '../../pricing/AccessibilityStages';
import Toc from './Toc';
import {
  ACCESSIBILITY_STAGES,
  ACCESSIBILITY_METHOD,
  ACCESSIBILITY_DELIVERABLES,
} from '@/lib/accessibilityPlans';
import { SITE_URL, SITE_NAME, OG_DEFAULTS } from '@/lib/seo';
import { AUTHORS, authorPerson } from '../../insights/notes';

/* Service landing page for WCAG compliance audits, targeting "wcag compliance
   audit", "wcag 2.1 aa compliance audit", "wcag compliance checklist / levels /
   requirements / deadline 2026" and the ADA, AODA and SEBI compliance queries
   behind them. Content-heavy by design, so it carries a sticky "on this page"
   sidebar, and is written answer-first — each section opens with a sentence
   that stands on its own when quoted by an AI answer engine.

   The plans and prices are NOT defined here: they come from
   src/lib/accessibilityPlans.ts, the same data sheet 04 of /pricing renders,
   so the two pages (and the Offer schema below) can't disagree.

   Structured data: WebPage (author, reviewer, citations) + Service (with an
   OfferCatalog built from the plans) + FAQPage + BreadcrumbList, in one @graph
   linked to the site-wide Organization entity.

   Heading rule for this page: every H2 carries the query its section answers
   ("WCAG compliance levels", "WCAG compliance checklist"…), and the FAQ only
   holds questions no section heading already answers, so the page never
   competes with itself for the same query. */

const URL = `${SITE_URL}/services/wcag-compliance-audit-pricing`;
const PUBLISHED = '2026-09-24';
/* The one date to bump when the content (not just styling) is re-checked. It
   drives the visible "Reviewed" stamp, the byline, and dateModified /
   lastReviewed in the schema, so they can never disagree. Deliberately not
   derived from file mtime: that would claim a review on every deploy. */
const REVIEWED = '2026-09-24';
const REVIEWED_LABEL = new Date(`${REVIEWED}T00:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const AUTHOR = AUTHORS['Muhammad Ahtisham Arif'];
const REVIEWER = AUTHORS['James Michaelson'];

/* SERP pair, kept inside ~60 / ~155 characters. */
const TITLE = 'WCAG Compliance Audit Pricing 2026 — Blueprint Code AI';
const META_DESC =
  'WCAG 2.2 and 2.1 AA compliance audits from £995, a free WCAG check, remediation and monitoring. ADA, AODA, SEBI and EAA covered. Published 2026 prices.';
/* Longer description for schema, where length costs nothing. */
const DESC =
  'Published 2026 pricing for WCAG compliance audits, remediation and monitoring by Blueprint Code AI. Manual and automated testing against WCAG 2.2 AA (which also covers WCAG 2.1 AA and 2.0 AA), with reports mapped to the ADA, Section 508, AODA, SEBI and RPwD Act, European Accessibility Act and UK requirements. From a free automated WCAG check to full audit and code-level remediation.';

export const metadata: Metadata = {
  title: TITLE,
  description: META_DESC,
  keywords: [
    'WCAG compliance audit',
    'WCAG compliance audit pricing',
    'WCAG 2.1 AA compliance audit',
    'WCAG 2.1 compliance audit',
    'WCAG 2.2 AA audit',
    'WCAG compliance auditor',
    'WCAG compliance assessment',
    'WCAG compliance checklist',
    'WCAG compliance checker',
    'WCAG compliance test',
    'WCAG compliance levels',
    'WCAG compliance requirements',
    'WCAG compliance guidelines',
    'WCAG compliance meaning',
    'WCAG compliance deadline',
    'WCAG compliance 2026',
    'WCAG compliance certification',
    'ADA compliance audit',
    'AODA compliance audit',
    'SEBI accessibility compliance',
    'European Accessibility Act audit',
    'Section 508 compliance',
    'accessibility remediation',
  ],
  alternates: { canonical: URL },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'WCAG compliance audit pricing 2026',
    description:
      'Published prices for WCAG 2.2 / 2.1 AA audits, remediation and monitoring — with ADA, AODA, SEBI and EAA coverage explained.',
    type: 'website',
    url: URL,
  },
};

/* Sidebar entries — ids must match the <section id>s below, in order. */
const SECTIONS = [
  { id: 'summary', label: 'At a glance' },
  { id: 'pricing', label: 'Audit pricing' },
  { id: 'frameworks', label: 'ADA, AODA, SEBI & more' },
  { id: 'what-is-wcag-compliance', label: 'What is WCAG compliance' },
  { id: 'levels', label: 'Compliance levels' },
  { id: 'requirements', label: 'Requirements & guidelines' },
  { id: 'deadlines', label: 'Deadlines 2026' },
  { id: 'process', label: 'How the audit works' },
  { id: 'checker-vs-audit', label: 'Checker vs audit' },
  { id: 'checklist', label: 'WCAG checklist' },
  { id: 'certification', label: 'Certification' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

/* Primary sources behind the legal and technical claims on this page. Linked
   from the frameworks table and listed in the Sources section; also emitted as
   `citation` in the WebPage schema. SEBI's entry points at the regulator's
   circulars index — swap in the specific accessibility circular URL. */
const SOURCES: { name: string; publisher: string; url: string }[] = [
  { name: 'Web Content Accessibility Guidelines (WCAG) 2.2', publisher: 'W3C', url: 'https://www.w3.org/TR/WCAG22/' },
  { name: 'What’s new in WCAG 2.2', publisher: 'W3C Web Accessibility Initiative', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/' },
  { name: 'Guidance on web accessibility and the ADA', publisher: 'US Department of Justice', url: 'https://www.ada.gov/resources/web-guidance/' },
  { name: 'Fact sheet: ADA Title II web and mobile accessibility rule', publisher: 'US Department of Justice', url: 'https://www.ada.gov/resources/2024-03-08-web-rule/' },
  { name: 'Section 508 standards and guidance', publisher: 'US General Services Administration', url: 'https://www.section508.gov/' },
  { name: 'O. Reg. 191/11: Integrated Accessibility Standards (AODA)', publisher: 'Government of Ontario', url: 'https://www.ontario.ca/laws/regulation/110191' },
  { name: 'Accessible Canada Act (S.C. 2019, c. 10)', publisher: 'Government of Canada', url: 'https://laws-lois.justice.gc.ca/eng/acts/A-0.6/' },
  { name: 'SEBI circulars', publisher: 'Securities and Exchange Board of India', url: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0' },
  { name: 'Directive (EU) 2019/882 — European Accessibility Act', publisher: 'EUR-Lex', url: 'https://eur-lex.europa.eu/eli/dir/2019/882/oj' },
  { name: 'Equality Act 2010', publisher: 'legislation.gov.uk', url: 'https://www.legislation.gov.uk/ukpga/2010/15/contents' },
  { name: 'Accessibility requirements for public sector websites and apps', publisher: 'GOV.UK', url: 'https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps' },
  { name: 'Overlay Fact Sheet', publisher: 'Accessibility practitioners (open letter)', url: 'https://overlayfactsheet.com/' },
];
const src = (startsWith: string) => SOURCES.find((s) => s.name.startsWith(startsWith))!.url;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does a WCAG compliance audit cost?',
    a: 'At Blueprint Code AI, an automated Instant WCAG Check is free, an Accessibility Health Check is £295, a full WCAG 2.2 AA audit starts from £995, an ecommerce or complex audit from £1,750, audit plus code-level remediation from £2,500, and complex remediation £3,500–£7,500+. Ongoing monitoring is £99 or £199 a month. Prices are in GBP, exclude VAT, and the fixed quote is confirmed at kick-off.',
  },
  {
    q: 'What is a WCAG 2.1 AA compliance audit?',
    a: 'A WCAG 2.1 AA compliance audit tests a site against the 50 Level A and AA success criteria in WCAG 2.1, using manual testing (keyboard, screen reader, zoom and reflow) alongside automated scanning. We audit against WCAG 2.2 AA, which contains every WCAG 2.1 AA criterion plus six more, so the same report evidences WCAG 2.1 AA — the level cited by the ADA Title II rule, EN 301 549 and India\'s GIGW — as well as 2.2 AA.',
  },
  {
    q: 'What is the difference between WCAG 2.1 and WCAG 2.2?',
    a: 'WCAG 2.2, published by the W3C in October 2023, adds nine success criteria to WCAG 2.1 — six of them at Level A or AA, covering focus that is hidden behind sticky content, focus appearance, dragging movements, minimum target size, consistent help, redundant entry and accessible authentication — and removes 4.1.1 Parsing as obsolete. A site that meets WCAG 2.2 AA also meets WCAG 2.1 AA.',
  },
  {
    q: 'What is a compliance audit?',
    a: 'A compliance audit is an independent check of whether something meets a defined standard or regulation, producing evidence of where it passes, where it fails and what must change. An accessibility compliance audit applies that to a website or app: it tests against WCAG, records each failure against the success criterion it breaches, and ends with a prioritised plan to fix it.',
  },
  {
    q: 'Do accessibility overlays or widgets make a website WCAG compliant?',
    a: 'No. Overlay widgets add a toolbar on top of a site but do not fix the underlying code, so the barriers remain for most assistive-technology users. Many ADA lawsuits have been filed against sites running overlays, and in 2025 the US Federal Trade Commission took action against an overlay vendor over its compliance claims. Compliance comes from fixing the source code.',
  },
  {
    q: 'Do you provide ADA compliance audits?',
    a: 'Yes. The ADA does not name a technical standard for private businesses, but courts, settlements and the Department of Justice consistently point to WCAG 2.1 Level AA, and the DOJ Title II rule adopts it for state and local government. Our WCAG 2.2 AA audit covers every WCAG 2.1 AA criterion, so the report can be used as ADA evidence, and we can carry out the remediation too.',
  },
  {
    q: 'Do you provide AODA compliance audits?',
    a: 'Yes. Under AODA\'s Integrated Accessibility Standards Regulation, Ontario public sector organisations and organisations with 50 or more employees must meet WCAG 2.0 Level AA (excluding live captions and pre-recorded audio description). Our audit tests against WCAG 2.2 AA, which includes every WCAG 2.0 AA criterion, and gives you the evidence behind your AODA accessibility compliance report.',
  },
  {
    q: 'Do you help with SEBI digital accessibility compliance?',
    a: 'Yes. SEBI requires its regulated entities — including stockbrokers, depository participants, mutual funds and asset management companies, investment advisers and research analysts — to make their websites, mobile apps and online onboarding such as KYC accessible to persons with disabilities, in line with the RPwD Act 2016 and Indian standards (GIGW and IS 17802) built on WCAG. We audit web and app journeys against WCAG 2.2 AA, map findings to those standards, and fix them.',
  },
  {
    q: 'Does the audit cover the European Accessibility Act?',
    a: 'Yes. The European Accessibility Act applies from 28 June 2025 to products and services sold to EU consumers, including ecommerce, banking and ebooks. It is presumed met through the harmonised standard EN 301 549, whose web requirements are WCAG 2.1 Level AA — every one of which our WCAG 2.2 AA audit tests.',
  },
  {
    q: 'What does a WCAG compliance auditor do?',
    a: 'A WCAG compliance auditor tests a representative sample of pages and journeys with a keyboard, screen readers, zoom and automated tools; confirms each failure by hand; maps it to the WCAG success criterion and level it breaches; rates its severity and user impact; and recommends a fix a developer can implement. When choosing one, ask whether testing is manual, which assistive technologies are used, and whether they can fix what they find.',
  },
  {
    q: 'Do you fix the accessibility issues as well as audit them?',
    a: 'Yes. Most audit firms stop at the report. Our Audit + Remediation plan (from £2,500) applies code-level fixes — semantic HTML, ARIA, focus management, contrast, reflow and form handling — re-tests against the original report and gives you an accessibility statement to publish. Larger or harder estates are covered by Complex remediation at £3,500–£7,500+.',
  },
  {
    q: 'Is a WCAG audit legal advice?',
    a: 'No. An accessibility audit reports a site\'s conformance with WCAG at a point in time and is technical evidence, not legal advice. It is what a legal team or regulator will ask to see, but decisions about legal obligations should be taken with a qualified adviser in the relevant jurisdiction.',
  },
];

export default function WcagAuditPricingPage() {
  const offers = ACCESSIBILITY_STAGES.flatMap((stage) =>
    stage.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.summary,
      url: `${URL}#plan-${stage.id}`,
      priceCurrency: 'GBP',
      ...(plan.maxPrice || plan.from || plan.per
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              priceCurrency: 'GBP',
              valueAddedTaxIncluded: false,
              ...(plan.maxPrice
                ? { minPrice: plan.price, maxPrice: plan.maxPrice }
                : plan.from
                  ? { minPrice: plan.price }
                  : { price: plan.price }),
              ...(plan.per ? { unitCode: 'MON', unitText: 'month' } : {}),
            },
          }
        : { price: plan.price }),
      itemOffered: { '@type': 'Service', name: plan.name },
    })),
  );
  const prices = ACCESSIBILITY_STAGES.flatMap((s) =>
    s.plans.filter((p) => !p.per).flatMap((p) => [p.price, p.maxPrice ?? p.price]),
  );

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${URL}#webpage`,
        url: URL,
        name: TITLE,
        description: DESC,
        inLanguage: 'en-GB',
        datePublished: PUBLISHED,
        dateModified: REVIEWED,
        lastReviewed: REVIEWED,
        author: authorPerson(AUTHOR.name),
        reviewedBy: authorPerson(REVIEWER.name),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${URL}#service` },
        breadcrumb: { '@id': `${URL}#breadcrumb` },
        citation: SOURCES.map((c) => ({ '@type': 'CreativeWork', name: c.name, url: c.url, publisher: { '@type': 'Organization', name: c.publisher } })),
        mentions: [
          { '@type': 'CreativeWork', name: 'Web Content Accessibility Guidelines (WCAG) 2.2', url: 'https://www.w3.org/TR/WCAG22/' },
          { '@type': 'CreativeWork', name: 'Web Content Accessibility Guidelines (WCAG) 2.1', url: 'https://www.w3.org/TR/WCAG21/' },
          { '@type': 'Legislation', name: 'Americans with Disabilities Act (ADA)', legislationJurisdiction: 'US', url: src('Guidance on web') },
          { '@type': 'Legislation', name: 'Section 508 of the Rehabilitation Act', legislationJurisdiction: 'US', url: src('Section 508') },
          { '@type': 'Legislation', name: 'Accessibility for Ontarians with Disabilities Act (AODA)', legislationJurisdiction: 'CA-ON', url: src('O. Reg.') },
          { '@type': 'Legislation', name: 'Accessible Canada Act', legislationJurisdiction: 'CA', url: src('Accessible Canada') },
          { '@type': 'Legislation', name: 'Rights of Persons with Disabilities Act, 2016', legislationJurisdiction: 'IN' },
          { '@type': 'GovernmentOrganization', name: 'Securities and Exchange Board of India (SEBI)', url: 'https://www.sebi.gov.in/' },
          { '@type': 'Legislation', name: 'European Accessibility Act (Directive (EU) 2019/882)', legislationJurisdiction: 'EU', url: src('Directive') },
          { '@type': 'Legislation', name: 'Equality Act 2010', legislationJurisdiction: 'GB', url: src('Equality Act') },
          { '@type': 'Legislation', name: 'Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018', legislationJurisdiction: 'GB', url: src('Accessibility requirements') },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${URL}#service`,
        name: 'WCAG compliance audit and remediation',
        alternateName: ['WCAG 2.2 AA audit', 'WCAG 2.1 AA compliance audit', 'ADA compliance audit', 'AODA compliance audit', 'SEBI accessibility audit'],
        serviceType: 'Web accessibility audit, remediation and monitoring',
        description: DESC,
        url: URL,
        provider: { '@id': `${SITE_URL}/#organization`, '@type': 'ProfessionalService', name: SITE_NAME, url: `${SITE_URL}/` },
        areaServed: [
          { '@type': 'Country', name: 'United States' },
          { '@type': 'Country', name: 'Canada' },
          { '@type': 'Country', name: 'India' },
          { '@type': 'Country', name: 'United Kingdom' },
          { '@type': 'Place', name: 'European Union' },
          { '@type': 'Place', name: 'Worldwide' },
        ],
        category: 'Digital accessibility',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'GBP',
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: offers.length,
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'WCAG compliance audit plans',
          itemListElement: offers,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${URL}#faq`,
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
          { '@type': 'ListItem', position: 3, name: 'WCAG compliance audit pricing', item: URL },
        ],
      },
    ],
  };

  return (
    <main id="main" className="wcag">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <div className="sheet title-block">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <a href="/services">Services</a>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <span aria-current="page">WCAG compliance audit pricing</span>
        </nav>

        <dl className="stamp">
          <div className="row"><dt>STANDARD</dt><dd>WCAG 2.2 AA — covers 2.1 AA &amp; 2.0 AA</dd></div>
          <div className="row"><dt>FRAMEWORKS</dt><dd>ADA · Section 508 · AODA · SEBI · RPwD · EAA · UK</dd></div>
          <div className="row"><dt>RANGE</dt><dd>Free – £7,500+, GBP excl. VAT</dd></div>
          <div className="row"><dt>REVIEWED</dt><dd><time dateTime={REVIEWED}>{REVIEWED_LABEL}</time></dd></div>
        </dl>

        <h1>WCAG compliance audit pricing.</h1>
        <p className="standfirst">Published 2026 prices for WCAG 2.2 and 2.1 AA compliance audits, remediation and monitoring &mdash; from a free automated check to a full manual audit with the fixes applied. One audit, mapped to the rules you actually answer to: the ADA, Section 508, AODA, SEBI and the RPwD Act, the European Accessibility Act and UK law.</p>
        <p className="byline">
          Written by <a href={AUTHOR.url.replace(SITE_URL, '')}>{AUTHOR.name}</a>, {AUTHOR.jobTitle.toLowerCase()}
          <span aria-hidden="true"> · </span>
          Reviewed by <a href={REVIEWER.url.replace(SITE_URL, '')}>{REVIEWER.name}</a>, {REVIEWER.jobTitle.toLowerCase()}
          <span aria-hidden="true"> · </span>
          Last reviewed <time dateTime={REVIEWED}>{REVIEWED_LABEL}</time>
        </p>
      </div>

      <div className="sheet doc">
        <Toc items={SECTIONS} />

        <div className="doc-body">
          {/* ============ 01 AT A GLANCE ============ */}
          <section id="summary" aria-labelledby="summary-h">
            <p className="sheet-no">SHEET 01 &mdash; AT A GLANCE</p>
            <h2 id="summary-h">WCAG compliance audit cost: the short answer.</h2>
            <p className="answer">A WCAG compliance audit from Blueprint Code AI costs <b>from £995</b> for a standard site and <b>from £1,750</b> for ecommerce or complex journeys, with code-level remediation <b>from £2,500</b>. An automated WCAG check is <b>free</b>. Every paid audit is tested by a person against WCAG 2.2 Level AA, which also evidences WCAG 2.1 AA and 2.0 AA &mdash; the levels cited by the ADA, AODA, SEBI, the European Accessibility Act and UK regulations.</p>

            <dl className="facts">
              <div><dt>Free check</dt><dd>Automated WCAG 2.2 A &amp; AA scan, results by email</dd></div>
              <div><dt>Health check</dt><dd>£295 &mdash; credited against an audit within 90 days</dd></div>
              <div><dt>Full audit</dt><dd>From £995 (up to 15 templates) · from £1,750 ecommerce</dd></div>
              <div><dt>Audit + fix</dt><dd>From £2,500 · complex estates £3,500&ndash;£7,500+</dd></div>
              <div><dt>Monitoring</dt><dd>£99 or £199 per month</dd></div>
              <div><dt>Testing</dt><dd>Keyboard, NVDA, VoiceOver, 400% zoom, 320px reflow</dd></div>
              <div><dt>Output</dt><dd>Issue-by-issue report, prioritised plan, accessibility statement</dd></div>
              <div><dt>Terms</dt><dd>GBP, excluding VAT · fixed quote at kick-off</dd></div>
            </dl>
          </section>

          {/* ============ 02 PRICING ============ */}
          <section id="pricing" aria-labelledby="pricing-h">
            <p className="sheet-no">SHEET 02 &mdash; AUDIT PRICING</p>
            <h2 id="pricing-h">WCAG audit pricing: check, audit, fix, monitor.</h2>
            <p>Four stages, priced separately so you only buy the one you need. These are the same plans published on our <a className="inline" href="/pricing#accessibility">schedule of rates</a> &mdash; one set of numbers, wherever you read them.</p>

            <AccessibilityStages anchors />

            <div className="band"><h3>How the testing is done</h3><span className="range">EVERY PAID STAGE</span></div>
            <div className="row2">
              <div className="item">
                <span className="lbl">METHOD</span>
                <ul style={{ marginTop: '14px' }}>
                  {ACCESSIBILITY_METHOD.map((m) => <li key={m}>{m}</li>)}
                </ul>
                <p className="note">Tools run first. Everything we report has been confirmed by a person.</p>
              </div>
              <div className="item">
                <span className="lbl">WHAT YOU RECEIVE</span>
                <ul style={{ marginTop: '14px' }}>
                  {ACCESSIBILITY_DELIVERABLES.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="note">All prices GBP, excluding VAT. Ranges reflect scope; a fixed quote is confirmed at kick-off.</p>
              </div>
            </div>
          </section>

          {/* ============ 03 FRAMEWORKS ============ */}
          <section id="frameworks" aria-labelledby="frameworks-h">
            <p className="sheet-no">SHEET 03 &mdash; LAWS &amp; FRAMEWORKS WE SERVE</p>
            <h2 id="frameworks-h">ADA, AODA and SEBI compliance audits.</h2>
            <p className="answer">Almost every digital accessibility law points back to the same technical standard: WCAG at Level AA. Because WCAG 2.2 AA contains every WCAG 2.1 AA and 2.0 AA requirement, a single audit gives you evidence for each framework below &mdash; the report is simply mapped to the version and clauses your regulator cites.</p>

            <div className="tscroll" role="region" aria-labelledby="fw-cap" tabIndex={0}>
              <table className="mtable">
                <caption id="fw-cap">Accessibility frameworks and the technical standard each references</caption>
                <thead>
                  <tr><th scope="col">Framework</th><th scope="col">Where</th><th scope="col">Who it covers</th><th scope="col">Technical standard</th></tr>
                </thead>
                <tbody>
                  <tr><th scope="row"><a href={src('Guidance on web')}>ADA &mdash; Title III</a></th><td>United States</td><td>Businesses open to the public, including ecommerce and online services</td><td>No codified standard; courts and DOJ point to WCAG 2.1 AA</td></tr>
                  <tr><th scope="row"><a href={src('Fact sheet')}>ADA &mdash; Title II</a></th><td>United States</td><td>State and local government, public universities, transit</td><td>WCAG 2.1 AA (DOJ 2024 final rule)</td></tr>
                  <tr><th scope="row"><a href={src('Section 508')}>Section 508</a></th><td>United States</td><td>Federal agencies and the vendors that sell to them</td><td>Revised 508 Standards &rarr; WCAG 2.0 AA</td></tr>
                  <tr><th scope="row"><a href={src('O. Reg.')}>AODA</a></th><td>Ontario, Canada</td><td>Public sector, and organisations with 50+ employees</td><td>WCAG 2.0 AA (IASR, O. Reg. 191/11)</td></tr>
                  <tr><th scope="row"><a href={src('Accessible Canada')}>Accessible Canada Act</a></th><td>Canada (federal)</td><td>Federally regulated sectors: banking, telecoms, transport</td><td>CAN/ASC-EN 301 549 &rarr; WCAG</td></tr>
                  <tr><th scope="row"><a href={src('SEBI')}>SEBI</a></th><td>India</td><td>SEBI-regulated entities: brokers, DPs, AMCs, advisers, research analysts</td><td>RPwD Act, GIGW &amp; IS 17802 &mdash; built on WCAG</td></tr>
                  <tr><th scope="row">RPwD Act 2016 &amp; GIGW</th><td>India</td><td>Government and establishments serving the public</td><td>GIGW 3.0 / IS 17802 &rarr; WCAG 2.1 AA</td></tr>
                  <tr><th scope="row"><a href={src('Directive')}>European Accessibility Act</a></th><td>European Union</td><td>Ecommerce, banking, ebooks, transport and telecoms sold to EU consumers</td><td>EN 301 549 &rarr; WCAG 2.1 AA</td></tr>
                  <tr><th scope="row"><a href={src('Equality Act')}>Equality Act 2010</a> &amp; <a href={src('Accessibility requirements')}>PSBAR 2018</a></th><td>United Kingdom</td><td>Service providers; public sector websites and apps</td><td>WCAG 2.2 AA (public sector)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="fw-grid">
              <div className="fw">
                <span className="lbl">UNITED STATES</span>
                <h3>ADA compliance audit</h3>
                <p>ADA website lawsuits are brought against private businesses every year, and the remedy sought is almost always WCAG 2.1 AA conformance. We audit against WCAG 2.2 AA &mdash; a superset &mdash; so your report stands as ADA evidence, and cover Section 508 for federal suppliers.</p>
              </div>
              <div className="fw">
                <span className="lbl">ONTARIO, CANADA</span>
                <h3>AODA compliance audit</h3>
                <p>AODA has required WCAG 2.0 AA of public-sector bodies and organisations with 50+ employees since 1 January 2021, with compliance reports filed on a set cycle. Our audit gives you the evidence behind that report, and the fixes where you fall short.</p>
              </div>
              <div className="fw">
                <span className="lbl">INDIA</span>
                <h3>SEBI accessibility compliance</h3>
                <p>SEBI requires regulated entities to make websites, trading and investment apps and digital onboarding &mdash; including KYC &mdash; accessible under the RPwD Act. We test those journeys against WCAG 2.2 AA and map findings to GIGW and IS 17802, including the forms, OTP and authentication steps that most often fail.</p>
              </div>
              <div className="fw">
                <span className="lbl">EU &amp; UK</span>
                <h3>European Accessibility Act &amp; UK audits</h3>
                <p>The European Accessibility Act has applied since 28 June 2025 to ecommerce and consumer banking sold into the EU, via EN 301 549. UK public sector sites are monitored against WCAG 2.2 AA, and the Equality Act applies to every service provider.</p>
              </div>
            </div>
            <p className="fine">This table summarises published requirements to show how one WCAG audit maps across them. It is not legal advice; confirm your obligations with a qualified adviser in your jurisdiction.</p>
          </section>

          {/* ============ 04 WHAT IS ============ */}
          <section id="what-is-wcag-compliance" aria-labelledby="what-h">
            <p className="sheet-no">SHEET 04 &mdash; MEANING</p>
            <h2 id="what-h">What is WCAG compliance? Meaning and versions.</h2>
            <p className="answer">WCAG compliance means a website or app meets the success criteria of the Web Content Accessibility Guidelines &mdash; the international standard published by the W3C for making digital content usable by people with visual, hearing, motor and cognitive disabilities &mdash; at a stated conformance level, usually AA.</p>
            <p>WCAG is written as testable <em>success criteria</em>: 86 in <a href={src('Web Content')}>WCAG 2.2</a>, each assigned a level. &ldquo;Compliant&rdquo; is shorthand for <em>conformance</em>: every applicable criterion at the chosen level, and every level below it, passes on the page &mdash; there is no partial conformance for a page. Because a full journey (a checkout, an account sign-up) is only as accessible as its weakest step, WCAG also requires that every page in a process conforms.</p>
            <p>WCAG is technology-neutral, so it applies equally to a WordPress site, a Shopify store, a React application, a customer portal or a native mobile app, and it is backwards compatible: content that meets WCAG 2.2 meets 2.1 and 2.0 at the same level.</p>

            <div className="tscroll" role="region" aria-labelledby="ver-cap" tabIndex={0}>
              <table className="mtable">
                <caption id="ver-cap">WCAG versions</caption>
                <thead><tr><th scope="col">Version</th><th scope="col">Published</th><th scope="col">A + AA criteria</th><th scope="col">Still referenced by</th></tr></thead>
                <tbody>
                  <tr><th scope="row">WCAG 2.0</th><td>December 2008</td><td>38</td><td>Section 508, AODA</td></tr>
                  <tr><th scope="row">WCAG 2.1</th><td>June 2018</td><td>50</td><td>ADA Title II, EN 301 549 / EAA, GIGW</td></tr>
                  <tr><th scope="row">WCAG 2.2</th><td>October 2023</td><td>55</td><td>UK public sector; current W3C recommendation</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ============ 05 LEVELS ============ */}
          <section id="levels" aria-labelledby="levels-h">
            <p className="sheet-no">SHEET 05 &mdash; COMPLIANCE LEVELS</p>
            <h2 id="levels-h">WCAG compliance levels: A, AA and AAA.</h2>
            <p className="answer">WCAG has three compliance levels. Level A removes the most severe barriers, Level AA is the standard required by nearly every law and policy, and Level AAA is the strictest &mdash; used for specific content, not as a whole-site target.</p>
            <div className="lv-grid">
              <div className="lv">
                <span className="lv-tag">A</span>
                <h3>Level A: the minimum</h3>
                <p>31 criteria in WCAG 2.2. Without these, some people cannot use the site at all: no keyboard access, images with no text alternative, video with no captions, keyboard traps.</p>
              </div>
              <div className="lv lv-key">
                <span className="lv-tag">AA</span>
                <h3>Level AA: the legal benchmark</h3>
                <p>24 more (55 in total). Text contrast of 4.5:1, visible focus, reflow to 320px, consistent navigation, clear error suggestions, minimum target size. This is the level we audit to, and the one regulators cite.</p>
              </div>
              <div className="lv">
                <span className="lv-tag">AAA</span>
                <h3>Level AAA: enhanced</h3>
                <p>31 further criteria, such as 7:1 contrast and sign-language interpretation. The W3C does not recommend AAA as a general policy, because some content cannot satisfy it.</p>
              </div>
            </div>
          </section>

          {/* ============ 06 REQUIREMENTS ============ */}
          <section id="requirements" aria-labelledby="req-h">
            <p className="sheet-no">SHEET 06 &mdash; REQUIREMENTS &amp; GUIDELINES</p>
            <h2 id="req-h">WCAG compliance requirements and guidelines.</h2>
            <p className="answer">WCAG compliance requirements sit under four principles known as POUR: content must be Perceivable, Operable, Understandable and Robust. Each principle holds guidelines, and each guideline holds the testable success criteria an audit checks.</p>
            <div className="pour">
              <div><span className="lbl">P &mdash; PERCEIVABLE</span><h3>Perceivable: people can take it in</h3><p>Text alternatives for images, captions and transcripts for media, sufficient contrast, structure that survives zoom and reflow, and meaning never carried by colour alone.</p></div>
              <div><span className="lbl">O &mdash; OPERABLE</span><h3>Operable: people can use it</h3><p>Everything works by keyboard, focus is visible and never hidden, there is time to act, nothing flashes dangerously, and targets are large enough to hit.</p></div>
              <div><span className="lbl">U &mdash; UNDERSTANDABLE</span><h3>Understandable: people can follow it</h3><p>Plain labels and instructions, predictable behaviour, errors that explain themselves, no re-typing the same data, and sign-in that doesn&rsquo;t depend on a memory test.</p></div>
              <div><span className="lbl">R &mdash; ROBUST</span><h3>Robust: technology can read it</h3><p>Code that exposes the correct name, role, state and value to screen readers and other assistive technology, and announces status changes.</p></div>
            </div>

            <h3 className="sub" id="wcag-in-ui">What WCAG means in UI design</h3>
            <p>Most failures we find are design decisions, not coding slips &mdash; which is why fixing them late is expensive. The UI rules that come up in almost every audit:</p>
            <ul className="ticks">
              <li><b>Contrast:</b> 4.5:1 for body text, 3:1 for large text, icons, input borders and focus indicators.</li>
              <li><b>Focus:</b> a visible focus style on every interactive element, never hidden under a sticky header or cookie banner (WCAG 2.2).</li>
              <li><b>Target size:</b> at least 24 &times; 24 CSS pixels, or enough spacing around smaller targets (WCAG 2.2).</li>
              <li><b>Colour:</b> errors, required fields, stock and selected states shown by text or shape as well as colour.</li>
              <li><b>Reflow:</b> no two-dimensional scrolling at 320px wide or 400% zoom.</li>
              <li><b>Forms:</b> visible labels, instructions before the field, errors in text next to the field and announced to screen readers.</li>
              <li><b>Dragging:</b> sliders, carousels and configurators offer a single-pointer alternative to dragging (WCAG 2.2).</li>
            </ul>
          </section>

          {/* ============ 07 DEADLINES ============ */}
          <section id="deadlines" aria-labelledby="dl-h">
            <p className="sheet-no">SHEET 07 &mdash; DEADLINES 2026</p>
            <h2 id="dl-h">WCAG compliance deadlines in 2026.</h2>
            <p className="answer">The main WCAG compliance deadline in 2026 is 24 April 2026, when the US ADA Title II rule, as published, requires large state and local government entities to meet WCAG 2.1 AA. The European Accessibility Act (June 2025) and AODA (January 2021) deadlines have already passed, and ADA Title III lawsuits have no deadline at all &mdash; they can be filed at any time.</p>
            <div className="tscroll" role="region" aria-labelledby="dl-cap" tabIndex={0}>
              <table className="mtable">
                <caption id="dl-cap">Key WCAG compliance dates, as published</caption>
                <thead><tr><th scope="col">Date</th><th scope="col">Framework</th><th scope="col">Requirement</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  <tr><th scope="row">1 Jan 2021</th><td>AODA</td><td>All websites and web content: WCAG 2.0 AA</td><td>In force</td></tr>
                  <tr><th scope="row">28 Jun 2025</th><td>European Accessibility Act</td><td>Covered products and services: EN 301 549 / WCAG 2.1 AA; transition periods for some existing services</td><td>In force</td></tr>
                  <tr><th scope="row">2025 onwards</th><td>SEBI</td><td>Regulated entities&rsquo; websites, apps and onboarding made accessible, on SEBI&rsquo;s phased timelines</td><td>Phasing in</td></tr>
                  <tr><th scope="row">24 Apr 2026</th><td>ADA Title II</td><td>Public entities serving 50,000+ people: WCAG 2.1 AA</td><td>2024 rule</td></tr>
                  <tr><th scope="row">26 Apr 2027</th><td>ADA Title II</td><td>Smaller public entities and special districts: WCAG 2.1 AA</td><td>2024 rule</td></tr>
                  <tr><th scope="row">Ongoing</th><td>ADA Title III</td><td>Private businesses: no fixed date; legal exposure is continuous</td><td>Now</td></tr>
                  <tr><th scope="row">Ongoing</th><td>UK PSBAR</td><td>Public sector sites monitored against WCAG 2.2 AA</td><td>Now</td></tr>
                </tbody>
              </table>
            </div>
            <p className="fine">Dates are as published by each regulator &mdash; see <a href="#sources">sources</a>. Regulators can amend or extend them, so we confirm the current position for your organisation at kick-off.</p>
          </section>

          {/* ============ 08 PROCESS ============ */}
          <section id="process" aria-labelledby="proc-h">
            <p className="sheet-no">SHEET 08 &mdash; HOW THE AUDIT WORKS</p>
            <h2 id="proc-h">How a WCAG compliance assessment works.</h2>
            <p className="answer">Our WCAG compliance assessment moves from scope to sweep to manual testing to a written, prioritised report &mdash; then, if you choose, to fixing, re-testing and monitoring. Nothing is reported until a person has confirmed it.</p>
            <ol className="steps">
              <li><b>Scope</b><span>We agree a representative sample: page templates plus the journeys that matter commercially &mdash; sign-up, search, basket, checkout, KYC. Price and timescale are fixed here.</span></li>
              <li><b>Automated sweep</b><span>Scanners run across the sample to catch machine-detectable failures quickly. This is the start of the audit, never the verdict.</span></li>
              <li><b>Manual testing</b><span>Keyboard-only operation, NVDA and VoiceOver, 400% zoom, 320px reflow, contrast and non-colour cues, forms and error recovery &mdash; on each journey, end to end.</span></li>
              <li><b>Report</b><span>Every issue with its failing element, WCAG success criterion and level, severity, user impact and a recommended fix &mdash; plus a plan of what to fix first.</span></li>
              <li><b>Walkthrough</b><span>A call with whoever will do the fixing, so nothing in the report is ambiguous.</span></li>
              <li><b>Remediation &amp; re-test</b><span>On Audit + Remediation, we apply the code-level fixes ourselves, re-test against the original report and supply an accessibility statement.</span></li>
              <li><b>Monitor</b><span>Scheduled scans and human review catch regressions as the site keeps changing.</span></li>
            </ol>
          </section>

          {/* ============ 09 CHECKER VS AUDIT ============ */}
          <section id="checker-vs-audit" aria-labelledby="cva-h">
            <p className="sheet-no">SHEET 09 &mdash; CHECKER VS AUDIT</p>
            <h2 id="cva-h">WCAG compliance checker vs a manual audit.</h2>
            <p className="answer">A WCAG compliance checker is an automated tool that scans code for machine-detectable failures. It is fast and useful, but reliably finds only around a third of WCAG issues &mdash; a WCAG compliance test that stands up as evidence needs manual testing by a person.</p>
            <div className="tscroll" role="region" aria-labelledby="cva-cap" tabIndex={0}>
              <table className="mtable">
                <caption id="cva-cap">Automated checker, overlay widget and manual audit compared</caption>
                <thead><tr><th scope="col">Question</th><th scope="col">Automated checker</th><th scope="col">Overlay widget</th><th scope="col">Manual audit</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Finds missing alt text, low contrast</th><td>Yes</td><td>Partly</td><td>Yes</td></tr>
                  <tr><th scope="row">Judges whether alt text is meaningful</th><td>No</td><td>No</td><td>Yes</td></tr>
                  <tr><th scope="row">Tests a checkout with a screen reader</th><td>No</td><td>No</td><td>Yes</td></tr>
                  <tr><th scope="row">Finds keyboard traps and focus order</th><td>Rarely</td><td>No</td><td>Yes</td></tr>
                  <tr><th scope="row">Fixes the underlying code</th><td>No</td><td>No</td><td>With remediation</td></tr>
                  <tr><th scope="row">Evidence for ADA, AODA, SEBI or EAA</th><td>Weak</td><td>No</td><td>Yes</td></tr>
                  <tr><th scope="row">Cost with us</th><td>Free</td><td>&mdash;</td><td>From £995</td></tr>
                </tbody>
              </table>
            </div>
            <p>We don&rsquo;t sell or recommend overlays. They leave the source code unchanged (see the practitioners&rsquo; <a href={src('Overlay')}>Overlay Fact Sheet</a>), many ADA lawsuits have been filed against sites running them, and in 2025 the US Federal Trade Commission acted against an overlay vendor over its compliance claims.</p>
          </section>

          {/* ============ 10 CHECKLIST ============ */}
          <section id="checklist" aria-labelledby="cl-h">
            <p className="sheet-no">SHEET 10 &mdash; WCAG COMPLIANCE CHECKLIST</p>
            <h2 id="cl-h">WCAG compliance checklist.</h2>
            <p className="answer">This WCAG compliance checklist lists the Level A and AA success criteria we see fail most often on commercial websites. Use it as a self-check before an audit; it is a starting point, not the full 55 criteria.</p>
            <div className="tscroll" role="region" aria-labelledby="cl-cap" tabIndex={0}>
              <table className="mtable checklist">
                <caption id="cl-cap">Common WCAG 2.2 A and AA failures</caption>
                <thead><tr><th scope="col">Criterion</th><th scope="col">Level</th><th scope="col">Check</th></tr></thead>
                <tbody>
                  <tr className="grp"><th scope="rowgroup" colSpan={3}>Perceivable</th></tr>
                  <tr><th scope="row">1.1.1 Non-text content</th><td>A</td><td>Every meaningful image, icon and chart has a text alternative; decorative ones are hidden</td></tr>
                  <tr><th scope="row">1.2.2 Captions</th><td>A</td><td>Pre-recorded video with sound has accurate captions</td></tr>
                  <tr><th scope="row">1.3.1 Info and relationships</th><td>A</td><td>Headings, lists, tables and form groups are marked up, not just styled</td></tr>
                  <tr><th scope="row">1.4.1 Use of colour</th><td>A</td><td>Errors, links and states aren&rsquo;t shown by colour alone</td></tr>
                  <tr><th scope="row">1.4.3 Contrast (minimum)</th><td>AA</td><td>Text is at least 4.5:1, large text 3:1</td></tr>
                  <tr><th scope="row">1.4.10 Reflow</th><td>AA</td><td>Works at 320px wide without horizontal scrolling</td></tr>
                  <tr><th scope="row">1.4.11 Non-text contrast</th><td>AA</td><td>Input borders, icons and focus indicators are at least 3:1</td></tr>
                  <tr className="grp"><th scope="rowgroup" colSpan={3}>Operable</th></tr>
                  <tr><th scope="row">2.1.1 Keyboard</th><td>A</td><td>Every function works with a keyboard alone</td></tr>
                  <tr><th scope="row">2.1.2 No keyboard trap</th><td>A</td><td>Focus can always move away from modals, embeds and widgets</td></tr>
                  <tr><th scope="row">2.4.3 Focus order</th><td>A</td><td>Tab order follows the visual and logical order</td></tr>
                  <tr><th scope="row">2.4.7 Focus visible</th><td>AA</td><td>You can always see where keyboard focus is</td></tr>
                  <tr><th scope="row">2.4.11 Focus not obscured</th><td>AA</td><td>Focused items aren&rsquo;t hidden by sticky headers or banners &mdash; new in 2.2</td></tr>
                  <tr><th scope="row">2.5.7 Dragging movements</th><td>AA</td><td>Anything draggable has a click or tap alternative &mdash; new in 2.2</td></tr>
                  <tr><th scope="row">2.5.8 Target size (minimum)</th><td>AA</td><td>Targets are 24 &times; 24 CSS px, or spaced &mdash; new in 2.2</td></tr>
                  <tr className="grp"><th scope="rowgroup" colSpan={3}>Understandable</th></tr>
                  <tr><th scope="row">3.1.1 Language of page</th><td>A</td><td>The page language is set in the code</td></tr>
                  <tr><th scope="row">3.2.6 Consistent help</th><td>A</td><td>Help and contact links sit in the same place on each page &mdash; new in 2.2</td></tr>
                  <tr><th scope="row">3.3.1 Error identification</th><td>A</td><td>Errors are described in text, next to the field</td></tr>
                  <tr><th scope="row">3.3.2 Labels or instructions</th><td>A</td><td>Every field has a visible label</td></tr>
                  <tr><th scope="row">3.3.7 Redundant entry</th><td>A</td><td>Users aren&rsquo;t asked to re-type what they already entered &mdash; new in 2.2</td></tr>
                  <tr><th scope="row">3.3.8 Accessible authentication</th><td>AA</td><td>Sign-in allows paste and password managers; no memory puzzles &mdash; new in 2.2</td></tr>
                  <tr className="grp"><th scope="rowgroup" colSpan={3}>Robust</th></tr>
                  <tr><th scope="row">4.1.2 Name, role, value</th><td>A</td><td>Custom controls expose their name, role and state to screen readers</td></tr>
                  <tr><th scope="row">4.1.3 Status messages</th><td>AA</td><td>&ldquo;Added to basket&rdquo; and similar updates are announced</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ============ 11 CERTIFICATION ============ */}
          <section id="certification" aria-labelledby="cert-h">
            <p className="sheet-no">SHEET 11 &mdash; CERTIFICATION</p>
            <h2 id="cert-h">WCAG compliance certification: does it exist?</h2>
            <p className="answer">There is no official WCAG compliance certification. The W3C writes the standard but does not certify websites, and any &ldquo;WCAG certified&rdquo; badge is a vendor&rsquo;s own mark. What regulators, courts and procurement teams accept is evidence.</p>
            <div className="row2 cert">
              <div className="item">
                <span className="lbl">EVIDENCE THAT COUNTS</span>
                <ul style={{ marginTop: '14px' }}>
                  <li>An audit report against a named WCAG version and level</li>
                  <li>A remediation record and re-test against that report</li>
                  <li>A published accessibility statement, kept current</li>
                  <li>An Accessibility Conformance Report (ACR), usually on the VPAT template, for procurement</li>
                  <li>Ongoing monitoring that shows it stayed fixed</li>
                </ul>
              </div>
              <div className="item">
                <span className="lbl">WHAT WE PROVIDE</span>
                <p style={{ marginTop: '14px' }}>Every paid audit produces the report. Audit + Remediation adds the fixes, the re-test and an accessibility statement you can publish; Monitoring Plus keeps that statement current. If you need an ACR / VPAT for a tender, the audit report is the evidence it&rsquo;s written from &mdash; ask us when you enquire.</p>
                <p className="note">Individual certifications, such as IAAP&rsquo;s, certify people&rsquo;s knowledge &mdash; not a website&rsquo;s conformance.</p>
              </div>
            </div>
          </section>

          {/* ============ 12 FAQ ============ */}
          <section id="faq" aria-labelledby="faq-h">
            <p className="sheet-no">SHEET 12 &mdash; COMMON QUESTIONS</p>
            <h2 id="faq-h">WCAG compliance audit FAQ.</h2>
            <div className="faq-list">
              {FAQS.map((f) => (
                <div className="faq" key={f.q}>
                  <h3>{f.q}</h3>
                  <p className="faq-a">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ============ 13 SOURCES ============ */}
          <section id="sources" aria-labelledby="src-h">
            <p className="sheet-no">SHEET 13 &mdash; SOURCES</p>
            <h2 id="src-h">Sources and references.</h2>
            <p>The primary documents behind the standards, laws and dates on this page. Where a regulator publishes updates, the linked page is the one to check.</p>
            <ol className="sources">
              {SOURCES.map((c) => (
                <li key={c.url}>
                  <a href={c.url}>{c.name}</a>
                  <span>{c.publisher}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* ============ CLOSE ============ */}
          <section className="close" id="contact" aria-labelledby="close-h">
            <p className="sheet-no">NEXT STEP</p>
            <h2 id="close-h">Start with a free WCAG check.</h2>
            <p>It costs nothing and commits you to nothing. When you want a person to read the results, the £295 Health Check is credited in full against an audit booked within 90 days. Tell us which framework you answer to &mdash; ADA, AODA, SEBI, the EAA or UK law &mdash; and we&rsquo;ll scope the audit to it.</p>
            <div className="ctas">
              <a className="btn solid" href="/contact">Book a WCAG audit</a>
              <a className="btn" href="#plan-check">Free WCAG check</a>
              <a className="btn" href="/pricing">Full schedule of rates</a>
            </div>
            <p className="terms">All prices are standard 2026 rates in GBP and exclude VAT. Ranges reflect scope; a fixed scope and fixed quote are confirmed at kick-off. Monitoring is monthly and can be changed with 30 days&apos; notice. Accessibility audits are delivered against WCAG 2.2 AA; an audit reports conformance at a point in time and is not legal advice.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
