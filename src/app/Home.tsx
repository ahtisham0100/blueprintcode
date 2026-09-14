'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { initBlueprintRoll } from './blueprintRoll';

/** Inline CSS custom property (typed for JSX style props). */
const accent = (c: string): CSSProperties => ({ ['--accent']: c } as CSSProperties);

export default function Home() {
  // Drive the blueprint-roll page-turn once the section is in the DOM.
  useEffect(() => initBlueprintRoll(), []);

  return (
    <div className="bp-root">
      {/* Header and footer are the global site chrome (src/app/_chrome), rendered
          by the root layout. The homepage keeps only its blueprint-roll body. */}

      {/* ============ BLUEPRINT-ROLL HOMEPAGE CONTENT ============ */}
      <main id="main" className="brc">
        <span id="top" />

        {/* ============ HERO ============ */}
        <section className="hero" style={{ borderTop: 0 }}>
          <div className="sheet">
            <div className="titlebar">
              <span>Sheet 00 / Company overview</span>
              <span>Discipline: Interactive commerce</span>
              <span>Status: Operational</span>
            </div>
            <div className="hero-grid">
              <div>
                <span className="lbl">CONFIGURATORS / COMMERCE / AI</span>
                <h1>We make complex products easier to buy.</h1>
                <p className="lead">Blueprint Code builds product configurators, recommendation engines and connected ecommerce systems for businesses whose products can&apos;t be explained by a standard product page.</p>
                <div className="hero-actions">
                  <a className="button solid" href="#sprint">Start with a prototype</a>
                  <a className="button" href="#work">View our work</a>
                </div>
              </div>
              <aside className="hero-side">
                <b>DESIGNED FROM THE COMMERCIAL PROBLEM OUT.</b>
                <p>We combine product logic, UX, real-time 3D, ecommerce and AI into tools customers can understand and businesses can operate.</p>
              </aside>
            </div>
            <div className="datum">
              <div><span className="lbl">LEAD CAPABILITY</span><b>CONFIGURATORS</b></div>
              <div><span className="lbl">LIVE SYSTEM</span><b>5 CONNECTED TOOLS</b></div>
              <div><span className="lbl">COMMERCE REACH</span><b>8 AMAZON MARKETS</b></div>
              <div><span className="lbl">DELIVERY</span><b>UK + GLOBAL</b></div>
            </div>
          </div>
        </section>

        {/* ============ 01 CONFIGURATORS ============ */}
        <section id="configurators">
          <div className="sheet">
            <p className="section-no">01 / PRIMARY EXPERTISE</p>
            <div className="roll-intro">
              <h2>Product configurators built to sell.</h2>
              <p>Turn product complexity into a clear customer journey. From a focused option builder to a complete digital showroom, the interface is only the visible layer. Scroll through the blueprint to see the commercial systems underneath.</p>
            </div>
            <div className="roll-track" id="blueprint-roll">
              <div className="roll-stage">
                <article className="roll-sheet" style={accent('#69aef5')}>
                  <div className="roll-copy"><span className="lbl">3D / SHEET 01</span><h3>2D and real-time 3D visualisation</h3><p>Material and finish switching customers can trust. Physically based surfaces behave differently under the same light, run directly in the browser and fall back gracefully where WebGL is unavailable.</p><a className="roll-link" href="#work">See a live build →</a><div className="chips"><span className="chip">three.js</span><span className="chip">PBR</span></div></div>
                  <div className="roll-demo"><div className="demo-head"><span>LASER TV CABINET · FINISH</span><b>GRAPHITE</b></div><div className="demo-ui cabinet-scene"><div className="cabinet" /></div><div className="chips"><span className="chip">Walnut</span><span className="chip">Matte black</span><span className="chip">White gloss</span><span className="chip">Oak</span><span className="chip">Graphite</span></div></div>
                </article>
                <article className="roll-sheet" style={accent('#58d8b2')}>
                  <div className="roll-copy"><span className="lbl">RULES / SHEET 02</span><h3>Compatibility and recommendation logic</h3><p>Every option knows what it can and cannot sit next to. Invalid choices grey out with a reason instead of failing at checkout, and the basket only becomes available when the build is sound.</p><a className="roll-link" href="#work">See a live build →</a><div className="chips"><span className="chip">rule engine</span></div></div>
                  <div className="roll-demo"><div className="demo-head"><span>PROJECTOR + SCREEN + ROOM</span><b>3 OF 3 VALID</b></div><div className="demo-ui"><div className="select-grid"><div className="field"><span>Projector</span><div className="fake-select">Ultra-short-throw laser TV</div></div><div className="field"><span>Screen material</span><div className="fake-select">ALR — UST (lenticular)</div></div><div className="field"><span>Room light</span><div className="fake-select">Living room, curtains</div></div><div className="field"><span>Rule check</span><div className="fake-select">All checks passed</div></div></div><p className="valid">Valid build. This pairing is right for the room.</p></div><div className="basket"><b>Add to basket</b><span>£4,289 · 2 items</span></div></div>
                </article>
                <article className="roll-sheet" style={accent('#d99a39')}>
                  <div className="roll-copy"><span className="lbl">PRICE / SHEET 03</span><h3>Dynamic pricing and specification</h3><p>Live totals, quotes and specification sheets change with the options. Price is computed from the configuration rather than looked up from a list, while the technical specification rewrites itself alongside it.</p><a className="roll-link" href="#work">See a live build →</a><div className="chips"><span className="chip">quote PDF</span><span className="chip">spec sheet</span></div></div>
                  <div className="roll-demo"><div className="demo-head"><span>CUSTOM PROJECTION SCREEN</span><b>INC. VAT, EX. DELIVERY</b></div><div className="demo-ui price-ui"><div className="options"><div className="option-row">Diagonal <b>120&quot;</b></div><div className="option-row">Aspect ratio <b>16:9</b></div><div className="option-row">Material <b>Matte white</b></div><div className="option-row">Mounting <b>Fixed frame</b></div></div><div className="quote"><span className="lbl">TOTAL</span><strong>£2,089</strong><div className="spec"><span>Viewable</span><b>2657 × 1494 mm</b><span>Diagonal</span><b>120&quot; (305 cm)</b><span>Frame</span><b>80 mm velvet</b><span>Weight</span><b>21.8 kg</b></div></div></div></div>
                </article>
                <article className="roll-sheet" style={accent('#b898ff')}>
                  <div className="roll-copy"><span className="lbl">CONNECT / SHEET 04</span><h3>WooCommerce, Shopify and CRM integration</h3><p>A finished configuration becomes structured commerce data: a detailed line item for a shop, or a qualified deal with the complete specification attached for a sales team.</p><a className="roll-link" href="#work">See a live build →</a><div className="chips"><span className="chip">REST</span><span className="chip">webhooks</span></div></div>
                  <div className="roll-demo"><div className="demo-head"><span>WHERE THE CONFIGURATION GOES</span><b>CHECKOUT</b></div><div className="demo-ui"><div className="flow"><div className="node"><span className="lbl">CONFIGURATOR</span><b>Cabinet · 2.0 m · Walnut</b></div><div className="line" /><div className="targets"><div className="node">WooCommerce item created</div><div className="node">Shopify attributes set</div><div className="node">CRM deal ready</div></div></div></div></div>
                </article>
                <article className="roll-sheet" style={accent('#ff91c5')}>
                  <div className="roll-copy"><span className="lbl">AI / SHEET 05</span><h3>AI-assisted product guidance</h3><p>Plain-English questions become valid configurations. The assistant stays bound to the rule engine, so it cannot recommend a combination the business would not actually sell.</p><a className="roll-link" href="#work">See a live build →</a><div className="chips"><span className="chip">rule-bound</span></div></div>
                  <div className="roll-demo"><div className="demo-head"><span>ASK ABOUT A ROOM</span><b>SCRIPTED DEMO</b></div><div className="demo-ui ai-grid"><div className="prompts"><div className="prompt active">Bright lounge, 4 m wide, big window opposite the sofa.</div><div className="prompt">Dedicated cinema room, blackout, biggest screen for 5 m.</div><div className="answer">Daylight rules out a matte white screen. A UST laser TV with a Fresnel ALR surface rejects light from the window and ceiling.</div></div><div className="recommend"><span className="lbl">RECOMMENDATION</span><div><span>Projector</span><b>UST laser TV</b></div><div><span>Screen</span><b>Fresnel ALR</b></div><div><span>Size</span><b>120&quot; 16:9</b></div><div><span>Estimate</span><b>≈ £4,690</b></div></div></div></div>
                </article>
              </div>
              <div className="roll-controls"><div className="roll-arrows"><button className="roll-arrow" id="roll-prev" type="button" aria-label="Previous blueprint sheet">←</button><button className="roll-arrow" id="roll-next" type="button" aria-label="Next blueprint sheet">→</button></div><span className="roll-progress" id="roll-progress">SHEET 01 / 05</span><span className="roll-hint">AUTO TURN / 10 SECONDS</span></div>
              <div className="roll-timer" aria-hidden="true" />
            </div>
            <a className="button" href="#contact">Discuss a configurator</a>
          </div>
        </section>

        {/* ============ 02 PROTOTYPE SPRINT (inverted) ============ */}
        <div className="invert" id="sprint">
          <div className="sheet">
            <p className="section-no">STEP 00 — START HERE</p>
            <div className="sprint-head">
              <h2 className="sprint-title">Prototype Sprint — £625 to £3,000 + VAT</h2>
              <p>Before anyone commits to a £7,500+ build, we build a working prototype of your product in one to four weeks. Something real in a browser, not a slide deck. The fee is credited in full against any configurator tier below if you proceed within 90 days.</p>
            </div>
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
                <h4>WHICH PRICE</h4>
                <ul>
                  <li>£625 — one week</li>
                  <li>£1,125 — two weeks</li>
                  <li>£2,000 — three weeks</li>
                  <li>£3,000 — four weeks</li>
                </ul>
                <p className="sprint-note">Plus VAT. We recommend the band on a free consultation, and show you screenshots of the approach before you commit to anything.</p>
                <span className="strip">DE-RISKS THE DECISION FOR YOU AND THE SCOPE FOR US</span>
              </div>
            </div>
          </div>
        </div>

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
                <p>Five connected tools returning one complete buying plan.</p>
                <a className="status" href="/ppav-case-study">Read case study</a>
              </article>
              <article className="project">
                <span className="n">02</span>
                <h3>Mirrored elevator cabin</h3>
                <p>True planar reflection, moving doors and environment-aware 3D.</p>
                <span className="status">DEMO ON REQUEST</span>
              </article>
              <article className="project">
                <span className="n">03</span>
                <h3>Modular dock builder</h3>
                <p>Grid-based layout, accessories, validation and quote generation.</p>
                <span className="status">DEMO ON REQUEST</span>
              </article>
              <article className="project">
                <span className="n">04</span>
                <h3>Personalised product builder</h3>
                <p>Drag-and-drop product customisation with anchored components.</p>
                <span className="status">DEMO ON REQUEST</span>
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
                  <li><a href={'https://www.amazon.co.uk/stores/PhoenixScreens%E2%80%94byPP-AV/page/6E75E02A-C32F-448E-8B42-7F9A9F8BF683?lp_asin=B0HDTZS2LM&ref_=ast_bln'} target="_blank" rel="noopener">Eight Amazon marketplaces</a></li>
                  <li>eBay Global</li>
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
              <p className="section-copy">Three configurator levels, each a step up in logic and integration. Scope and price are fixed against a written technical specification at kick-off.</p>
            </div>
            <div className="levels">
              <div className="level">
                <span className="num">01 / CFG</span>
                <h3>Foundation configurator</h3>
                <p>Focused options, rules, live preview and lead capture.</p>
                <span className="from">FROM £7,500</span>
              </div>
              <div className="level">
                <span className="num">02 / PRO</span>
                <h3>Professional configurator suite</h3>
                <p>Advanced logic, dynamic pricing, integrations and ecommerce.</p>
                <span className="from">£15,000 — £30,000</span>
              </div>
              <div className="level">
                <span className="num">03 / DXS</span>
                <h3>Enterprise digital showroom</h3>
                <p>Multiple tools, 3D, guided commerce and intelligent assistance.</p>
                <span className="from">FROM £35,000</span>
              </div>
              <div className="level other">
                <span className="num">SEPARATE LADDER</span>
                <h3>Commerce infrastructure</h3>
                <p>Websites, stores, multi-channel and enterprise commerce. Tier 1 to Tier 4, sold alongside or without a configurator.</p>
                <span className="from"><a href="/pricing">£5,000 — £120,000+ / SEE SCHEDULE</a></span>
              </div>
            </div>
            <p className="ladder-note">Every configurator build starts with a Prototype Sprint. Full published rates, add-ons and retainers are on the <a href="/pricing">schedule of rates</a>.</p>
          </div>
        </section>

        {/* ============ 06 ABOUT ============ */}
        <section id="about">
          <div className="sheet">
            <p className="section-no">06 / BLUEPRINT CODE</p>
            <div className="section-grid">
              <h2>Built by people who understand the sale.</h2>
              <p className="section-copy">Blueprint Code brings together commercial product thinking, software engineering, UX design and specialist 3D capability. We work from the buying problem outward, not from a fashionable technology inward.</p>
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
            <h2>What is your product making customers work too hard to understand?</h2>
            <p>Send us the product, the current sales process and the decisions customers find difficult. We&apos;ll identify the right first build — usually a Prototype Sprint.</p>
            <div className="hero-actions">
              <a className="button solid" href="mailto:james@blueprintcode.ai?subject=Blueprint Code project">Discuss your project</a>
              <a className="button" href="/pricing">See the rates</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
