import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// Security response headers, applied to every route. A crawl flagged all four
// as missing. None of them are ranking factors — this is ordinary hardening,
// not SEO.
//
// X-Frame-Options is SAMEORIGIN rather than DENY on purpose: /prototypes and
// the demo viewer embed the static demos at /<slug> in a same-origin iframe
// (see src/app/_demo-viewer/ and the is-embedded script in layout.tsx), and
// DENY would break them. If a client ever needs to embed a demo on THEIR
// domain, drop this header for that route and use a CSP frame-ancestors
// directive naming the permitted origins instead — don't loosen it globally.
//
// Content-Security-Policy is deliberately absent. A strict policy needs nonce
// plumbing for the inline scripts in layout.tsx and white-screens the site if
// it is wrong, so it belongs in its own change with its own testing.
//
// Strict-Transport-Security is already supplied by Vercel, so it isn't repeated
// here.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    // "/:path*" matches the root as well as every nested path.
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    // Service pages moved from /configurators/* to /services/*. Permanent
    // (308) so search engines transfer the old URLs' ranking to the new ones.
    return [
      {
        source: "/configurators/3d-product-configurator-development",
        destination: "/services/3d-product-configurator-development",
        permanent: true,
      },
      {
        source: "/configurators/guided-selling-tools",
        destination: "/services/guided-selling-tools",
        permanent: true,
      },
      // The site used to be static HTML served at /<page>.html and
      // /index.html. Google still has those URLs; 308 them to the clean routes
      // instead of letting them 404.
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      {
        source: "/:page(about|configurators|insights|ppav-case-study|pricing|prototypes|contact)\\.html",
        destination: "/:page",
        permanent: true,
      },
      // Renamed demos.
      {
        source: "/no1-premium-muay-thai-customiser",
        destination: "/premium-muay-thai-customiser",
        permanent: true,
      },
      {
        source: "/signet-ring-configurator-demo-3",
        destination: "/signet-ring-configurator",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return {
      // Static demos live at public/<slug>/index.html and are served at /<slug>.
      // This single wildcard replaces the old per-demo list: any /<slug> that
      // isn't a real route or file falls through to its index.html, so adding a
      // demo needs NO config change — just add public/<slug>/index.html (e.g.
      // via the /admin uploader) and it goes live on the next deploy.
      //
      // Real routes (/, /about, /prototypes, /api/*, …) and real public files
      // (/robots.txt, /site.css, …) are matched before these afterFiles rewrites,
      // so they always win; only leftover single-segment paths reach this rule.
      //
      // DYNAMIC routes are matched AFTER afterFiles, so /cms (Payload's
      // [[...segments]] catch-all) must be excluded here or it becomes
      // /cms/index.html and 404s. The site's own [...missing] catch-all is
      // fine: it only wants what nothing else claimed.
      afterFiles: [
        { source: "/:slug((?!cms$)[^/]+)", destination: "/:slug/index.html" },
      ],
    };
  },
};

// withPayload adds the bundler settings the Payload admin at /cms needs; it
// leaves the headers/redirects/rewrites above untouched.
export default withPayload(nextConfig);
