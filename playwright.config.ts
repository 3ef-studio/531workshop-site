import { defineConfig, devices } from "@playwright/test";

// Lightweight browser smoke tests. These never submit the contact form to a backend
// and never trigger a real Shopify checkout; e2e/fixtures.ts blocks every third-party
// request so the suite makes no external network calls.
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // In CI the build step already ran; locally, build first so `npm run test:e2e`
    // works from a clean tree.
    command: process.env.CI ? "npm run start" : "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Obviously-fake values so the server never uses real credentials even if a local
    // .env is present. NEXT_PUBLIC_* are build-time inlined; runtime-only vars still win.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      RESEND_API_KEY: "re_test_dummy_key",
      EMAIL_FROM: "531 Workshop <test@example.test>",
      CONTACT_TO_EMAIL: "owner@example.test",
      NEXT_PUBLIC_SITE_URL: baseURL,
      SITE_URL: baseURL,
      NEXT_PUBLIC_SHOPIFY_DOMAIN: "test-shop.myshopify.com",
      NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: "test_storefront_token",
    },
  },
});
