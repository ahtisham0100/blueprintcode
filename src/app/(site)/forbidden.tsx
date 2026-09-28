/* 403 page, rendered when a page calls forbidden() (needs
   experimental.authInterrupts in next.config.ts). Used by /blog-preview when
   the preview link is invalid or has expired. */

import type { Metadata } from 'next';
import './(content)/site.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Forbidden() {
  return (
    <main id="main">
      <div className="sheet title-block" style={{ paddingBottom: 96 }}>
        <dl className="stamp">
          <div className="row">
            <dt>STATUS</dt>
            <dd>403 — link invalid or expired</dd>
          </div>
        </dl>
        <h1>This preview link has expired.</h1>
        <p className="standfirst">Preview links last 30 minutes and only open the post they were made for. Open the post in the CMS and click Preview again.</p>
        <div className="actions">
          <a className="button" href="/">
            Back to the site
          </a>
        </div>
      </div>
    </main>
  );
}
