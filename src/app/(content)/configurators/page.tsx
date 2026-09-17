import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Configurators & commerce tools — Blueprint Code AI',
  description:
    'Guided selectors, specification builders, real-time 3D configurators and quote engines — built as commercial tools, not visual novelties. Worked examples from a live retail business.',
  alternates: { canonical: 'https://blueprintcode.ai/configurators' },
  openGraph: {
    title: 'Configurators & commerce tools — Blueprint Code AI',
    description:
      'Product logic wearing an interface. Six tool types, one connected system, proven on a trading business.',
    type: 'website',
    url: 'https://blueprintcode.ai/configurators',
  },
};

export default function ConfiguratorsPage() {
  return (
    <main id="main">
      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>DISCIPLINE</dt><dd>Interactive commerce tools</dd></div>
          <div className="row"><dt>TOOL TYPES</dt><dd>Six, combinable</dd></div>
          <div className="row"><dt>WORKED EXAMPLE</dt><dd>PP-AV — five connected tools, live</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>Product logic wearing an interface.</h1>
        <p className="standfirst">A configurator is not a 3D viewer with a price underneath. It&apos;s your product rules, your margin and your expertise, encoded once and then given away to every customer at the same quality — including the ones who arrive at eleven at night when nobody&apos;s answering the phone.</p>

        <table className="register">
          <caption>Tool register</caption>
          <thead>
            <tr><th scope="col">Ref</th><th scope="col">Tool type</th><th scope="col">What it decides</th><th scope="col">Live example</th></tr>
          </thead>
          <tbody>
            <tr><td>TT-01</td><td><a href="#tt-01">Guided selector</a></td><td>Which product, from a long catalogue</td><td>Projector Selector</td></tr>
            <tr><td>TT-02</td><td><a href="#tt-01">Specification builder</a></td><td>What a whole system should contain</td><td>Cinema &amp; Hi-Fi Planner</td></tr>
            <tr><td>TT-03</td><td><a href="#tt-01">Compatibility checker</a></td><td>Whether these things work together</td><td>Screen Finder</td></tr>
            <tr><td>TT-04</td><td><a href="#tt-01">Real-time 3D configurator</a></td><td>How the finished item will look</td><td>3D Cabinet Configurator</td></tr>
            <tr><td>TT-05</td><td><a href="#tt-01">Quote &amp; CPQ builder</a></td><td>What it costs, formally</td><td>Cinema specification output</td></tr>
            <tr><td>TT-06</td><td><a href="#tt-01">Advisory layer</a></td><td>What to do when the customer doesn&apos;t know</td><td>Audio Designer — &quot;guide me&quot;</td></tr>
          </tbody>
        </table>
      </div>

      {/* ============ 01 TOOL TYPES ============ */}
      <section id="tt-01">
        <div className="sheet">
          <p className="sheet-no">SHEET 01 — TOOL TYPES</p>
          <div className="two">
            <h2>Six shapes, mixed to fit the sale.</h2>
            <div>
              <p>Most businesses need two or three of these, not all six. Which ones depends entirely on where your customers currently get stuck — and that&apos;s usually obvious from the questions your sales team answers most often.</p>
              <p>Every example below is a tool we built for our own retail business and still operate today.</p>
            </div>
          </div>

          <div className="types">
            <div className="type">
              <span className="lbl">TT-01</span>
              <h3>Guided selector</h3>
              <p>Plain-English questions in, a short shortlist out, with the reason each item was chosen. For catalogues too large or too technical to browse.</p>
              <span className="eg">LIVE EXAMPLE<b>Projector Selector — matches to room, throw distance and light</b></span>
            </div>
            <div className="type">
              <span className="lbl">TT-02</span>
              <h3>Specification builder</h3>
              <p>Assembles a complete multi-item system rather than a single product. The customer leaves with a plan, not a basket of guesses.</p>
              <span className="eg">LIVE EXAMPLE<b>Cinema &amp; Hi-Fi Planner — room in, full specification out</b></span>
            </div>
            <div className="type">
              <span className="lbl">TT-03</span>
              <h3>Compatibility checker</h3>
              <p>Stops the wrong combination before it reaches checkout. Cheaper than the return, and considerably cheaper than the review.</p>
              <span className="eg">LIVE EXAMPLE<b>Screen Finder — material, gain and geometry against the room</b></span>
            </div>
            <div className="type">
              <span className="lbl">TT-04</span>
              <h3>Real-time 3D configurator</h3>
              <p>For products where finish and proportion carry the price. Live materials, live geometry, no render queue and no imagination required.</p>
              <span className="eg">LIVE EXAMPLE<b>3D Cabinet Configurator — finishes, sizes and options</b></span>
            </div>
            <div className="type">
              <span className="lbl">TT-05</span>
              <h3>Quote &amp; CPQ builder</h3>
              <p>Turns a configuration into a document a business can act on — priced, saved, shared, sent, and picked up again three weeks later.</p>
              <span className="eg">LIVE EXAMPLE<b>Cinema specification — save, email or buy outright</b></span>
            </div>
            <div className="type">
              <span className="lbl">TT-06</span>
              <h3>Advisory layer</h3>
              <p>The route for customers who can&apos;t answer the first question. Handles &quot;I don&apos;t know&quot; without dead-ending them or handing them to a form.</p>
              <span className="eg">LIVE EXAMPLE<b>Audio Designer — a dedicated &quot;guide me&quot; path</b></span>
            </div>
          </div>

          <p className="levels-note">Two of these have a dedicated guide: <a href="/configurators/3d-product-configurator-development">3D product configurator development</a> and <a href="/configurators/guided-selling-tools">guided selling &amp; product recommendation tools</a>.</p>
        </div>
      </section>

      {/* ============ 02 CONNECTED ============ */}
      <section id="connected">
        <div className="sheet">
          <p className="sheet-no">SHEET 02 — THE CONNECTED SYSTEM</p>
          <div className="two">
            <h2>The tools are the easy part. Connecting them isn&apos;t.</h2>
            <div>
              <p>Five separate tools that each ask the same six questions is five abandoned sessions. The architectural decision that makes the difference is storing the customer&apos;s answers once, in a shared profile, and letting every tool read from it.</p>
              <p>Each tool stays short. Collectively they behave like one system that remembers you.</p>
              <p className="pull">A room measured in the planner is still measured when the customer reaches the screen finder an hour later.</p>
            </div>
          </div>

          <div className="schematic">
            <span className="lbl">PP-AV — SCHEMATIC</span>
            <div className="spine"></div>
            <div className="sch-grid">
              <div className="node"><b>01</b>Room Planner</div>
              <div className="node"><b>02</b>Audio Designer</div>
              <div className="node"><b>03</b>Projector Selector</div>
              <div className="node"><b>04</b>Screen Finder</div>
              <div className="node"><b>05</b>3D Cabinet</div>
            </div>
            <div className="spine"></div>
            <div className="profile">
              <b>SHARED CUSTOMER PROFILE</b>
              <span>Room dimensions, seating, light, budget, layout, choices already made — written once, read by every tool.</span>
            </div>
            <div className="sch-out">
              <div className="node"><b>OUTPUT</b>One complete specification</div>
              <div className="node"><b>HAND-OFF</b>Basket, saved quote or enquiry</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 03 UNDER THE SURFACE ============ */}
      <section id="architecture">
        <div className="sheet">
          <p className="sheet-no">SHEET 03 — UNDER THE SURFACE</p>
          <div className="two">
            <h2>Where these projects usually fail.</h2>
            <div>
              <p>Rarely on the rendering. Almost always on the commercial rules — the combinations that can&apos;t be built, the discount that applies differently than anyone wrote down, the configuration that reaches the warehouse in a form nobody can pick.</p>
              <p>One real example: a volume discount that counts units rather than distinct products. Trivial to state, easy to implement backwards, and wrong in a way that only shows up in the margin report months later.</p>
            </div>
          </div>

          <div className="cols">
            <div className="col">
              <span className="lbl">CUSTOMER-FACING</span>
              <ul className="ticks">
                <li>Responsive guided journeys, built mobile-first</li>
                <li>Live visual feedback as options change</li>
                <li>Alternatives offered when something won&apos;t work</li>
                <li>Save, share and return to a configuration</li>
                <li>One readable summary at the end</li>
              </ul>
            </div>
            <div className="col">
              <span className="lbl">COMMERCE ARCHITECTURE</span>
              <ul className="ticks">
                <li>Pricing authority on the server, never in the browser</li>
                <li>Product and compatibility rules held as data, not code</li>
                <li>WooCommerce, Shopify or API hand-off to checkout</li>
                <li>Configurations that reach fulfilment in a pickable form</li>
                <li>Structured so an AI advisory layer can be added later</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 04 LEVELS ============ */}
      <section id="levels">
        <div className="sheet">
          <p className="sheet-no">SHEET 04 — BUILD LEVELS</p>
          <div className="two">
            <h2>Three levels, priced in public.</h2>
            <p>Scope and price are fixed against a written technical specification at kick-off. Full rates, add-ons and retainers sit on the schedule.</p>
          </div>
          <div className="levels">
            <div className="level">
              <span className="num">01 / CFG</span>
              <h3>Foundation configurator</h3>
              <p>One product family. Options, rules, live preview, dynamic pricing and lead capture.</p>
              <span className="from">£2,500 — £7,500</span>
            </div>
            <div className="level">
              <span className="num">02 / PRO</span>
              <h3>Professional suite</h3>
              <p>Multiple tools, conditional logic, quotes and PDFs, CRM and ecommerce integration, trade pricing.</p>
              <span className="from">£7,500 — £30,000</span>
            </div>
            <div className="level">
              <span className="num">03 / DXS</span>
              <h3>Enterprise digital showroom</h3>
              <p>Connected tools, shared profile, CPQ, ERP and API integration, AR, multi-brand and multi-language.</p>
              <span className="from">FROM £35,000</span>
            </div>
          </div>
          <p className="levels-note">Every configurator build starts with a Prototype Sprint. Optional add-ons — AR, trade portal, AI recommendations, cinematic rendering — are listed on the <a href="/pricing">schedule of rates</a>.</p>
        </div>
      </section>

      {/* ============ SPRINT (inverted) ============ */}
      <div className="invert" id="sprint">
        <div className="sheet">
          <p className="sheet-no">HOW EVERY BUILD STARTS</p>
          <div className="sprint-head">
            <h2>Prototype Sprint.</h2>
            <p>Before committing to a full build, we create a working prototype of your product in one to four weeks—something real in a browser, not a slide deck.</p>
          </div>
          <table className="sprint-table">
            <thead><tr><th>Sprint</th><th>Price</th><th>What this level of work would normally cost</th></tr></thead>
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
            <a className="button" href="/prototypes">See three we&apos;ve built</a>
            <a className="button" href="/contact">Book a sprint</a>
          </div>
        </div>
      </div>

      {/* ============ CLOSE ============ */}
      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">START HERE</p>
          <h2>What question does your sales team answer most often?</h2>
          <p>That question is usually the tool. Send it to us, along with the product and how you currently sell it, and we&apos;ll tell you which of the six shapes above fits — and whether you need one or three.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Discuss a configurator</a>
            <a className="button" href="/ppav-case-study">Read the PP-AV case study</a>
          </div>
        </div>
      </section>
    </main>
  );
}
