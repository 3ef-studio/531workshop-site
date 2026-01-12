"use client";

const SCRIPT_URL =
  "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadSDK(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.ShopifyBuy?.UI) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Shopify SDK load failed")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Shopify SDK load failed"));
    document.head.appendChild(script);
  });
}

function getEnv(): { domain: string; token: string } {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) {
    throw new Error(
      "Missing NEXT_PUBLIC_SHOPIFY_DOMAIN or NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN"
    );
  }
  return { domain, token };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type CartComponent = {
  addVariantToCart?: (variantId: string, quantity: number) => Promise<unknown>;
};

function getCartComponent(ui: unknown): CartComponent | null {
  if (!isRecord(ui)) return null;

  const components = ui.components;
  if (!isRecord(components)) return null;

  const cartArr = components.cart;
  if (!Array.isArray(cartArr) || cartArr.length === 0) return null;

  const cart0 = cartArr[0];
  return isRecord(cart0) ? (cart0 as CartComponent) : null;
}

/**
 * Don't cache a broken UI instance.
 */
export async function getBuyButtonUI(): Promise<unknown> {
  if (typeof window === "undefined") {
    throw new Error("Buy Button UI requires window");
  }

  if (window.__buyButtonUI__) {
    const ui = await window.__buyButtonUI__;
    if (!isRecord(ui)) {
      window.__buyButtonUI__ = undefined;
      throw new Error("Buy Button UI failed to initialize (cached).");
    }
    return ui;
  }

  window.__buyButtonUI__ = (async () => {
    const { domain, token } = getEnv();

    await loadSDK();

    const sdk = window.ShopifyBuy;
    if (!sdk?.UI) throw new Error("ShopifyBuy.UI unavailable after SDK load");

    const client = sdk.buildClient({
      domain,
      storefrontAccessToken: token,
    });

    const ui = await sdk.UI.onReady(client);
    if (!isRecord(ui)) {
      throw new Error("ShopifyBuy.UI.onReady returned an invalid UI object");
    }
    return ui;
  })();

  try {
    return await window.__buyButtonUI__;
  } catch (e) {
    window.__buyButtonUI__ = undefined;
    throw e;
  }
}

/**
 * Bootstraps the drawer cart/toggle by creating a hidden seed product component,
 * then waits until the cart component + addVariantToCart method exists.
 */
export async function ensureBuyButtonCart(seedProductId: string): Promise<void> {
  const ui = await getBuyButtonUI();

  // If cart method is already ready, we're done.
  const readyCart = getCartComponent(ui);
  if (readyCart?.addVariantToCart) return;

  const nodeId = "__shopify_buy_seed__";
  let node = document.getElementById(nodeId);

  if (!node) {
    node = document.createElement("div");
    node.id = nodeId;
    node.style.display = "none";
    document.body.appendChild(node);
  }

  if (!isRecord(ui) || typeof ui.createComponent !== "function") {
    throw new Error("Buy Button UI createComponent unavailable");
  }

  // Seed hidden product component to ensure cart + toggle exist
  ui.createComponent("product", {
    id: seedProductId,
    node,
    options: {
      product: {
        contents: {
          img: false,
          title: false,
          price: false,
          button: false,
          buttonWithQuantity: false,
          quantity: false,
          options: false,
        },
      },
      cart: { startOpen: false },
      toggle: { sticky: true },
    },
  });

  // Wait up to ~1s for the cart component + method to become available
  for (let i = 0; i < 10; i++) {
    await sleep(100);
    const cart = getCartComponent(ui);
    if (cart?.addVariantToCart) return;
  }

  throw new Error("Buy Button cart did not initialize in time.");
}

function gidToNumericVariantId(gid: string): string | null {
  if (!gid.startsWith("gid://")) return null;
  const last = gid.split("/").pop();
  return last && /^\d+$/.test(last) ? last : null;
}

/**
 * Add a variant to the drawer cart using the Buy Button's internal cart method,
 * so the UI updates immediately (no stale drawer state).
 */
export async function addVariantToDrawerCart(
  variantGidOrId: string,
  quantity: number,
  seedProductId?: string
): Promise<void> {
  const ui = await getBuyButtonUI();

  if (seedProductId) {
    await ensureBuyButtonCart(seedProductId);
  }

  const cart = getCartComponent(ui);
  const add = cart?.addVariantToCart;

  if (!add) {
    throw new Error(
      "Buy Button cart not initialized. Call ensureBuyButtonCart() first."
    );
  }

  const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  // Strategy:
  // 1) Try passing the variant GID (newer Buy Button builds + cart API)
  // 2) If that fails, fallback to numeric id (older checkout-based builds)
  try {
    await add(variantGidOrId, qty);
  } catch (e) {
    const numeric = gidToNumericVariantId(variantGidOrId) ?? variantGidOrId;
    if (numeric !== variantGidOrId) {
      await add(numeric, qty);
    } else {
      throw e;
    }
  }

  // Let the cart UI apply state updates before opening
  await sleep(50);

  if (isRecord(ui) && typeof ui.openCart === "function") {
    ui.openCart();
  }
}
