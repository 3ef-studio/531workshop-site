import { test as base, expect } from "@playwright/test";

/**
 * Test fixture that blocks every non-localhost request. This guarantees the smoke
 * suite makes no third-party network calls: the Shopify Buy Button SDK
 * (sdks.shopifycdn.com), the storefront domain (*.myshopify.com), YouTube embeds,
 * Google Tag Manager, etc. are all aborted. The app is expected to degrade
 * gracefully (empty Buy Button container, blank video iframe).
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === "localhost" || host === "127.0.0.1") return route.continue();
      return route.abort();
    });
    await use(page);
  },
});

export { expect };
