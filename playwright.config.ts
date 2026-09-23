import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL points the suite at an existing server (e.g. production, with
// --grep @readonly). Otherwise Playwright builds and starts its own server
// against a throwaway database — never the real data file. The temp dir is
// made once, in the runner, and inherited by the workers through the env.
const external = process.env.E2E_BASE_URL;
process.env.E2E_DB_DIR ??= mkdtempSync(join(tmpdir(), "crit7-e2e-"));
const PORT = 4410;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: external ?? `http://127.0.0.1:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  webServer: external
    ? undefined
    : {
        command: "pnpm build && node dist/server/entry.mjs",
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          HOST: "127.0.0.1",
          PORT: String(PORT),
          DATABASE_PATH: join(process.env.E2E_DB_DIR, "e2e.db"),
        },
      },
});
