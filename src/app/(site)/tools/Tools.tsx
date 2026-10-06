'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { initBlueprintRoll } from './blueprintRoll';
import { ROLL_CARDS } from './rollCards';
import { AMAZON_STORE_URL } from '@/lib/links';

export default function Tools() {
  // Drive the blueprint-roll page-turn once the section is in the DOM.
  useEffect(() => initBlueprintRoll(), []);

  return (
    <div className="bp-root">
      {/* Header and footer are the global site chrome (src/app/(site)/_chrome),
          rendered by the root layout. This page keeps only its blueprint-roll
          body. It was the homepage until the intelligence-layer homepage
          replaced it; it now lives at /tools as the BPC Tools overview. */}

      {/* ============ BLUEPRINT-ROLL TOOLS CONTENT ============ */}
      <main id="main" className="brc">
        <span id="top" />

        {/* ============ HERO ============ */}
        <section className="hero" style={{ borderTop: 0 }}>
          <div className="sheet">
            <div className="titlebar">
              <span>Sheet 00 / BPC Tools overview</span>
              <span>Discipline: Interactive commerce</span>
              <span>Status: Operational</span>
            </div>
            <div className="hero-grid">
              <div>
                <span className="lbl">CONFIGURATORS / COMMERCE / AI</span>
                <h1>We make complex products easier to buy.</h1>
                <p className="lead">Blueprint Code AI builds product configurators, recommendation engines and connected ecommerce systems for businesses whose products can&apos;t be explained by a standard product page.</p>
                <div className="hero-actions">
                  <a className="button solid" href="#sprint">Start with a prototype</a>
                  <a className="button" href="#work">View our work</a>
                </div>
              </div>
              <div className="hero-right">
                <figure className="hero-figure">
                  <div className="hero-plate">
                    <i /><i /><i /><i />
                    <Image
                      src="/hero image updated.png"
                      alt="Blueprint comparison: on the left, the old road — phone calls, emails, spreadsheets, PDFs, people and databases tangling their way into a manual process. On the right, the Blueprint Code road — one straight line from product configurator to AI recommendation, quote and order, and delivery."
                      width={1536}
                      height={1024}
                      quality={100}
                      sizes="(max-width: 850px) 92vw, (max-width: 1240px) 60vw, 840px"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <figcaption><span>Fig. 00</span><span>Old road / Blueprint Code road</span></figcaption>
                  {/* The drawing ends at "Delivered"; this is where that road leads next. */}
                  <a className="hero-journey" href="/process-blueprinter">
                    <b>Take the journey <span aria-hidden="true">→</span></b>
                    <span>Map your old road. See your Blueprint Code Road.</span>
                  </a>
                </figure>
                <aside className="hero-side">
                  <b>DESIGNED FROM THE COMMERCIAL PROBLEM OUT.</b>
                  <p>We combine product logic, UX, real-time 3D, ecommerce and AI into tools customers can understand and businesses can operate.</p>
                </aside>
              </div>
            </div>
            <div className="datum">
              <div><span className="lbl">CORE SPECIALISM</span><b>CONFIGURATORS</b></div>
              <div><span className="lbl">CONNECTED SYSTEMS</span><b>ECOMMERCE + CRM</b></div>
              <div><span className="lbl">BUILD APPROACH</span><b>PROTOTYPE FIRST</b></div>
              <div><span className="lbl">DELIVERY</span><b>UK + GLOBAL</b></div>
            </div>
          </div>
        </section>

        {/* ============ 01 CONFIGURATORS ============ */}
        <section id="configurators">
          <div className="sheet">
            <p className="section-no">01 / PRIMARY EXPERTISE</p>
            <div className="roll-intro">
              <h2>Six groups of tools for complex products.</h2>
              <p>From configuration and guided selection to planning, quoting, back-office automation and accessibility, each sheet is one group of tools we build. Turn the blueprint to see what sits inside each.</p>
            </div>
            <div className="roll-track" id="blueprint-roll">
              <div className="roll-stage">
                {ROLL_CARDS.map((card) => (
                  <article className="roll-sheet" key={card.stripIndex}>
                    <div className="art-cell">
                      <div className="art">
                        <i /><i /><i /><i />
                        <div className="art-svg" dangerouslySetInnerHTML={{ __html: card.svg }} />
                      </div>
                      <p className="art-caption"><span>{card.artCaption[0]}</span><span>{card.artCaption[1]}</span></p>
                    </div>
                    <div className="copy">
                      <p className="ref">{card.ref}</p>
                      <h3>{card.title}</h3>
                      <p className="intro">{card.intro}</p>
                      <p className="sched-head"><span>{card.listLabel ?? "Example tools"}</span><span>{card.count}</span></p>
                      <ul className="items">
                        {card.items.map((it, j) => <li key={j}>{it}</li>)}
                      </ul>
                    </div>
                    <div className="strip">
                      <span>Blueprint Code AI · <b>Tool groups</b></span>
                      <span>{card.stripName} · <b>{card.stripIndex}</b></span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="roll-controls"><div className="roll-arrows"><button className="roll-arrow" id="roll-prev" type="button" aria-label="Previous blueprint sheet">←</button><button className="roll-arrow roll-pause" id="roll-pause" type="button" aria-label="Pause automatic turning" aria-pressed="false"><span className="roll-pause-glyph" aria-hidden="true" /></button><button className="roll-arrow" id="roll-next" type="button" aria-label="Next blueprint sheet">→</button></div><span className="roll-progress" id="roll-progress">SHEET 01 / 06</span><span className="roll-hint" id="roll-hint">AUTO TURN / 10 SECONDS</span></div>
              <div className="roll-timer" aria-hidden="true" />
            </div>
            <a className="button" href="/contact">Discuss a configurator</a>
          </div>
        </section>

        {/* ============ 02 PROTOTYPE SPRINT (inverted) ============ */}
        <div className="invert" id="sprint">
          <div className="sheet">
            <p className="section-no">STEP 02 — START HERE</p>
            <div className="sprint-head">
              <h2 className="sprint-title">Prototype Sprint — prove it before we build it.</h2>
              <p>Before committing to a full build, we create a working prototype of your product in one to four weeks—something real in a browser, not a slide deck.</p>
            </div>
            <table className="sprint-table">
              <thead><tr><th>Sprint</th><th>Price</th><th>What a full version would normally cost</th></tr></thead>
              <tbody>
                <tr><td>One-week Focus Sprint</td><td className="price">£625</td><td>Standard value: £2,500–£4,000</td></tr>
                <tr><td>Two-week Prototype Sprint</td><td className="price">£1,125</td><td>Standard value: £4,000–£7,500</td></tr>
                <tr><td>Three-week System Sprint</td><td className="price">£2,000</td><td>Standard value: £7,500–£15,000</td></tr>
                <tr><td>Four-week Advanced Sprint</td><td className="price">£3,000</td><td>Standard value: £15,000+</td></tr>
              </tbody>
            </table>
            <div className="sprint-cols">
              <div className="sprint-col">
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
              <div className="sprint-col">
                <h4>HOW IT WORKS</h4>
                <p>We recommend the appropriate Sprint based on the complexity of the intended production system. If you proceed within 90 days, your Sprint fee is credited in full against the agreed build price.</p>
                <p className="sprint-note">Final build pricing depends on product logic, visual assets, integrations, commercial outputs and the level of production refinement required. Plus VAT.</p>
                <span className="strip">PROVE IT BEFORE WE BUILD IT</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ DESIGN PRINCIPLE — NO HOUSE TEMPLATE ============
            Sits directly before the work so the very different visual styles
            of the projects read as intent, not inconsistency. */}
        <section className="principle-panel" aria-labelledby="no-house-template">
          <div className="sheet">
            <div className="pp-frame">
              <i /><i /><i /><i />
              <div className="pp-art" aria-hidden="true">
                <Image
                  src="/Blueprint%20Product%20Configurator%20Schematic.png"
                  alt=""
                  fill
                  sizes="(max-width: 850px) 100vw, 70vw"
                />
              </div>
              <p className="pp-ref">DESIGN PRINCIPLE / 01</p>
              <h2 id="no-house-template">Every system should look native to the business it serves.</h2>
              <p className="pp-copy">We don&apos;t impose a house template. We design each visual language, customer journey and underlying tool around the product, the market and the commercial objective.</p>
              <p className="pp-tags"><span>PRODUCT-LED</span><span>BRAND-SPECIFIC</span><span>COMMERCIALLY ENGINEERED</span></p>
            </div>
            <a className="pp-next" href="#work">Selected systems — open a project file <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        {/* ============ 03 WORK ============ */}
        <section id="work">
          <div className="sheet">
            <p className="section-no">03 / SELECTED WORK</p>
            <div className="section-grid">
              <h2>Systems already running.</h2>
              <p className="section-copy">Each of these began as a focused prototype that solved the hardest part of the brief before anything else was built.</p>
            </div>
            <div className="project-index">
              <article className="project">
                <span className="n">01</span>
                <h3>Cinema system designer</h3>
                <p>Five connected tools returning one complete cinema buying plan.</p>
                <a className="status" href="/ppav-case-study">Read case study</a>
              </article>
              <article className="project">
                <span className="n">02</span>
                <h3>Cabinet configurator</h3>
                <p>Interactive 3D configuration for sizing, finishes and integrated equipment.</p>
                <a className="status" href="https://pp-av.com/cabinet-configurator/" target="_blank" rel="noopener">View live <span aria-hidden="true">↗</span><span className="sr-only"> (opens pp-av.com in a new tab)</span></a>
              </article>
              <article className="project">
                <span className="n">03</span>
                <h3>Screen finder</h3>
                <p>Guided screen and material selection matched to projector, room and viewing conditions.</p>
                <a className="status" href="https://pp-av.com/screen-finder/" target="_blank" rel="noopener">View live <span aria-hidden="true">↗</span><span className="sr-only"> (opens pp-av.com in a new tab)</span></a>
              </article>
              <article className="project">
                <span className="n">04</span>
                <h3>Audio system designer</h3>
                <p>Builds complete multichannel systems around room layout, speaker configuration and amplification.</p>
                <a className="status" href="https://pp-av.com/audio-designer/" target="_blank" rel="noopener">View live <span aria-hidden="true">↗</span><span className="sr-only"> (opens pp-av.com in a new tab)</span></a>
              </article>
            </div>
          </div>
        </section>

        {/* ============ 04 FEATURED ============ */}
        <section id="ppav">
          <div className="sheet">
            <p className="section-no">04 / FEATURED PROJECT</p>
            <div className="case">
              <div className="case-copy">
                <span className="lbl">PP-AV / LIVE COMMERCE BUSINESS</span>
                <h2>A digital retailer that behaves like a knowledgeable showroom.</h2>
                <p>For PP-AV we connected a Cinema Room Planner, Audio Designer, Projector Selector, Screen Finder and 3D Cabinet Configurator to a wider international commerce operation.</p>
                <ul className="ticks">
                  <li>Professional Configurator Suite</li>
                  <li>Enterprise Commerce Core</li>
                  <li>Direct PP-AV ecommerce</li>
                  <li><a href={AMAZON_STORE_URL} target="_blank" rel="noopener">Eight Amazon marketplaces</a></li>
                  <li><a href="https://www.ebay.co.uk/str/phoenixprojectorsav" target="_blank" rel="noopener">eBay Global</a></li>
                </ul>
                <a className="button" href="/ppav-case-study">View full case study</a>
              </div>
              <div className="case-drawing">
                <div className="tools">
                  <span>01 / ROOM PLANNER</span>
                  <span>02 / AUDIO DESIGNER</span>
                  <span>03 / PROJECTOR</span>
                  <span>04 / SCREEN FINDER</span>
                  <span>05 / 3D CABINET</span>
                </div>
                <div className="core">CONNECTED TO — COMMERCE CORE</div>
                <div className="case-stat">CONNECTED SALES TOOLS<b>05</b>ONE UNIFIED JOURNEY</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 05 BUILD LEVELS ============ */}
        <section id="levels">
          <div className="sheet">
            <p className="section-no">05 / BUILD LEVELS</p>
            <div className="section-grid">
              <h2>The right scale for the commercial job.</h2>
              <p className="section-copy">Four configurator levels, each a step up in logic and integration. Scope and price are fixed against a written technical specification at kick-off.</p>
            </div>
            <div className="levels">
              <div className="level">
                <span className="num">01 / CFG</span>
                <h3>Foundation configurator</h3>
                <p>One product family, focused option logic and live preview.</p>
                <span className="from">£2,500 — £7,500</span>
              </div>
              <div className="level">
                <span className="num">02 / ADV</span>
                <h3>Advanced configurator</h3>
                <p>More rules, pricing, quotations or one integration.</p>
                <span className="from">£7,500 — £15,000</span>
              </div>
              <div className="level">
                <span className="num">03 / PRO</span>
                <h3>Professional configurator suite</h3>
                <p>Multiple connected tools and commerce integration.</p>
                <span className="from">£15,000 — £30,000</span>
              </div>
              <div className="level">
                <span className="num">04 / DXS</span>
                <h3>Enterprise digital showroom</h3>
                <p>Shared data, several tools, portals, AI or enterprise integration.</p>
                <span className="from">FROM £35,000</span>
              </div>
              <div className="level other">
                <span className="num">SEPARATE LADDER</span>
                <h3>Commerce infrastructure</h3>
                <p>Websites, stores, multi-channel and enterprise commerce. Tier 1 to Tier 4, sold alongside or without a configurator.</p>
                <span className="from"><a href="/pricing">£5,000 — £120,000+ / SEE SCHEDULE</a></span>
              </div>
            </div>
            <p className="ladder-note">Every configurator build starts with a Prototype Sprint. Full published rates, add-ons and retainers are on the <a href="/pricing">schedule of rates</a>; accessibility audits have their own <a href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</a>.</p>
          </div>
        </section>

        {/* ============ 06 ABOUT ============ */}
        <section id="about">
          <div className="sheet">
            <p className="section-no">06 / BLUEPRINT CODE AI</p>
            <div className="section-grid">
              <h2>Built by people who understand the sale.</h2>
              <p className="section-copy">Blueprint Code AI brings together commercial product thinking, software engineering, UX design and specialist 3D capability. We work from the buying problem outward, not from a fashionable technology inward.</p>
            </div>
            <div className="principles">
              <div className="principle">
                <b>COMMERCIAL LOGIC</b>
                <p>Rules, pricing and customer decisions shape the system from the start.</p>
              </div>
              <div className="principle">
                <b>SHOW AND TELL</b>
                <p>Focused prototypes make difficult ideas tangible before the larger build.</p>
              </div>
              <div className="principle">
                <b>OWN THE OUTCOME</b>
                <p>Architecture, interaction, testing and launch are treated as one responsibility.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CLOSE ============ */}
        <section className="close" id="contact">
          <div className="sheet">
            <p className="section-no">07 / START A PROJECT</p>
            <h2>What do customers or staff need to ask before they can move forward?</h2>
            <p>Tell us that question, what you sell, and how the process works today. We&apos;ll tell you which tool answers it and what the first build would cost — usually a Prototype Sprint.</p>
            <div className="hero-actions">
              <a className="button solid" href="/contact">Discuss your project</a>
              <a className="button" href="/pricing">See the rates</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
