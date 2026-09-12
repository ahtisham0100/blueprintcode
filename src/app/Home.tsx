'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';

/** Per-item reveal stagger delay as a CSS custom property. */
const d = (seconds: number): CSSProperties =>
  ({ '--d': `${seconds}s` } as CSSProperties);

/** Sprint entrance stagger (~60ms per item) as a CSS custom property. */
const rise = (i: number): CSSProperties =>
  ({ '--rise-d': `${i * 60}ms` } as CSSProperties);

export default function Home() {
  // Scroll reveal via IntersectionObserver. Progressive enhancement: the
  // `bp-js` class is what hides [data-reveal] elements, so without JS (or
  // before this runs) everything stays visible for readers and crawlers.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('bp-js');

    const els = Array.from(document.querySelectorAll<HTMLElement>('.bp-reveal'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('bp-in'));
      return () => root.classList.remove('bp-js');
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('bp-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      root.classList.remove('bp-js');
    };
  }, []);

  // Size each capability iframe to its own content (the page inside posts its
  // height), so there are no nested scrollbars. Same-origin messages only.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { __bpcHeight?: number } | null;
      if (!data || typeof data.__bpcHeight !== 'number') return;
      const frames = document.querySelectorAll<HTMLIFrameElement>('.bp-cap-frame');
      frames.forEach((f) => {
        if (f.contentWindow === e.source) {
          f.style.height = `${Math.max(520, Math.ceil(data.__bpcHeight!))}px`;
        }
      });
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Sprint section entrance: reveal the list items + price cards once when the
  // grid scrolls into view, then disconnect. The resting (hidden) state lives
  // only in a `.bp-js`-gated, reduced-motion-guarded CSS rule, so the content
  // is visible without JavaScript and for reduced-motion users.
  useEffect(() => {
    const grid = document.querySelector('.bp-sprint-grid');
    if (!grid) return;
    const items = grid.querySelectorAll('.bp-sprint-rise');
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          items.forEach((el) => el.classList.add('is-in'));
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(grid);
    return () => io.disconnect();
  }, []);

  return (
    <div className="bp-root">
      <a className="bp-skip" href="#main">Skip to content</a>
      <div className="bp-grid" aria-hidden="true" />

      {/* ============ NAV ============ */}
      <header className="bp-nav" role="banner">
        <div className="bp-nav-inner">
          <a className="bp-brand" href="/" aria-label="Blueprint Code home">
            <svg className="bp-mark" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
              <rect width="96" height="96" rx="22" fill="#0B1F3A" />
              <g transform="translate(12 12) scale(0.86)">
                <rect x="6" y="6" width="12" height="72" rx="3" fill="#FFFFFF" />
                <rect x="24" y="6" width="42" height="32" rx="12" fill="none" stroke="#FFFFFF" strokeWidth="12" />
                <rect x="24" y="46" width="54" height="32" rx="12" fill="none" stroke="#4F8BFF" strokeWidth="12" />
              </g>
            </svg>
            <span className="bp-brand-name">Blueprint Code</span>
          </a>
          <nav className="bp-navlinks" aria-label="Primary">
            <a href="/configurators">Configurators</a>
            <a href="/prototypes">Prototypes</a>
            <a href="/ppav-case-study">Case study</a>
            <a href="/pricing">Pricing</a>
            <a href="/insights">Insights</a>
            <a href="/about">About</a>
            <a className="bp-nav-cta" href="#contact">Start a project</a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* ============ HERO ============ */}
        <section className="bp-hero" aria-labelledby="hero-h">
          <div className="bp-hero-eyebrow bp-hero-anim">
            <span className="bp-dot" aria-hidden="true" />
            CONFIGURATORS / COMMERCE / AI
          </div>
          <h1 id="hero-h" className="bp-h1 bp-hero-anim" style={d(0.1)}>
            We make complex products easier to buy.
          </h1>
          <div className="bp-hero-row bp-hero-anim" style={d(0.22)}>
            <div>
              <p className="bp-hero-lead">
                Blueprint Code builds product configurators, recommendation engines and
                connected ecommerce systems for businesses whose products can&apos;t be
                explained by a standard product page.
              </p>
              <div className="bp-hero-actions">
                <a className="bp-btn bp-btn-primary" href="#sprint">
                  Start with a prototype <span className="bp-arrow" aria-hidden="true">→</span>
                </a>
                <a className="bp-btn bp-btn-secondary" href="/prototypes">View our work</a>
              </div>
            </div>
            <aside className="bp-hero-aside">
              <div className="bp-aside-label">DESIGNED FROM THE COMMERCIAL PROBLEM OUT.</div>
              <p>
                We combine product logic, UX, real-time 3D, ecommerce and AI into tools
                customers can understand and businesses can operate.
              </p>
            </aside>
          </div>

          <div className="bp-datum">
            <div className="bp-datum-cell bp-reveal" style={d(0)}>
              <div className="bp-datum-label">LEAD CAPABILITY</div>
              <div className="bp-datum-value">CONFIGURATORS</div>
            </div>
            <div className="bp-datum-cell bp-reveal" style={d(0.08)}>
              <div className="bp-datum-label">LIVE SYSTEM</div>
              <div className="bp-datum-value">5 CONNECTED TOOLS</div>
            </div>
            <div className="bp-datum-cell bp-reveal" style={d(0.16)}>
              <div className="bp-datum-label">COMMERCE REACH</div>
              <div className="bp-datum-value">8 AMAZON MARKETS</div>
            </div>
            <div className="bp-datum-cell bp-reveal" style={d(0.24)}>
              <div className="bp-datum-label">DELIVERY</div>
              <div className="bp-datum-value">UK + GLOBAL</div>
            </div>
          </div>
        </section>

        {/* ============ 01 CONFIGURATORS ============ */}
        <section id="configurators" className="bp-section bp-section--border" aria-labelledby="cfg-h">
          <div className="bp-section-head bp-reveal">
            <div>
              <div className="bp-eyebrow">01 — PRIMARY EXPERTISE</div>
              <h2 id="cfg-h" className="bp-h2">Product configurators built to sell.</h2>
            </div>
            <p className="bp-lead">
              Not visual novelties. We build commercial tools that apply product rules, guide
              decisions, calculate specifications, update pricing and connect the final
              configuration to checkout, quote or CRM.
            </p>
          </div>

          <div className="bp-cfg-intro bp-reveal">
            <div className="bp-eyebrow bp-eyebrow--muted">PROFESSIONAL CONFIGURATOR SUITE</div>
            <h3 className="bp-h3">Turn product complexity into a clear customer journey.</h3>
            <p>
              From a focused option builder to a complete digital showroom, the interface is
              only the visible layer.
            </p>
          </div>

          <div className="bp-cards">
            {[
              { key: 'three', title: '2D and real-time 3D visualisation' },
              { key: 'rules', title: 'Compatibility and recommendation logic' },
              { key: 'price', title: 'Dynamic pricing and specification' },
              { key: 'connect', title: 'WooCommerce, Shopify and CRM integration' },
              { key: 'ai', title: 'AI-assisted product guidance' },
            ].map((c, i) => (
              <div className="bp-card" style={{ '--i': i } as CSSProperties} key={c.key}>
                <iframe
                  className="bp-cap-frame"
                  src={`/capabilities/${c.key}.html`}
                  title={c.title}
                  loading="lazy"
                  scrolling="no"
                />
              </div>
            ))}
          </div>

          <div className="bp-cfg-actions bp-reveal">
            <a className="bp-btn bp-btn-secondary" href="#contact">Discuss a configurator</a>
          </div>
        </section>

        {/* ============ 02 PROTOTYPE SPRINT ============ */}
        <section id="sprint" className="bp-sprint" aria-labelledby="sprint-h">
          <div className="bp-wrap">
            <div className="bp-sprint-grid">
              <div className="bp-sprint-intro">
                <div className="bp-eyebrow bp-eyebrow--light">02 — PROTOTYPE SPRINT</div>
                <h2 id="sprint-h" className="bp-h2 bp-h2--dark">Proof before promises.</h2>
              </div>
              <p className="bp-lead bp-lead--dark bp-sprint-lead">
                Before anyone commits to a full build, we make a working prototype of your
                product in three to five weeks. Something real in a browser, not a slide deck.
                The fee is credited in full against the build if you proceed within 90 days.
              </p>

              <div className="bp-get-card bp-sprint-full">
                <div className="bp-eyebrow bp-eyebrow--light">WHAT YOU GET</div>
                <ul className="bp-ticklist">
                  <li className="bp-sprint-rise" style={rise(0)}><span className="bp-tick" aria-hidden="true">✓</span>One real product, configurable and interactive</li>
                  <li className="bp-sprint-rise" style={rise(1)}><span className="bp-tick" aria-hidden="true">✓</span>A single core option path — the one that matters most to your sale</li>
                  <li className="bp-sprint-rise" style={rise(2)}><span className="bp-tick" aria-hidden="true">✓</span>Real materials and finishes, not placeholders</li>
                  <li className="bp-sprint-rise" style={rise(3)}><span className="bp-tick" aria-hidden="true">✓</span>Technical feasibility notes and recommended architecture</li>
                  <li className="bp-sprint-rise" style={rise(4)}><span className="bp-tick" aria-hidden="true">✓</span>Fixed quote for the full build</li>
                </ul>
              </div>

              <div className="bp-price-card bp-sprint-rise" style={rise(5)}>
                <div className="bp-price-num">£1,500</div>
                <div className="bp-price-label">2D / image-based</div>
                <p className="bp-price-detail">Options and pricing logic</p>
              </div>
              <div className="bp-price-card bp-price-card--pick bp-sprint-rise" style={rise(6)}>
                <span className="bp-price-pill">Common choice</span>
                <div className="bp-price-num">£3,000</div>
                <div className="bp-price-label">Real-time 3D</div>
                <p className="bp-price-detail">Material and finish switching</p>
              </div>

              <div className="bp-credit bp-sprint-full">
                <strong>Credited in full against the build.</strong> Proceed within 90 days and the sprint fee comes off the project price.
              </div>

              <div className="bp-sprint-actions bp-sprint-full">
                <a className="bp-btn bp-btn-dark" href="#contact">
                  Book a sprint <span className="bp-arrow" aria-hidden="true">→</span>
                </a>
                <a className="bp-btn bp-btn-dark-ghost" href="/pricing">See the rates</a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 03 SELECTED WORK ============ */}
        <section id="work" className="bp-section" aria-labelledby="work-h">
          <div className="bp-section-head bp-reveal">
            <div>
              <div className="bp-eyebrow">03 — SELECTED WORK</div>
              <h2 id="work-h" className="bp-h2">Systems already running.</h2>
            </div>
            <p className="bp-lead">
              Each of these began as a focused prototype that solved the hardest part of the
              brief before anything else was built.
            </p>
          </div>

          <ul className="bp-worklist">
            {[
              { title: 'Cinema system designer', desc: 'Five connected tools returning one complete buying plan.', cta: 'Read case study', href: '/ppav-case-study', img: '/assets/images/Prism.png' },
              { title: 'Mirrored elevator cabin', desc: 'True planar reflection, moving doors and environment-aware 3D.', cta: 'View prototype', href: '/prototypes', img: '/assets/images/aura-mirror-demo.png' },
              { title: 'Outboard motor selector', desc: 'Plain-English questions in, a shortlist of correctly sized motors out.', cta: 'View prototype', href: '/prototypes', img: '/assets/images/Ripple.png' },
              { title: 'Charm bracelet builder', desc: 'Drag to rearrange charms along the chain, with live pricing.', cta: 'View prototype', href: '/prototypes', img: '/assets/images/bracelet-config.png' },
            ].map((p, i) => (
              <li className="bp-work-item bp-reveal" style={d(i * 0.08)} key={p.title}>
                <a className="bp-work-link" href={p.href}>
                  <span className="bp-work-img" aria-hidden="true" style={{ backgroundImage: `url("${p.img}")` }} />
                  <span className="bp-work-scrim" aria-hidden="true" />
                  <span className="bp-work-body">
                    <h3 className="bp-work-title">{p.title} <span className="bp-arrow" aria-hidden="true">→</span></h3>
                    <span className="bp-work-cta">{p.cta}</span>
                    <span className="bp-work-fade">
                      <span className="bp-work-desc">{p.desc}</span>
                      {/* tags slot ready — awaiting tag copy */}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ 04 FEATURED · PP-AV ============ */}
        <section id="ppav" className="bp-section bp-section--top0" aria-labelledby="ppav-h">
          <div className="bp-featured bp-reveal">
            <div className="bp-featured-copy">
              <div className="bp-eyebrow">04 — FEATURED PROJECT</div>
              <div className="bp-featured-sublabel">PP-AV / LIVE COMMERCE BUSINESS</div>
              <h2 id="ppav-h" className="bp-h2">
                A digital retailer that behaves like a knowledgeable showroom.
              </h2>
              <p>
                For PP-AV we connected a Cinema Room Planner, Audio Designer, Projector
                Selector, Screen Finder and 3D Cabinet Configurator to a wider international
                commerce operation.
              </p>
              <ul className="bp-featured-ticks">
                <li><span className="bp-tick" aria-hidden="true">✓</span>Professional Configurator Suite</li>
                <li><span className="bp-tick" aria-hidden="true">✓</span>Enterprise Commerce Core</li>
                <li><span className="bp-tick" aria-hidden="true">✓</span>Direct PP-AV ecommerce</li>
                <li>
                  <span className="bp-tick" aria-hidden="true">✓</span>
                  <a className="bp-inline" href="https://www.amazon.com/stores/PHOENIXPROJECTORSAV/" rel="noopener">Eight Amazon marketplaces</a>
                </li>
                <li>
                  <span className="bp-tick" aria-hidden="true">✓</span>
                  <a className="bp-inline" href="https://www.ebay.co.uk/str/phoenixprojectorsav" rel="noopener">eBay Global</a>
                </li>
              </ul>
              <a className="bp-btn bp-btn-secondary bp-featured-btn" href="/ppav-case-study">
                View full case study <span className="bp-arrow" aria-hidden="true">→</span>
              </a>
            </div>
            <div className="bp-featured-visual">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset, no next/image optimisation needed */}
              <img
                className="bp-featured-svg"
                src="/assets/images/av-tools-ui-mockup.svg"
                alt="Blueprint Code AV tools suite mockup: Room planner, Audio designer, Projector, Screen finder and 3D cabinet, connected to the Commerce Core data layer."
                width={687}
                height={375}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* ============ 05 BUILD LEVELS ============ */}
        <section id="levels" className="bp-section bp-section--border" aria-labelledby="levels-h">
          <div className="bp-section-head bp-reveal">
            <div>
              <div className="bp-eyebrow">05 — BUILD LEVELS</div>
              <h2 id="levels-h" className="bp-h2">The right scale for the commercial job.</h2>
            </div>
            <p className="bp-lead">
              Three configurator levels, each a step up in logic and integration. Scope and
              price are fixed against a written technical specification at kick-off.
            </p>
          </div>

          <div className="bp-levels">
            <div className="bp-level bp-reveal" style={d(0)}>
              <span className="bp-level-code">01 / CFG</span>
              <h3>Foundation configurator</h3>
              <p>Focused options, rules, live preview and lead capture.</p>
              <span className="bp-level-price">FROM £7,500</span>
            </div>
            <div className="bp-level bp-reveal" style={d(0.08)}>
              <span className="bp-level-code">02 / PRO</span>
              <h3>Professional configurator suite</h3>
              <p>Advanced logic, dynamic pricing, integrations and ecommerce.</p>
              <span className="bp-level-price">£15,000 — £30,000</span>
            </div>
            <div className="bp-level bp-reveal" style={d(0.16)}>
              <span className="bp-level-code">03 / DXS</span>
              <h3>Enterprise digital showroom</h3>
              <p>Multiple tools, 3D, guided commerce and intelligent assistance.</p>
              <span className="bp-level-price">FROM £35,000</span>
            </div>
            <div className="bp-level bp-reveal" style={d(0.24)}>
              <span className="bp-level-code">SEPARATE LADDER</span>
              <h3>Commerce infrastructure</h3>
              <p>
                Websites, stores, multi-channel and enterprise commerce. Tier 1 to Tier 4,
                sold alongside or without a configurator.
              </p>
              <span className="bp-level-price"><a href="/pricing">£5,000 — £120,000+ / SEE SCHEDULE</a></span>
            </div>
          </div>

          <p className="bp-ladder-note bp-reveal">
            Every configurator build starts with a Prototype Sprint. Full published rates,
            add-ons and retainers are on the <a href="/pricing">schedule of rates</a>.
          </p>
        </section>

        {/* ============ 06 ABOUT ============ */}
        <section id="about" className="bp-section bp-section--top0" aria-labelledby="about-h">
          <div className="bp-section-head bp-reveal">
            <div>
              <div className="bp-eyebrow">06 — BLUEPRINT CODE</div>
              <h2 id="about-h" className="bp-h2">Built by people who understand the sale.</h2>
            </div>
            <div className="bp-about-body">
              <p className="bp-lead" style={{ paddingTop: 0 }}>
                Blueprint Code brings together commercial product thinking, software
                engineering, UX design and specialist 3D capability. We work from the buying
                problem outward, not from a fashionable technology inward.
              </p>
              <div className="bp-principles">
                <div className="bp-principle bp-reveal" style={d(0.15)}>
                  <div className="bp-principle-line" aria-hidden="true" />
                  <h3>Commercial logic</h3>
                  <p>Rules, pricing and customer decisions shape the system from the start.</p>
                </div>
                <div className="bp-principle bp-reveal" style={d(0.25)}>
                  <div className="bp-principle-line" aria-hidden="true" />
                  <h3>Show and tell</h3>
                  <p>Focused prototypes make difficult ideas tangible before the larger build.</p>
                </div>
                <div className="bp-principle bp-reveal" style={d(0.35)}>
                  <div className="bp-principle-line" aria-hidden="true" />
                  <h3>Own the outcome</h3>
                  <p>Architecture, interaction, testing and launch are treated as one responsibility.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 07 CLOSE ============ */}
        <section id="contact" className="bp-section bp-section--top0" aria-labelledby="close-h">
          <div className="bp-close-card bp-reveal">
            <div className="bp-eyebrow">07 — START A PROJECT</div>
            <h2 id="close-h" className="bp-h2">
              What is your product making customers work too hard to understand?
            </h2>
            <p>
              Send us the product, the current sales process and the decisions customers find
              difficult. We&apos;ll identify the right first build — usually a Prototype Sprint.
            </p>
            <div className="bp-close-actions">
              <a className="bp-btn bp-btn-primary" href="mailto:james@blueprintcode.ai?subject=Blueprint Code project">
                Discuss your project
              </a>
              <a className="bp-btn bp-btn-secondary" href="/pricing">See the rates</a>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="bp-footer" role="contentinfo">
        <div className="bp-footer-inner">
          <div className="bp-footer-brand">
            <span className="bp-footer-mark" aria-hidden="true" />
            <b>BLUEPRINT CODE</b>
            <span>· BUILD SYSTEMS / 2026</span>
          </div>
          <div className="bp-footer-meta">
            <span>UK — MONMOUTHSHIRE</span>
            <a href="mailto:james@blueprintcode.ai">JAMES@BLUEPRINTCODE.AI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
