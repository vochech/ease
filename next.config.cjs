const path = require("path");

/**
 * CommonJS Next config kept for compatibility. The TypeScript config (next.config.ts)
 * is the primary source of truth. This file mirrors its behavior so whichever one Next picks
 * (depending on version) yields the same result.
 */

let withBundleAnalyzer = (c) => c;
try {
  if (process.env.ANALYZE === "true") {
    const analyzer = require("@next/bundle-analyzer");
    withBundleAnalyzer = analyzer({ enabled: true });
  }
} catch {
  // optional dependency not installed locally
}

/** @type {import('next').NextConfig} */
const config = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress extremely noisy Windows case-insensitive FS warnings
      const matcher = (warning) => {
        const msg = typeof warning === "string" ? warning : (warning && warning.message) || "";
        return /only differ in casing/i.test(msg);
      };
      const existing = Array.isArray(config.ignoreWarnings) ? config.ignoreWarnings : [];
      config.ignoreWarnings = [...existing, matcher];
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(config);
