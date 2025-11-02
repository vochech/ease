import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "node_modules/react/jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": path.resolve(
        __dirname,
        "node_modules/react/jsx-dev-runtime.js",
      ),
      "@/components": path.resolve(__dirname, "components"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/hooks": path.resolve(__dirname, "hooks"),
      "@/types": path.resolve(__dirname, "types"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
});
