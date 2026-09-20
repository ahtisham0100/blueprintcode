import type { Metadata } from 'next';
import Image from 'next/image';
import './styles.css';
import { AMAZON_STORE_URL } from '@/lib/links';

export const metadata: Metadata = {
  title: 'About Blueprint Code AI — configurator developers, UK',
  description:
    'Blueprint Code AI builds the sales tools its founder needed. Born inside a real home-cinema retail business, not invented as a service category.',
  alternates: { canonical: 'https://blueprintcode.ai/about' },
  openGraph: {
    title: 'About Blueprint Code AI — configurator developers, UK',
    description:
      'We approached this as a business owner who needed better sales tools, not as an agency inventing a service category from theory.',
    type: 'website',
    url: 'https://blueprintcode.ai/about',
  },
};

export default function AboutPage() {
  return (
    <main id="main">
      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>ORIGIN</dt><dd>Built inside a trading retail business</dd></div>
          <div className="row"><dt>DIRECTION</dt><dd>UK — Monmouthshire</dd></div>
          <div className="row"><dt>TEAM</dt><dd>Commercial, engineering, design, specialist 3D</dd></div>
          <div className="row"><dt>ISSUE</dt><dd>2026</dd></div>
        </dl>

        <h1>We built these tools because we needed them first.</h1>
        <p className="standfirst">Blueprint Code AI didn&apos;t start as an agency looking for a niche. It started with a retailer who couldn&apos;t sell his own products properly using a normal website, and had to build something better.</p>
      </div>

      {/* ============ 01 ============ */}
      <section id="why">
        <div className="sheet">
          <p className="sheet-no">SHEET 01 — WHY BLUEPRINT CODE AI EXISTS</p>
          <div className="two">
            <h2>A problem we had before it was a service we sold.</h2>
            <div>
              <p>In 2020 our founder started Phoenix Projectors AV from nothing — home cinema, which is about as far from a simple product page as retail gets. A projector is not a decision anyone makes from a photograph and a spec table.</p>
              <p>Customers arrived with the same questions every time. Will this screen suit my room? Will this amplifier drive my speakers? Will that projector throw far enough at four metres? Every one of those was a phone call, a hand-written quote, an evening spent measuring someone else&apos;s living room by proxy. The sales that were lost were the ones nobody had time to answer.</p>
              <p>Agencies quoted for websites. Good websites, in fairness. None of them would build the thing that actually answered the questions, because that thing isn&apos;t a website — it&apos;s product logic wearing an interface.</p>
              <p>So we built it ourselves. Then we built the next one. Blueprint Code AI is that capability offered to other businesses with the same wound.</p>
              <p className="pull">We came at this as a business owner who needed better sales tools, not as an agency inventing a service category from theory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 02 ============ */}
      <section id="ppav">
        <div className="sheet">
          <p className="sheet-no">SHEET 02 — WHAT PP-AV TAUGHT US</p>
          <div className="two">
            <h2>Six years of running the business we now build for.</h2>
            <div>
              <p>Phoenix Projectors AV has traded since 2020. It sells direct, across <a href={AMAZON_STORE_URL} target="_blank" rel="noopener">eight Amazon marketplaces</a> and on eBay&apos;s global network. It deals with factories, freight, returns, VAT, marketplace policy and customers who describe a room in terms no specification sheet uses.</p>
              <p>That matters more than it sounds. Most configurator projects fail on commercial rules, not on rendering. Which options genuinely can&apos;t be combined. What happens to margin when a customer picks the expensive finish. How a configured item reaches a warehouse in a form somebody can actually pick and pack.</p>
              <p>We know because we&apos;ve got it wrong in our own business and paid for it. One of our tools exists specifically because a customer once received the wrong screen, and we wanted a structural fix rather than a promise to be more careful.</p>
            </div>
          </div>
          <div className="facts">
            <div><span className="lbl">TRADING SINCE</span><b>2020</b></div>
            <div><span className="lbl">CONNECTED TOOLS BUILT</span><b>5</b></div>
            <div><span className="lbl">MARKETPLACES OPERATED</span><b><a href={AMAZON_STORE_URL} target="_blank" rel="noopener">8</a></b></div>
            <div><span className="lbl">STATUS</span><b>STILL TRADING</b></div>
          </div>
        </div>
      </section>

      {/* ============ 03 ============ */}
      <section id="team">
        <div className="sheet">
          <p className="sheet-no">SHEET 03 — THE TEAM</p>
          <div className="two">
            <h2>Small, named and accountable.</h2>
            <p>Three people own this work. You will speak to the person doing it, not to a layer of account management placed between you and the build.</p>
          </div>
          <div className="team">
            <div className="member" id="james-michaelson">
              <Image
                className="headshot"
                src="/james.jpeg"
                alt="James Michaelson"
                width={640}
                height={640}
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <span className="lbl">01</span>
              <h3>James Michaelson</h3>
              <p className="role">Founder &amp; Solutions Architect</p>
              <p>Founder of Phoenix Projectors AV and of Blueprint Code AI. Sets the product logic, pricing rules and the commercial argument each tool has to win.</p>
              <span className="owns">OWNS<b>Scope, product logic, commercial rules, client relationship</b></span>
            </div>
            <div className="member" id="muhammad-ahtisham-arif">
              <Image
                className="headshot"
                src="/muhammad-ahtisham.jpeg"
                alt="Muhammad Ahtisham Arif"
                width={640}
                height={640}
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <span className="lbl">02</span>
              <h3>Muhammad Ahtisham Arif</h3>
              <p className="role">Engineering &amp; platform</p>
              <p>Architecture, integrations and the parts that have to keep working after launch — pricing authority, data hand-off, deployment.</p>
              <span className="owns">OWNS<b>Architecture, integrations, performance, deployment</b></span>
            </div>
            <div className="member">
              <Image
                className="headshot"
                src="/Parv-jain.png"
                alt="Parv Jain"
                width={640}
                height={640}
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <span className="lbl">03</span>
              <h3>Parv Jain</h3>
              <p className="role">Lead Designer</p>
              <p>Interface, interaction and the visual system. Makes a complicated decision feel like a short one without hiding what the customer is choosing.</p>
              <span className="owns">OWNS<b>Interface, interaction, design system, accessibility</b></span>
            </div>
          </div>
          <div className="support">
            <div>
              <span className="lbl">SPECIALIST 3D SUPPORT</span>
              <h3>Modelling, brought in by name.</h3>
            </div>
            <div>
              <p>Bespoke 3D assets are produced with specialist modelling partners we&apos;ve worked with before. Everything around them stays in-house: the architecture, the configuration logic, the real-time implementation and the interface. We tell you which parts are ours and which aren&apos;t, before you sign anything.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 04 ============ */}
      <section id="method">
        <div className="sheet">
          <p className="sheet-no">SHEET 04 — HOW THE THREE MEET</p>
          <div className="two">
            <h2>Commercial logic first. Always.</h2>
            <p>Most studios start with the interface and retrofit the rules. That&apos;s why so many configurators look impressive and sell nothing.</p>
          </div>
          <div className="disc">
            <div>
              <span className="step">FIRST</span>
              <h3>Commercial logic</h3>
              <p>What can be combined, what it costs, what margin it carries, what the business can actually make and ship. Written down before a pixel is drawn.</p>
            </div>
            <div>
              <span className="step">THEN</span>
              <h3>UX</h3>
              <p>The shortest honest path from a customer&apos;s rough intention to a specification they trust. Fewer questions, better questions.</p>
            </div>
            <div>
              <span className="step">THEN</span>
              <h3>Engineering</h3>
              <p>Making it fast, correct and durable — with pricing authority on the server, never in the browser.</p>
            </div>
          </div>
          <p className="disc-note">In practice these overlap constantly. The order matters because it decides what gets sacrificed when something has to give — and what gives should never be the commercial truth of the thing.</p>
        </div>
      </section>

      {/* ============ 05 ============ */}
      <section id="working">
        <div className="sheet">
          <p className="sheet-no">SHEET 05 — HOW WE WORK WITH YOU</p>
          <div className="two">
            <h2>UK-led, distributed, reachable.</h2>
            <p>Direction and commercial responsibility sit in the UK. Engineering is distributed, which is how a team this size delivers at this pace.</p>
          </div>
          <div className="work-grid">
            <div>
              <span className="lbl">AVAILABILITY</span>
              <ul className="ticks">
                <li>UK business hours, with overlap into US mornings</li>
                <li>A named person, not a shared inbox</li>
                <li>Same-day acknowledgement on anything urgent</li>
                <li>Scheduled calls rather than surprise ones</li>
              </ul>
            </div>
            <div>
              <span className="lbl">COMMUNICATION</span>
              <ul className="ticks">
                <li>A written update every week, whether or not there&apos;s good news</li>
                <li>A working link you can open at any point in the build</li>
                <li>Decisions recorded where you can find them later</li>
                <li>Scope changes priced before they happen, not after</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 06 ============ */}
      <section id="principles">
        <div className="sheet">
          <p className="sheet-no">SHEET 06 — PRINCIPLES</p>
          <div className="two">
            <h2>Four things we don&apos;t trade away.</h2>
            <p>These are the commitments we&apos;d want from a supplier, so they&apos;re the ones we make.</p>
          </div>
          <div className="principles">
            <div className="principle">
              <span className="n">01</span>
              <h3>Clarity</h3>
              <p>Plain language in proposals, updates and interfaces. If an explanation needs jargon to survive, the thinking underneath it isn&apos;t finished.</p>
            </div>
            <div className="principle">
              <span className="n">02</span>
              <h3>Evidence</h3>
              <p>Claims come with something you can open. A prototype beats a mockup, a mockup beats a promise, and none of them beat a tool already trading.</p>
            </div>
            <div className="principle">
              <span className="n">03</span>
              <h3>Ownership</h3>
              <p>Architecture, interaction, testing and launch are one responsibility. We don&apos;t hand you a build and describe the remaining problems as integration.</p>
            </div>
            <div className="principle">
              <span className="n">04</span>
              <h3>Honest scope</h3>
              <p>A fixed quote against a written specification. If we think your budget buys the wrong thing, we say so before you spend it — including when that costs us the work.</p>
            </div>
          </div>

          <div className="band">
            <div>
              <h3>The cheapest way to test all of this.</h3>
              <p>A Prototype Sprint is one to four weeks and £625 to £3,000 + VAT, credited in full against the build. You&apos;ll know how we work long before you&apos;re committed to anything.</p>
            </div>
            <a className="button" href="/prototypes">See the prototypes</a>
          </div>
        </div>
      </section>

      {/* ============ CLOSE ============ */}
      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">MEET THE TEAM</p>
          <h2>Talk to the people who&apos;d build it.</h2>
          <p>Half an hour, no pitch deck. Bring the product and the sales problem, and we&apos;ll tell you honestly whether this is something we&apos;re the right team for.</p>
          <div className="actions">
            <a className="button solid" href="/contact">Arrange a call</a>
            <a className="button" href="/ppav-case-study">Read the case study first</a>
          </div>
        </div>
      </section>
    </main>
  );
}
