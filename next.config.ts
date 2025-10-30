import path from "path";
import type { NextConfig } from "next";

// Explicitly set Turbopack root to avoid Next inferring the workspace root
// when multiple lockfiles are present on the machine (user-level lockfiles,
// monorepo parents, etc.). Pointing Turbopack to the project directory
// silences warnings and ensures module resolution is stable.
const nextConfig: NextConfig = {
	turbopack: {
		root: path.resolve(__dirname),
	},
} as unknown as NextConfig;

export default nextConfig;
