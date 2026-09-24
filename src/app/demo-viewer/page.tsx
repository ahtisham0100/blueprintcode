import type { Metadata } from 'next';
import DemoPlayground from './DemoPlayground';

export const metadata: Metadata = {
  title: 'Demo viewer — Blueprint Code AI',
  description: 'Preview of the reusable sheet-curl demo viewer (curl effect, page-turn sound, video / live toggle).',
  alternates: { canonical: 'https://blueprintcode.ai/demo-viewer' },
};

export default function DemoViewerPage() {
  return <DemoPlayground />;
}
