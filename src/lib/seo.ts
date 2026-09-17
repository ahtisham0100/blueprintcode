// Shared SEO constants and structured-data builders.
//
// Central home for the one-line positioning statement and the list of
// specialities we want traditional search engines *and* AI answer engines
// (ChatGPT, Perplexity, Google AI Overviews, etc.) to associate with
// Blueprint Code AI. Keeping these in one place means the same wording feeds
// page metadata, keywords, and the JSON-LD an LLM crawler reads.

export const SITE_URL = 'https://blueprintcode.ai';
export const SITE_NAME = 'Blueprint Code AI';

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
