import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  // iPhone 14 defaults to webkit; pin chromium, which is the browser Step 1 installs.
  use: { ...devices["iPhone 14"], browserName: "chromium", baseURL: "http://localhost:3100" },
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100/gate",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      GROUP_CODE: "e2e-code",
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-32",
    },
  },
});
