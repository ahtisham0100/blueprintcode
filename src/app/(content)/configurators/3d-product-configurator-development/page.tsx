import type { Metadata } from 'next';
import Link from 'next/link';
import '../styles.css';

/* Service landing page targeting "3D product configurator development" and
   related commercial-intent queries. Child of the /configurators hub, so the
   breadcrumb reads Home / Configurators / 3D product configurator development.
   Carries Service, FAQPage and BreadcrumbList structured data. */

const URL = 'https://blueprintcode.ai/configurators/3d-product-configurator-development';
const NAME = '3D product configurator development';
const DESC =
  'We build real-time 3D product configurators for the web: live materials, geometry and server-authoritative pricing, connected straight to your checkout. Prototype-first, and proven on our own live retail business.';

export const metadata: Metadata = {
  title: `${NAME} — Blueprint Code AI`,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: {
    title: `${NAME} — Blueprint Code AI`,
    description:
      'Real-time 3D configurators that sell: live materials and geometry, server-side pricing, checkout hand-off. Built browser-native, no plugins.',
    type: 'website',
    url: URL,
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does a 3D product configurator cost?',
    a: 'A focused real-time 3D configurator for one product family typically sits in the advanced band, £7,500 to £15,000. A professional build with pricing, rules and ecommerce integration commonly sits between £15,000 and £30,000, and connected multi-tool showrooms start from £35,000. Every build begins with a fixed-price Prototype Sprint (£625–£3,000) that proves the hardest part first and is credited against the full build.',
  },
  {
    q: 'Should my product be 2D or 3D?',
    a: 'Use real-time 3D when shape, proportion, material finish or spatial arrangement changes with the configuration and affects the buying decision. If customers mainly compare colours or finishes from a fixed angle, a cheaper 2D or layered-image configurator is usually the better commercial choice. We recommend the lightest method that resolves the customer’s actual uncertainty.',
  },
  {
    q: 'Does a browser-based 3D configurator work on mobile?',
    a: 'Yes. We build to a performance budget with optimised glTF/GLB models and level-of-detail so the experience stays smooth on mid-range phones, and we can serve a lighter presentation to mobile while desktop gets the full scene. No app or plugin is required — it runs in the browser with WebGL.',
  },
  {
    q: 'Can it connect to Shopify or WooCommerce?',
    a: 'Yes. The configured product hands off to a Shopify or WooCommerce basket, or to your CRM/quote system via API, with the configuration metadata preserved so the order reaches fulfilment in a form your team can actually pick and ship.',
  },
  {
    q: 'How long does a 3D configurator take to build?',
    a: 'A Prototype Sprint runs one to four weeks. A production Foundation build is typically a few weeks after the sprint; a professional suite with integrations and quoting runs longer depending on product logic, assets and the systems it connects to.',
  },
];

