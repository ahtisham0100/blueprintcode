import type { NextConfig } from "next";

// The former "content pages" (about, configurators, insights, ppav-case-study,
// pricing, prototypes) are now native Next.js routes under src/app, so they are
// no longer rewritten to the static HTML in public/<name>/<name>.html. Those
// files remain on disk for reference but are not served at /<name> anymore.
const staticPages: string[] = [];

// Static demo folders that live in public/<name>/index.html.
const staticDemos = [
  "aura-mirror-demo",
  "antera-elevator-configurator-concept",
  "bracelet-configurator-baked",
  "maison-cacao-demo-suite",
  "maison-cacao-dashboard-demo",
  "maison-cacao-order-operations",
  "maison-cacao-customer-segmentation",
  "premium-muay-thai-customiser",
  "max-kpi-japan",
  "signet-ring-configurator-demo-3",
  "signet-ring-configurator-demo",
];

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // The home page is now the React route src/app/page.tsx, so the "/"
      // rewrite to public/index/index.html has been removed. The old static
      // file still lives at public/index/index.html for reference.
      afterFiles: [
        ...staticPages.flatMap((name) => [
          { source: `/${name}`, destination: `/${name}/${name}.html` },
          { source: `/${name}.html`, destination: `/${name}/${name}.html` },
        ]),
        ...staticDemos.map((name) => ({
          source: `/${name}`,
          destination: `/${name}/index.html`,
        })),
      ],
    };
  },
};

export default nextConfig;
