import LegalDoc, { Clause, TableWrap, CompanyDetails } from '../_legal/LegalDoc';
import { COMPANY } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';

export const metadata = legalMetadata(
  '/privacy',
  'Privacy Policy',
  'How Blueprint Code AI Ltd collects, uses, stores and protects personal information — what we collect, why, who processes it, how long we keep it and your rights.',
);

const mail = <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>;

export default function PrivacyPage() {
  return (
    <LegalDoc
      doc="PRIVACY POLICY"
      title="Privacy Policy"
      lede="How Blueprint Code AI handles personal information when you visit our website, use our tools, get in touch or work with us."
      inShort={[
        <>We collect what you choose to send us — mainly enquiry details and project information — plus basic technical data needed to run the site securely.</>,
        <>Analytics (Microsoft Clarity) only runs if you allow it. You can change that at any time.</>,
        <>Enquiries that don&rsquo;t turn into a project are deleted after 90 days.</>,
        <>We use a small number of service providers to run the site. Some are in the United States, with legal safeguards in place.</>,
        <><strong>We do not sell personal information.</strong> You can ask to see, correct or delete yours by emailing {mail}.</>,
      ]}
    >
      <Clause id="who-we-are" title="Who we are">
        <p>
          {COMPANY.legalName} (&ldquo;BPC&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a UK solutions architecture
          studio. We design and build digital systems, interactive tools, ecommerce experiences and automation for
          businesses.
        </p>
        <p>
          For the personal information described in this policy, BPC is the controller. Where we process information
          only on a client&rsquo;s instructions as part of a project, the client is the controller and separate data
          processing terms apply.
        </p>
        <CompanyDetails />
      </Clause>

      <Clause id="what-we-collect" title="What we collect">
        <p>Depending on how you interact with us, this may include:</p>
        <ul>
          <li><strong>Enquiry details</strong> — from the project enquiry form and the free accessibility pre-check: your name, company, email address, phone number, location, a description of your project, a website link, any file you attach, and your answers about budget, timeframe and project stage.</li>
          <li><strong>Blueprint Builder account details</strong> — your email address (used to send sign-in links), your organisation, and the project information you enter and choose to send to us.</li>
          <li><strong>Correspondence</strong> — emails and messages you exchange with us.</li>
          <li><strong>Client project information</strong> — files, comments, approvals, specifications and other material needed to deliver work you commission.</li>
          <li><strong>Commercial records</strong> — proposals, quotes, contracts, invoices and payment status.</li>
          <li><strong>Technical information</strong> — IP address, browser and device type, time zone, and request and security logs generated when you use the site.</li>
          <li><strong>Usage information</strong> — only if you allow analytics: how you move through the site, including clicks, scrolling and page visits, recorded by Microsoft Clarity. See our <a href="/cookies">Cookie &amp; Tracking Policy</a>.</li>
        </ul>
        <p>
          The <strong>Process Blueprinter</strong> saves your work in your own browser only. Nothing you enter there is
          sent to us unless you separately choose to share it.
        </p>
        <p>
          We don&rsquo;t ask for, and you shouldn&rsquo;t send us, special category information (such as health
          information) through our website or tools.
        </p>
      </Clause>

      <Clause id="where-it-comes-from" title="Where it comes from">
        <p>
          Mostly directly from you. It can also come from a colleague at your organisation who involves you in a project,
          from your use of our website and tools, or from clients, suppliers and advisers we work with. We may use
          publicly available business information (such as a company website) when preparing for a conversation you have
          asked for.
        </p>
      </Clause>

      <Clause id="how-we-use-it" title="How we use it, and our lawful basis">
        <p>UK data protection law requires a lawful basis for each use. Ours are:</p>
        <TableWrap label="Uses and lawful bases">
          <table>
            <thead>
              <tr><th scope="col">What we do</th><th scope="col">Lawful basis</th></tr>
            </thead>
            <tbody>
              <tr><td>Reply to your enquiry, prepare a proposal or run a pre-check you asked for</td><td>Steps you asked for before a contract; otherwise our legitimate interest in responding to people who contact us</td></tr>
              <tr><td>Provide Blueprint Builder sign-in and keep your projects</td><td>Contract (providing the service you signed up for)</td></tr>
              <tr><td>Deliver, support and invoice client projects</td><td>Contract</td></tr>
              <tr><td>Keep the site secure, prevent abuse and keep technical logs</td><td>Legitimate interests (protecting our services and users)</td></tr>
              <tr><td>Analytics with Microsoft Clarity</td><td>Consent — only if you allow it</td></tr>
              <tr><td>Occasional relevant business updates to business contacts</td><td>Legitimate interests, within electronic marketing rules; you can opt out at any time</td></tr>
              <tr><td>Keep accounting, tax and legal records</td><td>Legal obligation</td></tr>
            </tbody>
          </table>
        </TableWrap>
        <p>
          Where we rely on legitimate interests, we have considered your interests and expectations, and you can object
          at any time.
        </p>
      </Clause>

      <Clause id="marketing" title="Marketing">
        <p>
          We don&rsquo;t use enquiry details for unrelated marketing. If we send you business updates, every message will
          let you opt out, and we follow the Privacy and Electronic Communications Regulations. After an opt-out we keep
          just enough information to make sure we don&rsquo;t contact you again.
        </p>
      </Clause>

      <Clause id="ai-and-automation" title="Automation and AI">
        <p>
          We may use automation and AI tools to help structure information, analyse what you send us, draft material and
          support our own decisions. We don&rsquo;t treat AI output as automatically correct, and a person stays
          responsible for anything we send you or decide about you.
        </p>
        <p>
          We don&rsquo;t make decisions based solely on automated processing that have legal or similarly significant
          effects on you.
        </p>
      </Clause>

      <Clause id="sharing" title="Who we share it with">
        <p>We use these service providers to run our website and business. They process information for us under contract:</p>
        <TableWrap label="Service providers">
          <table>
            <thead>
              <tr><th scope="col">Provider</th><th scope="col">What they do for us</th><th scope="col">Location</th></tr>
            </thead>
            <tbody>
              <tr><td>Vercel Inc.</td><td>Website hosting, request and security logs</td><td>United States and global network</td></tr>
              <tr><td>Neon</td><td>Database hosting for enquiries, Blueprint Builder and our content system</td><td>Cloud hosting (see transfers below)</td></tr>
              <tr><td>Cloudflare, Inc.</td><td>File and media storage (R2)</td><td>United States and global network</td></tr>
              <tr><td>Resend</td><td>Delivery of enquiry notifications and sign-in emails</td><td>United States</td></tr>
              <tr><td>Microsoft (Clarity)</td><td>Website analytics and session recording — only with your consent</td><td>United States</td></tr>
              <tr><td>Google</td><td>Delivers the website&rsquo;s fonts (which means your browser contacts Google&rsquo;s servers); sign-in for BPC staff to our content system</td><td>United States and global network</td></tr>
              <tr><td>Our business email provider</td><td>Email correspondence with you</td><td>Cloud hosting</td></tr>
            </tbody>
          </table>
        </TableWrap>
        <p>
          We may also share information with professional advisers (such as accountants and lawyers), where the law
          requires it, to protect our legal rights, or as part of a genuine sale or restructuring of our business.
        </p>
        <p><strong>We do not sell personal information</strong>, and we don&rsquo;t share it for advertising.</p>
      </Clause>

      <Clause id="transfers" title="International transfers">
        <p>
          Several of our providers are based in, or may process information in, the United States and other countries
          outside the UK. Where UK law requires a safeguard, we rely on one of: the UK Extension to the EU&ndash;US Data
          Privacy Framework (the &ldquo;UK&ndash;US data bridge&rdquo;) where the provider is certified under it; the
          ICO&rsquo;s International Data Transfer Agreement or Addendum to the EU Standard Contractual Clauses; or another
          transfer mechanism permitted by law. Contact us if you would like more detail.
        </p>
      </Clause>

      <Clause id="retention" title="How long we keep it">
        <TableWrap label="Retention periods">
          <table>
            <thead>
              <tr><th scope="col">Information</th><th scope="col">How long</th></tr>
            </thead>
            <tbody>
              <tr><td>Enquiries, pre-check requests and Builder submissions that don&rsquo;t become a project</td><td>90 days from receipt</td></tr>
              <tr><td>Client project records</td><td>The life of the project, then 6 years (the usual period for contract claims)</td></tr>
              <tr><td>Accounting and transaction records</td><td>6 years from the end of the financial year they relate to</td></tr>
              <tr><td>Blueprint Builder accounts</td><td>While the account is in use; deleted on request</td></tr>
              <tr><td>Server and security logs</td><td>Short-term, normally no more than 90 days</td></tr>
              <tr><td>Clarity analytics (with consent)</td><td>Held by Microsoft: session recordings up to 30 days, aggregated reports up to 13 months</td></tr>
              <tr><td>Marketing opt-out records</td><td>For as long as needed to respect the opt-out</td></tr>
            </tbody>
          </table>
        </TableWrap>
        <p>We may keep anonymised or aggregated information that no longer identifies anyone.</p>
      </Clause>

      <Clause id="security" title="Security">
        <p>
          We use proportionate technical and organisational measures to protect personal information, including
          encrypted connections, access controls, short-lived single-use sign-in links and signed session cookies. No
          internet-connected system can be guaranteed completely secure. Please keep access to your email account secure,
          as Blueprint Builder sign-in links are sent there.
        </p>
      </Clause>

      <Clause id="your-rights" title="Your rights">
        <p>
          Under UK data protection law you have the right to access your information; to have it corrected or erased;
          to restrict or object to how we use it; to receive certain information in a portable form; and to withdraw
          consent where we rely on it. Some rights depend on the circumstances.
        </p>
        <p>
          To use any of these rights, email {mail}. We will respond within one month, and we won&rsquo;t charge you in
          normal circumstances. We may need to confirm your identity first.
        </p>
        <p>
          If you are in the European Union, you have equivalent rights under the EU GDPR, and you can contact us in the
          same way.
        </p>
      </Clause>

      <Clause id="complaints" title="Complaints">
        <p>
          You can complain to the UK Information Commissioner&rsquo;s Office at{' '}
          <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer">ico.org.uk/make-a-complaint</a> or on
          0303 123 1113. We&rsquo;d appreciate the chance to put things right first, but you don&rsquo;t have to contact
          us before going to the ICO.
        </p>
      </Clause>

      <Clause id="children" title="Children">
        <p>Our website and services are for businesses and are not aimed at children. We don&rsquo;t knowingly collect information from anyone under 18.</p>
      </Clause>

      <Clause id="other-sites" title="Other websites">
        <p>Websites and services we link to have their own privacy information, which applies when you use them.</p>
      </Clause>

      <Clause id="changes" title="Changes and contact">
        <p>
          We will update this policy as our services, technology or the law change; the date at the top shows the latest
          revision. Questions about this policy or your information: {mail}, or write to {COMPANY.legalName},{' '}
          {COMPANY.office}.
        </p>
      </Clause>
    </LegalDoc>
  );
}
