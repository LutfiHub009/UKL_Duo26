import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.image2url.com',
        pathname: '/**',
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
