import { test, expect } from "./fixtures";

test.describe("public pages load", () => {
  test("home renders hero + primary nav", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Crafted for you");
    const nav = page.locator("header");
    await expect(nav.getByRole("link", { name: "Shop", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "FAQ", exact: true })).toBeVisible();
  });

  test("about", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  });

  test("faq lists question accordions", async ({ page }) => {
    const res = await page.goto("/faq");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Frequently Asked Questions/i }),
    ).toBeVisible();
    expect(await page.locator("details").count()).toBeGreaterThan(10);
  });

  test("gallery renders images and a quote CTA", async ({ page }) => {
    const res = await page.goto("/gallery2");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Gallery" })).toBeVisible();
    expect(await page.locator("main img").count()).toBeGreaterThan(10);
    await expect(page.getByRole("link", { name: /request a quote/i })).toBeVisible();
  });
});

test.describe("catalog", () => {
  test("shop lists all products from data/products.json", async ({ page }) => {
    const res = await page.goto("/shop");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(7);
    await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();
  });

  test("a valid product detail page renders its purchase area", async ({ page }) => {
    const res = await page.goto("/shop/small-board");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Small Cutting Board/i }),
    ).toBeVisible();
    // Shopify Buy Button mount point (the SDK itself is network-blocked in tests).
    await expect(page.locator('[id^="shopify-product-"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
  });

  test("an unknown product slug returns 404", async ({ page }) => {
    const res = await page.goto("/shop/this-product-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("navigation", () => {
  test("primary nav moves between pages", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header");
    await nav.getByRole("link", { name: "Shop", exact: true }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await nav.getByRole("link", { name: "FAQ", exact: true }).click();
    await expect(page).toHaveURL(/\/faq$/);
  });
});

test.describe("contact form", () => {
  test("accepts input and validates on the client without hitting the backend", async ({
    page,
  }) => {
    // Any POST to /api/contact during this test is a failure.
    let posted = false;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().includes("/api/contact")) posted = true;
    });

    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();

    // Empty submit surfaces client-side validation, no network call.
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText("First name is required.")).toBeVisible();

    // Fill valid input; errors clear.
    await page.locator('input[autocomplete="given-name"]').fill("Jane");
    await page.locator('input[autocomplete="family-name"]').fill("Doe");
    await page.locator('input[autocomplete="email"]').fill("jane@example.com");
    await page
      .locator("textarea")
      .fill("I would like a quote for a walnut dining table, about 72 by 36 inches.");

    await expect(page.getByText("First name is required.")).toHaveCount(0);
    await expect(page.locator('input[autocomplete="given-name"]')).toHaveValue("Jane");

    expect(posted).toBe(false);
  });
});
