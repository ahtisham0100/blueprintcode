/* Single source of truth for the per-route chrome data: the header "mark" label,
   the footer document/meta fields, and which nav link is current. Consumed by
   Header.tsx and Footer.tsx via chromeFor(pathname). */

export type NavKey =
  | 'configurators'
  | 'prototypes'
  | 'ppav-case-study'
  | 'pricing'
  | 'insights'
  | 'about';

export interface ChromeMeta {
  /** Small label shown next to the wordmark in the header. */
  label: string;
  /** Footer DOCUMENT value. */
  doc: string;
  /** Footer third column key/value (STUDIO and CONTACT are constant). */
  metaKey: string;
  metaVal: string;
  /** Which primary nav item to mark aria-current, if any. */
  current?: NavKey;
}

const PAGES: Record<string, ChromeMeta> = {
  '/': {
    label: 'BUILD SYSTEMS / 2026',
    doc: 'BLUEPRINT CODE',
    metaKey: 'DIRECTION',
    metaVal: 'UK — MONMOUTHSHIRE',
  },
  '/about': {
    label: 'ABOUT',
    doc: 'ABOUT',
    metaKey: 'DIRECTION',
    metaVal: 'UK — MONMOUTHSHIRE',
    current: 'about',
  },
  '/configurators': {
    label: 'CONFIGURATORS',
    doc: 'CONFIGURATORS & COMMERCE TOOLS',
    metaKey: 'WORKED EXAMPLE',
    metaVal: 'PP-AV — 5 CONNECTED TOOLS',
    current: 'configurators',
  },
  '/insights': {
    label: 'FIELD NOTES',
    doc: 'FIELD NOTES',
    metaKey: 'ENTRIES',
    metaVal: '2026 — 04 PUBLISHED',
    current: 'insights',
  },
  '/ppav-case-study': {
    label: 'DWG PP-AV',
    doc: 'PP-AV DIGITAL SHOWROOM',
    metaKey: 'DISCIPLINE',
    metaVal: 'INTERACTIVE COMMERCE',
    current: 'ppav-case-study',
  },
  '/pricing': {
    label: 'RATES 2026',
    doc: 'SCHEDULE OF RATES',
    metaKey: 'ISSUE',
    metaVal: '2026 — SHEETS 01/06',
    current: 'pricing',
  },
  '/prototypes': {
    label: 'PROTOTYPE REGISTER',
    doc: 'PROTOTYPE REGISTER',
    metaKey: 'DISCIPLINE',
    metaVal: 'INTERACTIVE COMMERCE',
    current: 'prototypes',
  },
};

const FALLBACK: ChromeMeta = PAGES['/'];

export function chromeFor(pathname: string): ChromeMeta {
  return PAGES[pathname] ?? FALLBACK;
}

/** Primary nav items, in order. */
export const NAV: { key: NavKey; href: string; label: string }[] = [
  { key: 'configurators', href: '/configurators', label: 'Configurators' },
  { key: 'prototypes', href: '/prototypes', label: 'Prototypes' },
  { key: 'ppav-case-study', href: '/ppav-case-study', label: 'Case study' },
  { key: 'pricing', href: '/pricing', label: 'Pricing' },
  { key: 'insights', href: '/insights', label: 'Insights' },
  { key: 'about', href: '/about', label: 'About' },
];
