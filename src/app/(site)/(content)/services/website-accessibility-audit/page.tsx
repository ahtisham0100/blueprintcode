import type { Metadata } from 'next';
import Link from 'next/link';
import '../../configurators/styles.css';
import './styles.css';
import PreCheck from './PreCheck';
import EvidenceDialog from './EvidenceDialog';
import { SITE_URL, SITE_NAME, OG_DEFAULTS } from '@/lib/seo';

/* Service landing page for website accessibility audits, targeting "website
   accessibility audit", "accessibility audit services", "free accessibility
   check / WCAG checker" and "accessibility remediation". The commercial
   detail (plans, prices, ADA/AODA/EAA mapping) lives on
   /services/wcag-compliance-audit-pricing; this page explains the approach and
   links there, so the two don't compete for the same queries.

   Structured data: Service + FAQPage + BreadcrumbList in one @graph, linked to
   the site-wide Organization entity. */

const URL = `${SITE_URL}/services/website-accessibility-audit`;
const NAME = 'Website accessibility audit and remediation';
const DESC =
  'Website accessibility audits from Blueprint Code AI: a free automated WCAG 2.2 AA pre-check, human review with keyboard and screen-reader testing, a prioritised remediation blueprint, the fixes, and a retest.';

/* SERP pair, kept inside ~60 / ~155 characters. */
const TITLE = 'Website Accessibility Audit & Free WCAG Check — BPC';
const META_DESC =
  'Free WCAG 2.2 AA pre-check, then human accessibility review, practical remediation and retest. Find the barriers, understand them, and fix them.';

export const metadata: Metadata = {
  title: TITLE,
  description: META_DESC,
  keywords: [
    'website accessibility audit',
    'accessibility audit services',
    'web accessibility audit',
    'free accessibility check',
    'free WCAG checker',
    'WCAG 2.2 AA pre-check',
    'accessibility remediation',
    'accessibility testing',
  ],
  alternates: { canonical: URL },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Website accessibility audit, made practical',
    description:
      'Start with a free WCAG 2.2 AA pre-check. Then human review, a prioritised remediation blueprint, the fixes, and a retest.',
    type: 'website',
    url: URL,
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is a website accessibility audit?',
    a: 'A website accessibility audit tests a site against an accessibility standard — usually WCAG 2.2 Level AA — to find the barriers that stop disabled people using it. A proper audit combines automated scanning with manual testing by a person: keyboard use, screen readers, zoom and reflow, forms and error recovery.',
  },
  {
    q: 'Is the free WCAG pre-check a full audit?',
    a: 'No. The free pre-check is an automated scan for machine-detectable WCAG 2.2 A and AA failures. It is a useful first step, but automated tools find only part of the picture, so it is not certification or proof of conformance. A full audit adds human testing of everything software cannot judge.',
  },
  {
    q: 'Can automated accessibility checkers find every issue?',
    a: 'No. UK government guidance from the Department for Work and Pensions cites a Government Digital Service study in which the best individual automated tools found only around 30–40% of 142 known accessibility issues. Keyboard behaviour, screen-reader experience and whether content makes sense still need people to test.',
  },
  {
    q: 'Do you fix the accessibility issues you find?',
    a: 'Yes. Findings become a prioritised remediation blueprint — what changes, where, who owns it — and Blueprint Code AI, your developers or a combined team implement the fixes. The changes are then retested and any remaining exceptions documented.',
  },
  {
    q: 'How much does a website accessibility audit cost?',
    a: 'The automated pre-check is free. Paid reviews, full WCAG 2.2 AA audits, remediation and monitoring are published with their prices on our WCAG compliance audit pricing page; a fixed quote is confirmed before work starts.',
  },
];

