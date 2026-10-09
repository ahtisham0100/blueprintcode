'use client';

import { useState } from 'react';

/* The Medusa Heads pricing page body, rebuilt as a React component from the
   hand-built medusa-heads-pricing HTML. The copy lives here next to the
   calculator state because the plan cards, Purse tiles and Cerberus tiers all
   drive the same "Your Medusa" estimate box. Prices are illustrative — see the
   note under the closing call to action. */

type ModeKey = 'Seek' | 'Enrich' | 'Pursue';
type CheckKey = 'Cerberus' | 'Cerberus Pack';

interface Mode {
  key: ModeKey;
  tag: string;
  strap: string;
  price: number;
  /** "From £…": Pursue's price depends on the outreach platform. */
  from?: boolean;
  coins: number;
  /** Tightest selectivity the plan allows (top N% of qualified scans). */
  filter: number;
  /** Seek's +100 Coins in the first month. */
  firstMonthBonus?: boolean;
  /** The cyan line under the allowance. */
  bonus?: string;
  featured?: boolean;
  items: string[];
}

const MODES: Mode[] = [
  {
    key: 'Seek',
    tag: 'MODE / 01',
    strap: 'Find the organisations worth pursuing.',
    price: 149,
    coins: 50,
    filter: 40,
    firstMonthBonus: true,
    bonus: '+100 BONUS COINS IN YOUR FIRST MONTH',
    items: [
      'Three specialist Heads hunting for you',
      'Evidence-qualified opportunities',
      'Source evidence and reasoning',
      'Your feedback sharpens each Head',
    ],
  },
  {
    key: 'Enrich',
    tag: 'MODE / 02',
    strap: 'Identify the likely decision-makers and add the contact context around the opportunity.',
    price: 249,
    coins: 150,
    filter: 30,
    bonus: 'DECISION-MAKERS + CONTACT DETAILS ON EVERY OPPORTUNITY',
    featured: true,
    items: [
      'Likely decision-makers identified for every opportunity',
      'Roles and contact details for outreach',
      'Context for a first message',
      'Everything in Seek',
    ],
  },
  {
    key: 'Pursue',
    tag: 'MODE / 03',
    strap: 'Send qualified opportunities straight into your outreach campaigns.',
    price: 299,
    from: true,
    coins: 150,
    filter: 20,
    bonus: 'FINAL PRICE DEPENDS ON YOUR OUTREACH PARTNER',
    items: [
      'Everything in Enrich',
      'Sent straight into your outreach campaigns',
      'Replies feed back into Medusa',
      'Needs your own outreach platform, billed by its provider',
    ],
  },
];

interface Purse {
  name: string;
  coins: number;
  price: number;
  unit: string;
  /** Volume pricing: no fixed price, the estimate shows "Contact us". */
  custom?: boolean;
}

const PURSES: Purse[] = [
  { name: 'Starter', coins: 150, price: 225, unit: '£1.50 / opportunity · ex VAT' },
  { name: 'Growth', coins: 500, price: 625, unit: '£1.25 / opportunity · ex VAT' },
  { name: 'Scale', coins: 1500, price: 1500, unit: '£1.00 / opportunity · ex VAT' },
  { name: 'Agency & Corporate', coins: 5000, price: 0, unit: 'Volume pricing · shared Purse', custom: true },
];

interface Check {
  key: CheckKey;
  /** Charge per delivered Coin, in pounds. Pack includes the Cerberus people checks. */
  rate: number;
  label: string;
  tag: string;
  price: string;
  body: string;
  featured?: boolean;
}

const CHECKS: Check[] = [
  {
    key: 'Cerberus',
    rate: 0.5,
    label: 'CERBERUS',
    tag: 'PEOPLE VERIFICATION',
    price: '£0.50',
    body: 'Verifies the people Enrich has identified: role accuracy, whether they are still at the company, decision-making relevance, company relationships, officer or ownership context where useful, source freshness and contradictions. It strengthens the human side of the case without changing the Head’s selection rules.',
  },
  {
    key: 'Cerberus Pack',
    rate: 5,
    label: 'CERBERUS PACK',
    tag: 'FULL COMMERCIAL VERIFICATION',
    price: '£5.00',
    body: 'Includes all Cerberus people checks, then verifies the existing opportunity in greater commercial depth using relevant licensed paid-data and research sources where available: richer company financials, credit or risk indicators, ownership and group context, director history, directly relevant contracts or procurement evidence, regulatory or filing flags, commercial-strength signals and material contradictions. The Pack strengthens confidence in the case Medusa has already made; it does not broaden the Hunt or search for unrelated new intelligence.',
    featured: true,
  },
];

