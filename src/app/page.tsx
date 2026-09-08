import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Blueprint Code — Services & Pricing 2026',
  description:
    'Blueprint Code: web development, e-commerce infrastructure, bespoke 3D product configurators, and AI automation for UK, US and European businesses.',
};

export default function PricingPage() {
  return (
    <>
      {/* Skip link */}
      <a className="skip" href="#main">Skip to content</a>

      {/* ============ NAV ============ */}
      <nav className="nav" aria-label="Primary">
        <div className="container nav-inner">
          <a className="brand" href="#top" aria-label="Blueprint Code home">
            <LogoMark className="brand-mark" width={34} height={34} />
            <span className="brand-name">
              Blueprint <b className="grad-text">Code</b>
            </span>
          </a>
          <ul className="nav-links">
            <li><a href="#tiers">Tiers</a></li>
            <li><a href="#configurators">Configurators</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#alacarte">À la carte</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
          <div className="nav-right">
            <a className="nav-cta" href="mailto:james@blueprintcode.ai">Start a project</a>
          </div>
        </div>
      </nav>

      <span id="top" />

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="container">
          <LogoMark className="hero-logo reveal" width={96} height={96} aria-label="Blueprint Code logo" />
          <p className="eyebrow reveal">Blueprint Code · Digital Studio</p>
          <h1 className="reveal">
            Software, commerce &amp;{' '}
            <span className="grad-text">interactive tools</span>, built to launch.
          </h1>
          <p className="tagline reveal">
            <b>Design.</b> <b>Build.</b> <b>Code.</b> <b>Launch.</b>
          </p>
          <p className="lead reveal">
            Websites, e-commerce infrastructure, bespoke 3D product configurators, and AI
            automation for ambitious businesses across the UK, US &amp; Europe.
          </p>
          <div className="hero-contact reveal">
            <a href="mailto:james@blueprintcode.ai" className="btn-contact">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Get in touch — <b>james@blueprintcode.ai</b></span>
            </a>
          </div>
          <div className="meta reveal">
            <div className="meta-item">
              <div className="meta-label">Project Range</div>
              <div className="meta-value">£500 – £120,000+</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Specialism</div>
              <div className="meta-value">Interactive commerce</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Edition</div>
              <div className="meta-value">2026 Pricing</div>
            </div>
          </div>
        </div>
      </header>

      <main id="main">

        {/* ============ 01 · CORE TIERS ============ */}
        <section className="section" id="tiers" aria-labelledby="tiers-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">01 — WEBSITES &amp; COMMERCE</p>
              <h2 id="tiers-h">Four tiers, one clear path</h2>
              <p className="section-desc">
                Start where your business is today and upgrade as you grow. Each tier builds on the
                last — no rework, no wasted spend.
              </p>
            </div>

            {/* Tier 1 */}
            <h3 className="tier-group-label">
              Tier 1 · Digital Presence{' '}
              <span className="range">£3,500 – £7,500</span>
            </h3>
            <div className="grid">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T1</span>
                  <div className="card-title-wrap">
                    <h4>Starter Website</h4>
                    <div className="price">£5,000</div>
                  </div>
                </div>
                <p className="card-desc">Foundation layer for a credible digital presence.</p>
                <ul className="features">
                  <li>5-page WordPress website</li>
                  <li>Mobile-responsive, accessible build (WCAG 2.2 AA)</li>
                  <li>Foundational SEO setup</li>
                  <li>Contact forms &amp; analytics</li>
                  <li>2 weeks post-launch support</li>
                </ul>
                <p className="upgrade"><b>Next step:</b> Tier 2 when you&apos;re ready to sell online.</p>
              </article>
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T1</span>
                  <div className="card-title-wrap">
                    <h4>Professional Website</h4>
                    <div className="price">£7,500</div>
                  </div>
                </div>
                <p className="card-desc">Refined brand with a conversion focus.</p>
                <ul className="features">
                  <li>Everything in Starter Website</li>
                  <li>UX optimisation &amp; conversion-led layout</li>
                  <li>Blog / content management system</li>
                  <li>Advanced lead capture &amp; qualification</li>
                  <li>Performance optimisation (sub-3s load)</li>
                  <li>4 weeks support</li>
                </ul>
                <p className="upgrade"><b>Next step:</b> Add e-commerce with Tier 2.</p>
              </article>
            </div>

            {/* Tier 2 */}
            <h3 className="tier-group-label">
              Tier 2 · Commerce{' '}
              <span className="range">£10,000 – £14,000</span>
            </h3>
            <div className="grid">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T2</span>
                  <div className="card-title-wrap">
                    <h4>Starter Commerce</h4>
                    <div className="price">£10,000</div>
                  </div>
                </div>
                <p className="card-desc">A complete online store with payment processing.</p>
                <ul className="features">
                  <li>WooCommerce / Shopify setup</li>
                  <li>Product catalogue (up to 30 SKUs)</li>
                  <li>Payment gateway integration</li>
                  <li>Shipping configuration</li>
                  <li>Filtering &amp; search</li>
                  <li>6 weeks support</li>
                </ul>
              </article>
              <article className="card featured">
                <span className="badge">Most popular</span>
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T2</span>
                  <div className="card-title-wrap">
                    <h4>Growth Commerce</h4>
                    <div className="price">£14,000</div>
                  </div>
                </div>
                <p className="card-desc">A serious selling system with automation.</p>
                <ul className="features">
                  <li>Everything in Starter Commerce</li>
                  <li>Expanded catalogue (up to 100 SKUs)</li>
                  <li>Email automation (abandoned cart)</li>
                  <li>Advanced filtering &amp; recommendations</li>
                  <li>Customer account portal</li>
                  <li>Analytics dashboard</li>
                  <li>3 months support</li>
                </ul>
              </article>
            </div>

            {/* Tier 3 */}
            <h3 className="tier-group-label">
              Tier 3 · Multi-Channel Commerce{' '}
              <span className="range">£18,000 – £24,000</span>
            </h3>
            <div className="grid">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T3</span>
                  <div className="card-title-wrap">
                    <h4>Channel Expansion</h4>
                    <div className="price">£18,000</div>
                  </div>
                </div>
                <p className="card-desc">Amazon <em>or</em> eBay integration with inventory sync.</p>
                <ul className="features">
                  <li>Amazon or eBay marketplace integration</li>
                  <li>Multi-channel listing sync</li>
                  <li>Cross-platform inventory (2 channels)</li>
                  <li>Order routing automation</li>
                  <li>Channel-specific pricing</li>
                  <li>Unified reporting dashboard</li>
                  <li>4 months support</li>
                </ul>
              </article>
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T3</span>
                  <div className="card-title-wrap">
                    <h4>Advanced Multi-Channel</h4>
                    <div className="price">£24,000</div>
                  </div>
                </div>
                <p className="card-desc">Full Amazon + eBay + website synchronisation.</p>
                <ul className="features">
                  <li>Everything in Channel Expansion</li>
                  <li>Amazon + eBay + website full sync</li>
                  <li>Advanced attributes &amp; filtering</li>
                  <li>Customer segmentation &amp; tracking</li>
                  <li>Multi-channel analytics</li>
                  <li>Workflow automation (reviews, alerts)</li>
                  <li>6 months support</li>
                </ul>
              </article>
            </div>

            {/* Tier 4 */}
            <h3 className="tier-group-label">
              Tier 4 · Enterprise &amp; Transformation{' '}
              <span className="range">£45,000 – £120,000+</span>
            </h3>
            <div className="grid">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T4</span>
                  <div className="card-title-wrap">
                    <h4>Enterprise Commerce Core</h4>
                    <div className="price">£45,000</div>
                  </div>
                </div>
                <p className="card-desc">Full enterprise infrastructure with multi-region deployment.</p>
                <ul className="features">
                  <li>Advanced commerce + AI intelligence layer</li>
                  <li>Multi-region &amp; multi-language deployment</li>
                  <li>Advanced reporting dashboards</li>
                  <li>Dedicated account manager</li>
                  <li>Priority support (4-hour SLA)</li>
                  <li>Quarterly business reviews</li>
                  <li>12 months premium support</li>
                </ul>
              </article>
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">T4</span>
                  <div className="card-title-wrap">
                    <h4>Digital Transformation</h4>
                    <div className="price"><span className="from">from</span>£85,000</div>
                  </div>
                </div>
                <p className="card-desc">Complete ecosystem rebuild with continuous optimisation.</p>
                <ul className="features">
                  <li>Full enterprise commerce infrastructure</li>
                  <li>Multi-brand architecture</li>
                  <li>Global marketplace deployment</li>
                  <li>Advanced AI systems (custom models)</li>
                  <li>Custom ERP-like platform layer</li>
                  <li>Dedicated development team</li>
                  <li>24 months Gold support</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ============ 02 · PREMIUM CONFIGURATOR DEVELOPMENT ============ */}
        <section className="section" id="configurators" aria-labelledby="cfg-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">02 — SIGNATURE SERVICE</p>
              <h2 id="cfg-h">Premium Ecommerce Configurator Development</h2>
              <p className="section-desc">
                Luxury product visualisation and interactive sales systems — our specialism, and the
                work most studios can&apos;t deliver. Real-time visual commerce that lets customers build,
                see and price a bespoke product before they buy.
              </p>
            </div>

            {/* Configurator tiers */}
            <div className="cfg-tiers">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">F1</span>
                  <div className="card-title-wrap">
                    <h4>Foundation Configurator</h4>
                    <div className="price"><span className="from">from</span>£7,500</div>
                  </div>
                </div>
                <p className="card-desc">
                  For premium product brands replacing static ecommerce with an immersive buying
                  experience.
                </p>
                <ul className="features">
                  <li>Bespoke interactive configurator</li>
                  <li>Premium responsive UI / UX</li>
                  <li>Real-time material &amp; finish switching</li>
                  <li>Dynamic pricing engine</li>
                  <li>Product option logic</li>
                  <li>Mobile optimisation</li>
                  <li>Branded luxury interface</li>
                  <li>Hosting deployment assistance</li>
                  <li>Lead capture integration</li>
                  <li>SEO-friendly architecture</li>
                </ul>
                <div className="upgrade">
                  <b>Ideal for:</b> AV furniture, laser TV cabinets, premium screens, designer
                  furniture, interior products.
                </div>
              </article>

              <article className="card featured">
                <span className="badge">Most popular</span>
                <div className="card-top">
                  <span className="chip" aria-hidden="true">P2</span>
                  <div className="card-title-wrap">
                    <h4>Professional Configurator Suite</h4>
                    <div className="price">£15,000 – £30,000</div>
                  </div>
                </div>
                <p className="card-desc">
                  A fully integrated, commerce-focused system built to lift conversion and streamline
                  bespoke sales.
                </p>
                <p className="cfg-subhead">Everything in Foundation, plus</p>
                <ul className="features">
                  <li>Advanced pricing &amp; conditional logic</li>
                  <li>Live quotation system</li>
                  <li>Save &amp; share configurations</li>
                  <li>PDF quote generation</li>
                  <li>CRM integration</li>
                  <li>Ecommerce platform integration</li>
                  <li>Multi-product architecture</li>
                  <li>Room colour matching tools</li>
                  <li>Dealer / trade pricing mode</li>
                  <li>Analytics &amp; conversion tracking</li>
                  <li>Enhanced rendering &amp; lighting systems</li>
                  <li>Advanced animations &amp; transitions</li>
                </ul>
                <div className="upgrade">
                  <b>Commercial impact:</b> higher AOV, reduced quotation workload, faster decisions,
                  fewer abandoned enquiries.
                </div>
              </article>

              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">E3</span>
                  <div className="card-title-wrap">
                    <h4>Enterprise Digital Showroom</h4>
                    <div className="price"><span className="from">from</span>£50,000</div>
                  </div>
                </div>
                <p className="card-desc">
                  A complete immersive commerce platform for luxury configurable products and
                  high-ticket bespoke sales.
                </p>
                <p className="cfg-subhead">Everything in Professional, plus</p>
                <ul className="features">
                  <li>Multi-brand architecture</li>
                  <li>Advanced CPQ (Configure, Price, Quote)</li>
                  <li>ERP / API integration</li>
                  <li>AR room placement</li>
                  <li>Real-time inventory logic</li>
                  <li>Manufacturing option management</li>
                  <li>Customer account dashboards</li>
                  <li>Advanced admin system</li>
                  <li>International pricing support</li>
                  <li>Multi-language capability</li>
                  <li>Finance / payment integrations</li>
                  <li>Custom analytics dashboards</li>
                </ul>
                <div className="upgrade">
                  <b>Designed for:</b> luxury furniture, bespoke interiors, home cinema companies,
                  premium retailers, trade &amp; dealer networks.
                </div>
              </article>
            </div>

            {/* Optional enhancements */}
            <h3 className="cfg-block-label">Optional enhancements</h3>
            <p className="cfg-block-desc">Add-ons that layer onto any configurator tier above.</p>
            <div className="table-wrap">
              <table>
                <caption>Indicative starting prices. Final scope confirmed at kick-off.</caption>
                <thead>
                  <tr><th scope="col">Enhancement</th><th scope="col">From</th></tr>
                </thead>
                <tbody>
                  <tr><td>AR / Room placement</td><td>£5,000</td></tr>
                  <tr><td>Trade portal &amp; dealer dashboard</td><td>£4,500</td></tr>
                  <tr><td>AI-assisted product recommendations</td><td>£3,000</td></tr>
                  <tr><td>Cinematic product rendering</td><td>£2,500</td></tr>
                  <tr><td>Advanced material system (PBR)</td><td>£1,500</td></tr>
                  <tr><td>Dynamic logistics &amp; delivery calculator</td><td>£1,500</td></tr>
                  <tr><td>Automated PDF specification sheets</td><td>£1,000</td></tr>
                </tbody>
              </table>
            </div>

            {/* Differentiator */}
            <div className="spotlight" style={{ marginTop: '48px' }}>
              <span className="tag">What makes our systems different</span>
              <h3>We don&apos;t build basic &ldquo;website configurators.&rdquo;</h3>
              <p>
                We build immersive commerce systems that help premium brands increase conversion
                rates, simplify bespoke ordering, automate quotations, improve customer confidence,
                and create luxury digital buying experiences.
              </p>
              <div className="cfg-cols">
                <div>
                  <h4>Our focus combines</h4>
                  <ul className="features">
                    <li>Luxury ecommerce UX</li>
                    <li>Real-time visualisation</li>
                    <li>Advanced pricing logic</li>
                    <li>Bespoke product workflows</li>
                    <li>Conversion-focused design</li>
                  </ul>
                </div>
                <div>
                  <h4>Commercial benefits</h4>
                  <ul className="features">
                    <li>Higher average order value</li>
                    <li>Reduced quotation workload</li>
                    <li>Faster customer decision-making</li>
                    <li>Improved dealer efficiency</li>
                    <li>Lower abandoned enquiries</li>
                  </ul>
                </div>
              </div>
              <h4 style={{ fontSize: '16px', color: 'var(--text)', margin: '26px 0 0' }}>
                Typical industries
              </h4>
              <div className="pill-row">
                <span className="pill">Home cinema &amp; AV</span>
                <span className="pill">Luxury furniture</span>
                <span className="pill">Kitchens &amp; wardrobes</span>
                <span className="pill">Architectural interiors</span>
                <span className="pill">Bespoke manufacturing</span>
                <span className="pill">Designer home products</span>
              </div>
            </div>

            {/* Configurator retainer & support */}
            <h3 className="cfg-block-label">Configurator retainer &amp; support</h3>
            <p className="cfg-block-desc">
              Keep your configurator current, optimised and expanding after launch.
            </p>
            <div className="support-grid">
              <div className="support">
                <h3>Essential</h3>
                <div className="price">£250<span> / month</span></div>
                <ul className="features">
                  <li>Updates &amp; minor changes</li>
                  <li>Backups</li>
                  <li>Monitoring</li>
                </ul>
              </div>
              <div className="support popular">
                <span className="badge">Most popular</span>
                <h3>Growth</h3>
                <div className="price">£750<span> / month</span></div>
                <ul className="features">
                  <li>Feature updates</li>
                  <li>Performance optimisation</li>
                  <li>Analytics &amp; reporting</li>
                </ul>
              </div>
              <div className="support">
                <h3>Full Technical Partnership</h3>
                <div className="price">Custom</div>
                <ul className="features">
                  <li>Ongoing development</li>
                  <li>Platform expansion</li>
                  <li>Roadmap &amp; strategy</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 03 · AI & AUTOMATION ============ */}
        <section className="section" id="ai" aria-labelledby="ai-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">03 — AI &amp; AUTOMATION</p>
              <h2 id="ai-h">Intelligence layered onto commerce</h2>
              <p className="section-desc">
                Add AI where it earns its keep — search, recommendations, support and prediction —
                as a layer on any tier above.
              </p>
            </div>
            <div className="grid">
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">AI</span>
                  <div className="card-title-wrap">
                    <h4>Automation Starter</h4>
                    <div className="price">£8,000</div>
                  </div>
                </div>
                <p className="card-desc">Email automation &amp; a focused chatbot.</p>
                <ul className="features">
                  <li>Email automation (cart, reviews, orders)</li>
                  <li>Order data sync (1–2 channels)</li>
                  <li>Rule-based support chatbot</li>
                </ul>
              </article>
              <article className="card">
                <div className="card-top">
                  <span className="chip" aria-hidden="true">AI</span>
                  <div className="card-title-wrap">
                    <h4>AI Commerce Assistant</h4>
                    <div className="price">£16,000</div>
                  </div>
                </div>
                <p className="card-desc">Natural-language search &amp; smart recommendations.</p>
                <ul className="features">
                  <li>Natural-language product search</li>
                  <li>AI recommendations engine</li>
                  <li>Conversational chatbot (full catalogue)</li>
                  <li>Automated product descriptions</li>
                  <li>Visual search capability</li>
                </ul>
              </article>
              <article className="card featured">
                <span className="badge">High impact</span>
                <div className="card-top">
                  <span className="chip" aria-hidden="true">AI</span>
                  <div className="card-title-wrap">
                    <h4>AI Intelligence System</h4>
                    <div className="price">£22,000</div>
                  </div>
                </div>
                <p className="card-desc">A complete intelligence layer with predictive analytics.</p>
                <ul className="features">
                  <li>Everything in AI Commerce Assistant</li>
                  <li>Competitive price monitoring &amp; alerting</li>
                  <li>Review sentiment analysis (all channels)</li>
                  <li>Behaviour prediction &amp; churn detection</li>
                  <li>Automated sales insights</li>
                  <li>Weekly AI-generated reporting</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ============ 04 · CORE SERVICES ============ */}
        <section className="section" id="services" aria-labelledby="svc-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">04 — CORE SERVICES</p>
              <h2 id="svc-h">Capabilities, standalone or combined</h2>
              <p className="section-desc">
                Individual services that can be purchased on their own or bundled into any tier
                above.
              </p>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">01</span>
                <h3>Web Design &amp; Development</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>WordPress Development</h4>
                  <p>Custom WordPress sites, themes and plugins with full CMS control.</p>
                </div>
                <div className="service-item">
                  <h4>Next.js &amp; React</h4>
                  <p>High-performance marketing sites, SaaS platforms and landing pages on modern frameworks.</p>
                </div>
                <div className="service-item">
                  <h4>E-Commerce Development</h4>
                  <p>WooCommerce and headless builds — product pages, checkout, inventory, payments.</p>
                </div>
                <div className="service-item">
                  <h4>Landing Page Design</h4>
                  <p>High-converting pages for campaigns, launches and lead generation.</p>
                </div>
                <div className="service-item">
                  <h4>Redesign &amp; Optimisation</h4>
                  <p>Modernise an existing site: better UX, faster performance, improved SEO.</p>
                </div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">02</span>
                <h3>Backend &amp; Integrations</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>REST API Development</h4>
                  <p>Custom backends in NestJS / Node.js — clean architecture, documented, built to scale.</p>
                </div>
                <div className="service-item">
                  <h4>Database Design</h4>
                  <p>Supabase, PostgreSQL and Redis — optimised schemas, modelling and performance tuning.</p>
                </div>
                <div className="service-item">
                  <h4>Third-Party Integrations</h4>
                  <p>Stripe, CRMs (HubSpot, Salesforce), Zapier and any API your business relies on.</p>
                </div>
                <div className="service-item">
                  <h4>Headless CMS Setup</h4>
                  <p>Sanity, Contentful, Payload and Decap for content-driven platforms.</p>
                </div>
                <div className="service-item">
                  <h4>B2B SaaS Platforms</h4>
                  <p>Multi-tenancy, subscription billing, user management and dashboard analytics.</p>
                </div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">03</span>
                <h3>Interactive Tools</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>Product Configurators</h4>
                  <p>Real-time configuration with colours, sizes, options and dynamic pricing.</p>
                </div>
                <div className="service-item">
                  <h4>Price Calculators</h4>
                  <p>Interactive quoting tools that price projects or products from user inputs.</p>
                </div>
                <div className="service-item">
                  <h4>Quote &amp; Proposal Builders</h4>
                  <p>Multi-step forms that generate instant quotes, integrated with your CRM.</p>
                </div>
                <div className="service-item">
                  <h4>Comparison &amp; Filter Tools</h4>
                  <p>Dynamic comparison widgets that help users find the right fit fast.</p>
                </div>
                <div className="service-item">
                  <h4>Booking &amp; Scheduling</h4>
                  <p>Custom availability calendars and resource schedulers embedded in your site.</p>
                </div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">04</span>
                <h3>UI / UX Design</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>UX Research &amp; Audits</h4>
                  <p>Find friction, drop-offs and usability issues with actionable fixes.</p>
                </div>
                <div className="service-item">
                  <h4>Wireframing &amp; Prototyping</h4>
                  <p>Low- and high-fidelity Figma prototypes to validate before code.</p>
                </div>
                <div className="service-item">
                  <h4>Design Systems</h4>
                  <p>Scalable component libraries and design tokens for consistent UI.</p>
                </div>
                <div className="service-item">
                  <h4>Brand Identity</h4>
                  <p>Logo, palette, typography and visual guidelines that stay consistent.</p>
                </div>
                <div className="service-item">
                  <h4>Responsive &amp; Mobile</h4>
                  <p>Every design optimised for desktop, tablet and mobile without compromise.</p>
                </div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">05</span>
                <h3>AI Automation &amp; Integration</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>AI Chatbots &amp; Assistants</h4>
                  <p>Custom chat built on OpenAI or Claude APIs, trained on your content and tone.</p>
                </div>
                <div className="service-item">
                  <h4>Workflow Automation</h4>
                  <p>Connect apps and automate lead routing, sequences, data processing and reporting.</p>
                </div>
                <div className="service-item">
                  <h4>AI Content &amp; Data Tools</h4>
                  <p>Generation, summarisation, classification and enrichment pipelines.</p>
                </div>
                <div className="service-item">
                  <h4>LLM API Integration</h4>
                  <p>Embed search, recommendations and generation into your products.</p>
                </div>
                <div className="service-item">
                  <h4>Document &amp; Form Intelligence</h4>
                  <p>Automated extraction and processing of documents, forms and PDFs.</p>
                </div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-block-head">
                <span className="num" aria-hidden="true">06</span>
                <h3>Compliance, Accessibility &amp; Support</h3>
              </div>
              <div className="service-grid">
                <div className="service-item">
                  <h4>WCAG 2.2 / ADA Audits</h4>
                  <p>Full accessibility audits against WCAG 2.2 AA with prioritised remediation.</p>
                </div>
                <div className="service-item">
                  <h4>Accessibility Remediation</h4>
                  <p>Keyboard nav, screen-reader support, contrast, alt text and ARIA fixes.</p>
                </div>
                <div className="service-item">
                  <h4>Maintenance Retainers</h4>
                  <p>Updates, security patches, monitoring and content changes.</p>
                </div>
                <div className="service-item">
                  <h4>Performance &amp; SEO</h4>
                  <p>Core Web Vitals, technical SEO, image optimisation and caching.</p>
                </div>
                <div className="service-item">
                  <h4>Security &amp; Hosting</h4>
                  <p>Secure hosting, SSL, firewall, backups and uptime monitoring.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 05 · À LA CARTE ============ */}
        <section className="section" id="alacarte" aria-labelledby="alc-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">05 — À LA CARTE</p>
              <h2 id="alc-h">Individual services</h2>
              <p className="section-desc">
                Standalone pricing for specific services outside the core tiers. Ordered from
                foundational engineering to focused add-ons.
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <caption>Standard 2026 pricing. Ranges reflect scope; fixed quote confirmed at kick-off.</caption>
                <thead>
                  <tr><th scope="col">Service</th><th scope="col">Standard price</th></tr>
                </thead>
                <tbody>
                  <tr><td>Custom API Development</td><td>£4,000 – £12,000</td></tr>
                  <tr><td>Design System Development</td><td>£8,000 – £15,000</td></tr>
                  <tr><td>Visual Product Search</td><td>£6,000</td></tr>
                  <tr><td>AI Customer Support Chatbot</td><td>£5,000</td></tr>
                  <tr><td>Custom Reporting Dashboard</td><td>£5,000</td></tr>
                  <tr><td>Email Marketing Automation</td><td>£4,500</td></tr>
                  <tr><td>Content Generation System</td><td>£4,000</td></tr>
                  <tr><td>Multilingual Auto-Translation</td><td>£3,500</td></tr>
                  <tr><td>Price Monitoring Dashboard</td><td>£3,500</td></tr>
                  <tr><td>UX Research &amp; Audit</td><td>£3,500</td></tr>
                  <tr><td>Accessibility Remediation</td><td>£3,000 – £8,000</td></tr>
                  <tr><td>Inventory Sync (multi-channel)</td><td>£3,000</td></tr>
                  <tr><td>Review Management Automation</td><td>£2,500</td></tr>
                  <tr><td>WCAG 2.2 Accessibility Audit</td><td>£2,000</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============ 06 · SUPPORT ============ */}
        <section className="section" id="support" aria-labelledby="sup-h">
          <div className="container">
            <div className="section-head">
              <p className="section-num">06 — ONGOING SUPPORT</p>
              <h2 id="sup-h">Monthly retainer plans</h2>
              <p className="section-desc">
                Continuous optimisation and system management to keep your infrastructure secure,
                performant and evolving.
              </p>
            </div>
            <div className="support-grid">
              <div className="support">
                <h3>Bronze</h3>
                <div className="price">£350<span> / month</span></div>
                <ul className="features">
                  <li>Content updates &amp; minor changes</li>
                  <li>Security patches &amp; platform updates</li>
                  <li>Performance monitoring</li>
                  <li>Email support (48-hour response)</li>
                  <li>Monthly uptime reports</li>
                </ul>
              </div>
              <div className="support popular">
                <span className="badge">Most popular</span>
                <h3>Silver</h3>
                <div className="price">£840<span> / month</span></div>
                <ul className="features">
                  <li>Everything in Bronze</li>
                  <li>A/B testing &amp; conversion optimisation</li>
                  <li>Monthly analytics reporting</li>
                  <li>Priority support (24-hour response)</li>
                  <li>5 development hours / month</li>
                  <li>Quarterly strategy sessions</li>
                </ul>
              </div>
              <div className="support">
                <h3>Gold</h3>
                <div className="price">£1,750<span> / month</span></div>
                <ul className="features">
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
          </div>
        </section>

      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-card">
            <div className="footer-card-glow" aria-hidden="true" />
            <div className="footer-card-inner">
              <LogoMark className="footer-mark" width={56} height={56} aria-label="Blueprint Code logo" />
              <p className="tagline">Design. Build. Code. Launch.</p>
              <h2 className="footer-title">Let&apos;s build something exceptional</h2>
              <p className="footer-desc">
                Have a new build, 3D configurator, or bespoke digital project in mind? Connect directly with our lead engineer.
              </p>

              <div className="footer-actions">
                <a href="mailto:james@blueprintcode.ai" className="footer-email-btn">
                  <span className="email-status-dot" aria-hidden="true" />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>james@blueprintcode.ai</span>
                </a>
              </div>
              <p className="footer-subtext">Quick response · NDA protected · Transparent fixed-price proposals</p>
            </div>
          </div>

          <p className="note">
            All prices are standard 2026 rates in GBP and exclude VAT. Final scope and fixed quotes
            are confirmed at project kick-off. Ranges reflect project complexity.
          </p>
          <p className="footer-copy">&copy; 2026 Blueprint Code. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

/** Blueprint Code logo as a Next.js Image component loading the real PNG. */
function LogoMark({
  className,
  width = 96,
  height = 96,
  'aria-label': ariaLabel,
}: {
  className?: string;
  width?: number;
  height?: number;
  'aria-label'?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt={ariaLabel ?? 'Blueprint Code logo'}
      width={width}
      height={height}
      className={className}
      priority={width >= 80}
    />
  );
}
