import { Children, isValidElement, type ReactNode } from 'react';
import { COMPANY, LEGAL_UPDATED } from './company';
import './legal.css';

/* Shared frame for the legal documents. Plain English first: the title block
   carries a short "in short" summary, then the numbered clauses follow with a
   contents list beside them. Each page writes its clauses as <Clause> children;
   the contents list is built from their ids and titles. */

interface ClauseProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function Clause({ id, title, children }: ClauseProps) {
  return (
    <section className="clause" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

interface LegalDocProps {
  doc: string;
  title: string;
  lede: string;
  inShort: ReactNode[];
  /** Overrides the revision date for a document that changes on its own cycle. */
  updated?: string;
  children: ReactNode;
}

export default function LegalDoc({ doc, title, lede, inShort, updated = LEGAL_UPDATED, children }: LegalDocProps) {
  const clauses = Children.toArray(children).filter(
    (c): c is React.ReactElement<ClauseProps> => isValidElement(c) && c.type === Clause,
  );

  return (
    <main id="main" className="legal">
      <div className="sheet title-block">
        <dl className="stamp">
          <div className="row"><dt>DOCUMENT</dt><dd>{doc}</dd></div>
          <div className="row"><dt>ISSUER</dt><dd>{COMPANY.legalName.toUpperCase()}</dd></div>
          <div className="row"><dt>UPDATED</dt><dd>{updated.toUpperCase()}</dd></div>
        </dl>
        <h1>{title}</h1>
        <p className="standfirst">{lede}</p>
        <div className="in-short">
          <h2>In short</h2>
          <ul>
            {inShort.map((point, i) => <li key={i}>{point}</li>)}
          </ul>
        </div>
      </div>

      <div className="sheet legal-body">
        <nav className="legal-toc" aria-label="Contents">
          <p className="legal-toc-key">CONTENTS</p>
          <ol>
            {clauses.map((c) => (
              <li key={c.props.id}><a href={`#${c.props.id}`}>{c.props.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="legal-clauses">{children}</div>
      </div>
    </main>
  );
}

/** A table that may scroll sideways on a narrow screen. Focusable and named,
 *  so keyboard users can scroll it too. */
export function TableWrap({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

/** The registered company block, used at the foot of several documents. */
export function CompanyDetails() {
  return (
    <dl className="company">
      <div><dt>Company</dt><dd>{COMPANY.legalName}</dd></div>
      <div><dt>Registered in</dt><dd>{COMPANY.registeredIn}</dd></div>
      <div><dt>Company number</dt><dd>{COMPANY.number}</dd></div>
      <div><dt>Registered office</dt><dd>{COMPANY.office}</dd></div>
      {COMPANY.icoNumber ? <div><dt>ICO registration</dt><dd>{COMPANY.icoNumber}</dd></div> : null}
      <div><dt>Contact</dt><dd><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></dd></div>
    </dl>
  );
}