/** Cerberus Gate: run after delivery on the Pack-checked opportunities chosen
 *  for handoff, so it only exists alongside Pack. Pounds per gated opportunity. */
const GATE_RATE = 1.25;

/** Selectivity per Head: how much of the qualified pool is delivered now. */
const SELECTIONS = [
  { value: 20, label: 'FOCUSED' },
  { value: 30, label: 'BALANCED' },
  { value: 40, label: 'BROAD' },
] as const;

const gbp = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export default function Pricing() {
  const [modeKey, setModeKey] = useState<ModeKey>('Seek');
  const [purseName, setPurseName] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState<CheckKey | null>(null);
  const [selection, setSelection] = useState<number>(40);
  const [deliveries, setDeliveries] = useState('0');
  const [gate, setGate] = useState(false);
  const [gatedInput, setGatedInput] = useState('0');
  const [showVerification, setShowVerification] = useState(true);

  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[0];
  const purse = PURSES.find((p) => p.name === purseName) ?? null;
  const check = CHECKS.find((c) => c.key === checkKey) ?? null;

  // A plan allows selectivity down to its own band; a looser choice carries over.
  const tight = mode.filter;
  const selected = selection < tight ? tight : selection;
  const checked = Math.max(0, Math.floor(Number(deliveries) || 0));
  const verifyCost = check ? Math.round(checked * check.rate * 100) / 100 : 0;
  // Gated opportunities are a subset of the checked deliveries.
  const gated = Math.min(Math.max(0, Math.floor(Number(gatedInput) || 0)), checked);
  const gateCost = gate ? Math.round(gated * GATE_RATE * 100) / 100 : 0;
  const prefix = mode.from ? 'From ' : '';

  const chooseMode = (m: Mode) => {
    setModeKey(m.key);
    setSelection((s) => (s < m.filter ? m.filter : s));
  };
  const togglePurse = (name: string) => setPurseName((p) => (p === name ? null : name));
  const toggleCheck = (key: CheckKey) => {
    const next = checkKey === key ? null : key;
    setCheckKey(next);
    if (next !== 'Cerberus Pack') setGate(false);
  };
  // Adding Gate switches Pack on, since Gate only runs on Pack-checked opportunities.
  const toggleGate = () => {
    if (gate) return setGate(false);
    setGate(true);
    setCheckKey('Cerberus Pack');
  };
  const changeDeliveries = (v: string) => {
    setDeliveries(v);
    const cap = Math.max(0, Math.floor(Number(v) || 0));
    if ((Number(gatedInput) || 0) > cap) setGatedInput(String(cap));
  };
  const changeGated = (v: string) => setGatedInput(Number(v) > checked ? String(checked) : v);

  return (
    <main>
      <section className="hero">
        <div>
          <div className="k">PRICING / SIMPLE ON THE SURFACE</div>
          <h1>
            CHOOSE HOW
            <br />
            MEDUSA HUNTS.
          </h1>
          <p className="lead">
            Your plan decides what Medusa does with each opportunity. A Purse tops up how many she delivers.
          </p>
          <p className="summary">From £149 a month. Qualified opportunities, not lists. Top up when you need more.</p>
          <div className="rule">
            PREMIUM VERIFIES THE COMPANY. CERBERUS VERIFIES THE PEOPLE. CERBERUS PACK VERIFIES THE WHOLE OPPORTUNITY.
          </div>
        </div>
        <div className="visual">
          <img src="/medusa/head.svg" alt="Medusa Heads" width="635" height="625" />
          <div className="cap">
            MODEL / <b>SUBSCRIPTION + COINS</b>
            <br />
            QUALITY / PREMIUM BY DEFAULT
            <br />
            SCALE / YOUR CHOICE
          </div>
        </div>
      </section>

      <section className="sec launch" id="launch-pricing">
        <figure>
          <img
            src="/medusa/launch-pricing.webp"
            alt="Indicative launch pricing: a monthly subscription with included base features, then scaling through additional usage, extra features and optional verification. Qualified opportunities can move directly into downstream execution platforms such as sales engagement, CRM or other channels. Medusa qualifies. Your platform executes."
            width="1672"
            height="941"
            loading="eager"
            decoding="async"
          />
          <figcaption>
            INDICATIVE LAUNCH PRICING / <b>SUBSCRIPTION + COINS + HEADS + CERBERUS</b> · REFINED THROUGH CLIENT ZERO
          </figcaption>
        </figure>
      </section>

      <section className="sec" id="compare">
        <div className="head">
          <div>
            <div className="k">01 / FILTER BEFORE THE ENGINE</div>
            <h2>
              BETTER INPUTS.
              <br />
              BEFORE EXECUTION.
            </h2>
          </div>
          <p className="copy">
            Most outbound systems become useful once a candidate has already entered the workflow. Medusa works one
            step earlier: it researches the wider market, applies your commercial judgement, and only passes forward
            the organisations that earn their place. If it doesn&apos;t make the cut, you never see it, and it never
            uses a Coin.
          </p>
        </div>
        <div className="cmp-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr">Compared</span>
                </th>
                <th scope="col">CANDIDATE POOL</th>
                <th scope="col" className="us">
                  MEDUSA QUALIFIED
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">WHAT ENTERS THE ENGINE</th>
                <td>Organisations that match initial search or filter criteria</td>
                <td className="us">Organisations that have earned their place through evidence-led qualification</td>
              </tr>
              <tr>
                <th scope="row">WHEN JUDGEMENT HAPPENS</th>
                <td>After candidates enter the workflow</td>
                <td className="us">Before delivery or handoff</td>
              </tr>
              <tr>
                <th scope="row">REJECTS AND DUPLICATES</th>
                <td>May still require review or cleanup</td>
                <td className="us">Never use a Coin</td>
              </tr>
              <tr>
                <th scope="row">WHY THIS ORGANISATION</th>
                <td>Initial matching data</td>
                <td className="us">Source evidence and reasoning you can check</td>
              </tr>
              <tr>
                <th scope="row">OVER TIME</th>
                <td>Criteria can be rerun and refined</td>
                <td className="us">Heads sharpen from outcome feedback</td>
              </tr>
              <tr>
                <th scope="row">ROLE IN THE STACK</th>
                <td>Feeds the execution workflow</td>
                <td className="us">Improves what deserves to enter it</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="cmp-foot">
          <blockquote>Fewer candidates. Better inputs.</blockquote>
          <div className="rule">MEDUSA FILTERS BEFORE THE ENGINE.</div>
        </div>
      </section>

      <section className="sec">
        <div className="head">
          <div>
            <div className="k">02 / CHOOSE YOUR PLAN</div>
            <h2>
              HOW FAR SHOULD
              <br />
              MEDUSA GO?
            </h2>
          </div>
          <p className="copy">
            Every plan starts with Premium company verification using Medusa’s core public and open evidence. Higher
            plans take each qualified opportunity further. You can also choose how selective each Head should be:
            Focused, Balanced or Broad. Only organisations that meet the qualification standard are ever considered.
          </p>
        </div>
        <div className="modes">
          {MODES.map((m) => (
            <article key={m.key} className={m.featured ? 'card featured' : 'card'}>
              <div className="tag">{m.tag}</div>
              <h3>{m.key.toUpperCase()}</h3>
              <div className="strap">{m.strap}</div>
              <div className="price">
                <b>
                  {m.from ? 'From ' : ''}
                  {gbp(m.price)}
                </b>{' '}
                <span>/ MONTH · EX VAT</span>
              </div>
              <div className="gold">3 HEADS + {m.coins} MEDUSA COINS INCLUDED / MONTH</div>
              {m.bonus && <div className="bonus">{m.bonus}</div>}
              <div className="filter">SELECTION: UP TO THE TOP {m.filter}% OF QUALIFIED SCANS</div>
              <ul>
                {m.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                className={m.key === mode.key ? 'sel active' : 'sel'}
                aria-pressed={m.key === mode.key}
                onClick={() => chooseMode(m)}
              >
                SELECT {m.key.toUpperCase()}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="sec" id="cerberus">
        <div className="head">
          <div>
            <div className="k">03 / OPTIONAL VERIFICATION</div>
            <h2>
              THREE LEVELS
              <br />
              OF CONFIDENCE.
            </h2>
          </div>
          <p className="copy">
            Medusa Premium verifies the company as standard. Cerberus verifies the people. Cerberus Pack adds full
            commercial verification of the existing opportunity. After delivery, you can run Cerberus Gate on the
            Pack-checked opportunities you select for handoff.
          </p>
        </div>
        <div className="cerb" id="cerberus-box">
          <div className="cmark">C</div>
          <div>
            <h3>CERBERUS / DEEPER VERIFICATION</h3>
            <p>
              Choose how deeply Medusa should challenge each delivered opportunity. Verification is charged only on
              delivered Coins while the selected checker is switched on.
            </p>
            <div id="cerberus-reveal" className="cerb-pricing" hidden={!showVerification}>
              <div className="cerb-grid">
                {CHECKS.map((c) => {
                  const on = c.key === check?.key;
                  return (
                    <article key={c.key} className={c.featured ? 'cerb-tier featured' : 'cerb-tier'}>
                      <div className="ctag">{c.tag}</div>
                      <h4>{c.key.toUpperCase()}</h4>
                      <div className="cprice">
                        <b>{c.price}</b> <span>/ COIN · EX VAT</span>
                      </div>
                      <p>{c.body}</p>
                      <button
                        type="button"
                        className={on ? 'sel active' : 'sel'}
                        aria-pressed={on}
                        onClick={() => toggleCheck(c.key)}
                      >
                        {on ? `${c.key.toUpperCase()} ADDED` : `ADD ${c.key.toUpperCase()}`}
                      </button>
                    </article>
                  );
                })}
                <article className={gate ? 'cerb-tier gate-tier active' : 'cerb-tier gate-tier'}>
                  <div className="ctag">AFTER DELIVERY · ON YOUR SELECTION</div>
                  <h4>CERBERUS GATE</h4>
                  <div className="cprice">
                    <b>+£1.25</b> <span>/ SELECTED OPPORTUNITY · EX VAT</span>
                  </div>
                  <p>
                    Run Gate after delivery, only on the Pack-checked opportunities you select for handoff. It checks the
                    permitted-use context: target jurisdiction, applicable outreach rules, source and licence provenance,
                    suppression or objection status, retention or use restrictions, and whether the Pack findings can be
                    passed downstream for the intended purpose. You pay only for the opportunities you choose to Gate.
                  </p>
                  <button type="button" className={gate ? 'sel active' : 'sel'} aria-pressed={gate} onClick={toggleGate}>
                    {gate ? 'GATE ADDED' : 'ADD GATE'}
                  </button>
                </article>
              </div>
              <div className="cerb-note cerb-lead">
                PREMIUM QUALIFIES THE COMPANY. CERBERUS VERIFIES THE PEOPLE. CERBERUS PACK VERIFIES THE EXISTING
                COMMERCIAL CASE IN DEPTH. GATE CHECKS WHETHER THE OPPORTUNITIES YOU SELECT CAN BE HANDED OFF.
              </div>
              <div className="cerb-note">
                CERBERUS COSTS £0.50 PER DELIVERED COIN. CERBERUS PACK COSTS £5.00 PER DELIVERED COIN AND INCLUDES THE
                PEOPLE CHECKS PLUS FULL COMMERCIAL VERIFICATION. CERBERUS GATE IS AN OPTIONAL +£1.25 PER OPPORTUNITY YOU
                SELECT, RUN AFTER DELIVERY ON PACK-CHECKED OPPORTUNITIES. GATE IS NOT A STANDALONE CHECK.
              </div>
            </div>
          </div>
          <div className="cerb-side">
            <small>AVAILABLE WITH ENRICH &amp; PURSUE</small>
            <button
              type="button"
              className={showVerification ? 'sel active' : 'sel'}
              aria-expanded={showVerification}
              aria-controls="cerberus-reveal"
              onClick={() => setShowVerification((v) => !v)}
            >
              {showVerification ? 'HIDE VERIFICATION PRICING' : 'VIEW VERIFICATION PRICING'}
            </button>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="head">
          <div>
            <div className="k">04 / NEED MORE VOLUME?</div>
            <h2>
              ONE COIN.
              <br />
              ONE OPPORTUNITY.
            </h2>
          </div>
          <p className="copy">
            Each subscription includes a monthly Medusa Coin allowance. The Purse is the top-up layer: buy one when you
            need more volume. Bigger Purses reduce unit cost without lowering the evidence standard. The Purses shown
            here are one-off purchases that roll over for 90 days; recurring Purses save 10%.
          </p>
        </div>
        <div className="define">
          <div>
            <strong>1 Medusa Coin = 1 newly delivered qualified opportunity.</strong>
            <span>DUPLICATES, PREVIOUSLY DELIVERED ORGANISATIONS AND REJECTED RESULTS DO NOT CONSUME ANOTHER COIN.</span>
          </div>
          <div>
            <strong>The Purse scales. The Head does not get careless.</strong>
            <span>
              WHEN A NICHE RUNS DRY, RELEASE THE HEAD’S RESERVE OR LET IT MOVE TO MONITORING. IT NEVER LOWERS THE BAR
              TO FILL A PURSE.
            </span>
          </div>
        </div>
        <div className="purses">
          {PURSES.map((p) => {
            const on = p.name === purse?.name;
            return (
              <button
                key={p.name}
                type="button"
                className={on ? 'purse active' : 'purse'}
                aria-pressed={on}
                onClick={() => togglePurse(p.name)}
              >
                <div className="pn">{p.custom ? p.name.toUpperCase() : `${p.name.toUpperCase()} PURSE`}</div>
                <div className="coins">
                  {p.coins.toLocaleString('en-GB')}
                  {p.custom ? '+' : ''}
                </div>
                <div className="cl">MEDUSA COINS</div>
                <div className="pp">
                  <b>{p.custom ? 'Talk to us' : gbp(p.price)}</b>
                  {p.unit}
                </div>
              </button>
            );
          })}
        </div>

        <div className="builder">
          <div className="box">
            <div className="k">YOUR MEDUSA / EXAMPLE</div>
            <div className="row">
              <span>Medusa level</span>
              <b>{mode.key.toUpperCase()}</b>
            </div>
            <div className="row">
              <span>Heads included</span>
              <b>3</b>
            </div>
            <div className="row">
              <span>Included monthly Coins</span>
              <b>{mode.coins}</b>
            </div>
            <div className="row">
              <span>First-month bonus</span>
              <b>{mode.firstMonthBonus ? '+100 COINS' : '—'}</b>
            </div>
            <div className="row">
              <span>Purse (one-off)</span>
              <b>
                {purse
                  ? `${purse.name.toUpperCase()} / ${purse.coins.toLocaleString('en-GB')}${purse.custom ? '+' : ''} COINS`
                  : 'NONE'}
              </b>
            </div>
            <details className="fine">
              <summary>FINE-TUNE</summary>
              <div className="row">
                <span>How selective should Medusa be?</span>
                <span className="selwrap" role="group" aria-label="Selectivity per Head">
                  {SELECTIONS.map(({ value: v, label }) => {
                    const locked = v < tight;
                    return (
                      <button
                        key={v}
                        type="button"
                        className={v === selected ? 'selopt active' : 'selopt'}
                        disabled={locked}
                        title={locked ? 'Available on a higher plan' : undefined}
                        aria-pressed={v === selected}
                        onClick={() => setSelection(v)}
                      >
                        {label} · {v}%{locked ? (v === 20 ? ' · PURSUE' : ' · ENRICH') : ''}
                      </button>
                    );
                  })}
                </span>
              </div>
              <p className="estimate-note">
                Qualification decides whether an opportunity is good enough. Selectivity decides how much of the
                qualified pool you want delivered now.
              </p>
            </details>
            <div className="row">
              <span>Verification</span>
              <span>
                <b>
                  {check ? `${check.label} / £${check.rate.toFixed(2)} PER DELIVERED COIN` : 'PREMIUM / COMPANY'}
                  {gate ? ' + GATE ON SELECTED' : ''}
                </b>
                {CHECKS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={c.key === check?.key ? 'mini active' : 'mini'}
                    aria-pressed={c.key === check?.key}
                    onClick={() => toggleCheck(c.key)}
                  >
                    {c.key === 'Cerberus' ? 'CERBERUS' : 'PACK'}
                  </button>
                ))}
                <button type="button" className={gate ? 'mini active' : 'mini'} aria-pressed={gate} onClick={toggleGate}>
                  GATE
                </button>
              </span>
            </div>
            <div className="row" hidden={!check}>
              <label htmlFor="verified-coins">Expected checked deliveries / month</label>
              <input
                type="number"
                id="verified-coins"
                min={0}
                step={1}
                inputMode="numeric"
                aria-describedby="cerb-estimate-note"
                value={deliveries}
                onChange={(e) => changeDeliveries(e.target.value)}
              />
            </div>
            <p id="cerb-estimate-note" className="estimate-note" hidden={!check}>
              Enter your expected number of delivered opportunities to be checked. Cerberus costs £0.50 per delivered
              Coin. Cerberus Pack costs £5.00 per delivered Coin. Gate adds £1.25 only on the Pack-checked
              opportunities you select for it.
            </p>
            <div className="row" hidden={!gate}>
              <label htmlFor="gated-coins">Opportunities you expect to Gate / month</label>
              <input
                type="number"
                id="gated-coins"
                min={0}
                step={1}
                inputMode="numeric"
                value={gatedInput}
                onChange={(e) => changeGated(e.target.value)}
              />
            </div>
            <div className="row">
              <span>Core evidence</span>
              <b>PREMIUM / COMPANY VERIFIED</b>
            </div>
            <div className="row" hidden={mode.key !== 'Pursue'}>
              <span>Outreach</span>
              <b>YOUR OWN PLATFORM, BILLED SEPARATELY</b>
            </div>
            <div className="total">
              <span>MONTHLY MEDUSA SUBSCRIPTION</span>
              <b>
                {prefix}
                {gbp(mode.price)}
              </b>
            </div>
            <div className="row">
              <span>One-off Purse purchase</span>
              <b>{purse ? (purse.custom ? 'CONTACT US' : gbp(purse.price)) : '£0'}</b>
            </div>
            <div className="row" hidden={!check}>
              <span>{check ? `Estimated ${check.label} usage / month` : 'Estimated verification usage / month'}</span>
              <b>{gbp(verifyCost)}</b>
            </div>
            <div className="row" hidden={!gate}>
              <span>Estimated Gate usage / month</span>
              <b>{gbp(gateCost)}</b>
            </div>
            <div className="total">
              <span>ESTIMATED MONTHLY COST (EXCL. ONE-OFF PURSE)</span>
              <b>
                {prefix}
                {gbp(mode.price + verifyCost + gateCost)}
              </b>
            </div>
            <p className="estimate-note">
              All amounts ex VAT. Medusa subscription is recurring. Selected Purse is a one-off purchase; verification is
              charged only on actual delivered opportunities checked. Cerberus Pack is £5.00 per Pack-checked Coin.
              Cerberus Gate is a Pack-only add-on at +£1.25, charged only on the opportunities you select for it.
            </p>
          </div>
          <div className="box">
            <div className="k">THE PRICING PRINCIPLE</div>
            <blockquote>Choose how Medusa hunts. Then choose how full you want her purse.</blockquote>
            <p>
              A small company can run Pursue with no Purse. A corporate team can run Seek with a huge one. Capability
              and volume scale independently. Click a Purse again to remove it. The calculator separates one-off Purse
              purchases from recurring subscription charges and optional verification usage. Premium company
              verification is built in; Enrich identifies likely decision-makers, Cerberus verifies those people, then
              Cerberus Pack deepens verification of the same opportunity when the commercial case justifies more
              scrutiny. Pack verifies deeper; it does not broaden the Hunt. Selectivity per Head lives under Fine-tune.
            </p>
          </div>
        </div>
      </section>

      <div className="hiw" id="how-it-works">
        <div className="k">HOW IT WORKS</div>
        <h2>UNDER THE SURFACE.</h2>
        <p>
          Everything above is all you need to start. The detail below is for when you want to know how Medusa hunts,
          what happens when a market runs dry, and how to add more Heads.
        </p>
      </div>

      <section className="sec" id="heads">
        <div className="head">
          <div>
            <div className="k">05 / HOW MEDUSA HUNTS</div>
            <h2>
              START WITH THREE.
              <br />
              GROW THE ESTATE.
            </h2>
          </div>
          <p className="copy">
            Every Medusa subscription includes three active Heads. That is enough to test different markets, ICPs or
            opportunity types without turning the product into a toy. When the business needs more hunting lanes, or
            a niche moves to Monitoring, Head capacity scales separately from Coins.
          </p>
        </div>

        <div className="heads-intro">
          <div className="heads-card">
            <strong>3 Heads included with every subscription.</strong>
            <span>RUN DIFFERENT HUNTS, COMPARE RESULTS, THEN PUT MORE COINS BEHIND THE HEADS THAT EARN IT.</span>
          </div>
          <div className="heads-card">
            <strong>Heads define what Medusa is looking for.</strong>
            <span>
              COINS CONTROL HOW MUCH SHE HUNTS. MORE HEADS MEAN MORE DISTINCT OPPORTUNITY TYPES, MARKETS OR CLIENT
              CAMPAIGNS.
            </span>
          </div>
        </div>

        <div className="heads-grid">
          <article className="head-pack">
            <div className="hlabel">INCLUDED</div>
            <h3>CORE ESTATE</h3>
            <div className="count">
              3 <small>HEADS</small>
            </div>
            <p>Included in Seek, Enrich and Pursue. Enough for a genuine trial across multiple ICPs or commercial angles.</p>
            <div className="head-note">NO EXTRA MONTHLY HEAD CHARGE.</div>
          </article>
          <article className="head-pack">
            <div className="hlabel">EXPANSION / 01</div>
            <h3>STARTER ESTATE</h3>
            <div className="count">
              +3 <small>HEADS</small>
            </div>
            <p>Add another small group of specialist Heads when the first three prove useful.</p>
            <div className="head-note">£49 / MONTH · EX VAT</div>
          </article>
          <article className="head-pack featured">
            <div className="hlabel">EXPANSION / 02</div>
            <h3>AGENCY ESTATE</h3>
            <div className="count">
              +10 <small>HEADS</small>
            </div>
            <p>Run multiple client, territory or vertical Hunts from one account with shared Coin capacity.</p>
            <div className="head-note">£149 / MONTH · EX VAT · TEAM / CLIENT STRUCTURE · SHARED PURSE.</div>
          </article>
          <article className="head-pack">
            <div className="hlabel">EXPANSION / 03</div>
            <h3>CORPORATE ESTATE</h3>
            <div className="count">
              25+ <small>HEADS</small>
            </div>
            <p>
              Custom multi-team Head capacity from 25 Heads upward, with permissions and governance for larger
              commercial operations.
            </p>
            <div className="head-note">FROM £349 / MONTH · EX VAT · CUSTOM CAPACITY · GOVERNANCE · SUPPORT.</div>
          </article>
        </div>

        <div className="reserve" id="reserve">
          <div className="rmark" aria-hidden="true">
            R
          </div>
          <div>
            <h3>THE RESERVE</h3>
            <p>
              Qualified opportunities that do not make your current selection are not wasted. Medusa ranks the next
              strongest opportunities and holds them in the Reserve, ready to release later if you want to widen the
              Hunt. Qualification decides whether an opportunity is good enough; selectivity decides what is delivered
              now. Released opportunities are re-checked before delivery and use one Coin each, like any other.
            </p>
            <div className="bands" aria-label="Example: a Head running in Balanced mode">
              <span className="band live">BALANCED · STRONGEST 30% · DELIVERED NOW</span>
              <span className="band res">NEXT 20% · HELD IN RESERVE</span>
              <span className="band out">BELOW QUALIFICATION STANDARD · NOT KEPT</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="head">
          <div>
            <div className="k">06 / SIMPLE RULES</div>
            <h2>
              NO CREDIT
              <br />
              MATHEMATICS.
            </h2>
          </div>
          <p className="copy">
            One Coin always means one newly delivered qualified opportunity. The subscription changes what happens
            around that opportunity, not the meaning of the Coin.
          </p>
        </div>
        <div className="faq">
          <article>
            <h3>What does selectivity mean?</h3>
            <p>
              Qualification decides whether an opportunity is good enough. Selectivity decides how much of that
              qualified pool you want delivered now. Broad can deliver up to the top 40% of qualified scans, Balanced
              up to the top 30%, and Focused up to the top 20%. These are maximum selection bands, not guaranteed pass
              rates: anything below the qualification standard is rejected.
            </p>
          </article>
          <article>
            <h3>What if Medusa finds a duplicate?</h3>
            <p>A repeat organisation does not consume another Coin. Neither does a rejected result.</p>
          </article>
          <article>
            <h3>Can I top up without changing plan?</h3>
            <p>Yes. Add a Purse whenever you need more volume. One-off Purses roll over for 90 days.</p>
          </article>
          <article>
            <h3>What happens when a niche runs dry?</h3>
            <p>
              Release the next qualifying opportunities from the Head’s Reserve, or let it move to Monitoring and
              report only new entrants and changes. Add another Head to open a new market.
            </p>
          </article>
          <article>
            <h3>Can I change selectivity later?</h3>
            <p>
              Yes, per Head, at any time. Move between Broad, Balanced and Focused within your plan’s available range.
              Upgrading unlocks tighter selectivity.
            </p>
          </article>
          <article>
            <h3>Does the Reserve cost extra?</h3>
            <p>No. Holding it is included. A released opportunity is re-checked, then uses one Coin like any other delivery.</p>
          </article>
          <article>
            <h3>Do I need an outreach platform?</h3>
            <p>
              Only for Pursue. Connect the account you already use, or open one with a supported provider; they bill
              you directly.
            </p>
          </article>
          <article>
            <h3>How are Cerberus checks charged?</h3>
            <p>
              Premium company verification is included. Cerberus adds people-level verification at £0.50 per delivered
              Coin. Cerberus Pack costs £5.00 per delivered Coin and includes the people checks plus deeper
              verification of the existing commercial case. Pack verifies deeper; it does not broaden the Hunt. Cerberus
              Gate is optional and runs after delivery: select the Pack-checked opportunities you want to hand off, and
              Gate checks jurisdiction, permitted-use context, source/licence provenance, suppression status and
              handoff restrictions for £1.25 each.
            </p>
          </article>
        </div>
      </section>

      <div className="rule vat">ALL PRICES EXCLUDE VAT WHERE APPLICABLE.</div>
      <section className="cta">
        <div className="k">THE HUNT IS ON</div>
        <h2>
          START SMALL. PROVE THE HEAD.
          <br />
          OPEN THE PURSE WHEN IT EARNS IT.
        </h2>
        <p>
          The commercial model scales from a single experimental Head to agency and corporate use without changing the
          basic rules.
        </p>
        <a href="/contact">BUILD MY FIRST HEAD →</a>
        <div className="rule">
          ILLUSTRATIVE PRICES — PURSE AND VERIFICATION RATES TO BE CONFIRMED AGAINST CLIENT ZERO UNIT ECONOMICS AND
          PAID-DATA COSTS BEFORE LAUNCH. CERBERUS IS £0.50 PER COIN. CERBERUS PACK IS £5.00 PER COIN. CERBERUS GATE IS
          +£1.25 PER SELECTED PACK-CHECKED OPPORTUNITY, RUN AFTER DELIVERY.
        </div>
      </section>
    </main>
  );
}
