import type { Metadata } from 'next';
import Image from 'next/image';
import { OG_DEFAULTS } from '@/lib/seo';
import HomeMotion from './_home/HomeMotion';
import './home.css';

/* Homepage — "Intelligence before execution". Built from the homepage design
   file (bpc-new-homepage) as a server component: no client JS, the global
   header/footer come from the (site) layout. Every style is scoped under
   .bpc-home in home.css so nothing leaks into the chrome or other routes.

   The former homepage (configurators, Prototype Sprint, selected work) is now
   the BPC Tools overview at /tools, linked from the Studios section below.

   Motion: the hero rises on load (CSS only); everything below carries .reveal
   and is lifted into view by HomeMotion as it scrolls in. --d staggers the
   delay inside a group. Hover states live in home.css; the Medusa ecosystem
   diagram takes an ember glow on hover. */

const TITLE = 'Blueprint Code AI — Intelligence Before Execution';
const DESCRIPTION = 'BPC builds intelligence layers that sit upstream of established execution systems.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://blueprintcode.ai/' },
  openGraph: {
    ...OG_DEFAULTS,
    title: TITLE,
    description: 'We architect systems that decide what deserves action — before the software that executes it takes over.',
    type: 'website',
    url: 'https://blueprintcode.ai/',
  },
};

