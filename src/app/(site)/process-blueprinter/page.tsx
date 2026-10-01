import type { Metadata } from 'next';
import { isBuilderPublic } from '@/lib/flags';
import { OG_DEFAULTS } from '@/lib/seo';
import ProcessBlueprinter from './ProcessBlueprinter';
import './styles.css';

/* /process-blueprinter: "Take the journey" from the homepage hero. Visitors map
   their old road and see their Blueprint Code Road; the last step hands their
   process to Blueprint Builder as its description (or to /contact while the
   builder is not public). Rendered per request so that switch takes effect. */

export const dynamic = 'force-dynamic';

const TITLE = 'Blueprint your current process — Blueprint Code AI';
const DESCRIPTION = 'Map how your process works today and see your Blueprint Code Road: how Blueprint Code would connect it.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://blueprintcode.ai/process-blueprinter' },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, type: 'website', url: 'https://blueprintcode.ai/process-blueprinter' },
};

export default function ProcessBlueprinterPage() {
  return (
    <main id="main">
      <ProcessBlueprinter builderUrl={isBuilderPublic() ? '/builder' : null} />
    </main>
  );
}
