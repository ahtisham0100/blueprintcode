import type { Metadata } from 'next';
import './styles.css';
import MediaLauncher from '../../_chrome/MediaLauncher';
import { AMAZON_STORE_URL } from '@/lib/links';

export const metadata: Metadata = {
  title: 'PP-AV digital showroom — Blueprint Code AI case study',
  description:
    'How a specialist AV retailer was rebuilt as a digital showroom: five connected sales tools, real-time 3D configuration and international multi-channel commerce.',
  alternates: { canonical: 'https://blueprintcode.ai/ppav-case-study' },
  openGraph: {
    title: 'PP-AV digital showroom — Blueprint Code AI case study',
    description:
      'A specialist retailer, rebuilt as a digital showroom. Five connected tools, eight Amazon marketplaces, eBay Global.',
    type: 'website',
    url: 'https://blueprintcode.ai/ppav-case-study',
  },
};

export default function PpavCaseStudyPage() {
  return (
    <main id="main">
      <span id="top"></span>

      {/* ============ TITLE BLOCK ============ */}
      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>VENTURE</dt><dd>Phoenix Projectors AV — our own retail business</dd></div>
          <div className="row"><dt>SECTOR</dt><dd>Home cinema &amp; AV — specialist retail</dd></div>
          <div className="row"><dt>SCOPE</dt><dd>Professional Configurator Suite + Enterprise Commerce Core</dd></div>
          <div className="row"><dt>STATUS</dt><dd>Live and trading</dd></div>
        </dl>

        <h1>A specialist retailer, rebuilt as a digital showroom.</h1>

        <p className="standfirst">Five connected buying tools, live product logic and international multi-channel commerce — built to make complex home-cinema decisions feel clear.</p>

        <div className="dim">
          <div className="dim-rule"><span className="dim-label">ONE CONNECTED JOURNEY</span></div>
        </div>

        <div className="spec">
          <div><span className="fig">5</span><small>connected sales tools</small></div>
          <div><span className="fig">3D</span><small>real-time configuration</small></div>
          <div><span className="fig">8</span><small><a href={AMAZON_STORE_URL} target="_blank" rel="noopener">Amazon marketplaces</a></small></div>
          <div><span className="fig">1</span><small>eBay global storefront</small></div>
        </div>
      </div>

      {/* ============ 01 ============ */}
      <section id="system" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 01 — THE SYSTEM</p>
          <h2>One journey. Five specialist tools.</h2>
          <p>Each tool works on its own, but the Cinema Room Planner brings them together. Room data, product choices and commercial rules travel through the experience and come back as one system specification.</p>
        </div>

        <div className="index">
          <div className="tool"><span className="n">01</span><h3>Room Planner</h3><p>The master journey</p></div>
          <div className="tool"><span className="n">02</span><h3>Audio Designer</h3><p>Layout &amp; compatibility</p></div>
          <div className="tool"><span className="n">03</span><h3>Projector Selector</h3><p>Room-led matching</p></div>
          <div className="tool"><span className="n">04</span><h3>Screen Finder</h3><p>Material guidance</p></div>
          <div className="tool"><span className="n">05</span><h3>3D Cabinet</h3><p>Live visual configuration</p></div>
        </div>
      </section>

      {/* ============ 02 ============ */}
      <section id="action" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 02 — IN ACTION</p>
          <h2>Show the work moving.</h2>
          <p>Short, silent interface films let decision-makers understand the capability in seconds. Each can open into a longer narrated walkthrough without slowing the page.</p>
        </div>

        <div className="viewports">
          <div className="vp">
            <div className="media media--loop" data-title="Slot 1">
              <i></i><i></i><i></i><i></i>
              {/* POSTER (shown for reduced-motion users):
              <img src="/media/case-01.jpg" alt="Describe what the film shows"> */}
              {/* SILENT LOOP — playsinline stops iOS going fullscreen:
              <video src="/media/case-01.mp4" poster="/media/case-01.jpg"
                     muted loop autoplay playsinline preload="metadata"></video> */}
              <div className="media-launch"><em>AWAITING MEDIA</em><small>/media/case-01.mp4</small></div>
            </div>
            <h3>Cinema Room Planner</h3>
            <p>From room dimensions to a complete, purchasable cinema specification.</p>
          </div>
          <div className="vp">
            <div className="media media--loop" data-title="Slot 2">
              <i></i><i></i><i></i><i></i>
              {/* POSTER (shown for reduced-motion users):
              <img src="/media/case-02.jpg" alt="Describe what the film shows"> */}
              {/* SILENT LOOP — playsinline stops iOS going fullscreen:
              <video src="/media/case-02.mp4" poster="/media/case-02.jpg"
                     muted loop autoplay playsinline preload="metadata"></video> */}
              <div className="media-launch"><em>AWAITING MEDIA</em><small>/media/case-02.mp4</small></div>
            </div>
            <h3>3D Cabinet Configurator</h3>
            <p>Real-time options, visual feedback and price logic.</p>
          </div>
          <div className="vp">
            <div className="media media--loop" data-title="Slot 3">
              <i></i><i></i><i></i><i></i>
              {/* POSTER (shown for reduced-motion users):
              <img src="/media/case-03.jpg" alt="Describe what the film shows"> */}
              {/* SILENT LOOP — playsinline stops iOS going fullscreen:
              <video src="/media/case-03.mp4" poster="/media/case-03.jpg"
                     muted loop autoplay playsinline preload="metadata"></video> */}
              <div className="media-launch"><em>AWAITING MEDIA</em><small>/media/case-03.mp4</small></div>
            </div>
            <h3>Guided Product Selectors</h3>
            <p>Complex technical choice reduced to clear customer questions.</p>
          </div>
        </div>
      </section>

      {/* ============ 03 ============ */}
      <section id="channels" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 03 — CONNECTED COMMERCE</p>
          <h2>Built beyond a single storefront.</h2>
          <p>The platform supports PP-AV&apos;s direct specialist channel while extending the business across <a href={AMAZON_STORE_URL} target="_blank" rel="noopener">eight Amazon marketplaces</a> and eBay&apos;s global network.</p>
        </div>

        <div className="channels">
          <div className="ch">
            <span className="tag">DIRECT COMMERCE</span>
            <h3>PP-AV.com</h3>
            <p>The richest guided experience: specialist tools, complete systems and direct customer support.</p>
            <a href="https://pp-av.com">Visit PP-AV</a>
          </div>
          <div className="ch">
            <span className="tag">EIGHT MARKETPLACES</span>
            <h3>Amazon International</h3>
            <p>A dedicated Phoenix Projectors AV presence operating across eight Amazon marketplaces.</p>
            <a href={AMAZON_STORE_URL} target="_blank" rel="noopener">View Amazon store</a>
          </div>
          <div className="ch">
            <span className="tag">GLOBAL MARKETPLACE</span>
            <h3>eBay Global</h3>
            <p>An established international channel extending product discovery and customer reach worldwide.</p>
            <a href="https://www.ebay.co.uk/str/phoenixprojectorsav">View eBay store</a>
          </div>
        </div>
      </section>

      {/* ============ 04 ============ */}
      <section id="surface" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 04 — UNDER THE SURFACE</p>
          <h2>Built around commercial rules.</h2>
          <p>The visible interface is one layer. Product relationships, compatibility, pricing and ecommerce hand-off are what make the tools useful as sales infrastructure.</p>
        </div>

        <div className="cols">
          <div className="col">
            <span className="tag">CUSTOMER EXPERIENCE</span>
            <ul>
              <li>Responsive guided journeys</li>
              <li>Room-led product recommendations</li>
              <li>Interactive 3D visualisation</li>
              <li>Clear alternatives and compatibility guidance</li>
              <li>One complete system summary</li>
            </ul>
          </div>
          <div className="col">
            <span className="tag">COMMERCE ARCHITECTURE</span>
            <ul>
              <li>React and TypeScript interfaces</li>
              <li>Three.js real-time 3D</li>
              <li>Server-authoritative product pricing</li>
              <li>WooCommerce purchasing hand-off</li>
              <li>Structured for an AI advisory layer</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ 05 ============ */}
      <section id="capability" className="sheet">
        <div className="sec-head">
          <p className="sheet-no">SHEET 05 — PROVEN CAPABILITY</p>
          <h2>One live project. Two service levels.</h2>
          <p>PP-AV demonstrates both an advanced configurator programme and the wider commerce core needed to turn those tools into a connected international platform.</p>
        </div>

        <div className="levels">
          <div className="lvl">
            <span className="tag">BLUEPRINT CODE AI SERVICE</span>
            <h3>Professional Configurator Suite</h3>
            <p>Shown through five advanced customer-facing planning, selection and configuration tools.</p>
            <ul>
              <li>Product and compatibility rules</li>
              <li>Dynamic specification and pricing</li>
              <li>2D guidance and real-time 3D</li>
              <li>WooCommerce basket integration</li>
            </ul>
            <div className="band">TYPICAL PROJECT RANGE £15,000–£30,000</div>
          </div>
          <div className="lvl">
            <span className="tag">BLUEPRINT CODE AI SERVICE</span>
            <h3>Enterprise Commerce Core</h3>
            <p>Shown by the complete system connecting guided selling, direct ecommerce and international marketplace operations.</p>
            <ul>
              <li>Unified multi-tool customer journey</li>
              <li>Direct PP-AV commerce</li>
              <li><a href={AMAZON_STORE_URL} target="_blank" rel="noopener">Eight Amazon marketplaces</a> and eBay Global</li>
              <li>Multi-brand, trade and AI-ready architecture</li>
            </ul>
            <div className="band">PACKAGE FROM £45,000</div>
          </div>
        </div>
      </section>

      {/* ============ OUTCOME (inverted) ============ */}
      <div className="invert">
        <div className="sheet">
          <p className="sheet-no">THE OUTCOME</p>
          <h2>A digital retailer that behaves like a knowledgeable showroom.</h2>
          <p>A scalable commercial platform that helps customers explore confidently before they ever speak to a salesperson — and gives PP-AV an experience marketplaces cannot reproduce.</p>
          <p className="pull">PP-AV is not a concept showing what Blueprint Code AI could build. It is a live commerce business demonstrating what we have already built.</p>
        </div>
      </div>

      {/* ============ METHOD TRANSFERS ============ */}
      <section id="transfers">
        <div className="sheet">
          <p className="sheet-no">THE METHOD TRANSFERS</p>
          <h2>The industry changes. The method transfers.</h2>
          <p className="standfirst">Look at PP-AV and substitute your own industry. The same repeatable approach sits underneath — which is what makes this a method, not one lucky design.</p>

          <div className="transfer" role="list" aria-label="How the PP-AV method maps onto other industries">
            <div className="transfer-row" role="listitem"><span className="from">Home cinema</span><span className="arrow" aria-hidden="true">→</span><span className="to">Fitted furniture</span></div>
            <div className="transfer-row" role="listitem"><span className="from">Audio compatibility</span><span className="arrow" aria-hidden="true">→</span><span className="to">Industrial component compatibility</span></div>
            <div className="transfer-row" role="listitem"><span className="from">Projector selection</span><span className="arrow" aria-hidden="true">→</span><span className="to">Equipment selection</span></div>
            <div className="transfer-row" role="listitem"><span className="from">Screen configuration</span><span className="arrow" aria-hidden="true">→</span><span className="to">Made-to-order pricing</span></div>
            <div className="transfer-row" role="listitem"><span className="from">The complete cinema package</span><span className="arrow" aria-hidden="true">→</span><span className="to">Any multi-product solution</span></div>
          </div>

          <p className="pull">Whether the product is a cinema system, piece of furniture, sports kit, technical installation or made-to-order product, the challenge is often the same: help customers understand their options, make compatible choices and move confidently towards purchase.</p>
          <p className="transfer-note">That is where PP-AV stops being merely a home-cinema case study and becomes evidence that Blueprint Code AI&apos;s approach can be repeated commercially.</p>
        </div>
      </section>

      {/* ============ CLOSE ============ */}
      <section className="close sheet" id="contact">
        <p className="sheet-no">YOUR PRODUCT</p>
        <h2>Could your sales journey work like this?</h2>
        <p>Every build starts with a Prototype Sprint — one to four weeks, £625 to £3,000 + VAT, credited in full against the build.</p>
        <div className="ctas">
          <a className="btn solid" href="/contact">Discuss your project</a>
          <a className="btn" href="/prototypes">See three prototypes</a>
          <a className="btn" href="/standards-and-credentials">Standards &amp; credentials</a>
        </div>
      </section>

      <MediaLauncher />
    </main>
  );
}
