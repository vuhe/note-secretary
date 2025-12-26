import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  distDir: "dist",
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/chat",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
