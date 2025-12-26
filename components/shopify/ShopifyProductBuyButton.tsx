"use client";

import { useEffect, useId } from "react";

/**
 * Minimal typings for Shopify Buy Button SDK (ShopifyBuy)
 * Shopify does not provide official TypeScript types for this SDK.
 */
type ShopifyBuyUI = {
  createComponent: (
    type: "product" | "collection",
    options: Record<string, unknown>
  ) => void;
};

type ShopifyBuyUIFactory = {
  onReady: (client: unknown) => Promise<ShopifyBuyUI>;
};

declare global {
  interface Window {
    ShopifyBuy?: {
      buildClient: (config: {
        domain: string;
        storefrontAccessToken: string;
      }) => unknown;
      UI: ShopifyBuyUIFactory;
    };
  }
}

const SCRIPT_URL =
  "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";

function getHslFromCssVar(varName: string, fallbackHsl: string) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();

  // shadcn tokens typically store HSL channels like: "210 40% 96.1%"
  // Convert to valid CSS color: hsl(210 40% 96.1%)
  return raw ? `hsl(${raw})` : fallbackHsl;
}

function loadBuyButtonSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.ShopifyBuy?.UI) return resolve();

    // Already requested
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

type Props = {
  /** Shopify Product ID (numeric string) */
  productId: string;

  /** Render width hint used by Shopify widget (px) */
  width?: number;

  /** Button label */
  buttonText?: string;

  /** Override the checkout button text in the cart */
  checkoutText?: string;

  /** Roundness used for Shopify widget buttons */
  borderRadiusPx?: number;
};

export default function ShopifyProductBuyButton({
  productId,
  width = 280,
  buttonText = "Add to cart",
  checkoutText = "Checkout",
  borderRadiusPx = 10,
}: Props) {
  const reactId = useId();
  // useId can include ":" in React 18; sanitize for valid DOM id
  const nodeId = `shopify-product-${reactId.replace(/[:]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

      if (!domain || !token) {
        console.warn(
          "Shopify Buy Button not configured. Missing NEXT_PUBLIC_SHOPIFY_DOMAIN or NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN."
        );
        return;
      }

      await loadBuyButtonSDK();
      if (cancelled) return;

      const sdk = window.ShopifyBuy;
      if (!sdk?.UI) {
        console.error("ShopifyBuy SDK loaded but UI is unavailable.");
        return;
      }

      const client = sdk.buildClient({
        domain,
        storefrontAccessToken: token,
      });

      await sdk.UI.onReady(client).then((ui: ShopifyBuyUI) => {
        const node = document.getElementById(nodeId);
        if (!node) return;

        // Prevent duplicates on client navigation / re-renders
        node.innerHTML = "";

        // Compute concrete colors from your theme tokens (Shopify widget won't reliably resolve var(--...))
        const accentBg = getHslFromCssVar("--accent", "hsl(210 40% 96.1%)");
        const accentFg = getHslFromCssVar(
          "--accent-foreground",
          "hsl(222 47% 11%)"
        );

        const themedButtonStyles = {
          "background-color": accentBg,
          color: accentFg,
          "border-radius": `${borderRadiusPx}px`,
          "font-family": "inherit",
          ":hover": {
            "background-color": accentBg,
            filter: "brightness(0.95)",
          },
          ":focus": {
            "background-color": accentBg,
          },
          ":active": {
            "background-color": accentBg,
            filter: "brightness(0.9)",
          },
        } as const;

        const themedButtonWithQuantityStyles = {
          "border-radius": `${borderRadiusPx}px`,
          "font-family": "inherit",
          ":hover": {
            filter: "brightness(0.95)",
          },
          ":active": {
            filter: "brightness(0.9)",
          },
        } as const;

        ui.createComponent("product", {
          id: productId,
          node,
          moneyFormat: "%24%7B%7Bamount%7D%7D",
          options: {
            product: {
              width: String(width),
              contents: {
                img: false,
                title: false,
                price: false,
                button: false,
                buttonWithQuantity: true,
              },
              text: {
                button: buttonText,
              },
              styles: {
                // Shopify sometimes uses `button` or `buttonWithQuantity` depending on template
                button: themedButtonStyles,
                buttonWithQuantity: themedButtonWithQuantityStyles,
              },
            },

            // If a modal ever opens, keep it consistent
            modalProduct: {
              contents: {
                img: false,
                imgWithCarousel: true,
                button: false,
                buttonWithQuantity: true,
              },
              styles: {
                button: themedButtonStyles,
                buttonWithQuantity: themedButtonStyles,
              },
              text: {
                button: buttonText,
              },
            },

            // Cart checkout button styling (otherwise defaults can appear as green/blue on hover)
            cart: {
              text: {
                total: "Subtotal",
                button: checkoutText,
              },
              styles: {
                button: themedButtonStyles,
              },
            },

            // Cart toggle button styling
            toggle: {
              styles: {
                toggle: {
                  "background-color": accentBg,
                  "border-radius": `${borderRadiusPx}px`,
                  ":hover": {
                    "background-color": accentBg,
                    filter: "brightness(0.95)",
                  },
                  ":focus": {
                    "background-color": accentBg,
                  },
                  ":active": {
                    "background-color": accentBg,
                    filter: "brightness(0.9)",
                  },
                },
                count: {
                  color: accentFg,
                  "font-family": "inherit",
                },
              },
            },
          },
        });
      });
    }

    init().catch((e) => console.error("Shopify Buy Button init failed:", e));

    return () => {
      cancelled = true;
    };
  }, [productId, width, buttonText, checkoutText, borderRadiusPx, nodeId]);

  return <div id={nodeId} />;
}
