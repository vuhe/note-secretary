import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
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

// biome-ignore lint/style/noDefaultExport: Next.js config
export default nextConfig;
