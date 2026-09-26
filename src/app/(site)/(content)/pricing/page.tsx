import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import './styles.css';
import AccessibilityStages from './AccessibilityStages';
import { ACCESSIBILITY_METHOD, ACCESSIBILITY_DELIVERABLES } from '@/lib/accessibilityPlans';

export const metadata: Metadata = {
  title: 'Schedule of rates 2026 — Blueprint Code AI',
  description:
    'Published 2026 rates for websites, commerce infrastructure, product configurators, AI automation, WCAG 2.2 accessibility audits and support retainers. GBP, excluding VAT.',
  alternates: { canonical: 'https://blueprintcode.ai/pricing' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Schedule of rates 2026 — Blueprint Code AI',
    description:
      'Published rates, so you can size a project before you speak to anyone. Free accessibility checks to £120,000+ builds.',
    type: 'website',
    url: 'https://blueprintcode.ai/pricing',
  },
};

export default function PricingPage() {
  return (
    <main id="main">
      <span id="top"></span>

      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>ISSUE</dt><dd>2026 — standard rates</dd></div>
          <div className="row"><dt>CURRENCY</dt><dd>GBP, excluding VAT</dd></div>
          <div className="row"><dt>RANGE</dt><dd>Free – £120,000+</dd></div>
          <div className="row"><dt>SPECIALISM</dt><dd>Interactive commerce &amp; product configurators</dd></div>
        </dl>

        <h1>Schedule of rates.</h1>
        <p className="standfirst">Websites, commerce infrastructure, bespoke 3D product configurators, AI automation and WCAG 2.2 accessibility work. Published prices, so you can size a project before you speak to anyone.</p>
      </div>

      {/* ============ 01 TIERS ============ */}
      <section id="tiers" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 01 — WEBSITES &amp; COMMERCE</p>
          <h2>Four tiers, one path.</h2>
          <p>Start where the business is today and upgrade as it grows. Each tier builds on the last, so nothing gets rebuilt on the way up.</p>
        </div>

        <div className="band"><h3>Tier 1 — Digital Presence</h3><span className="range">£5,000 – £7,500</span></div>
        <div className="row2">
          <div className="item">
            <div className="item-top"><h4>Starter Website</h4><span className="rate">£5,000</span></div>
            <p>Foundation layer for a credible digital presence.</p>
            <ul>
              <li>5-page WordPress website</li>
              <li>Mobile-responsive, accessible build (WCAG 2.2 AA)</li>
              <li>Foundational SEO setup</li>
              <li>Contact forms &amp; analytics</li>
              <li>2 weeks post-launch support</li>
            </ul>
            <p className="note"><b>Next:</b> Tier 2 when you&apos;re ready to sell online.</p>
          </div>
          <div className="item">
            <div className="item-top"><h4>Professional Website</h4><span className="rate">£7,500</span></div>
            <p>Refined brand with a conversion focus.</p>
            <ul>
              <li>Everything in Starter Website</li>
              <li>UX optimisation &amp; conversion-led layout</li>
              <li>Blog / content management system</li>
              <li>Advanced lead capture &amp; qualification</li>
              <li>Performance optimisation (sub-3s load)</li>
              <li>4 weeks support</li>
            </ul>
            <p className="note"><b>Next:</b> add e-commerce with Tier 2.</p>
          </div>
        </div>

        <div className="band"><h3>Tier 2 — Commerce</h3><span className="range">£10,000 – £14,000</span></div>
        <div className="row2">
          <div className="item">
            <div className="item-top"><h4>Starter Commerce</h4><span className="rate">£10,000</span></div>
            <p>A complete online store with payment processing.</p>
            <ul>
              <li>WooCommerce / Shopify setup</li>
              <li>Product catalogue (up to 30 SKUs)</li>
              <li>Payment gateway integration</li>
              <li>Shipping configuration</li>
              <li>Filtering &amp; search</li>
              <li>6 weeks support</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>Growth Commerce</h4><span className="rate">£14,000</span></div>
            <p>A serious selling system with automation.</p>
            <ul>
              <li>Everything in Starter Commerce</li>
              <li>Expanded catalogue (up to 100 SKUs)</li>
              <li>Email automation (abandoned cart)</li>
              <li>Advanced filtering &amp; recommendations</li>
              <li>Customer account portal</li>
              <li>Analytics dashboard</li>
              <li>3 months support</li>
            </ul>
          </div>
        </div>

        <div className="band"><h3>Tier 3 — Multi-Channel Commerce</h3><span className="range">£18,000 – £24,000</span></div>
        <div className="row2">
          <div className="item">
            <div className="item-top"><h4>Channel Expansion</h4><span className="rate">£18,000</span></div>
            <p>Amazon or eBay integration with inventory sync.</p>
            <ul>
              <li>Amazon or eBay marketplace integration</li>
              <li>Multi-channel listing sync</li>
              <li>Cross-platform inventory (2 channels)</li>
              <li>Order routing automation</li>
              <li>Channel-specific pricing</li>
              <li>Unified reporting dashboard</li>
              <li>4 months support</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>Advanced Multi-Channel</h4><span className="rate">£24,000</span></div>
            <p>Full Amazon, eBay and website synchronisation.</p>
            <ul>
              <li>Everything in Channel Expansion</li>
              <li>Amazon + eBay + website full sync</li>
              <li>Advanced attributes &amp; filtering</li>
              <li>Customer segmentation &amp; tracking</li>
              <li>Multi-channel analytics</li>
              <li>Workflow automation (reviews, alerts)</li>
              <li>6 months support</li>
            </ul>
          </div>
        </div>

        <div className="band"><h3>Tier 4 — Enterprise &amp; Transformation</h3><span className="range">£45,000 – £120,000+</span></div>
        <div className="row2">
          <div className="item">
            <div className="item-top"><h4>Enterprise Commerce Core</h4><span className="rate">£45,000</span></div>
            <p>Full enterprise infrastructure with multi-region deployment.</p>
            <ul>
              <li>Advanced commerce + AI intelligence layer</li>
              <li>Multi-region &amp; multi-language deployment</li>
              <li>Advanced reporting dashboards</li>
              <li>Dedicated account manager</li>
              <li>Priority support (4-hour SLA)</li>
              <li>Quarterly business reviews</li>
              <li>12 months premium support</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>Digital Transformation</h4><span className="rate"><span className="from">from</span>£85,000</span></div>
            <p>Complete ecosystem rebuild with continuous optimisation.</p>
            <ul>
              <li>Full enterprise commerce infrastructure</li>
              <li>Multi-brand architecture</li>
              <li>Global marketplace deployment</li>
              <li>Advanced AI systems (custom models)</li>
              <li>Custom ERP-like platform layer</li>
              <li>Dedicated development team</li>
              <li>24 months Gold support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ 02 CONFIGURATORS ============ */}
      <section id="configurators" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 02 — SIGNATURE SERVICE</p>
          <h2>Premium configurator development.</h2>
          <p>Real-time visual commerce that lets a customer build, see and price a bespoke product before they buy. This is the specialism, and the work most studios can&apos;t deliver.</p>
        </div>
      </section>

      <div className="invert">
        <div className="sheet">
          <span className="lbl">STEP 00 — START HERE</span>
          <h3>Prototype Sprint — £625 to £3,000 + VAT</h3>
          <p>Before committing to a full build, we create a working prototype of your product in one to four weeks—something real in a browser, not a slide deck.</p>
          <table className="sprint-table">
            <thead><tr><th>Sprint</th><th>Price</th><th>What a full version would normally cost</th></tr></thead>
            <tbody>
              <tr><td>One-week Focus Sprint</td><td className="price">£625</td><td>Standard value: £2,500–£4,000</td></tr>
              <tr><td>Two-week Prototype Sprint</td><td className="price">£1,125</td><td>Standard value: £4,000–£7,500</td></tr>
              <tr><td>Three-week System Sprint</td><td className="price">£2,000</td><td>Standard value: £7,500–£15,000</td></tr>
              <tr><td>Four-week Advanced Sprint</td><td className="price">£3,000</td><td>Standard value: £15,000+</td></tr>
            </tbody>
          </table>
          <div className="invert-cols">
            <div>
              <h4>WHAT YOU GET</h4>
              <ul>
                <li>One real product, configurable and interactive</li>
                <li>A single core option path — the one that matters most to your sale</li>
                <li>Real materials and finishes, not placeholders</li>
                <li>Runs in the browser on desktop and mobile</li>
                <li>Technical feasibility notes and recommended architecture</li>
                <li>Fixed quote for the full build</li>
              </ul>
            </div>
            <div>
              <h4>HOW IT WORKS</h4>
              <p>We recommend the appropriate Sprint based on the complexity of the intended production system. If you proceed within 90 days, your Sprint fee is credited in full against the agreed build price.</p>
              <p className="band-note">Final build pricing depends on product logic, visual assets, integrations, commercial outputs and the level of production refinement required. Plus VAT.</p>
              <span className="strip">PROVE IT BEFORE WE BUILD IT</span>
            </div>
          </div>
        </div>
      </div>

      <section className="sheet" style={{ borderTop: 0, paddingTop: '72px' }}>
        <div className="band"><h3>Configurator tiers</h3><span className="range">EVERY BUILD STARTS FROM THE SPRINT ABOVE</span></div>
        <div className="row3 cfg-row4">
          <div className="item">
            <div className="item-top"><h4>Foundation</h4><span className="rate"><span className="from">from</span>£2,500</span></div>
            <p>One product family with focused option logic and live preview — a credible immersive buying experience.</p>
            <ul>
              <li>Bespoke interactive configurator</li>
              <li>Premium responsive UI / UX</li>
              <li>Real-time material &amp; finish switching</li>
              <li>Dynamic pricing engine</li>
              <li>Product option logic</li>
              <li>Branded interface &amp; mobile optimisation</li>
              <li>Lead capture &amp; SEO-friendly architecture</li>
            </ul>
            <p className="note"><b>Ideal for:</b> AV furniture, laser TV cabinets, premium screens, designer furniture.</p>
          </div>
          <div className="item">
            <div className="item-top"><h4>Advanced</h4><span className="rate">£7.5–15k</span></div>
            <p>More configuration depth for a single product family — added rules, pricing and quoting, or one system integration.</p>
            <ul>
              <li>Everything in Foundation</li>
              <li>Advanced option &amp; conditional logic</li>
              <li>Dynamic pricing &amp; quotation output</li>
              <li>Save &amp; share configurations</li>
              <li>PDF quote generation</li>
              <li>One CRM or ecommerce integration</li>
            </ul>
            <p className="note"><b>Ideal for:</b> a single configurator that needs real quoting, rules or one integration.</p>
          </div>
          <div className="item">
            <div className="item-top"><h4>Professional</h4><span className="rate">£15–30k</span></div>
            <p>A fully integrated, commerce-focused system built to lift conversion and streamline bespoke sales.</p>
            <ul>
              <li>Everything in Foundation</li>
              <li>Advanced pricing &amp; conditional logic</li>
              <li>Live quotation system</li>
              <li>Save &amp; share configurations</li>
              <li>PDF quote generation</li>
              <li>CRM and ecommerce integration</li>
              <li>Multi-product architecture</li>
              <li>Room colour matching tools</li>
              <li>Dealer / trade pricing mode</li>
              <li>Enhanced rendering &amp; lighting</li>
            </ul>
            <p className="note"><b>Impact:</b> higher AOV, less quotation workload, faster decisions, fewer abandoned enquiries.</p>
          </div>
          <div className="item">
            <div className="item-top"><h4>Enterprise</h4><span className="rate"><span className="from">from</span>£35,000</span></div>
            <p>A complete immersive commerce platform for luxury configurable products and high-ticket bespoke sales.</p>
            <ul>
              <li>Everything in Professional</li>
              <li>Multi-brand architecture</li>
              <li>Advanced CPQ (configure, price, quote)</li>
              <li>ERP / API integration</li>
              <li>AR room placement</li>
              <li>Real-time inventory logic</li>
              <li>Manufacturing option management</li>
              <li>Customer account dashboards</li>
              <li>International pricing &amp; multi-language</li>
              <li>Finance / payment integrations</li>
            </ul>
            <p className="note"><b>Designed for:</b> luxury furniture, bespoke interiors, home cinema, trade &amp; dealer networks.</p>
          </div>
        </div>

        <div className="band"><h3>Optional enhancements</h3><span className="range">LAYERS ONTO ANY TIER</span></div>
        <table className="sched">
          <caption>Indicative starting prices. Final scope confirmed at kick-off.</caption>
          <thead><tr><th scope="col">Enhancement</th><th scope="col">From</th></tr></thead>
          <tbody>
            <tr><td>AR / room placement</td><td>£5,000</td></tr>
            <tr><td>Trade portal &amp; dealer dashboard</td><td>£4,500</td></tr>
            <tr><td>AI-assisted product recommendations</td><td>£3,000</td></tr>
            <tr><td>Cinematic product rendering</td><td>£2,500</td></tr>
            <tr><td>Advanced material system (PBR)</td><td>£1,500</td></tr>
            <tr><td>Dynamic logistics &amp; delivery calculator</td><td>£1,500</td></tr>
            <tr><td>Automated PDF specification sheets</td><td>£1,000</td></tr>
          </tbody>
        </table>

        <div className="band"><h3>Ongoing configurator support</h3><span className="range">FROM £300 / MONTH</span></div>
        <div className="row2">
          <div className="item">
            <p>Configurators run on the same Bronze, Silver or Gold retainer as every other build — with one uplift for the configurator itself. Added to any plan in <a href="#support">sheet 06</a>.</p>
            <ul>
              <li>New product variants, materials and finishes added</li>
              <li>Pricing rules and option logic changes</li>
              <li>3D asset updates and re-optimisation</li>
              <li>Render quality and load-time performance tuning</li>
              <li>Configuration analytics review</li>
            </ul>
          </div>
          <div className="item">
            <span className="lbl">WORKED EXAMPLE</span>
            <table className="sched" style={{ marginTop: '14px' }}>
              <tbody>
                <tr><td>Silver retainer</td><td>£840 / mo</td></tr>
                <tr><td>Configurator uplift</td><td>£300 / mo</td></tr>
                <tr><td><b>Total</b></td><td><b>£1,140 / mo</b></td></tr>
              </tbody>
            </table>
            <p className="note">A configurator is the most complex asset we maintain. The uplift covers the 3D and pricing-logic work a standard maintenance plan doesn&apos;t reach.</p>
          </div>
        </div>
      </section>

      {/* ============ 03 AI ============ */}
      <section id="ai" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 03 — AI &amp; AUTOMATION</p>
          <h2>Intelligence layered onto commerce.</h2>
          <p>Add AI where it earns its keep — search, recommendations, support and prediction — as a layer on any tier above.</p>
        </div>
        <div className="row3">
          <div className="item">
            <div className="item-top"><h4>Automation Starter</h4><span className="rate">£8,000</span></div>
            <p>Email automation and a focused chatbot.</p>
            <ul>
              <li>Email automation (cart, reviews, orders)</li>
              <li>Order data sync (1–2 channels)</li>
              <li>Rule-based support chatbot</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>AI Commerce Assistant</h4><span className="rate">£16,000</span></div>
            <p>Natural-language search and smart recommendations.</p>
            <ul>
              <li>Natural-language product search</li>
              <li>AI recommendations engine</li>
              <li>Conversational chatbot (full catalogue)</li>
              <li>Automated product descriptions</li>
              <li>Visual search capability</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>AI Intelligence System</h4><span className="rate">£22,000</span></div>
            <p>A complete intelligence layer with predictive analytics.</p>
            <ul>
              <li>Everything in AI Commerce Assistant</li>
              <li>Competitive price monitoring &amp; alerting</li>
              <li>Review sentiment analysis (all channels)</li>
              <li>Behaviour prediction &amp; churn detection</li>
              <li>Automated sales insights</li>
              <li>Weekly AI-generated reporting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ 04 ACCESSIBILITY ============ */}
      <section id="accessibility" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 04 &mdash; ACCESSIBILITY &amp; COMPLIANCE</p>
          <h2>Check, audit, fix, monitor.</h2>
          <p>WCAG 2.2 AA work in four stages, priced separately so you only buy the stage you need. The automated check is free. The audit tells you what a scanner can&apos;t see. Remediation is the part most accessibility firms hand back to someone else &mdash; we do it ourselves. For ADA, AODA, SEBI and EAA coverage, levels, deadlines and a full FAQ, see <a href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</a>.</p>
        </div>
      </section>

      <div className="invert">
        <div className="sheet">
          <span className="lbl">STAGE 00 &mdash; START HERE</span>
          <h3>Instant WCAG Check &mdash; free</h3>
          <p>Enter a URL and get an automated WCAG 2.2 report back in about a minute: contrast failures, missing alternative text, unlabelled form fields, heading structure, landmarks and keyboard traps. No account, no sales call.</p>
          <div className="invert-cols">
            <div>
              <h4>WHAT IT COVERS</h4>
              <ul>
                <li>Automated WCAG 2.2 level A and AA checks</li>
                <li>Every issue listed with the element that fails</li>
                <li>Mapped to the success criterion it breaches</li>
                <li>Ordered by severity, so you know what matters</li>
                <li>Free, with no obligation to buy anything</li>
              </ul>
            </div>
            <div>
              <h4>WHAT IT CAN&rsquo;T DO</h4>
              <p>Automated testing reliably finds around a third of WCAG failures. It cannot tell you whether alternative text is useful, whether a keyboard journey makes sense, whether an error message can be understood, or whether a checkout can actually be completed with a screen reader.</p>
              <p className="band-note">That judgement is what the paid stages buy. The scan tells you there is a problem. A person tells you what it costs you, and how to fix it.</p>
              <span className="strip">FREE &mdash; RUN IT ON ANY URL</span>
            </div>
          </div>
        </div>
      </div>

      <section className="sheet" style={{ borderTop: 0, paddingTop: '72px' }}>
        <AccessibilityStages />

        <div className="band"><h3>How the testing is done</h3><span className="range">APPLIES TO EVERY PAID STAGE</span></div>
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
            <p className="note">Delivered against WCAG 2.2 AA, the level UK and EU accessibility requirements reference. How these plans map to ADA, AODA, SEBI and EAA requirements is set out on the <a href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</a> page.</p>
          </div>
        </div>
      </section>

      {/* ============ 05 CAPABILITY ============ */}
      <section id="capability" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 05 &mdash; CAPABILITY</p>
          <h2>Standalone or combined.</h2>
          <p>Individual services that can be bought on their own or bundled into any tier above.</p>
        </div>

        <div className="caps">
          <div className="cap">
            <div><span className="lbl">GROUP A</span><h3>Web design &amp; development</h3></div>
            <div className="cap-items">
              <div><b>WordPress</b><span>Custom sites, themes and plugins with full CMS control.</span></div>
              <div><b>Next.js &amp; React</b><span>High-performance marketing sites, SaaS platforms and landing pages.</span></div>
              <div><b>E-commerce</b><span>WooCommerce and headless builds — product pages, checkout, payments.</span></div>
              <div><b>Landing pages</b><span>High-converting pages for campaigns, launches and lead generation.</span></div>
              <div><b>Redesign</b><span>Modernise an existing site: better UX, faster performance, improved SEO.</span></div>
            </div>
          </div>
          <div className="cap">
            <div><span className="lbl">GROUP B</span><h3>Backend &amp; integrations</h3></div>
            <div className="cap-items">
              <div><b>REST APIs</b><span>Custom backends in NestJS / Node.js — documented and built to scale.</span></div>
              <div><b>Database design</b><span>Supabase, PostgreSQL and Redis — schemas, modelling, performance tuning.</span></div>
              <div><b>Third-party integrations</b><span>Stripe, HubSpot, Salesforce, Zapier and any API the business relies on.</span></div>
              <div><b>Headless CMS</b><span>Sanity, Contentful, Payload and Decap for content-driven platforms.</span></div>
              <div><b>B2B SaaS platforms</b><span>Multi-tenancy, subscription billing, user management, dashboards.</span></div>
            </div>
          </div>
          <div className="cap">
            <div><span className="lbl">GROUP C</span><h3>Interactive tools</h3></div>
            <div className="cap-items">
              <div><b>Product configurators</b><span>Real-time configuration with colours, sizes, options and dynamic pricing.</span></div>
              <div><b>Price calculators</b><span>Interactive quoting tools that price projects or products from user inputs.</span></div>
              <div><b>Quote builders</b><span>Multi-step forms generating instant quotes, integrated with your CRM.</span></div>
              <div><b>Comparison &amp; filters</b><span>Dynamic widgets that help users find the right fit fast.</span></div>
              <div><b>Booking &amp; scheduling</b><span>Custom availability calendars and resource schedulers.</span></div>
            </div>
          </div>
          <div className="cap">
            <div><span className="lbl">GROUP D</span><h3>UI / UX design</h3></div>
            <div className="cap-items">
              <div><b>Research &amp; audits</b><span>Find friction, drop-offs and usability issues, with actionable fixes.</span></div>
              <div><b>Wireframing</b><span>Low- and high-fidelity Figma prototypes to validate before code.</span></div>
              <div><b>Design systems</b><span>Scalable component libraries and design tokens for consistent UI.</span></div>
              <div><b>Brand identity</b><span>Logo, palette, typography and visual guidelines.</span></div>
              <div><b>Responsive &amp; mobile</b><span>Every design optimised for desktop, tablet and mobile.</span></div>
            </div>
          </div>
          <div className="cap">
            <div><span className="lbl">GROUP E</span><h3>AI automation</h3></div>
            <div className="cap-items">
              <div><b>Chatbots &amp; assistants</b><span>Custom chat on OpenAI or Claude APIs, trained on your content and tone.</span></div>
              <div><b>Workflow automation</b><span>Lead routing, sequences, data processing and reporting.</span></div>
              <div><b>Content &amp; data tools</b><span>Generation, summarisation, classification and enrichment pipelines.</span></div>
              <div><b>LLM API integration</b><span>Embed search, recommendations and generation into your products.</span></div>
              <div><b>Document intelligence</b><span>Automated extraction and processing of documents, forms and PDFs.</span></div>
            </div>
          </div>
          <div className="cap">
            <div><span className="lbl">GROUP F</span><h3>Compliance &amp; support</h3></div>
            <div className="cap-items">
              <div><b>WCAG 2.2 / ADA audits</b><span>Full accessibility audits against WCAG 2.2 AA with prioritised remediation. Priced in <a href="#accessibility">sheet 04</a>.</span></div>
              <div><b>Remediation</b><span>Keyboard nav, screen-reader support, contrast, alt text and ARIA fixes.</span></div>
              <div><b>Maintenance</b><span>Updates, security patches, monitoring and content changes.</span></div>
              <div><b>Performance &amp; SEO</b><span>Core Web Vitals, technical SEO, image optimisation and caching.</span></div>
              <div><b>Security &amp; hosting</b><span>Secure hosting, SSL, firewall, backups and uptime monitoring.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 06 À LA CARTE ============ */}
      <section id="alacarte" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 06 &mdash; À LA CARTE</p>
          <h2>Individual services.</h2>
          <p>Standalone pricing for specific work outside the core tiers, ordered from foundational engineering to focused add-ons.</p>
        </div>
        <table className="sched">
          <caption>Standard 2026 pricing. Ranges reflect scope; fixed quote confirmed at kick-off. Accessibility audits, remediation and monitoring are priced in <a href="#accessibility">sheet 04</a>.</caption>
          <thead><tr><th scope="col">Service</th><th scope="col">Standard price</th></tr></thead>
          <tbody>
            <tr><td>Custom API development</td><td>£4,000 – £12,000</td></tr>
            <tr><td>Design system development</td><td>£8,000 – £15,000</td></tr>
            <tr><td>Visual product search</td><td>£6,000</td></tr>
            <tr><td>AI customer support chatbot</td><td>£5,000</td></tr>
            <tr><td>Custom reporting dashboard</td><td>£5,000</td></tr>
            <tr><td>Email marketing automation</td><td>£4,500</td></tr>
            <tr><td>Content generation system</td><td>£4,000</td></tr>
            <tr><td>Multilingual auto-translation</td><td>£3,500</td></tr>
            <tr><td>Price monitoring dashboard</td><td>£3,500</td></tr>
            <tr><td>UX research &amp; audit</td><td>£3,500</td></tr>
            <tr><td>Inventory sync (multi-channel)</td><td>£3,000</td></tr>
            <tr><td>Review management automation</td><td>£2,500</td></tr>
          </tbody>
        </table>
      </section>

      {/* ============ 07 SUPPORT ============ */}
      <section id="support" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 07 &mdash; ONGOING SUPPORT</p>
          <h2>Monthly retainers.</h2>
          <p>One ladder, whatever we built for you. Configurator clients add the <a href="#configurators">configurator uplift</a> on top.</p>
        </div>
        <div className="row3">
          <div className="item">
            <div className="item-top"><h4>Bronze</h4><span className="rate">£350</span></div>
            <p>Per month.</p>
            <ul>
              <li>Content updates &amp; minor changes</li>
              <li>Security patches &amp; platform updates</li>
              <li>Performance monitoring</li>
              <li>Email support (48-hour response)</li>
              <li>Monthly uptime reports</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>Silver</h4><span className="rate">£840</span></div>
            <p>Per month.</p>
            <ul>
              <li>Everything in Bronze</li>
              <li>A/B testing &amp; conversion optimisation</li>
              <li>Monthly analytics reporting</li>
              <li>Priority support (24-hour response)</li>
              <li>5 development hours / month</li>
              <li>Quarterly strategy sessions</li>
            </ul>
          </div>
          <div className="item">
            <div className="item-top"><h4>Gold</h4><span className="rate">£1,750</span></div>
            <p>Per month.</p>
            <ul>
              <li>Everything in Silver</li>
              <li>AI &amp; automation optimisation</li>
              <li>API cost management</li>
              <li>Dedicated account manager</li>
              <li>15 development hours / month</li>
              <li>Monthly strategy calls</li>
              <li>Priority feature queue</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ CLOSE ============ */}
      <section className="close sheet" id="contact">
        <p className="sheet-no">NEXT STEP</p>
        <h2>Size it, then prove it.</h2>
        <p>Most projects start with a Prototype Sprint. One to four weeks, £625 to £3,000 + VAT, credited in full against the build. Accessibility work starts with a free WCAG check &mdash; it costs nothing and commits you to nothing.</p>
        <div className="ctas">
          <a className="btn solid" href="/contact">Start a project</a>
          <a className="btn" href="#accessibility">Free WCAG check</a>
          <a className="btn" href="#configurators">Read the sprint detail</a>
        </div>
        <p className="terms">All prices are standard 2026 rates in GBP and exclude VAT. Ranges reflect project complexity; a fixed scope and fixed quote are confirmed at kick-off. Retainers and accessibility monitoring are monthly and can be changed with 30 days&apos; notice. Accessibility audits are delivered against WCAG 2.2 AA; an audit reports conformance at a point in time and is not legal advice.</p>
      </section>
    </main>
  );
}
