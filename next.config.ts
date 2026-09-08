import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/aura-mirror-demo",
        destination: "/aura-mirror-demo/index.html",
      },
      {
        source: "/aura-mirror-demo/",
        destination: "/aura-mirror-demo/index.html",
      },
    ];
  },
};

export default nextConfig;
