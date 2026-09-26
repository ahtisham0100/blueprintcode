import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import './styles.css';
import rawData from './data.json';

/* Standards & Credentials. Everything on this page is driven by data.json —
   to add a credential, list a programme in progress, or edit any copy, update
   that file only and the page re-renders from it. Nothing here is hardcoded in
   the component. */

interface StampRow { key: string; value: string }
interface Credential {
  name: string;
  issuer: string;
  holder: string;
  dateAchieved: string;
  renewalDate?: string;
  credentialNumber: string;
  verifyUrl?: string;
}
interface Point { title: string; detail: string }
interface InProgressItem {
  programme: string;
  awardingBody: string;
  anticipatedCompletion: string;
  status: string;
}
interface LinkRef { label: string; href: string }

interface StandardsData {
  meta: { title: string; description: string; canonical: string };
  stamp: StampRow[];
  opening: { heading: string; body: string };
  credentials: { sheetNo: string; heading: string; intro: string; emptyState: string; items: Credential[] };
  accessibility: { sheetNo: string; heading: string; intro: string; points: Point[] };
  security: { sheetNo: string; heading: string; intro: string; points: Point[] };
  inProgress: { sheetNo: string; heading: string; intro: string; emptyState: string; items: InProgressItem[] };
  clientBenefits: { sheetNo: string; heading: string; intro: string; points: string[] };
  evidence: { sheetNo: string; heading: string; intro: string; points: string[]; link: LinkRef };
  disclaimer: string;
  close: { eyebrow: string; heading: string; body: string; cta: LinkRef; secondary: LinkRef };
}

const data = rawData as unknown as StandardsData;

export const metadata: Metadata = {
  title: data.meta.title,
  description: data.meta.description,
  alternates: { canonical: data.meta.canonical },
  openGraph: {
    ...OG_DEFAULTS,
    title: data.meta.title,
    description: data.meta.description,
    type: 'website',
    url: data.meta.canonical,
  },
};

export default function StandardsPage() {
  const { opening, credentials, accessibility, security, inProgress, clientBenefits, evidence, disclaimer, close } = data;

  return (
    <main id="main">
      <div className="sheet title-block">
        <dl className="stamp">
          {data.stamp.map((row) => (
            <div className="row" key={row.key}><dt>{row.key}</dt><dd>{row.value}</dd></div>
          ))}
        </dl>
        <h1>{opening.heading}</h1>
        <p className="standfirst">{opening.body}</p>
      </div>

      {/* ============ 01 — CURRENT CREDENTIALS ============ */}
      <section id="credentials">
        <div className="sheet">
          <p className="sheet-no">{credentials.sheetNo}</p>
          <div className="two">
            <h2>{credentials.heading}</h2>
            <p>{credentials.intro}</p>
          </div>
          {credentials.items.length > 0 ? (
            <div className="cred-grid">
              {credentials.items.map((c) => (
                <article className="cred" key={c.credentialNumber || c.name}>
                  <h3>{c.name}</h3>
                  <p className="cred-issuer">{c.issuer}</p>
                  <dl className="cred-meta">
                    <div><dt>Holder</dt><dd>{c.holder}</dd></div>
                    <div><dt>Achieved</dt><dd>{c.dateAchieved}</dd></div>
                    {c.renewalDate ? <div><dt>Renews</dt><dd>{c.renewalDate}</dd></div> : null}
                    <div><dt>Credential no.</dt><dd>{c.credentialNumber}</dd></div>
                  </dl>
                  {c.verifyUrl ? (
                    <a className="cred-verify" href={c.verifyUrl} target="_blank" rel="noopener noreferrer">
                      Verify Credential ↗
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">{credentials.emptyState}</p>
          )}
        </div>
      </section>

      {/* ============ 02 — ACCESSIBILITY ============ */}
      <section id="accessibility">
        <div className="sheet">
          <p className="sheet-no">{accessibility.sheetNo}</p>
          <div className="two">
            <h2>{accessibility.heading}</h2>
            <p>{accessibility.intro}</p>
          </div>
          <div className="pt-grid">
            {accessibility.points.map((p) => (
              <div className="pt" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.detail}</p>
              </div>
            ))}
          </div>
          <p className="pt-more">
            We also audit and fix other people&rsquo;s sites against WCAG 2.2 AA &mdash; see{' '}
            <a href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</a>{' '}
            for ADA, AODA, SEBI and EAA coverage.
          </p>
        </div>
      </section>

      {/* ============ 03 — SECURITY & TECHNICAL STANDARDS ============ */}
      <section id="security">
        <div className="sheet">
          <p className="sheet-no">{security.sheetNo}</p>
          <div className="two">
            <h2>{security.heading}</h2>
            <p>{security.intro}</p>
          </div>
          <div className="pt-grid">
            {security.points.map((p) => (
              <div className="pt" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 04 — CURRENTLY PROGRESSING ============ */}
      <section id="in-progress">
        <div className="sheet">
          <p className="sheet-no">{inProgress.sheetNo}</p>
          <div className="two">
            <h2>{inProgress.heading}</h2>
            <p>{inProgress.intro}</p>
          </div>
          {inProgress.items.length > 0 ? (
            <div className="prog">
              {inProgress.items.map((it) => (
                <div className="prog-row" key={it.programme}>
                  <span className="prog-status">{it.status}</span>
                  <div className="prog-body">
                    <h3>{it.programme}</h3>
                    <p className="prog-body-meta">{it.awardingBody}</p>
                  </div>
                  <span className="prog-eta"><span className="lbl">ANTICIPATED</span><b>{it.anticipatedCompletion}</b></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">{inProgress.emptyState}</p>
          )}
        </div>
      </section>

      {/* ============ 05 — WHAT CLIENTS RECEIVE ============ */}
      <section id="benefits">
        <div className="sheet">
          <p className="sheet-no">{clientBenefits.sheetNo}</p>
          <div className="two">
            <h2>{clientBenefits.heading}</h2>
            <p>{clientBenefits.intro}</p>
          </div>
          <ul className="ticks benefits">
            {clientBenefits.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </section>

      {/* ============ 06 — EVIDENCE WITHIN CASE STUDIES ============ */}
      <section id="evidence">
        <div className="sheet">
          <p className="sheet-no">{evidence.sheetNo}</p>
          <div className="two">
            <h2>{evidence.heading}</h2>
            <div>
              <p>{evidence.intro}</p>
              <ul className="ticks">
                {evidence.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <div className="actions">
                <a className="button" href={evidence.link.href}>{evidence.link.label}</a>
              </div>
            </div>
          </div>
          <p className="disclaimer">{disclaimer}</p>
        </div>
      </section>

      {/* ============ CLOSE ============ */}
      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">{close.eyebrow}</p>
          <h2>{close.heading}</h2>
          <p>{close.body}</p>
          <div className="actions">
            <a className="button solid" href={close.cta.href}>{close.cta.label}</a>
            <a className="button" href={close.secondary.href}>{close.secondary.label}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
