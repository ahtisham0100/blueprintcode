import type { Metadata } from 'next';
import LeadsView from './LeadsView';
import './leads.css';

export const metadata: Metadata = {
  title: 'Admin — Leads',
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return <LeadsView />;
}
