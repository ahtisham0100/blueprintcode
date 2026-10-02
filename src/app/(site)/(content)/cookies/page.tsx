import LegalDoc, { Clause, TableWrap } from '../_legal/LegalDoc';
import { COMPANY } from '../_legal/company';
import { legalMetadata } from '../_legal/meta';
import { CookieSettingsButton } from '../../_chrome/Consent';

export const metadata = legalMetadata(
  '/cookies',
  'Cookie & Tracking Policy',
  'The cookies and similar technologies blueprintcode.ai uses, what each is for, how long it lasts, and how to allow or reject optional analytics.',
);

/* The register below was taken from the code (cookie names and lifetimes) and
   Microsoft's Clarity documentation. If a cookie or storage key is added or
   removed anywhere on the public site, update this table — and if it is
   optional, bump CONSENT_VERSION in _chrome/Consent.tsx so visitors are asked
   again. */
const NECESSARY: [string, string, string, string][] = [
  ['bpc-consent', 'Remembers your cookie choice so we don’t ask on every page', '6 months', 'First party'],
  ['bpcb-client', 'Keeps you signed in to Blueprint Builder (only set if you sign in)', '14 days', 'First party'],
  ['bpcb-review', 'Keeps a BPC reviewer signed in to one Builder project (BPC staff only)', '4 hours', 'First party'],
  ['bpc-token, bpc-oauth-state, bpc-oauth-nonce', 'Sign-in and security for BPC staff on our content system (staff only)', '8 hours / 10 minutes', 'First party'],
];

const FUNCTIONAL: [string, string, string][] = [
  ['bpc-viewer-sound', 'Remembers whether you turned sound off in the demo viewer', 'Until you clear it'],
  ['bpc-blueprinter:1', 'Saves your Process Blueprinter work in your browser so it’s there when you return. It is never sent to us.', 'Until you clear it'],
];

const ANALYTICS: [string, string, string, string][] = [
  ['_clck', 'Keeps the same anonymous Clarity user ID across visits', '1 year', 'First party'],
  ['_clsk', 'Joins page views into a single session recording', '1 day', 'First party'],
  ['CLID', 'Identifies the first time Clarity saw this browser', '1 year', 'Third party (Microsoft)'],
  ['MUID', 'Microsoft browser identifier used for site analytics', '1 year', 'Third party (Microsoft)'],
  ['ANONCHK, MR, SM', 'Microsoft housekeeping for the MUID cookie', 'Up to 7 days', 'Third party (Microsoft)'],
];

export default function CookiesPage() {
  return (
    <LegalDoc
      doc="COOKIE & TRACKING POLICY"
      title="Cookie & Tracking Policy"
      lede="What blueprintcode.ai stores on or reads from your device, why, and how you stay in control."
      inShort={[
        <>The site needs a few cookies to work — mainly to keep you signed in and to remember your cookie choice. These can&rsquo;t be switched off.</>,
        <>The only optional technology is <strong>Microsoft Clarity</strong> analytics. It stays off unless you select &ldquo;Allow analytics&rdquo;.</>,
        <>We don&rsquo;t use advertising or marketing cookies.</>,
        <>You can change your choice at any time with the &ldquo;Cookie settings&rdquo; link in the footer, or the button below.</>,
      ]}
    >
      <Clause id="what-they-are" title="What cookies and similar technologies are">
        <p>
          Cookies are small pieces of information a website stores on your device. Websites also use similar
          technologies, such as browser storage (&ldquo;local storage&rdquo;) and scripts that read device information.
          This policy covers all of them, and we call them &ldquo;cookies&rdquo; unless the difference matters.
        </p>
      </Clause>

      <Clause id="necessary" title="Strictly necessary">
        <p>
          These are needed for the site and the features you ask for to work, so the law doesn&rsquo;t require your
          consent for them. Most visitors only ever receive the first one.
        </p>
        <TableWrap label="Strictly necessary cookies">
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th><th scope="col">Set by</th></tr>
            </thead>
            <tbody>
              {NECESSARY.map(([name, purpose, duration, party]) => (
                <tr key={name}><td><code>{name}</code></td><td>{purpose}</td><td>{duration}</td><td>{party}</td></tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Clause>

      <Clause id="functional" title="Functional (stored in your browser)">
        <p>
          These remember things you have done on the site, only on your device. They are set only when you use the
          feature concerned, and nothing in them is sent to us.
        </p>
        <TableWrap label="Functional browser storage">
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th></tr>
            </thead>
            <tbody>
              {FUNCTIONAL.map(([name, purpose, duration]) => (
                <tr key={name}><td><code>{name}</code></td><td>{purpose}</td><td>{duration}</td></tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Clause>

      <Clause id="analytics" title="Analytics (optional)">
        <p>
          With your permission, we use Microsoft Clarity to understand how people use the site so we can improve it.
          Clarity records how you interact with pages — clicks, scrolling, mouse movement and the pages you visit — and
          produces heatmaps and session replays. By default, Clarity masks what you type into form fields. Microsoft&rsquo;s own
          privacy statement also applies:{' '}
          <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">privacy.microsoft.com</a>.
        </p>
        <p>
          Clarity is not loaded at all until you select &ldquo;Allow analytics&rdquo;. If you reject it, or later
          withdraw, none of these cookies are set by our site.
        </p>
        <TableWrap label="Analytics cookies">
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th><th scope="col">Set by</th></tr>
            </thead>
            <tbody>
              {ANALYTICS.map(([name, purpose, duration, party]) => (
                <tr key={name}><td><code>{name}</code></td><td>{purpose}</td><td>{duration}</td><td>{party}</td></tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Clause>

      <Clause id="marketing" title="Marketing">
        <p>We don&rsquo;t use advertising, retargeting or marketing cookies.</p>
      </Clause>

      <Clause id="your-choices" title="Your choices">
        <p>
          You choose on your first visit, and can change your mind at any time — withdrawing is as easy as agreeing. When
          you withdraw, we ask Clarity to delete its cookies and stop recording.
        </p>
        <p><CookieSettingsButton className="link-button">Change my cookie settings</CookieSettingsButton></p>
        <p>
          We ask again after six months, or sooner if we add a new optional technology. Your browser also lets you
          block or delete cookies; blocking the necessary ones may stop sign-in from working.
        </p>
      </Clause>

      <Clause id="third-parties" title="Fonts and other third parties">
        <p>
          The site&rsquo;s fonts are delivered by Google Fonts, so your browser contacts Google&rsquo;s servers when a
          page loads. Google Fonts does not set cookies.
        </p>
      </Clause>

      <Clause id="changes" title="Changes and contact">
        <p>
          We update this policy when our website, providers or the rules change. Questions:{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. See also our <a href="/privacy">Privacy Policy</a>.
        </p>
      </Clause>
    </LegalDoc>
  );
}
