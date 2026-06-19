import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "atlas-id.vercel.app",
      },
    ],
  },
};

export default nextConfig;
