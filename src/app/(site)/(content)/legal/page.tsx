import LegalDoc, { Clause, CompanyDetails } from '../_legal/LegalDoc';
import { COMPANY, LEGAL_DOCS } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';

export const metadata = legalMetadata(
  '/legal',
  'Legal',
  'Company details for Blueprint Code AI Ltd and its legal documents: privacy, cookies, website terms, accessibility and automated tool terms.',
);

/* The legal hub: registered company details plus an index of every legal
   document. Terms of Business are listed as "on request" until the solicitor
   has signed them off — publish them as their own page then. */
export default function LegalPage() {
  return (
    <LegalDoc
      doc="LEGAL & COMPANY"
      title="Legal"
      lede="Clear information about who we are, how we handle information and the terms that apply to our website and tools."
      inShort={[
        <>{COMPANY.legalName} is a private limited company registered in {COMPANY.registeredIn}, number {COMPANY.number}.</>,
        <>Every legal document is listed below, written in plain English with the detail underneath.</>,
        <>Questions about any of them: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</>,
      ]}
    >
      <Clause id="company" title="Company details">
        <CompanyDetails />
      </Clause>

      <Clause id="documents" title="Legal documents">
        <ul className="doc-list">
          {LEGAL_DOCS.map((d) => (
            <li key={d.href}>
              <a href={d.href}><b>{d.title}</b><span>{d.summary}</span></a>
            </li>
          ))}
        </ul>
      </Clause>

      <Clause id="terms-of-business" title="Terms of Business">
        <p>
          Paid projects are governed by the accepted proposal or statement of work and the terms agreed with it, not by
          the website terms. Our standard Terms of Business are available on request — email{' '}
          <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Terms of Business')}`}>{COMPANY.email}</a>.
        </p>
      </Clause>
    </LegalDoc>
  );
}
