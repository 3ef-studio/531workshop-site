import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/gallery2",
        destination: "/gallery",
        permanent: true,
      },
      {
        // Legacy product-detail path from an earlier version of the site
        // (e.g. /shop/p/cedar-bar-table) — still indexed by Google, 404s
        // today. No 1:1 mapping exists to current product slugs, so send
        // visitors to the shop index instead of a dead end.
        source: "/shop/p/:slug*",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
