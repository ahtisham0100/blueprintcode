import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import { mediaHostForRewrite } from "./src/cms/media/urls";
import { listStaticDemoSlugs, staticDemoRewriteSource } from "./src/lib/staticDemos";
import path from "node:path";

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

const staticDemoSource = staticDemoRewriteSource(listStaticDemoSlugs(path.join(process.cwd(), "public")));

const nextConfig: NextConfig = {
  // forbidden() → 403 with (site)/forbidden.tsx. Used only by /blog-preview
  // for invalid or expired preview links.
  experimental: { authInterrupts: true },

  // Database demos are rendered at request time with the shared header and
  // footer partials; make sure those files ship with the serverless
  // functions that read them (src/cms/demos/partials.ts).
  outputFileTracingIncludes: {
    "/[slug]": ["./public/partials/site-header.html", "./public/partials/site-footer.html"],
    "/demo-preview/[id]": ["./public/partials/site-header.html", "./public/partials/site-footer.html"],
  },

  images: {
    // The homepage hero is served from the media library on the media host.
    remotePatterns: [{ protocol: "https", hostname: "media.blueprintcode.ai", pathname: "/media/**" }],
  },

  async headers() {
    // "/:path*" matches the root as well as every nested path.
    return [
      { source: "/:path*", headers: securityHeaders },
      // Post previews (a page, so it cannot set these itself): never cached,
      // never indexed. Demo previews set the same headers in their route.
      {
        source: "/blog-preview/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
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
    // media.<domain>/<key> → the /media route, for every path on that host.
    // Host-matched so it never touches the main site; absent in local dev,
    // where MEDIA_PUBLIC_URL points at localhost:5000/media directly.
    const mediaHost = mediaHostForRewrite();
    return {
      beforeFiles: mediaHost
        ? [{ source: "/:path*", has: [{ type: "host", value: mediaHost }], destination: "/media/:path*" }]
        : [],
      // Legacy static demos live at public/<slug>/index.html and are served at
      // /<slug>. The rewrite names exactly those slugs (discovered at build
      // time by src/lib/staticDemos.ts), so:
      //   - a static demo is served before any dynamic route (it wins), and
      //   - every other single-segment path reaches the dynamic [slug] route,
      //     where demos published from the CMS live (behind CMS_PUBLIC).
      // A demo added via the old /admin uploader is a commit, hence a rebuild,
      // so the list is always current.
      afterFiles: staticDemoSource ? [{ source: staticDemoSource, destination: "/:slug/index.html" }] : [],
    };
  },
};

// withPayload adds the bundler settings the Payload admin at /cms needs; it
// leaves the headers/redirects/rewrites above untouched.
export default withPayload(nextConfig);
