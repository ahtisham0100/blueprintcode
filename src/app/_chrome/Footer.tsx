'use client';

import { usePathname } from 'next/navigation';
import { chromeFor } from './pages';

/* Global site footer — the "title block" (.tb) drafting strip. DOCUMENT and the
   third column vary per route; STUDIO and CONTACT are constant. */
export default function Footer() {
  const pathname = usePathname();
  const meta = chromeFor(pathname);

  return (
    <footer>
      <div className="sheet tb">
        <div>
          DOCUMENT<b>{meta.doc}</b>
        </div>
        <div>
          STUDIO<b>BLUEPRINT CODE AI</b>
        </div>
        <div>
          {meta.metaKey}
          <b>{meta.metaVal}</b>
        </div>
        <div>
          CONTACT
          <b>
            <a href="mailto:hello@blueprintcode.ai">HELLO@BLUEPRINTCODE.AI</a>
          </b>
        </div>
      </div>
      <div className="sheet foot-index">
        <div className="foot-col">
          <span className="foot-col-key">SERVICES</span>
          <a href="/services/wcag-compliance-audit-pricing">WCAG compliance audit pricing</a>
          <a href="/configurators/3d-product-configurator-development">3D product configurators</a>
          <a href="/configurators/guided-selling-tools">Guided selling tools</a>
          <a href="/pricing">Schedule of rates →</a>
        </div>
        <div className="foot-col">
          <span className="foot-col-key">FIELD NOTES</span>
          <a href="/insights/configurator-cost">What a configurator costs</a>
          <a href="/insights/2d-vs-3d">2D vs 3D configurators</a>
          <a href="/insights/digital-showroom">Digital showrooms</a>
          <a href="/insights/ppav-growth">eBay to multi-market retailer</a>
          <a href="/insights">All entries →</a>
        </div>
        <div className="foot-col">
          <span className="foot-col-key">TRUST</span>
          <a href="/standards-and-credentials">Standards &amp; Credentials</a>
        </div>
      </div>
    </footer>
  );
}
