import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const REPO = "lifeboard";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${REPO}` : undefined,
  assetPrefix: isProd ? `/${REPO}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
