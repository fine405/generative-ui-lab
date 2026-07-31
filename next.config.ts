import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@earendil-works/pi-ai"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
