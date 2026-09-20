import type { Metadata } from 'next';
import Link from 'next/link';
import '../styles.css';

/* Service landing page targeting "guided selling tools" / "product
   recommendation engine development" and related commercial-intent queries.
   Child of the /configurators hub. Carries Service, FAQPage and BreadcrumbList
   structured data. */

const URL = 'https://blueprintcode.ai/configurators/guided-selling-tools';
const NAME = 'Guided selling & product recommendation tools';
const DESC =
  'Custom guided selling and product recommendation tools that turn a large, technical catalogue into a short, confident choice — and show the customer why each product was recommended. Connected to your store, proven on a live retail business.';

/* NAME and DESC feed the Service and BreadcrumbList schema below, where length
   costs nothing. TITLE and META_DESC are the SERP-facing pair, kept inside
   Google's ~60-character title and ~155-character description limits so neither
   gets truncated mid-phrase in a result snippet. */
const TITLE = 'Guided selling tool development — Blueprint Code AI';
const META_DESC =
  'Guided selling and product recommendation tools that turn a large, technical catalogue into a short, confident choice — and show why.';

export const metadata: Metadata = {
  title: TITLE,
  description: META_DESC,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description:
      'Guided selectors and recommendation engines that turn a big catalogue into a short, reasoned shortlist — and hand off to checkout.',
    type: 'website',
    url: URL,
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is guided selling?',
    a: 'Guided selling replaces "browse the catalogue and hope" with a short set of plain-English questions that lead the customer to the right product, along with the reason it was chosen. It is most valuable when the catalogue is large, technical or full of compatibility rules the customer can’t be expected to know.',
  },
  {
    q: 'How is a recommendation engine different from a filter?',
    a: 'A filter removes products that don’t match; a recommendation engine actively proposes the best fit and explains why, handling the customer who doesn’t yet know what to filter for. Filters need the customer to already understand the options — a recommendation tool doesn’t.',
  },
  {
    q: 'Does it integrate with our ecommerce platform?',
    a: 'Yes. The tool reads your product data and hands the chosen items off to a WooCommerce or Shopify basket, or to your CRM/quote system via API, so a recommendation becomes an order without the customer starting again.',
  },
  {
    q: 'How is this different from a chatbot?',
    a: 'A generic chatbot answers questions; a guided selling tool is a structured, rules-based journey grounded in your actual products, pricing and compatibility, with a defined commercial outcome at the end. We can add an AI advisory layer on top once that structured foundation exists, so recommendations are explained from real product context rather than generic chat.',
  },
  {
    q: 'How much does a guided selling tool cost and how long does it take?',
    a: 'A focused guided selector typically starts around £2,500 as a foundation build. An advanced single tool with added rules, pricing and quoting or one integration runs £7,500 to £15,000, and a professional multi-tool suite £15,000 to £30,000 depending on integrations and quoting. Every build starts with a fixed-price Prototype Sprint (£625–£3,000, one to four weeks) that is credited against the full build.',
  },
];

