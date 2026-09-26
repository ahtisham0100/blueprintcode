import type { Metadata } from 'next';
import DemosView from './DemosView';
import './demos.css';

export const metadata: Metadata = {
  title: 'Admin — Demos',
  robots: { index: false, follow: false },
};

export default function DemosPage() {
  return <DemosView />;
}
