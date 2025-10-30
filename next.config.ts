import path from "path";
import type { NextConfig } from "next";

// Explicitly set Turbopack root to avoid Next inferring the workspace root
// when multiple lockfiles are present on the machine (user-level lockfiles,
// monorepo parents, etc.). Pointing Turbopack to the project directory
// silences warnings and ensures module resolution is stable.
const nextConfig: NextConfig = {
	// Disable Turbopack for local development stability; use webpack.
	// Next's type definitions may not include this experimental flag, so we
	// use a relaxed cast to avoid type errors while keeping runtime behavior.
	// @ts-ignore: next experimental config
	experimental: {
		turbo: false,
	},

	turbopack: {
		root: path.resolve(__dirname),
	},
} as unknown as NextConfig;

export default nextConfig;
