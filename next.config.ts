import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increase limit for photo uploads
    },
  },
};

export default nextConfig;
