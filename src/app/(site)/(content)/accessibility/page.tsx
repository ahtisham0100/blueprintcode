import LegalDoc, { Clause } from '../_legal/LegalDoc';
import { COMPANY } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';

export const metadata = legalMetadata(
  '/accessibility',
  'Accessibility Statement',
  'Blueprint Code AI’s accessibility commitment for its own website and tools, the standard we work to, known limitations and how to report a problem.',
);

/* Honest by design: this statement does not claim WCAG 2.2 AA conformance,
   because the site has not yet had a full audit. When it has, replace the
   "standard" and "limitations" clauses with the verified level, scope, test
   date, method and the confirmed list of known issues. */
export default function AccessibilityPage() {
  const mail = <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Accessibility problem')}`}>{COMPANY.email}</a>;

  return (
    <LegalDoc
      doc="ACCESSIBILITY STATEMENT"
      title="Accessibility Statement"
      lede="We want everyone to be able to use the BPC website and tools. This is where we stand, and how to tell us when something gets in your way."
      inShort={[
        <>We are working towards WCAG 2.2 Level AA across this website and our tools.</>,
        <>Some areas may not fully meet that standard yet. We are completing a full review and will publish the results here.</>,
        <>If anything is hard to use, email {mail} and we&rsquo;ll help you get what you need another way while we fix it.</>,
      ]}
    >
      <Clause id="approach" title="Our approach">
        <p>
          Blueprint Code AI builds systems that make complex tasks easier to understand and use, and accessibility is part
          of that. We aim to design our own website and tools so that as many people as possible can perceive,
          understand, navigate and interact with them — including people who use a keyboard, screen reader,
          magnification or voice control.
        </p>
      </Clause>

      <Clause id="standard" title="The standard we work to">
        <p>
          We use the Web Content Accessibility Guidelines (WCAG) 2.2 as our reference. We are working towards Level AA
          across blueprintcode.ai and our public tools. Some areas may not yet fully meet that standard.
        </p>
      </Clause>

      <Clause id="what-we-do" title="What we build in">
        <ul>
          <li>Full keyboard operation, with a visible focus indicator and a &ldquo;skip to content&rdquo; link.</li>
          <li>Semantic headings, landmarks and labelled form fields, so assistive technology can describe each page.</li>
          <li>Colour contrast and readable type sizes on a dark background.</li>
          <li>Form errors and status messages that are announced, not just shown.</li>
          <li>Respect for your system&rsquo;s reduced-motion setting.</li>
          <li>Meaningful alternative text for informative images.</li>
          <li>Pages that reflow on small screens and at high zoom.</li>
        </ul>
        <p>
          Automated testing helps us catch some issues, but it doesn&rsquo;t prove conformance on its own, so we also test
          important journeys by hand.
        </p>
      </Clause>

      <Clause id="limitations" title="Known limitations">
        <p>
          We are completing a full accessibility review of the site and will list any confirmed issues here, with what we
          are doing about them. Areas we already know need particular attention:
        </p>
        <ul>
          <li>Interactive 3D and configurator demonstrations, which may be hard to use without a mouse or sight.</li>
          <li>Older static demonstration pages, which were built before our current standards.</li>
        </ul>
      </Clause>

      <Clause id="third-party" title="Third-party content">
        <p>
          Some services or embedded content come from other providers and are outside our direct control. Where one
          creates a significant barrier, we will look for a practical alternative or improvement.
        </p>
      </Clause>

      <Clause id="report" title="Tell us about a problem">
        <p>
          If you have difficulty using any part of our website or tools, or need information in a different format,
          email {mail}. Please tell us the page or tool, and briefly what went wrong.
        </p>
        <p>
          We aim to reply within 5 working days. Where we can&rsquo;t fix something straight away, we&rsquo;ll offer a
          practical alternative — for example, sending the information by email or going through it with you on a call.
        </p>
      </Clause>

      <Clause id="review" title="Review">
        <p>We will update this statement as the site develops and as reviews find improvements. The date at the top shows when it was last revised.</p>
      </Clause>
    </LegalDoc>
  );
}
