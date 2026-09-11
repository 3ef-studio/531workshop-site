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
    const res = await page.goto("/gallery");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Gallery" })).toBeVisible();
    expect(await page.locator("main img").count()).toBeGreaterThan(10);
    await expect(page.getByRole("link", { name: /request a quote/i })).toBeVisible();
  });
});

test.describe("gallery categories and projects", () => {
  const categories = [
    "tables",
    "cabinets",
    "specialty-projects",
    "commercial-projects",
    "cutting-boards",
  ];

  for (const category of categories) {
    test(`/gallery/${category} returns 200`, async ({ page }) => {
      const res = await page.goto(`/gallery/${category}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    });
  }

  test("a project page renders its details and links back to its category", async ({
    page,
  }) => {
    const res = await page.goto("/gallery/tables/live-edge-coffee-table");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Live Edge Coffee Table" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /More Tables/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "All Gallery" })).toBeVisible();
  });

  test("a project page with full metadata renders materials/year/dimensions", async ({
    page,
  }) => {
    await page.goto("/gallery/tables/epoxy-river-coffee-table-sycamore");
    await expect(page.getByText("Sycamore, Epoxy, Metal")).toBeVisible();
    await expect(page.getByText("2021")).toBeVisible();
  });

  test('every project page has an "I want something like this" CTA to /contact?project=<slug>', async ({
    page,
  }) => {
    const cases: Array<[string, string]> = [
      ["/gallery/tables/live-edge-coffee-table", "live-edge-coffee-table"],
      ["/gallery/cutting-boards/checkerboard-cutting-board", "checkerboard-cutting-board"],
      ["/gallery/specialty-projects/keepsake-boxes", "keepsake-boxes"],
      ["/gallery/cabinets/display-cabinet", "display-cabinet"],
    ];

    for (const [path, slug] of cases) {
      await page.goto(path);
      const cta = page.getByRole("link", { name: "I want something like this" });
      await expect(cta).toBeVisible();

      const href = await cta.getAttribute("href");
      const url = new URL(href!, "http://localhost:3000");
      expect(url.pathname).toBe("/contact");
      // The slug is the ONLY thing carried in the query string.
      expect(url.searchParams.get("project")).toBe(slug);
      expect([...url.searchParams.keys()]).toEqual(["project"]);
    }
  });

  test("following the CTA lands on Contact with the matching project context", async ({
    page,
  }) => {
    await page.goto("/gallery/cutting-boards/checkerboard-cutting-board");
    await page.getByRole("link", { name: "I want something like this" }).click();

    await page.waitForURL(/\/contact\?project=checkerboard-cutting-board$/);
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
    const contextCard = page
      .locator(".ui-card")
      .filter({ hasText: "Interested in something like this?" });
    await expect(contextCard).toBeVisible();
    await expect(contextCard.getByText("Checkerboard Cutting Board")).toBeVisible();
    await expect(page.getByLabel(/Project type/i)).toHaveValue("cutting-boards");

    // Browser Back returns to the project page.
    await page.goBack();
    await expect(page).toHaveURL(/\/gallery\/cutting-boards\/checkerboard-cutting-board$/);
  });

  test("cutting-board gallery entries reuse Shop imagery without purchase UI", async ({
    page,
  }) => {
    const res = await page.goto("/gallery/cutting-boards/large-end-grain-cutting-board");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Large End-Grain Cutting Board" }),
    ).toBeVisible();
    // No Shop/purchase affordances belong on a gallery project page.
    await expect(page.locator('[id^="shopify-product-"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: /add to cart/i })).toHaveCount(0);
  });

  test("an unknown category returns 404", async ({ page }) => {
    const res = await page.goto("/gallery/not-a-real-category");
    expect(res?.status()).toBe(404);
  });

  test("a known category with an unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/gallery/tables/not-a-real-project");
    expect(res?.status()).toBe(404);
  });

  test("a real slug under the wrong category returns 404", async ({ page }) => {
    // "checkerboard-cutting-board" exists, but under cutting-boards, not tables.
    const res = await page.goto("/gallery/tables/checkerboard-cutting-board");
    expect(res?.status()).toBe(404);
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

test.describe("hero custom-project CTA", () => {
  // HERO_SLIDE_IDS order: Live Edge Coffee Table, Puzzle Dining Table,
  // Epoxy River Coffee Table Sycamore, Keepsake Boxes.

  test("Start a Custom Project targets the active slide's Gallery project; View Our Work stays /gallery", async ({
    page,
  }) => {
    await page.goto("/");

    const startCta = page.getByRole("link", { name: "Start a Custom Project" });
    const viewWork = page.getByRole("link", { name: "View Our Work" });

    await expect(viewWork).toHaveAttribute("href", "/gallery");

    // Slide 0
    const href = await startCta.getAttribute("href");
    const url = new URL(href!, "http://localhost:3000");
    expect(url.pathname).toBe("/contact");
    expect(url.searchParams.get("project")).toBe("live-edge-coffee-table");
    expect([...url.searchParams.keys()]).toEqual(["project"]);

    // Manual navigation to slide 2 changes the CTA destination.
    await page.getByRole("button", { name: /Show project photo 2: Puzzle Dining Table/i }).click();
    await expect(startCta).toHaveAttribute("href", "/contact?project=puzzle-dining-table");
    await expect(viewWork).toHaveAttribute("href", "/gallery");

    // Next control advances again.
    await page.getByRole("button", { name: "Next project photo" }).click();
    await expect(startCta).toHaveAttribute(
      "href",
      "/contact?project=epoxy-river-coffee-table-sycamore",
    );
  });

  test("automatic rotation also updates the CTA destination", async ({ page }) => {
    await page.goto("/");
    const startCta = page.getByRole("link", { name: "Start a Custom Project" });
    await expect(startCta).toHaveAttribute("href", "/contact?project=live-edge-coffee-table");
    // Rotation interval is 15s — wait past one auto-advance without interacting.
    await expect(startCta).toHaveAttribute("href", "/contact?project=puzzle-dining-table", {
      timeout: 20_000,
    });
  });

  test("following the hero CTA lands on Contact with that project's context", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Show project photo 4: Keepsake Boxes/i }).click();
    await page.getByRole("link", { name: "Start a Custom Project" }).click();

    await page.waitForURL(/\/contact\?project=keepsake-boxes$/);
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
    const contextCard = page
      .locator(".ui-card")
      .filter({ hasText: "Interested in something like this?" });
    await expect(contextCard.getByText("Keepsake Boxes")).toBeVisible();
    await expect(page.getByLabel(/Project type/i)).toHaveValue("specialty-projects");
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

  test("works normally with no project context", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("Interested in something like this?")).toHaveCount(0);
    // Optional project fields are present but unselected.
    await expect(page.getByLabel(/Project type/i)).toHaveValue("");
  });

  test("a valid ?project= shows Gallery context and preselects the matching project type", async ({
    page,
  }) => {
    await page.goto("/contact?project=live-edge-coffee-table");

    await expect(page.getByText("Interested in something like this?")).toBeVisible();
    await expect(page.getByText("Live Edge Coffee Table")).toBeVisible();
    // Category label in the context card specifically (the Project Type
    // <option> below also renders the text "Tables").
    const contextCard = page
      .locator(".ui-card")
      .filter({ hasText: "Interested in something like this?" });
    await expect(contextCard.getByText("Tables", { exact: true })).toBeVisible();

    // Category "tables" preselects the matching Project Type option, but the
    // visitor can still change it.
    const projectType = page.getByLabel(/Project type/i);
    await expect(projectType).toHaveValue("tables");
    await projectType.selectOption("cabinets");
    await expect(projectType).toHaveValue("cabinets");
  });

  test("an invalid ?project= fails gracefully into the normal contact experience", async ({
    page,
  }) => {
    const res = await page.goto("/contact?project=this-project-does-not-exist");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
    await expect(page.getByText("Interested in something like this?")).toHaveCount(0);
  });
});
