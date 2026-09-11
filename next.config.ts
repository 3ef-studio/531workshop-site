import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/gallery2",
        destination: "/gallery",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