export default function HomePage() {
  return (
    <main id="main" className="bpc-home">
      <HomeMotion />
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="wrap">
          <div className="kicker hero-anim">Blueprint Code AI</div>
          <h1 className="hero-anim" style={{ '--d': '.1s' } as React.CSSProperties}>Intelligence before execution.</h1>
          <div className="hero-copy hero-anim" style={{ '--d': '.25s' } as React.CSSProperties}>
            <strong>BPC builds intelligence layers that sit upstream of established execution systems.</strong>
          </div>
          <div className="hero-sub hero-anim" style={{ '--d': '.35s' } as React.CSSProperties}>
            We architect systems that decide what deserves action — before the software that executes it takes over.
          </div>
          <div className="actions hero-anim" style={{ '--d': '.45s' } as React.CSSProperties}>
            <a className="btn primary" href="#system">Explore the system →</a>
            <a className="btn secondary" href="#products">See what we build</a>
          </div>
          <div className="hero-note hero-anim" style={{ '--d': '.6s' } as React.CSSProperties}>
            <span>Solutions Architecture</span>
            <span>Intelligence Systems</span>
            <span>Venture Creation</span>
          </div>
        </div>
      </section>

      {/* ============ UNDERSTAND / JUDGE / ACT ============ */}
      <section>
        <div className="wrap">
          <p className="quote reveal">
            We do not replace the systems businesses already use. We make them more intelligent before the work reaches them.
          </p>
          <div className="flow">
            <div className="stage bpc reveal">
              <div className="n">01 / Intelligence</div>
              <h3>Understand</h3>
              <p>Define what matters, search broadly, gather evidence and recognise the situations worth acting on.</p>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="stage bpc reveal" style={{ '--d': '.12s' } as React.CSSProperties}>
              <div className="n">02 / Decision</div>
              <h3>Judge</h3>
              <p>Qualify, verify, rank and decide what deserves to move into the operational workflow.</p>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="stage reveal" style={{ '--d': '.24s' } as React.CSSProperties}>
              <div className="n">03 / Execution</div>
              <h3>Act</h3>
              <p>CRM. Outreach. Procurement. Recruitment. Workflow. Existing platforms do what they already do well.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ THE SHARED ARCHITECTURE ============ */}
      <section id="system">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">The shared architecture</div>
            <div>
              <h2>One foundation. Multiple specialist systems.</h2>
              <p className="lead">
                Behind each BPC product sits the same principle: intelligence, coordination and trust remain reusable even when the market changes.
              </p>
            </div>
          </div>
          <div className="pillars">
            <article className="pillar reveal">
              <div className="function">Intelligence · Evidence · Learning</div>
              <div className="name">M.<span>O</span>.M.</div>
              <p>The reusable intelligence foundation. It captures judgement, learns from outcomes and carries useful capability forward.</p>
            </article>
            <article className="pillar reveal" style={{ '--d': '.12s' } as React.CSSProperties}>
              <div className="function">Orchestration · Governance · Coordination</div>
              <div className="name">Z.<span>E</span>.U.S.</div>
              <p>The control layer. It coordinates how systems use shared capability, permissions, rules and resources.</p>
            </article>
            <article className="pillar reveal" style={{ '--d': '.24s' } as React.CSSProperties}>
              <div className="function">Verification · Challenge · Protection</div>
              <div className="name">CERBERUS</div>
              <p>The trust layer. It challenges evidence, detects contradictions and raises the bar when the decision matters more.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTS ============ */}
      <section id="products">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">The first child</div>
            <div>
              <h2>Specialist products built on a shared intelligence model.</h2>
              <p className="lead">
                Each product sits upstream of a different execution system, answering the decision that must be made before action begins.
              </p>
            </div>
          </div>
          {/* Medusa Heads — the ecosystem diagram (public/Medusa Heads
              Intelligence Ecosystem.png) replaces the former product card. The
              caption keeps the product's one-line question and summary as
              text, so the page still says what the diagram shows. */}
          <figure className="ecosystem reveal">
            <Image
              src="/Medusa%20Heads%20Intelligence%20Ecosystem.png"
              alt="Medusa Heads intelligence ecosystem. Upstream intelligence — market signals, buyer intent, competitive intelligence, strategic insights and real-time context — flows downstream to power execution across CRM, outreach, sales AI, automation, engagement, analytics and data."
              width={1672}
              height={941}
              quality={90}
              sizes="(max-width: 1240px) 100vw, 1184px"
            />
            <figcaption>
              <p className="q">Who should we pursue?</p>
              <p>Medusa identifies, evidences and qualifies organisations before they enter the outreach engine. Search is not the product. Judgement is.</p>
            </figcaption>
          </figure>
          <div className="future">
            <article className="future-card reveal">
              <small>In development</small>
              <h4>Hermes Wings</h4>
              <p>What do we need to know before we move?<br /><strong>Know before you go.</strong></p>
            </article>
            <article className="future-card reveal" style={{ '--d': '.12s' } as React.CSSProperties}>
              <small>Architecture</small>
              <h4>Medusa Tails</h4>
              <p>Find the live opportunities worth pursuing — without chasing your own tail.</p>
            </article>
            <article className="future-card reveal" style={{ '--d': '.24s' } as React.CSSProperties}>
              <small>Architecture</small>
              <h4>Argus</h4>
              <p>What changed while we weren&apos;t looking?<br /><strong>See what changed before it changes the game.</strong></p>
            </article>
          </div>
        </div>
      </section>

      {/* ============ BPC STUDIOS ============ */}
      <section id="studio">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">BPC Studios</div>
            <div>
              <h2>Built for ourselves. Applied for others.</h2>
              <p className="lead">
                We work with organisations that have a difficult commercial problem and need the system behind it designed — not simply another piece of software commissioned.
              </p>
            </div>
          </div>
          <div className="studio-grid">
            <article className="studio-card reveal">
              <h3>Solutions Architecture</h3>
              <p>We begin with the decision, commercial constraint or operational problem. The software comes afterwards.</p>
              <div className="steps">
                <div>Architecture <span>01</span></div>
                <div>Prototype <span>02</span></div>
                <div>Deployment <span>03</span></div>
              </div>
            </article>
            <article className="studio-card reveal" style={{ '--d': '.12s' } as React.CSSProperties}>
              <h3>Interactive Systems &amp; Tools</h3>
              <p>Configurators, recommendation engines, planners, guided-selling systems and specialist automation remain part of the BPC capability — now collected in one place.</p>
              <div className="actions">
                <a className="btn secondary" href="/tools">Explore BPC Tools →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ OPERATING PROOF ============ */}
      <section id="proof" className="proof">
        <div className="wrap">
          <div className="proof-box reveal">
            <div className="proof-media">
              <Image
                src="/ppav-mark.png"
                alt="PP-AV phoenix mark"
                width={800}
                height={800}
                sizes="320px"
              />
            </div>
            <div className="proof-copy">
              <div className="eyebrow">Operating proof</div>
              <h3>A commercial business. A living laboratory.</h3>
              <p>PP‑AV gives BPC something most studios do not have: a real operating environment in which systems can be designed, deployed and tested against customers, revenue and operational friction.</p>
              <p>The result is architecture shaped by use, not theory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CLOSE ============ */}
      <section id="contact" className="final">
        <div className="wrap reveal">
          <div className="eyebrow">Blueprint Code AI</div>
          <h2>We don&apos;t begin with software.<br />We begin with the decision the software needs to make.</h2>
          <a className="btn primary" href="mailto:hello@blueprintcode.ai">Talk to BPC →</a>
        </div>
      </section>
    </main>
  );
}