export default function ThreeDConfiguratorPage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: NAME,
    serviceType: NAME,
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
          <span aria-current="page">3D configurator development</span>
        </nav>

        <dl className="stamp">
          <div className="row"><dt>DISCIPLINE</dt><dd>Real-time 3D commerce</dd></div>
          <div className="row"><dt>RENDERING</dt><dd>Browser-native, no plugins</dd></div>
          <div className="row"><dt>WORKED EXAMPLE</dt><dd>PP-AV 3D Cabinet Configurator, live</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>3D product configurator development.</h1>
        <p className="standfirst">A real-time 3D configurator lets a customer build your product on screen &mdash; rotate it, change its material, resize it, watch the price update &mdash; and then buy exactly what they configured. We build them browser-native, connected to your checkout, and priced from a working prototype rather than a promise.</p>
      </div>

      {/* 01 — WHEN 3D EARNS ITS COST */}
      <section id="when-3d">
        <div className="sheet">
          <p className="sheet-no">SHEET 01 — WHEN 3D EARNS ITS COST</p>
          <div className="two">
            <h2>3D is a cost. It should buy you a sale.</h2>
            <div>
              <p>Real-time 3D earns its place when shape, proportion, finish or spatial arrangement changes with the configuration and genuinely affects the decision &mdash; furniture, cabinetry, modular systems, machinery, anything a customer needs to see from every angle before they trust it.</p>
              <p>When the choice is really about colours or finishes from one fixed angle, a lighter <Link href="/insights/2d-vs-3d">2D or image-based configurator</Link> sells just as well for less. We&rsquo;ll tell you which one your product actually needs before you spend on 3D assets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — WHAT IT HAS TO DO */}
      <section id="what-it-does">
        <div className="sheet">
          <p className="sheet-no">SHEET 02 — WHAT A 3D CONFIGURATOR HAS TO DO</p>
          <div className="two">
            <h2>The model is the easy half.</h2>
            <div>
              <p>A convincing 3D scene with unreliable commercial output is a demo, not a sales tool. The value sits in the invisible layer: which combinations can actually be built, what they cost, and whether the order reaches your warehouse in a form somebody can pick.</p>
            </div>
          </div>

          <div className="cols">
            <div className="col">
              <span className="lbl">CUSTOMER-FACING</span>
              <ul className="ticks">
                <li>Live geometry, materials and camera as options change</li>
                <li>Real finishes and lighting, not placeholder swatches</li>
                <li>Smooth on mid-range phones, mobile-first</li>
                <li>Save, share and return to a configuration</li>
                <li>One clear price and summary at the end</li>
              </ul>
            </div>
            <div className="col">
              <span className="lbl">COMMERCE ARCHITECTURE</span>
              <ul className="ticks">
                <li>Server-authoritative pricing, never trusted to the browser</li>
                <li>Product and compatibility rules held as data, not code</li>
                <li>WooCommerce, Shopify or API hand-off to checkout</li>
                <li>Configurations that reach fulfilment in a pickable form</li>
                <li>Optional AR preview and a later AI advisory layer</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — HOW WE BUILD IT */}
      <section id="how">
        <div className="sheet">
          <p className="sheet-no">SHEET 03 — HOW WE BUILD IT</p>
          <div className="two">
            <h2>Browser-native, and built to a performance budget.</h2>
            <div>
              <p>It runs in a normal web browser with WebGL &mdash; no app, no plugin, no download. Models are delivered as optimised glTF/GLB with level-of-detail so the scene loads fast and stays responsive, and we set a performance budget at the start rather than discovering it after launch.</p>
              <p>Every build opens with a <Link href="/configurators#sprint">Prototype Sprint</Link>: we prove the single hardest thing about your product &mdash; the reflection, the modular join, the awkward pricing rule &mdash; in a working browser scene before anyone commits to the full build.</p>
            </div>
          </div>
          <p className="levels-note">Pricing follows the three build levels on the <Link href="/configurators#levels">configurators overview</Link>, and add-ons such as AR, cinematic rendering and an AI recommendation layer sit on the <Link href="/pricing">schedule of rates</Link>. See a real one in the <Link href="/ppav-case-study">PP-AV case study</Link>.</p>
        </div>
      </section>

      {/* 04 — FAQ */}
      <section id="faq">
        <div className="sheet">
          <p className="sheet-no">COMMON QUESTIONS</p>
          <div className="two">
            <h2>3D configurator questions, answered plainly.</h2>
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
          <h2>Send us the product you can&rsquo;t explain in a photo.</h2>
          <p>Tell us what you sell and the one thing customers can&rsquo;t picture before they buy. We&rsquo;ll tell you whether it needs real-time 3D, and prove the hardest part in a fixed-price Prototype Sprint before you commit.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Discuss a 3D configurator</a>
            <a className="button" href="/configurators/guided-selling-tools">Guided selling &amp; recommendations</a>
          </div>
        </div>
      </section>
    </main>
  );
}
