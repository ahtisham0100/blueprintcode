import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import './styles.css';
import { DemoViewerProvider, DemoTrigger } from '../../_demo-viewer/DemoViewer';

export const metadata: Metadata = {
  title: 'Prototype register — Blueprint Code AI',
  description:
    'Four working prototypes: a made-to-order shorts builder, a charm bracelet builder, a commerce operations suite and an engine fit architecture.',
  alternates: { canonical: 'https://blueprintcode.ai/prototypes' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Prototype register — Blueprint Code AI',
    description:
      'Working prototypes you can try. Each one solved the hardest part of a brief before anything else was built.',
    type: 'website',
    url: 'https://blueprintcode.ai/prototypes',
  },
};

export default function PrototypesPage() {
  return (
    <DemoViewerProvider>
    <main id="main">
      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>DOCUMENT</dt><dd>Prototype register</dd></div>
          <div className="row"><dt>ENTRIES</dt><dd>Four, all working</dd></div>
          <div className="row"><dt>ORIGIN</dt><dd>Each built as a Prototype Sprint</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Prototypes you can actually use.</h1>
        <p className="standfirst">Every one of these started the same way — a fixed-price sprint aimed at the hardest part of the brief, built before anyone committed to a production system. Try them. That&apos;s what they&apos;re for.</p>

        <table className="register">
          <caption>Drawing register</caption>
          <thead>
            <tr>
              <th scope="col">Ref</th>
              <th scope="col">Prototype</th>
              <th scope="col">Sector</th>
              <th scope="col">Sprint band</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>PROTO-01</td><td><a href="#proto-01">Made-to-order fight shorts</a></td><td>Sports &amp; fight equipment</td><td>£2,000</td></tr>
            <tr><td>PROTO-02</td><td><a href="#proto-02">Charm bracelet builder</a></td><td>Jewellery &amp; personalised goods</td><td>£2,000</td></tr>
            <tr><td>PROTO-03</td><td><a href="#proto-03">Commerce operations suite</a></td><td>Luxury food &amp; drink ecommerce</td><td>£2,000</td></tr>
            <tr><td>PROTO-04</td><td><a href="#proto-04">Engine fit architecture</a></td><td>Marine &amp; powered equipment</td><td>£625</td></tr>
          </tbody>
        </table>
      </div>

      {/* ============ PROTO-01 ============ */}
      <section id="proto-01">
        <div className="sheet">
          <p className="sheet-no">PROTO-01 — SPORTS &amp; FIGHT EQUIPMENT</p>
          <h2>Made-to-order fight shorts.</h2>
          <p className="entry-intro">A made-to-order garment is sold on its finish, and a flat preview is the one thing that cannot show finish. The customer is asked to pay a premium for a difference nobody has let them see.</p>

          <div className="entry">
            <DemoTrigger
              className="viewport"
              item={{ title: 'Made-to-order fight shorts', ref: 'BPC · PROTO-01', iframeSrc: '/premium-muay-thai-customiser' }}
            >
              <div className="vp-frame"><i></i><i></i><i></i><i></i><span>OPEN PROTOTYPE →</span></div>
              <div className="vp-caption"><span>PRE-RENDERED CGI</span><span>SINGLE FILE</span></div>
            </DemoTrigger>
            <div className="entry-copy">
              <h3>What it proves</h3>
              <p>That premium product presentation does not need a real-time engine — only the right frames, and a configurator built around them.</p>
              <ul className="ticks">
                <li>Front, rear and a detail zoom on every finish, not one hero angle</li>
                <li>Six rendered finish combinations, switched with no load between them</li>
                <li>Full size run, with personalisation priced as it is added</li>
                <li>Pre-rendered assets, so nothing compiles or downloads in the browser</li>
                <li>Ends at a Shopify line-item payload — the selection leaves as an order line</li>
              </ul>
              <div className="meta">
                <div><span className="lbl">TECHNIQUE</span><b>PRE-RENDERED CGI</b></div>
                <div><span className="lbl">BUILD TIME</span><b>3 WEEKS</b></div>
                <div><span className="lbl">HARDEST PART</span><b>MATERIAL FIDELITY</b></div>
                <div><span className="lbl">SPRINT BAND</span><b>£2,000</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROTO-02 ============ */}
      <section id="proto-02">
        <div className="sheet">
          <p className="sheet-no">PROTO-02 — JEWELLERY &amp; PERSONALISED GOODS</p>
          <h2>Charm bracelet builder.</h2>
          <p className="entry-intro">A customisable piece has more combinations than a catalogue can photograph. The customer is asked to imagine the thing they&apos;re paying for, which is exactly when they close the tab.</p>

          <div className="entry flip">
            <DemoTrigger
              className="viewport"
              item={{ title: 'Charm bracelet builder', ref: 'BPC · PROTO-02', iframeSrc: '/bracelet-configurator-baked' }}
            >
              <div className="vp-frame"><i></i><i></i><i></i><i></i><span>OPEN PROTOTYPE →</span></div>
              <div className="vp-caption"><span>DRAG &amp; DROP</span><span>SINGLE FILE</span></div>
            </DemoTrigger>
            <div className="entry-copy">
              <h3>What it proves</h3>
              <p>That a personalised product can be assembled by hand, on a phone, and still load instantly.</p>
              <ul className="ticks">
                <li>Drag to rearrange charms along the chain, tap to select</li>
                <li>Pre-rendered assets, so there is no 3D download to wait for</li>
                <li>Live price as pieces are added and removed</li>
                <li>Ships as a single self-contained file — no build step, no framework</li>
                <li>The finished arrangement is what gets ordered, not an approximation</li>
              </ul>
              <div className="meta">
                <div><span className="lbl">TECHNIQUE</span><b>BAKED ASSETS / HTML</b></div>
                <div><span className="lbl">BUILD TIME</span><b>3 WEEKS</b></div>
                <div><span className="lbl">HARDEST PART</span><b>CHAIN ALIGNMENT</b></div>
                <div><span className="lbl">SPRINT BAND</span><b>£2,000</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROTO-03 ============ */}
      <section id="proto-03">
        <div className="sheet">
          <p className="sheet-no">PROTO-03 — LUXURY FOOD &amp; DRINK ECOMMERCE</p>
          <h2>Commerce operations suite.</h2>
          <p className="entry-intro">The data a small ecommerce team needs already exists. It just arrives as exports, one question at a time, long after the moment the answer was useful.</p>

          <div className="entry">
            <DemoTrigger
              className="viewport"
              item={{ title: 'Commerce operations suite', ref: 'BPC · PROTO-03', iframeSrc: '/maison-cacao-demo-suite' }}
            >
              <div className="vp-frame"><i></i><i></i><i></i><i></i><span>OPEN PROTOTYPE →</span></div>
              <div className="vp-caption"><span>THREE CONNECTED TOOLS</span><span>NO 3D REQUIRED</span></div>
            </DemoTrigger>
            <div className="entry-copy">
              <h3>What it proves</h3>
              <p>That a team can be using a working internal tool inside a sprint, before anyone commits to an integration.</p>
              <ul className="ticks">
                <li>Three connected consoles — trading overview, order queue, customer segments</li>
                <li>Filters and controls work against realistic sample data, not screenshots</li>
                <li>The order queue surfaces only what needs a human decision</li>
                <li>Segments derived from buying behaviour rather than manual tags</li>
                <li>Built to be pointed at the live store without redesigning the interface</li>
              </ul>
              <div className="meta">
                <div><span className="lbl">TECHNIQUE</span><b>SAMPLE-DATA CONSOLES</b></div>
                <div><span className="lbl">BUILD TIME</span><b>3 WEEKS</b></div>
                <div><span className="lbl">HARDEST PART</span><b>SEGMENT RULES</b></div>
                <div><span className="lbl">SPRINT BAND</span><b>£2,000</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROTO-04 ============ */}
      <section id="proto-04">
        <div className="sheet">
          <p className="sheet-no">PROTO-04 — MARINE &amp; POWERED EQUIPMENT</p>
          <h2>Engine fit architecture.</h2>
          <p className="entry-intro">Ten engine families, sixty-three purchasable configurations, and every one of them competing with the others for the same search result. The buyer only ever wanted to know which engine fits their boat.</p>

          <div className="entry flip">
            <DemoTrigger
              className="viewport"
              item={{ title: 'Engine fit architecture', ref: 'BPC · PROTO-04', iframeSrc: '/demos/Marine-Engine-Fit-Architecture-Demo.html' }}
            >
              <div className="vp-frame"><i></i><i></i><i></i><i></i><span>OPEN PROTOTYPE →</span></div>
              <div className="vp-caption"><span>CATALOGUE ARCHITECTURE</span><span>NO 3D REQUIRED</span></div>
            </DemoTrigger>
            <div className="entry-copy">
              <h3>What it proves</h3>
              <p>That the catalogue structure decision can be settled before the store is built, by making it clickable instead of arguing it on a call.</p>
              <ul className="ticks">
                <li>A guided finder that starts with the boat, not the engine</li>
                <li>Ten indexable family pages carry the content; sixty-three variations carry price and stock</li>
                <li>A compatibility key, so parts filter by the engine the buyer actually owns</li>
                <li>One-way dealer sync with the writable fields fixed in code, not in a settings screen</li>
                <li>Crated freight and parcel rated separately, presented as one delivery total</li>
              </ul>
              <div className="meta">
                <div><span className="lbl">TECHNIQUE</span><b>WOOCOMMERCE MODEL</b></div>
                <div><span className="lbl">BUILD TIME</span><b>1 WEEK</b></div>
                <div><span className="lbl">HARDEST PART</span><b>FAMILY / VARIATION SPLIT</b></div>
                <div><span className="lbl">SPRINT BAND</span><b>£625</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SPRINT (inverted) ============ */}
      <div className="invert" id="sprint">
        <div className="sheet">
          <p className="sheet-no">HOW EACH ONE STARTED</p>
          <div className="sprint-head">
            <h2>Prototype Sprint.</h2>
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
                <li>Technical feasibility notes and recommended architecture</li>
                <li>Fixed quote for the full build</li>
              </ul>
            </div>
            <div className="sprint-col">
              <h4>HOW IT WORKS</h4>
              <p>We recommend the appropriate Sprint based on the complexity of the intended production system. If you proceed within 90 days, your Sprint fee is credited in full against the agreed build price.</p>
              <p className="band-note">Final build pricing depends on product logic, visual assets, integrations, commercial outputs and the level of production refinement required. Plus VAT.</p>
              <span className="strip">PROVE IT BEFORE WE BUILD IT</span>
            </div>
          </div>
          <div className="actions">
            <a className="button" href="/contact">Book a sprint</a>
            <a className="button" href="/pricing">See the full rates</a>
          </div>
        </div>
      </div>

      {/* ============ CLOSE ============ */}
      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">YOUR PRODUCT</p>
          <h2>Which part of your product is hardest to explain?</h2>
          <p>That&apos;s the part worth prototyping first. Send us the product, the current sales process and the questions customers keep asking, and we&apos;ll tell you what the sprint should cover.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Discuss a prototype</a>
            <a className="button" href="/ppav-case-study">See a prototype that became a platform</a>
          </div>
        </div>
      </section>
    </main>
    </DemoViewerProvider>
  );
}
