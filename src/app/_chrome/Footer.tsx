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
          STUDIO<b>BLUEPRINT CODE</b>
        </div>
        <div>
          {meta.metaKey}
          <b>{meta.metaVal}</b>
        </div>
        <div>
          CONTACT
          <b>
            <a href="mailto:james@blueprintcode.ai">JAMES@BLUEPRINTCODE.AI</a>
          </b>
        </div>
      </div>
    </footer>
  );
}
