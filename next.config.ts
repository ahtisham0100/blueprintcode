import type { NextConfig } from "next";

// Static HTML pages that live in public/<name>/<name>.html.
// Each is served at /<name> and also at /<name>.html so the
// existing relative links inside the pages keep working.
const staticPages = [
  "about",
  "configurators",
  "insights",
  "ppav-case-study",
  "pricing",
  "prototypes",
];

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
