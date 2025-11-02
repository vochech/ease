// ESLint 9 flat config - minimal setup for Next.js TypeScript
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: null,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    rules: {
      // Baseline syntax check only - no style rules to avoid noise
    },
  },
];
