import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["spec/**/*.test.ts", "scripts/**/*.test.ts"],
    // Browser checks run with `pnpm test:e2e` (Playwright), never here.
    exclude: [...configDefaults.exclude, "e2e/**"],
    globalSetup: ["./spec/global-setup.ts"],
  },
});
