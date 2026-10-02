import LegalDoc, { Clause, CompanyDetails } from '../_legal/LegalDoc';
import { COMPANY } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';

export const metadata = legalMetadata(
  '/terms',
  'Website Terms of Use',
  'The terms for using blueprintcode.ai and Blueprint Code AI’s public tools, demonstrations and prototypes.',
);

export default function TermsPage() {
  return (
    <LegalDoc
      doc="WEBSITE TERMS OF USE"
      title="Website Terms of Use"
      lede="The rules for using blueprintcode.ai and the public tools, demonstrations and prototypes on it."
      inShort={[
        <>The website, its demonstrations and its tools are ours. You&rsquo;re welcome to use them for their intended purpose.</>,
        <>Free tools and generated results are indicative — a starting point, not a certification, guarantee or specification.</>,
        <>Don&rsquo;t misuse the site, copy substantial parts of it, or submit information you don&rsquo;t have the right to share.</>,
        <>Paid work is governed by its own proposal and contract, not these terms.</>,
        <>These terms are governed by the law of England and Wales.</>,
      ]}
    >
      <Clause id="about" title="About these terms">
        <p>
          These terms apply when you use blueprintcode.ai and any other public website, demonstration or tool operated
          by {COMPANY.legalName} (&ldquo;BPC&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site you agree to
          them. Our <a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie &amp; Tracking Policy</a> explain
          how we handle personal information, and our <a href="/tool-terms">Automated Tools &amp; Scanner Terms</a> add
          to these terms for automated tools.
        </p>
        <CompanyDetails />
      </Clause>

      <Clause id="what-we-provide" title="What the site provides">
        <p>
          The site contains information about BPC, worked examples, demonstrations, prototypes, pricing guidance,
          calculators, assessment tools and other interactive features. It explains and demonstrates our work. Unless we
          expressly say otherwise, nothing on it is a project-specific specification, professional audit, quotation or
          contract.
        </p>
        <p>
          Published prices are a guide. A price only becomes binding when it appears in a proposal or statement of work
          that both sides accept.
        </p>
      </Clause>

      <Clause id="tools-and-outputs" title="Public tools and generated results">
        <p>Unless we expressly say otherwise:</p>
        <ul>
          <li>results from our tools are indicative and for information only;</li>
          <li>they depend on what you enter, which may be incomplete or change over time;</li>
          <li>automated and AI-assisted results can contain errors or omissions;</li>
          <li>a public tool is not a certification, guarantee, professional opinion or final specification; and</li>
          <li>important decisions should be checked by an appropriate person before you act on them.</li>
        </ul>
        <p>
          A prototype or demonstration shows an idea or proposed interaction. Don&rsquo;t assume it is ready for
          production use unless we confirm that in writing.
        </p>
      </Clause>

      <Clause id="ip" title="Our intellectual property">
        <p>
          Unless stated otherwise, BPC owns or is licensed to use the intellectual property in the site, including our
          name and branding, written content, interface designs, demonstrations, prototypes, software and methods.
        </p>
        <p>You may view and use the site for its intended purpose. Without our written permission, you must not:</p>
        <ul>
          <li>copy, republish or commercially use substantial parts of the site or our materials;</li>
          <li>present our work, demonstrations or prototypes as your own;</li>
          <li>remove copyright or ownership notices;</li>
          <li>use automated means to extract substantial parts of the site or its data, except as the law allows; or</li>
          <li>reverse engineer our tools or software, except where the law gives you a right to do so.</li>
        </ul>
        <p>Nothing in these terms transfers ownership of any of our intellectual property to you.</p>
      </Clause>

      <Clause id="acceptable-use" title="Acceptable use">
        <p>You must not use the site or our tools to:</p>
        <ul>
          <li>do anything unlawful, fraudulent or harmful;</li>
          <li>introduce malicious code, or attack, overload or disrupt our systems;</li>
          <li>try to get around security, sign-in or usage limits;</li>
          <li>submit information you have no right to share, or that infringes someone else&rsquo;s rights; or</li>
          <li>target, harass or harm anyone else.</li>
        </ul>
        <p>We may restrict or suspend access where we reasonably need to for security, legal compliance or to protect the service and its users.</p>
      </Clause>

      <Clause id="your-content" title="Information you submit">
        <p>
          You are responsible for the information you send us through the site and confirm you have the right to provide
          it. You keep ownership of it. You give us permission to use it as needed to provide the feature or service you
          asked for and to respond to you. Personal information is handled under our <a href="/privacy">Privacy Policy</a>.
        </p>
      </Clause>

      <Clause id="accounts" title="Blueprint Builder accounts">
        <p>
          If you use Blueprint Builder, you sign in with a link sent to your email address. Keep access to that email
          account secure, and tell us promptly at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> if you think
          someone else has used your account. We may close accounts that are misused.
        </p>
      </Clause>

      <Clause id="third-parties" title="Links and third-party services">
        <p>
          The site may link to or rely on services run by other companies. We don&rsquo;t control their content,
          availability, security or terms, and a link isn&rsquo;t an endorsement.
        </p>
      </Clause>

      <Clause id="availability" title="Availability and changes">
        <p>
          We aim to keep the site useful and available, but we don&rsquo;t guarantee it will always be uninterrupted or
          error-free. We may change, suspend or withdraw any part of it, for example for maintenance, security, legal or
          development reasons.
        </p>
      </Clause>

      <Clause id="liability" title="Our liability">
        <p>
          Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including
          liability for death or personal injury caused by negligence, or for fraud.
        </p>
        <p>
          Subject to that, the site and our free tools are provided for general information and demonstration, free of
          charge and &ldquo;as is&rdquo;. We are not liable for any loss arising from reliance on them, or for business
          losses such as lost profit, revenue, data or opportunity. Where you are a consumer, your statutory rights are
          not affected.
        </p>
      </Clause>

      <Clause id="client-work" title="Paid client work">
        <p>
          Commissioning paid work from BPC creates a separate relationship. It is governed by the accepted proposal or
          statement of work and our Terms of Business, which take priority over these terms for that work.
        </p>
      </Clause>

      <Clause id="law" title="Changes, law and contact">
        <p>
          We may update these terms; the date at the top shows the latest version. These terms are governed by the law
          of England and Wales, and the courts of England and Wales have jurisdiction, without affecting any mandatory
          rights you have under the law of the country where you live.
        </p>
        <p>Questions: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
      </Clause>
    </LegalDoc>
  );
}