export default function GuidedSellingPage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: NAME,
    serviceType: 'Guided selling and product recommendation tool development',
    description: DESC,
    provider: {
      '@type': 'Organization',
      name: 'Blueprint Code AI',
      url: 'https://blueprintcode.ai/',
    },
    areaServed: 'Worldwide',
    url: URL,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blueprintcode.ai/' },
      { '@type': 'ListItem', position: 2, name: 'Configurators', item: 'https://blueprintcode.ai/configurators' },
      { '@type': 'ListItem', position: 3, name: NAME, item: URL },
    ],
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="sheet title-block">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <Link href="/configurators">Configurators</Link>
          <span className="crumbs-sep" aria-hidden="true">/</span>
          <span aria-current="page">Guided selling &amp; recommendations</span>
        </nav>

        <dl className="stamp">
          <div className="row"><dt>DISCIPLINE</dt><dd>Guided selling &amp; recommendations</dd></div>
          <div className="row"><dt>DECIDES</dt><dd>Which product, from a hard catalogue</dd></div>
          <div className="row"><dt>WORKED EXAMPLE</dt><dd>PP-AV Projector Selector, live</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Guided selling that makes the choice obvious.</h1>
        <p className="standfirst">When a catalogue is large, technical or full of rules the customer can&rsquo;t be expected to know, browsing fails quietly &mdash; they leave without buying and you never hear why. A guided selling tool asks a few plain questions and returns a short, reasoned shortlist, then hands it straight to checkout.</p>
      </div>

      {/* 01 — THE PROBLEM */}
      <section id="problem">
        <div className="sheet">
          <p className="sheet-no">SHEET 01 — THE PROBLEM WITH BROWSING</p>
          <div className="two">
            <h2>More filters don&rsquo;t help a confused customer.</h2>
            <div>
              <p>Filters assume the customer already knows what to filter for. Faceted search, longer spec tables and more categories just move the work from your business onto someone who came to you precisely because they didn&rsquo;t know the answer.</p>
              <p>Guided selling inverts that: it asks about the customer&rsquo;s situation in language they already use, then does the technical translation for them &mdash; and shows the reasoning, so the recommendation is trusted rather than second-guessed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — WHAT WE BUILD */}
      <section id="what-we-build">
        <div className="sheet">
          <p className="sheet-no">SHEET 02 — WHAT WE BUILD</p>
          <div className="two">
            <h2>Four shapes of the same idea.</h2>
            <div>
              <p>Most businesses need one or two of these, chosen by where customers currently get stuck. Every example is a tool we built for our own retail business and still run today.</p>
            </div>
          </div>

          <div className="cols">
            <div className="col">
              <span className="lbl">GUIDED SELECTOR</span>
              <ul className="ticks">
                <li>Plain-English questions in, a short shortlist out</li>
                <li>The reason each item was chosen, shown</li>
                <li>For catalogues too large or technical to browse</li>
              </ul>
            </div>
            <div className="col">
              <span className="lbl">RECOMMENDATION ENGINE</span>
              <ul className="ticks">
                <li>Actively proposes the best fit, not just what matches</li>
                <li>Handles &ldquo;I don&rsquo;t know&rdquo; without a dead end</li>
                <li>Rules held as data, editable without a developer</li>
              </ul>
            </div>
            <div className="col">
              <span className="lbl">COMPATIBILITY CHECKER</span>
              <ul className="ticks">
                <li>Stops the wrong combination before checkout</li>
                <li>Cheaper than the return, far cheaper than the review</li>
                <li>Offers a working alternative, not just an error</li>
              </ul>
            </div>
            <div className="col">
              <span className="lbl">QUIZ / NEEDS FINDER</span>
              <ul className="ticks">
                <li>A light, on-brand path into a considered purchase</li>
                <li>Captures a qualified enquiry even when they don&rsquo;t buy today</li>
                <li>Hands off to basket, saved quote or CRM</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — UNDER THE SURFACE */}
      <section id="architecture">
        <div className="sheet">
          <p className="sheet-no">SHEET 03 — UNDER THE SURFACE</p>
          <div className="two">
            <h2>The recommendation has to be commercially correct.</h2>
            <div>
              <p>A shortlist that looks smart but suggests an incompatible or unprofitable combination costs you more than no tool at all. We encode your real product logic &mdash; compatibility, availability, margin, trade rules &mdash; as data the business can maintain, and keep pricing authority on the server.</p>
              <p>Because the customer&rsquo;s answers are stored once in a shared profile, a needs finder, a selector and a compatibility check behave like one system that remembers them, rather than three tools asking the same questions. It&rsquo;s the same architecture behind the connected <Link href="/ppav-case-study">PP-AV showroom</Link>.</p>
            </div>
          </div>
          <p className="levels-note">Build levels and pricing are on the <Link href="/configurators#levels">configurators overview</Link>; add-ons including an AI advisory layer sit on the <Link href="/pricing">schedule of rates</Link>. For products where finish and form drive the decision, see <Link href="/configurators/3d-product-configurator-development">3D product configurator development</Link>.</p>
        </div>
      </section>

      {/* 04 — FAQ */}
      <section id="faq">
        <div className="sheet">
          <p className="sheet-no">COMMON QUESTIONS</p>
          <div className="two">
            <h2>Guided selling questions, answered plainly.</h2>
            <div>
              {FAQS.map((f) => (
                <div key={f.q} style={{ marginBottom: '26px' }}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">START HERE</p>
          <h2>What question does your sales team answer most often?</h2>
          <p>That question is usually the tool. Send it to us with your product and how you sell it today, and we&rsquo;ll tell you whether a selector, a recommendation engine or a compatibility check fits &mdash; and prove it in a fixed-price Prototype Sprint.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Discuss guided selling</a>
            <a className="button" href="/configurators/3d-product-configurator-development">3D configurator development</a>
          </div>
        </div>
      </section>
    </main>
  );
}
