'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/* Field-notes index + slide-in reading panel. Ports the original inline reader
   script to React: clicking an index entry opens its article in a fixed panel,
   the URL hash tracks the open note (back/forward and deep links work), and
   Escape or the scrim closes it. */

interface Note {
  slug: string;
  ref: string; // shown in the index (e.g. "INS-001")
  refB: string; // second line in the index (e.g. "COST & SCOPE")
  bar: string; // panel bar label (e.g. "INS-001 / COST & SCOPE")
  title: string;
  desc: string;
  content: ReactNode; // the .panel-head + article body + .panel-foot
}

const NOTES: Note[] = [
  {
    slug: 'configurator-cost',
    ref: 'INS-001',
    refB: 'COST & SCOPE',
    bar: 'INS-001 / COST & SCOPE',
    title: 'What does a product configurator cost in 2026?',
    desc: 'Realistic price bands, the variables that move them, and how to avoid paying production money before the difficult idea is proven.',
    content: (
      <>
        <div className="panel-head">
          <span className="lbl">INS-001 · COST &amp; SCOPE · 3 MIN READ</span>
          <h2>What does a product configurator cost in 2026?</h2>
        </div>
        <p className="intro">In 2026, a credible custom product configurator can begin at around <strong>£7,500</strong>, while a professional commercial system commonly sits between <strong>£15,000 and £30,000</strong>. A multi-tool digital showroom can start from <strong>£35,000</strong> and rise substantially when it includes complex 3D, enterprise integrations, dealer portals or custom commerce infrastructure.</p>
        <p>Those bands are more useful than a suspiciously precise quotation made before anyone has mapped the product rules. Two configurators that look similar in a screenshot can require completely different amounts of work underneath.</p>
        <h2>The four practical price levels</h2>
        <div className="table-wrap"><table><thead><tr><th>Level</th><th>Typical scope</th><th>Indicative price</th></tr></thead><tbody><tr><td>Prototype Sprint</td><td>One difficult interaction or product idea, working in a browser</td><td>£625–£3,000</td></tr><tr><td>Foundation Configurator</td><td>Focused options, rules, live preview and lead capture</td><td>From £7,500</td></tr><tr><td>Professional Suite</td><td>Advanced logic, pricing, ecommerce and business integrations</td><td>£15,000–£30,000</td></tr><tr><td>Enterprise Digital Showroom</td><td>Multiple connected tools, 3D, accounts, data and guided commerce</td><td>From £35,000</td></tr></tbody></table></div>
        <p>These are custom-development ranges rather than plugin licence prices. An off-the-shelf app may be enough for simple colour, text or image choices. Custom development becomes valuable when the product has genuine dependencies, unusual visuals, quoting requirements or a sales process that standard software cannot express.</p>
        <h2>What actually changes the price?</h2>
        <h3>1. product logic</h3>
        <p>A configurator with ten independent colour choices is relatively straightforward. A configurator where material changes affect dimensions, available accessories, manufacturing rules, delivery method and price is not.</p>
        <p>The important number is rarely the number of options. It is the number of <strong>relationships between options</strong>.</p>
        <h3>2. visual method</h3>
        <p>Static images, layered renders and real-time 3D each solve different problems. Image-based configuration is efficient when the camera angle is fixed and the customer mainly needs to compare finishes. Real-time 3D becomes worthwhile when shape, layout, viewpoint or spatial understanding affects the sale.</p>
        <h3>3. pricing and quoting</h3>
        <p>A displayed starting price is simple. A server-authoritative calculation involving dimensions, components, customer type, quantity, tax, shipping and discount bands needs careful architecture and testing.</p>
        <h3>4. integrations</h3>
        <p>The tool may need to create a WooCommerce or Shopify basket, push a qualified lead into a CRM, generate a PDF specification, request freight pricing or retrieve live product data. Every integration adds value, but also adds failure states and responsibility.</p>
        <h3>5. product data</h3>
        <p>Clean, structured data can reduce build time. Inconsistent spreadsheets, undocumented exceptions and missing assets move work from development into product discovery and data preparation.</p>
        <h3>6. administration</h3>
        <p>If staff need to add products, adjust rules or upload materials without a developer, an administration layer must be designed as carefully as the customer interface.</p>
        <blockquote>The expensive part is not drawing a configurator screen. It is making the answer commercially correct every time.</blockquote>
        <h2>Why start with a paid prototype?</h2>
        <p>A prototype should prove the part carrying the most uncertainty: perhaps a mirrored 3D surface, a modular placement system, an unusual pricing rule or the interaction between many product choices.</p>
        <p>Blueprint Code’s Prototype Sprint is priced by its length rather than by technique: <strong><a href="/pricing">£625 for one week</a></strong>, £1,125 for two, £2,000 for three and <strong>£3,000 for four</strong>, plus VAT. It runs for one to four weeks and is credited in full against the main configurator build when the project proceeds within the agreed period.</p>
        <p>This gives both sides evidence before a larger commitment. It also produces something useful for internal approval, investment discussions or testing with customers.</p>
        <h2>Common costing mistakes</h2>
        <ul><li><strong>Pricing from screens alone:</strong> the visible steps reveal little about the logic underneath.</li><li><strong>Treating every option as independent:</strong> compatibility rules are often where the real project sits.</li><li><strong>Leaving product data until development:</strong> unresolved data questions become expensive technical interruptions.</li><li><strong>Assuming the prototype is production code:</strong> a proof can validate direction without yet covering security, analytics, accessibility or every edge case.</li><li><strong>Ignoring operation after launch:</strong> products, prices and integrations change.</li></ul>
        <h2>What should a serious quotation include?</h2>
        <p>Expect a written definition of the customer journey, product rules, visual method, integrations, deliverables, exclusions, testing responsibility, deployment and support. A range is appropriate during discovery; a fixed figure only becomes meaningful when the boundaries are understood.</p>
        <div className="note"><span className="data">Planning note</span>Prepare a representative product set, existing pricing logic, a list of known exceptions and examples of the final output your sales team needs. That will improve any estimate more than a longer feature wish list.</div>
        <h2>The short answer</h2>
        <p>Budget <strong>from £7,500</strong> for a focused custom configurator, <strong>£15,000–£30,000</strong> for a professional commercial suite and <strong>£35,000+</strong> for a connected digital showroom. Prove the difficult part first, and do not choose 3D unless it materially improves the customer’s decision.</p>
        <div className="panel-foot">
          <a className="button" href="/pricing">See the rates</a>
          <a className="button" href="/prototypes">See the prototypes</a>
        </div>
      </>
    ),
  },
  {
    slug: '2d-vs-3d',
    ref: 'INS-002',
    refB: 'VISUAL METHOD',
    bar: 'INS-002 / VISUAL METHOD',
    title: '2D vs 3D product configurators',
    desc: 'When images and rules are enough, when real-time 3D earns its cost, and how to choose without buying technology for its own sake.',
    content: (
      <>
        <div className="panel-head">
          <span className="lbl">INS-002 · VISUAL METHOD · 3 MIN READ</span>
          <h2>2D vs 3D product configurators</h2>
        </div>
        <p className="intro">Use 2D or layered imagery when customers need to compare colours, finishes, text or components from a controlled viewpoint. Use real-time 3D when they need to understand shape, proportion, spatial arrangement or the product from multiple angles.</p>
        <p>The decision should follow the buying problem. Starting with technology often creates an expensive experience that looks impressive but does not improve the sale.</p>
        <h2>What counts as a 2d configurator?</h2>
        <p>A 2D configurator can change photographs, rendered layers, SVG components or interface diagrams as customers choose options. It can still contain sophisticated compatibility logic, pricing and ecommerce integration. “2D” describes the visual method, not the intelligence of the system.</p>
        <p>It works particularly well for personalised prints, apparel details, front-facing furniture finishes, screen specifications, packaging, jewellery layouts and products whose important choices can be understood from one or two prepared views.</p>
        <h2>What real-time 3d adds</h2>
        <p>A 3D configurator renders a model in the browser and allows the interface to change its geometry, material, components, camera or environment. Customers can usually rotate, zoom and inspect the configured object.</p>
        <p>It becomes commercially useful for modular structures, architectural interiors, configurable furniture, machinery, vehicles and products where size or spatial relationship is difficult to communicate through static images.</p>
        <div className="table-wrap"><table><thead><tr><th>Question</th><th>2D / image-based</th><th>Real-time 3D</th></tr></thead><tbody><tr><td>Fixed viewing angle sufficient?</td><td>Usually ideal</td><td>Often unnecessary</td></tr><tr><td>Shape changes materially?</td><td>Possible with prepared assets</td><td>Strong fit</td></tr><tr><td>Customer must inspect all sides?</td><td>Requires multiple images</td><td>Natural interaction</td></tr><tr><td>Asset production</td><td>Images or layered renders</td><td>Optimised 3D models and materials</td></tr><tr><td>Device demands</td><td>Generally lighter</td><td>Requires performance planning</td></tr><tr><td>Prototype starting point</td><td>From £625</td><td>From £625</td></tr></tbody></table></div>
        <h2>When 2d is the better commercial decision</h2>
        <ul><li>The customer views the product mainly from one angle.</li><li>Changes are surface-level rather than structural.</li><li>Excellent photography or renders already exist.</li><li>Fast loading on lower-powered devices matters more than free camera movement.</li><li>The main value lies in rules, recommendations or pricing.</li><li>The budget should prioritise ecommerce integration over 3D assets.</li></ul>
        <p>A well-designed 2D configurator will outperform weak 3D if it answers the buying question faster.</p>
        <h2>When 3d earns its place</h2>
        <ul><li>Dimensions or geometry change with the configuration.</li><li>Customers need to understand how modules connect.</li><li>Material response—reflection, texture or finish—is part of the buying decision.</li><li>The object needs to be inspected from several angles.</li><li>Placement within a room or environment matters.</li><li>The visual experience itself supports a premium brand position.</li></ul>
        <p>Our <a href="/prototypes">mirrored elevator-cabin prototype</a> is a good example. The technical uncertainty was not a list of finishes; it was whether a browser-based cabin could produce convincing planar reflections of the external environment. That question required 3D.</p>
        <h2>The hybrid option</h2>
        <p>Many of the strongest systems combine methods. A real-time 3D product may use 2D diagrams for measurements. A guided selector may use photography until the final configuration opens in 3D. Mobile users may receive a lighter presentation while desktop customers see the full scene.</p>
        <p>Hybrid architecture lets each stage use the clearest and most efficient representation.</p>
        <blockquote>Choose the visual method by asking what the customer cannot confidently understand today.</blockquote>
        <h2>Do not forget the invisible layer</h2>
        <p>Whether the view is 2D or 3D, a commercial configurator still needs to handle:</p>
        <ul><li>Available and unavailable combinations</li><li>Pricing and discounts</li><li>Product codes and configuration data</li><li>Basket, quote or CRM hand-off</li><li>Saved configurations</li><li>Accessibility and mobile use</li><li>Analytics and operational updates</li></ul>
        <p>A beautiful model with unreliable commercial output is a visual demo, not a production sales system.</p>
        <h2>How to decide with minimal risk</h2>
        <ol><li>Write down the specific uncertainty preventing the purchase.</li><li>Identify the minimum visual method capable of resolving it.</li><li>Test the hardest interaction with representative product data.</li><li>Review it on the actual devices customers use.</li><li>Only then scope the production integrations and full catalogue.</li></ol>
        <div className="note"><span className="data">Prototype bands</span>A Blueprint Code <a href="/configurators">Prototype Sprint</a> is priced by its length, not by whether it is 2D or 3D: £625 for one week, £1,125 for two, £2,000 for three and £3,000 for four, plus VAT. All are credited against the main build when it proceeds within the agreed period.</div>
        <h2>The short answer</h2>
        <p>Use 2D when the buying decision is mostly about options, information and controlled visual comparison. Use 3D when customers must understand changing form, space or material behaviour. When uncertain, prototype the same critical decision in the simplest credible form before commissioning the larger system.</p>
        <div className="panel-foot">
          <a className="button" href="/pricing">See the rates</a>
          <a className="button" href="/prototypes">See the prototypes</a>
        </div>
      </>
    ),
  },
  {
    slug: 'digital-showroom',
    ref: 'INS-003',
    refB: 'STRATEGY',
    bar: 'INS-003 / STRATEGY',
    title: 'Why complex products need a digital showroom',
    desc: 'A product page displays information. A digital showroom turns uncertainty into a guided, commercially useful buying journey.',
    content: (
      <>
        <div className="panel-head">
          <span className="lbl">INS-003 · STRATEGY · 3 MIN READ</span>
          <h2>Why complex products need a digital showroom</h2>
        </div>
        <p className="intro">A product page presents a product. A digital showroom helps a customer work out what they need, what works together and what they should do next.</p>
        <p>That difference matters when the catalogue contains technical dependencies, configurable dimensions, unfamiliar terminology or several products that must form one working system.</p>
        <h2>The product-page assumption</h2>
        <p>Most ecommerce templates are built around a familiar sequence: title, images, description, variants, price and add-to-basket. That works when the customer knows which product they want and only needs confidence in the seller.</p>
        <p>It becomes less effective when the customer is asking:</p>
        <ul><li>Which model suits my room or application?</li><li>Will these components work together?</li><li>Which material solves my particular problem?</li><li>What size or quantity do I need?</li><li>What will the complete system cost?</li><li>What happens if I choose the wrong option?</li></ul>
        <p>Adding more specification tables rarely resolves that uncertainty. It can simply transfer the work from the business to the customer.</p>
        <h2>What a digital showroom does</h2>
        <p>A digital showroom combines content, product logic and interactive tools into a guided commercial journey. It may include:</p>
        <ul><li>A room or application planner</li><li>A guided product selector</li><li>A compatibility checker</li><li>A 2D or 3D configurator</li><li>A price or specification calculator</li><li>Alternative recommendations</li><li>A saved project or formal quotation</li><li>An AI advisory layer grounded in the customer’s configuration</li></ul>
        <p>The purpose is not to recreate a physical shop visually. It is to recreate its most valuable behaviour: understanding the customer’s circumstances and reducing the risk of a poor decision.</p>
        <h2>The pp-av example</h2>
        <p>PP-AV sells home-cinema equipment, where purchases depend on room dimensions, viewing habits, light conditions, speaker layouts, projector capability and product compatibility.</p>
        <p>Instead of relying only on category and product pages, we developed <a href="/ppav-case-study">five connected tools</a>:</p>
        <ol><li><strong>Cinema Room Planner</strong> — the master journey for room and system information.</li><li><strong>Audio System Designer</strong> — speaker layout, electronics and compatibility.</li><li><strong>Projector Selector</strong> — recommendation based on room and usage.</li><li><strong>Screen Finder</strong> — material and screen guidance.</li><li><strong>3D Cabinet Configurator</strong> — live visual configuration for laser-TV furniture.</li></ol>
        <p>Each tool can help independently. Together, they behave like a knowledgeable showroom and return the customer to one commercial plan.</p>
        <blockquote>A digital showroom should not trap the customer in a funnel. It should preserve their decisions while letting them move naturally between specialist questions.</blockquote>
        <h2>Where the commercial value comes from</h2>
        <h3>Better-qualified customers</h3>
        <p>A customer who completes a planner or configurator has expressed needs in structured form. Even when they do not purchase immediately, the resulting enquiry is more useful than “please send me more information.”</p>
        <h3>Larger, more coherent orders</h3>
        <p>When the website explains the whole system, customers can understand why complementary items belong together rather than evaluating each basket line in isolation.</p>
        <h3>Less repetitive support</h3>
        <p>Common presales questions become part of the guided journey, allowing human experts to focus on exceptions and valuable conversations.</p>
        <h3>Ownable differentiation</h3>
        <p>Competitors can copy a discount or product description. Reproducing connected logic, data and interactive experience is much harder.</p>
        <h3>Structured data for future ai</h3>
        <p>Once customer inputs and commercial rules are structured, an AI assistant can explain recommendations, flag conflicts and answer questions using actual project context rather than generic chat.</p>
        <h2>When a digital showroom is not necessary</h2>
        <p>It may be excessive when products are simple, low-consideration and easily compared; when the catalogue is too small to create real confusion; or when the business has not documented its own product rules.</p>
        <p>In those cases, clearer product pages, filtering or a focused calculator may solve the problem more efficiently.</p>
        <h2>How to start</h2>
        <ol><li>List the questions your sales team answers repeatedly.</li><li>Identify the choices most likely to cause returns, abandonment or hesitation.</li><li>Map the minimum information needed to make a safe recommendation.</li><li>Choose one difficult interaction to prototype.</li><li>Connect additional tools only when the shared data genuinely improves the journey.</li></ol>
        <div className="note"><span className="data">Architecture principle</span>The master system should own shared customer and project data. Specialist tools can then receive what they need and return their decisions without forcing the customer to start again.</div>
        <h2>The short answer</h2>
        <p>Complex products need a digital showroom when buying successfully requires guidance, calculation or compatibility—not merely information. Begin with the most expensive point of customer uncertainty, prove that interaction, and expand into a connected platform only where the commercial case supports it.</p>
        <div className="panel-foot">
          <a className="button" href="/pricing">See the rates</a>
          <a className="button" href="/prototypes">See the prototypes</a>
        </div>
      </>
    ),
  },
  {
    slug: 'ppav-growth',
    ref: 'INS-004',
    refB: 'OPERATOR NOTE',
    bar: 'INS-004 / OPERATOR NOTE',
    title: 'From an eBay account to a multi-market retailer',
    desc: 'Six lessons from growing PP-AV into an international commerce operation with five connected sales tools.',
    content: (
      <>
        <div className="panel-head">
          <span className="lbl">INS-004 · OPERATOR NOTE · 3 MIN READ</span>
          <h2>From an eBay account to a multi-market retailer</h2>
        </div>
        <p className="intro">PP-AV is Blueprint Code’s in-house commerce venture—not a client commission or a portfolio demonstration. That distinction matters because we experience the operational consequences of the systems we design.</p>
        <p>The business began with approximately £3,000 of working capital and an established eBay account. Over six years it developed into a multi-market specialist retailer operating through its own ecommerce platform, eight Amazon marketplaces and eBay Global, with approximately £50,000 in stock and five connected planning and configuration tools.</p>
        <p>The result is useful evidence, but the lessons behind it are more valuable.</p>
        <h2>1. capital efficiency shapes better systems</h2>
        <p>When capital is limited, the business cannot solve every problem by buying inventory or adding staff. It has to become selective about stock, suppliers, channels and automation.</p>
        <p>PP-AV increasingly uses direct supplier shipping where appropriate and avoids tying cash up in products without a clear route to sale. The technology follows the same discipline: build tools that remove an identifiable commercial constraint rather than adding features for appearance.</p>
        <blockquote>Limited capital is not an excuse for limited ambition. It forces the operating model and the software to justify themselves.</blockquote>
        <h2>2. marketplaces provide reach, but not differentiation</h2>
        <p>eBay and Amazon can provide access to customers who would never discover a specialist independent website first. They also impose fees, listing structures, price visibility and platform rules that the seller does not control.</p>
        <p>The direct platform therefore needs to offer something marketplaces cannot reproduce. For PP-AV, that became specialist guidance, connected planning and configurable systems rather than another catalogue presenting the same products.</p>
        <p>The useful strategy is not “marketplace or own site.” Each channel performs a different commercial job.</p>
        <h2>3. complex products need guidance before persuasion</h2>
        <p>Home-cinema customers can hesitate because the decision itself is difficult. More promotional copy does not solve uncertainty about room size, screen material, projector suitability or audio compatibility.</p>
        <p>We built guided tools because the business needed them:</p>
        <ul><li>Cinema Room Planner</li><li>Audio System Designer</li><li>Projector Selector</li><li>Screen Finder</li><li>3D Cabinet Configurator</li></ul>
        <p>This changed the website from a passive product catalogue into a digital showroom capable of helping customers form a coherent specification.</p>
        <h2>4. the basket is part of the product experience</h2>
        <p>A configured system should not disintegrate into unrelated product lines at the final step. The basket needs to retain configuration metadata and communicate that the customer has built one considered solution.</p>
        <p>For made-to-order and configurable products, the order record must also preserve the specification clearly enough for fulfilment, support and later reference. The hand-off from configurator to ecommerce is not a technical footnote; it determines whether the experience is commercially usable.</p>
        <h2>5. connected tools become more valuable than isolated tools</h2>
        <p>A projector selector can recommend a projector. A screen finder can recommend a material. A room planner can record dimensions. Their larger value appears when the same customer does not need to repeat information and each decision informs the next.</p>
        <p>The Cinema Room Planner acts as the master journey while specialist tools receive relevant context and return their results. That architecture supports a future advisory layer capable of explaining recommendations and detecting conflicts across the complete system.</p>
        <div className="note"><span className="data">System lesson</span>Do not combine every decision into one enormous interface. Preserve one source of shared project data while allowing specialist tools to remain focused.</div>
        <h2>6. operating after launch changes how you build</h2>
        <p>Products change. Supplier feeds are imperfect. Prices move. Marketplaces introduce new restrictions. Customers use tools in ways the designer did not predict.</p>
        <p>Owning PP-AV means Blueprint Code cannot regard deployment as the finish line. We have to maintain product logic, diagnose failures, improve mobile journeys and consider what staff need to operate the system over time.</p>
        <p>That experience affects our client work. We ask earlier questions about administration, error states, data ownership, pricing authority and support because we have lived with the alternative.</p>
        <h2>What the numbers do—and do not—prove</h2>
        <div className="table-wrap"><table><thead><tr><th>Starting point</th><th>Current operation</th></tr></thead><tbody><tr><td>Approximately £3,000 working capital</td><td>Approximately £50,000 in stock</td></tr><tr><td>Established eBay account</td><td>Own platform, eight Amazon marketplaces and eBay Global</td></tr><tr><td>Marketplace-led selling</td><td>Connected digital showroom</td></tr><tr><td>Conventional product discovery</td><td>Five customer-facing planning and configuration tools</td></tr></tbody></table></div>
        <p>The growth does not mean every decision was perfect, or that software alone created the business. It demonstrates something narrower and more useful: commercial experience, capital discipline and technical capability have been applied together in a live operation over six years.</p>
        <h2>The lesson we carry into blueprint code</h2>
        <p>We do not build ecommerce systems from the position of an outside observer. We understand product data, pricing, margins, customer acquisition, marketplace operations, integrations and the commercial consequences of technical decisions.</p>
        <p>For clients selling complex products, that means the conversation begins with how the customer buys and how the business operates—not with a predetermined framework or fashionable interface.</p>
        <div className="panel-foot">
          <a className="button" href="/pricing">See the rates</a>
          <a className="button" href="/prototypes">See the prototypes</a>
        </div>
      </>
    ),
  },
];

