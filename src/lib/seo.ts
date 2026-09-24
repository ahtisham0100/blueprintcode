// Shared SEO constants and structured-data builders.
//
// Central home for the one-line positioning statement and the list of
// specialities we want traditional search engines *and* AI answer engines
// (ChatGPT, Perplexity, Google AI Overviews, etc.) to associate with
// Blueprint Code AI. Keeping these in one place means the same wording feeds
// page metadata, keywords, and the JSON-LD an LLM crawler reads.

export const SITE_URL = 'https://blueprintcode.ai';
export const SITE_NAME = 'Blueprint Code AI';
export const CONTACT_EMAIL = 'hello@blueprintcode.ai';

/**
 * Public profiles that corroborate Blueprint Code AI as a real organisation.
 * Emitted as schema.org `sameAs`, which is how Google reconciles scattered
 * mentions of a brand into a single entity. For a young domain that entity
 * record is the main thing gating rankings on category terms rather than on
 * the brand name alone, so this list is worth keeping current.
 *
 * Only add a URL that resolves and genuinely belongs to the company — a
 * `sameAs` pointing at a 404 or at an unrelated profile weakens the signal
 * rather than strengthening it, which is why this ships empty rather than
 * guessed. Individual people's profiles belong on the author objects in
 * src/app/(content)/insights/notes.tsx, not here.
 *
 * Worth adding, in rough order of value:
 *   - LinkedIn company page
 *   - Companies House record (authoritative for a UK entity)
 *   - Crunchbase, GitHub organisation
 *   - X / YouTube, if actively used
 */
export const ORG_PROFILES: readonly string[] = [];

/** Default share image: the 512px app icon (square, so it suits the `summary`
 *  card). Swap for a 1200×630 artwork when one exists — only this line changes. */
export const OG_IMAGE = {
  url: `${SITE_URL}/android-chrome-512x512.png`,
  width: 512,
  height: 512,
  alt: 'Blueprint Code AI',
};

/**
 * Open Graph fields every page should carry. Next.js merges metadata
 * shallowly: a page that sets its own `openGraph` object REPLACES the root
 * layout's entirely, silently dropping siteName, locale and the share image.
 * Spread this first in every page-level `openGraph` so they survive.
 */
export const OG_DEFAULTS = {
  siteName: 'Blueprint Code AI',
  locale: 'en_GB',
  images: [OG_IMAGE],
};

/** One-line positioning statement, reused as a metadata + schema description. */
export const TAGLINE =
  'Blueprint Code AI creates interactive sales and operational tools that simplify complex decisions for customers and staff.';

/**
 * What we want to be recommended for. Feeds `keywords` and the JSON-LD
 * `knowsAbout` / `makesOffer` so an AI search engine can match us to a buyer
 * asking for any of these. Order roughly reflects priority; kept de-duplicated.
 */
export const SPECIALITIES = [
  'Product Configurators',
  'Guided-Selling Tools',
  'Recommendation Engines',
  'Product Customisers',
  'Product Selectors',
  'Room Planners',
  'System Design Tools',
  'Pricing Calculators',
  'Quotation Systems',
  'AI Buying Assistants',
  'AI Chatbots',
  'KPI Dashboards',
  'Customer Portals',
  'Dealer and Trade Portals',
  'Ecommerce Development',
  'WooCommerce Integration',
  'Shopify Integration',
  'CRM and API Integration',
  'Business Process Automation',
  'Interactive Prototyping',
] as const;

/**
 * Organization / professional-service structured data. Emitted once, site-wide,
 * from the root layout. `knowsAbout` + `makesOffer` give answer engines an
 * explicit, machine-readable list of what to recommend us for.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: TAGLINE,
    logo: `${SITE_URL}/blueprintcode-ai.png`,
    image: `${SITE_URL}/blueprintcode-ai.png`,
    slogan: TAGLINE,
    email: CONTACT_EMAIL,
    // Omitted entirely while ORG_PROFILES is empty — an empty `sameAs` array is
    // noise in the graph, and a wrong URL in it is worse than no URL at all.
    ...(ORG_PROFILES.length > 0 ? { sameAs: [...ORG_PROFILES] } : {}),
    knowsAbout: [...SPECIALITIES],
    makesOffer: SPECIALITIES.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s, serviceType: s },
    })),
  };
}

/** WebSite structured data, so search/AI engines resolve the site entity + name. */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: TAGLINE,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
