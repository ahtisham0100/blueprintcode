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
      {
        source: "/antera-elevator-configurator-concept",
        destination: "/antera-elevator-configurator-concept/index.html",
      },
      {
        source: "/antera-elevator-configurator-concept/",
        destination: "/antera-elevator-configurator-concept/index.html",
      },
      {
        source: "/bracelet-configurator-baked",
        destination: "/bracelet-configurator-baked/index.html",
      },
      {
        source: "/bracelet-configurator-baked/",
        destination: "/bracelet-configurator-baked/index.html",
      },
    ];
  },
};

export default nextConfig;
