import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit / API tests. Node environment (no DOM needed — pure functions + route handlers).
// All external systems (Postgres, Resend, Shopify/fetch) are mocked inside the tests;
// nothing here performs a live network call, DB write, or email send.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // Deterministic, obviously-fake configuration. These are NOT real credentials and
    // are never used to reach a real service (every integration is mocked per-test).
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      PGSSLMODE: "disable",
      RESEND_API_KEY: "re_test_dummy_key",
      EMAIL_FROM: "531 Workshop <test@example.test>",
      CONTACT_TO_EMAIL: "owner@example.test",
      SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SHOPIFY_DOMAIN: "test-shop.myshopify.com",
      NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: "test_storefront_token",
    },
  },
});
