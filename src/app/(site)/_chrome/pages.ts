/* Single source of truth for the per-route chrome data: the header "mark" label,
   the footer document/meta fields, and which nav link is current. Consumed by
   Header.tsx and Footer.tsx via chromeFor(pathname). */

export type NavKey =
  | 'tools'
  | 'configurators'
  | 'prototypes'
  | 'process-blueprinter'
  | 'wcag-scanner'
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
    label: 'INTELLIGENCE SYSTEMS',
    doc: 'BLUEPRINT CODE AI',
    metaKey: 'DIRECTION',
    metaVal: 'UK & GLOBAL',
  },
  '/tools': {
    label: 'BPC TOOLS',
    doc: 'BPC TOOLS — INTERACTIVE SYSTEMS',
    metaKey: 'DISCIPLINE',
    metaVal: 'INTERACTIVE COMMERCE',
    current: 'tools',
  },
  '/about': {
    label: 'ABOUT',
    doc: 'ABOUT',
    metaKey: 'DIRECTION',
    metaVal: 'UK & GLOBAL',
    current: 'about',
  },
  '/contact': {
    label: 'START A PROJECT',
    doc: 'PROJECT ENQUIRY',
    metaKey: 'REF',
    metaVal: 'BPC-ENQ',
  },
  '/configurators': {
    label: 'CONFIGURATORS',
    doc: 'CONFIGURATORS & COMMERCE TOOLS',
    metaKey: 'WORKED EXAMPLE',
    metaVal: 'PP-AV — 5 CONNECTED TOOLS',
    current: 'configurators',
  },
  '/process-blueprinter': {
    label: 'PROCESS BLUEPRINTER',
    doc: 'PROCESS BLUEPRINTER',
    metaKey: 'DISCIPLINE',
    metaVal: 'INTERACTIVE COMMERCE',
    current: 'process-blueprinter',
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
    metaVal: '2026 — SHEETS 01/07',
    current: 'pricing',
  },
  '/services': {
    label: 'SERVICES',
    doc: 'SERVICES INDEX',
    metaKey: 'ISSUE',
    metaVal: '2026 — PUBLISHED RATES',
  },
  '/services/website-accessibility-audit': {
    label: 'WCAG SCANNER',
    doc: 'WEBSITE ACCESSIBILITY AUDIT',
    metaKey: 'STANDARD',
    metaVal: 'WCAG 2.2 AA — FREE PRE-CHECK',
    current: 'wcag-scanner',
  },
  '/services/wcag-compliance-audit-pricing': {
    label: 'WCAG AUDIT PRICING',
    doc: 'WCAG COMPLIANCE AUDIT PRICING',
    metaKey: 'STANDARD',
    metaVal: 'WCAG 2.2 AA — ADA · AODA · SEBI',
    current: 'pricing',
  },
  '/prototypes': {
    label: 'PROTOTYPE REGISTER',
    doc: 'PROTOTYPE REGISTER',
    metaKey: 'DISCIPLINE',
    metaVal: 'INTERACTIVE COMMERCE',
    current: 'prototypes',
  },
  '/standards-and-credentials': {
    label: 'STANDARDS & CREDENTIALS',
    doc: 'STANDARDS & CREDENTIALS',
    metaKey: 'SCOPE',
    metaVal: 'COMPANY & INDIVIDUAL',
  },
  '/legal': {
    label: 'LEGAL',
    doc: 'LEGAL & COMPANY',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
  '/privacy': {
    label: 'LEGAL',
    doc: 'PRIVACY POLICY',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
  '/cookies': {
    label: 'LEGAL',
    doc: 'COOKIE & TRACKING POLICY',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
  '/terms': {
    label: 'LEGAL',
    doc: 'WEBSITE TERMS OF USE',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
  '/accessibility': {
    label: 'LEGAL',
    doc: 'ACCESSIBILITY STATEMENT',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
  '/tool-terms': {
    label: 'LEGAL',
    doc: 'AUTOMATED TOOLS & SCANNER TERMS',
    metaKey: 'ISSUER',
    metaVal: 'BLUEPRINT CODE AI LTD — NO. 17490525',
  },
};

const FALLBACK: ChromeMeta = PAGES['/'];

export function chromeFor(pathname: string): ChromeMeta {
  return PAGES[pathname] ?? FALLBACK;
}

export interface NavLink {
  key: NavKey;
  href: string;
  label: string;
  /** One-line description, shown under the label inside a dropdown. */
  note?: string;
}

export interface NavItem extends NavLink {
  /** Sub-links revealed on hover/focus; the item itself stays a link. */
  children?: NavLink[];
}

/** The Tools category: the BPC Tools overview (the former homepage) and the
 *  tool pages that used to sit at the top level of the nav. Shared by the
 *  header dropdown and the footer TOOLS column. */
export const TOOLS_NAV: NavLink[] = [
  { key: 'tools', href: '/tools', label: 'BPC Tools overview', note: 'Configurators, commerce and AI systems' },
  { key: 'configurators', href: '/configurators', label: 'Configurators', note: 'Six tool types, one connected system' },
  { key: 'prototypes', href: '/prototypes', label: 'Prototypes', note: 'Working prototypes you can try' },
  { key: 'process-blueprinter', href: '/process-blueprinter', label: 'Process Blueprinter', note: 'Map your old road, see the Blueprint Code road' },
  { key: 'wcag-scanner', href: '/services/website-accessibility-audit#scan', label: 'WCAG Scanner', note: 'Free WCAG 2.2 AA pre-check for any website' },
];

/** Primary nav items, in order. */
export const NAV: NavItem[] = [
  { key: 'tools', href: '/tools', label: 'Tools', children: TOOLS_NAV },
  { key: 'ppav-case-study', href: '/ppav-case-study', label: 'Case study' },
  { key: 'pricing', href: '/pricing', label: 'Pricing' },
  { key: 'insights', href: '/insights', label: 'Insights' },
  { key: 'about', href: '/about', label: 'About' },
];
