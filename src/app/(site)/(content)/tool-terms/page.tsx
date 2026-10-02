import LegalDoc, { Clause } from '../_legal/LegalDoc';
import { COMPANY } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';

export const metadata = legalMetadata(
  '/tool-terms',
  'Automated Tools & Scanner Terms',
  'What Blueprint Code AI’s automated assessments, accessibility pre-checks, the Process Blueprinter and AI-assisted outputs can and cannot tell you.',
);

export default function ToolTermsPage() {
  return (
    <LegalDoc
      doc="AUTOMATED TOOLS & SCANNER TERMS"
      title="Automated Tools & Scanner Terms"
      lede="Extra terms for our automated assessments, accessibility pre-checks, the Process Blueprinter and other decision-support tools. They add to the Website Terms of Use."
      inShort={[
        <>Automated results are preliminary. They help you find where to look — they aren&rsquo;t an audit or a certificate.</>,
        <>An automated accessibility check can&rsquo;t find every barrier and isn&rsquo;t a declaration of WCAG conformance.</>,
        <>Only submit a website you&rsquo;re entitled to have assessed, and don&rsquo;t submit sensitive personal information.</>,
        <>AI-assisted output can be wrong. Check anything important before you rely on it.</>,
      ]}
    >
      <Clause id="purpose" title="What these tools are for">
        <p>
          BPC tools help with discovery, early analysis and decision support. Where we offer them, they may use fixed
          rules, browser automation, data analysis, AI, or a combination. Unless a result is expressly described as part
          of a formal, separately commissioned audit, it is a <strong>preliminary, indicative result</strong> and not a
          certification.
        </p>
      </Clause>

      <Clause id="website-checks" title="Website checks and scans">
        <p>
          Where a tool asks for a website address, submit only a site you are entitled to have assessed — your own, or
          one you have permission to assess. A check looks at what an ordinary browser can see and may record technical
          observations and evidence needed to produce the result.
        </p>
        <p>You must not use our tools to:</p>
        <ul>
          <li>try to access anything without permission, or get around sign-in or other restrictions;</li>
          <li>carry out destructive, excessive or load testing;</li>
          <li>target systems or collect information unlawfully; or</li>
          <li>interfere with another service.</li>
        </ul>
      </Clause>

      <Clause id="accessibility-results" title="Accessibility results">
        <p>
          Automated accessibility testing finds some potential issues, but not all of them, and it doesn&rsquo;t replace
          manual testing with assistive technology. Unless it comes from a separately commissioned audit, a BPC automated
          accessibility result:
        </p>
        <ul>
          <li>is not a declaration of WCAG conformance;</li>
          <li>is not a legal compliance certificate (for example under the ADA, the Equality Act 2010 or the European Accessibility Act);</li>
          <li>doesn&rsquo;t guarantee that every barrier has been found; and</li>
          <li>should be treated as a starting point for investigation and fixes.</li>
        </ul>
      </Clause>

      <Clause id="blueprinter" title="The Process Blueprinter and recommendations">
        <p>
          These tools work from the information you give them and the rules available to them. Their output helps you
          structure a problem, spot likely friction and see possible approaches. It doesn&rsquo;t guarantee that a
          proposed system, workflow, product or commercial decision is right for you without further review.
        </p>
        <p>The Process Blueprinter keeps your work in your own browser; it isn&rsquo;t sent to us unless you choose to share it.</p>
      </Clause>

      <Clause id="ai" title="AI-assisted output">
        <p>
          AI may help interpret, classify, structure or generate information. AI-generated material can be incomplete or
          wrong. Some of our paid services include human review; don&rsquo;t assume a public tool does unless it says so.
        </p>
      </Clause>

      <Clause id="inputs" title="What you put in">
        <p>
          You are responsible for making sure what you submit is accurate enough for the purpose and that you have the
          right to share it. Don&rsquo;t submit confidential information, special category personal information (such as
          health data) or other sensitive information to a public tool unless the tool says it is designed for it.
        </p>
      </Clause>

      <Clause id="reliance" title="Relying on results">
        <p>
          Results can change as websites, data, standards, rules and our systems change. Before acting on a result where
          a mistake could have significant financial, legal, security, accessibility or operational consequences, get it
          verified by a suitably qualified person.
        </p>
      </Clause>

      <Clause id="fair-use" title="Fair use">
        <p>We may apply reasonable usage and rate limits, and suspend use that appears abusive, automated without permission, harmful or unlawful.</p>
      </Clause>

      <Clause id="ownership" title="Ownership">
        <p>
          We keep all rights in our tools, interfaces, methods, software and the logic we create. You keep ownership of
          the information you submit. Ownership of anything produced in a paid project is set out in that
          project&rsquo;s agreement.
        </p>
      </Clause>

      <Clause id="contact" title="Privacy and contact">
        <p>
          Personal information connected with your use of our tools is handled under our{' '}
          <a href="/privacy">Privacy Policy</a>. Questions: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </Clause>
    </LegalDoc>
  );
}