export default function WebsiteAccessibilityAuditPage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${URL}#service`,
        name: NAME,
        alternateName: ['Website accessibility audit', 'Free WCAG 2.2 AA pre-check', 'Accessibility remediation'],
        serviceType: 'Web accessibility audit and remediation',
        description: DESC,
        url: URL,
        provider: { '@id': `${SITE_URL}/#organization`, '@type': 'ProfessionalService', name: SITE_NAME, url: `${SITE_URL}/` },
        areaServed: [
          { '@type': 'Country', name: 'United Kingdom' },
          { '@type': 'Place', name: 'Worldwide' },
        ],
        category: 'Digital accessibility',
        offers: {
          '@type': 'Offer',
          name: 'Free automated WCAG 2.2 AA pre-check',
          price: 0,
          priceCurrency: 'GBP',
          url: `${URL}#scan`,
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
          { '@type': 'ListItem', position: 3, name: 'Website accessibility audit', item: URL },
        ],
      },
    ],
  };

  return (
    <main id="main" className="a11y">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <div className="sheet title-block">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <Link href="/services">Services</Link>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <span aria-current="page">Website accessibility audit</span>
        </nav>

        <dl className="stamp">
          <div className="row"><dt>GROUP 06</dt><dd>Audit &amp; improve / accessibility</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Website accessibility audits, made practical.</h1>
        <p className="standfirst">Find accessibility problems. Understand what they mean. Build a clear route to fixing them. Start with a free automated WCAG 2.2 AA pre-check &mdash; no account required.</p>
        <div className="actions">
          <a className="button solid" href="#scan">Run a free WCAG pre-check →</a>
          <a className="button" href="#how">How remediation works</a>
        </div>

        <dl className="a11y-meta">
          <div><dt>Standard</dt><dd>WCAG 2.2 AA</dd></div>
          <div><dt>First step</dt><dd>Free automated pre-check</dd></div>
          <div><dt>Next step</dt><dd>Human review + remediation</dd></div>
          <div><dt>Delivery</dt><dd>UK + global</dd></div>
        </dl>
      </div>

      {/* 01 — WHY IT MATTERS */}
      <section id="why">
        <div className="sheet">
          <p className="sheet-no">SHEET 01 — WHY IT MATTERS</p>
          <div className="two">
            <h2>Accessibility isn&rsquo;t a checklist.</h2>
            <div className="body-copy">
              <p>A website can look perfectly usable while presenting serious barriers to people using keyboards, screen readers, magnification or other assistive technology.</p>
              <p>Blueprint Code AI combines automated testing with practical human assessment and remediation. The aim is not to hand you a frightening report. It is to show what needs attention, why it matters and how to fix it.</p>
            </div>
          </div>
          <div className="cols">
            <div className="col">
              <span className="lbl">AUTOMATED</span>
              <h3>Find detectable issues quickly.</h3>
              <p>Structure, accessible names, image alternatives, contrast and other machine-detectable failures can be checked at scale.</p>
            </div>
            <div className="col">
              <span className="lbl">HUMAN</span>
              <h3>Test the experience software can&rsquo;t understand.</h3>
              <p>Keyboard behaviour, focus, screen-reader experience, forms, meaningful content and real usability still require people.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — FREE PRE-CHECK */}
      <section id="scan" aria-labelledby="scan-h">
        <div className="sheet scan-pair">
          <div>
            <p className="sheet-no">SHEET 02 — FREE WCAG PRE-CHECK</p>
            <h2 id="scan-h">Check your website.</h2>
            <p style={{ marginTop: '18px' }}>Enter a public website address to request an automated WCAG 2.2 pre-check. Automated testing is useful for finding machine-detectable barriers, but it is only the first stage of accessibility testing.</p>
            <div className="disclaimer">
              <b>Important:</b> an automated scan is a pre-check, not certification and not proof of full WCAG conformance. Many accessibility requirements need manual testing.
            </div>
            <div className="disclaimer">
              <span className="lbl">WHY THE FREE SCAN IS ONLY THE START</span>
              <strong>Automated accessibility tools catch only part of the picture.</strong>
              They are excellent at finding machine-detectable problems quickly, but they cannot determine whether a digital experience is genuinely accessible. Manual and assistive-technology testing remain essential.
              <div><EvidenceDialog /></div>
            </div>
          </div>
          <PreCheck />
        </div>
      </section>

      {/* 03 — AUTOMATION + HUMAN REVIEW */}
      <section id="automation-vs-human">
        <div className="sheet">
          <p className="sheet-no">SHEET 03 — AUTOMATION + HUMAN REVIEW</p>
          <h2 style={{ marginBottom: '32px' }}>What software can see &mdash; and what it can&rsquo;t.</h2>
          <div className="compare">
            <div>
              <h3>Automated checks can identify</h3>
              <ul className="ticks">
                <li>Missing or invalid accessible names</li>
                <li>Some colour-contrast failures</li>
                <li>Missing image alternatives</li>
                <li>Landmark and structural problems</li>
                <li>Certain ARIA and semantic errors</li>
                <li>Other programmatically detectable WCAG failures</li>
              </ul>
            </div>
            <div>
              <h3>People still need to assess</h3>
              <ul className="ticks">
                <li>Keyboard usability and logical focus</li>
                <li>Screen-reader experience and announcements</li>
                <li>Form errors and recovery</li>
                <li>Meaning and quality of alternatives</li>
                <li>Zoom, reflow and practical usability</li>
                <li>Captions, motion and interaction behaviour</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 04 — REMEDIATION ROAD */}
      <section id="how">
        <div className="sheet">
          <p className="sheet-no">SHEET 04 — REMEDIATION ROAD</p>
          <div className="two">
            <h2>Found something? We don&rsquo;t just hand you a report.</h2>
            <p className="standfirst">Findings move into a structured remediation blueprint: what changes, where, priority, responsibility, implementation and retest.</p>
          </div>
          <ol className="road">
            <li><span className="lbl">01 / SCAN</span><h3>Detect</h3><p>Automated reconnaissance identifies machine-detectable issues.</p></li>
            <li><span className="lbl">02 / REVIEW</span><h3>Verify</h3><p>Human review checks findings and the areas automation cannot judge.</p></li>
            <li><span className="lbl">03 / BLUEPRINT</span><h3>Plan</h3><p>Issues become a prioritised remediation scope with clear ownership.</p></li>
            <li><span className="lbl">04 / REMEDIATE</span><h3>Fix</h3><p>BPC, your developers or a combined team implement the agreed work.</p></li>
            <li><span className="lbl">05 / RETEST</span><h3>Confirm</h3><p>Changes are checked again and remaining exceptions documented.</p></li>
          </ol>
        </div>
      </section>

      {/* 05 — SERVICES */}
      <section id="services">
        <div className="sheet">
          <p className="sheet-no">SHEET 05 — ACCESSIBILITY SERVICES</p>
          <h2 style={{ marginBottom: '32px' }}>Audit &amp; improve.</h2>
          <div className="cols">
            <div className="col">
              <span className="lbl">REVIEW</span>
              <h3>WCAG accessibility reviews</h3>
              <p>Automated and manual assessment against the agreed accessibility target.</p>
            </div>
            <div className="col">
              <span className="lbl">REMEDIATION</span>
              <h3>Practical fixes</h3>
              <p>Developer-ready actions, component improvements and direct remediation where appropriate.</p>
            </div>
            <div className="col">
              <span className="lbl">RETEST</span>
              <h3>Evidence after change</h3>
              <p>Retesting, documented remaining issues and a clearer picture of the site&rsquo;s accessibility position.</p>
            </div>
            <div className="col">
              <span className="lbl">PRICING</span>
              <h3>Published rates</h3>
              <p>Plans and prices for audits, remediation and monitoring are on <Link href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="sheet">
          <p className="sheet-no">COMMON QUESTIONS</p>
          <div className="two">
            <h2>Accessibility audit questions, answered plainly.</h2>
            <div className="faq">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="close" id="next-step">
        <div className="sheet">
          <p className="sheet-no">SHEET 06 — NEXT STEP</p>
          <h2>Make the problems visible. Then make them fixable.</h2>
          <p>Start with the free automated pre-check. If the findings justify a deeper review, Blueprint Code AI can turn them into a practical remediation project.</p>
          <div className="actions">
            <a className="button solid" href="#scan">Run free pre-check →</a>
            <Link className="button" href="/contact">Discuss accessibility →</Link>
            <Link className="button" href="/services/wcag-compliance-audit-pricing">View WCAG pricing →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
