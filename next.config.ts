import type { NextConfig } from "next";
import path from "path";

let withBundleAnalyzer: (c: NextConfig) => NextConfig;
try {
  // Only require when ANALYZE to avoid optional dep in local dev
  if (process.env.ANALYZE === "true") {
    const analyzer = require("@next/bundle-analyzer");
    withBundleAnalyzer = analyzer({ enabled: true });
  } else {
    withBundleAnalyzer = (c: NextConfig) => c;
  }
} catch {
  withBundleAnalyzer = (c: NextConfig) => c;
}

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Turbopack root is picked up consistently
    root: path.resolve(__dirname),
  },
  experimental: {
    // Reduce client bundle by modularizing heavy packages
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config, { dev }) => {
    // Keep webpack config minimal; rely on Next's built-in React dedupe
    if (dev) {
      // Suppress extremely noisy Windows case-insensitive FS warnings
      // "There are multiple modules with names that only differ in casing."
      const matcher = (warning: unknown) => {
        const msg = typeof warning === "string" ? warning : (warning as { message?: string })?.message || "";
        return /only differ in casing/i.test(msg);
      };
      const existing = Array.isArray((config as any).ignoreWarnings) ? (config as any).ignoreWarnings : [];
      (config as any).ignoreWarnings = [...existing, matcher];
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
