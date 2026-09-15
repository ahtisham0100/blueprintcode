import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      afterFiles: [
        { source: "/:slug", destination: "/:slug/index.html" },
      ],
    };
  },
};

export default nextConfig;