export default function Reader() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const lastEntry = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const active = NOTES.find((n) => n.slug === openSlug) ?? null;

  const open = useCallback((slug: string, push: boolean) => {
    if (!NOTES.some((n) => n.slug === slug)) return;
    setOpenSlug(slug);
    if (push) history.pushState({ slug }, '', '#' + slug);
  }, []);

  const close = useCallback((push: boolean) => {
    setOpenSlug(null);
    if (push) history.pushState({}, '', location.pathname);
    lastEntry.current?.focus();
  }, []);

  // Reflect open state on <body>, move focus into/out of the panel, reset scroll.
  useEffect(() => {
    document.body.classList.toggle('reading', openSlug !== null);
    if (openSlug !== null) {
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      closeBtn.current?.focus();
    }
    return () => {
      document.body.classList.remove('reading');
    };
  }, [openSlug]);

  // Escape to close, hash-driven navigation (back/forward + deep link on load).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.body.classList.contains('reading')) close(true);
    };
    const onPop = () => {
      const s = location.hash.replace('#', '');
      if (s) open(s, false);
      else close(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    if (location.hash) open(location.hash.replace('#', ''), false);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [open, close]);

  return (
    <>
      <section id="index">
        <div className="sheet">
          <p className="sheet-no">INDEX — 4 ENTRIES</p>
          <div className="insights-index">
            {NOTES.map((n) => (
              <button
                key={n.slug}
                className="entry"
                data-slug={n.slug}
                onClick={(e) => {
                  lastEntry.current = e.currentTarget;
                  open(n.slug, true);
                }}
              >
                <span className="ref">{n.ref}<b>{n.refB}</b></span>
                <span>
                  <h3>{n.title}</h3>
                  <p>{n.desc}</p>
                </span>
                <span className="go">3 MIN READ →</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        className="scrim"
        onClick={() => close(true)}
        aria-hidden="true"
      />
      <div
        className="panel"
        id="reader"
        role="dialog"
        aria-modal="true"
        aria-label={active?.title}
        {...(active ? { 'data-open': '' } : {})}
      >
        <div className="panel-bar">
          <span id="reader-ref">{active ? active.bar : 'FIELD NOTE'}</span>
          <button
            className="panel-close"
            type="button"
            ref={closeBtn}
            onClick={() => close(true)}
          >
            Close
          </button>
        </div>
        <div className="panel-body" ref={bodyRef}>
          {active && <div className="inner">{active.content}</div>}
        </div>
      </div>
    </>
  );
}
