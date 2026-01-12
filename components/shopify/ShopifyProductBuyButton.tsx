"use client";

import { useEffect, useId } from "react";

const SCRIPT_URL =
  "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";

function loadBuyButtonSDK(): Promise<void> {
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

function hslVar(varName: string, fallbackHsl: string): string {
  if (typeof window === "undefined") return fallbackHsl;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return raw ? `hsl(${raw})` : fallbackHsl;
}

type Props = {
  productId: string; // numeric Shopify product id string
  width?: number;
  buttonText?: string;
  checkoutText?: string;
  borderRadiusPx?: number;
  showOptions?: boolean;
  showPrice?: boolean;
};

export default function ShopifyProductBuyButton({
  productId,
  width = 320,
  buttonText = "Add to cart",
  checkoutText = "Checkout",
  borderRadiusPx = 12,
  showOptions = false,
  showPrice = false,
}: Props) {
  const reactId = useId();
  const nodeId = `shopify-product-${reactId.replace(/[:]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    // Persist qty across BuyButton re-renders (variant change triggers render)
    let persistedQty = 1;

    function clampQty(n: number): number {
      if (!Number.isFinite(n)) return 1;
      return Math.max(1, Math.min(99, Math.floor(n)));
    }

    function readQtyFromNode(node: HTMLElement): number {
      // BuyButton uses a quantity input when quantityInput is true
      const input = node.querySelector<HTMLInputElement>('input[type="number"]');
      if (!input) return persistedQty;
      const v = clampQty(Number(input.value));
      return v;
    }

    function writeQtyToNode(node: HTMLElement, qty: number) {
      const input = node.querySelector<HTMLInputElement>('input[type="number"]');
      if (!input) return;
      const next = String(clampQty(qty));
      if (input.value !== next) input.value = next;
    }

    function ensureQtyListeners(node: HTMLElement) {
      // attach once
      if (node.dataset.qtyListeners === "1") return;
      node.dataset.qtyListeners = "1";

      // Any input changes update persistedQty
      node.addEventListener("input", (e) => {
        const t = e.target;
        if (t instanceof HTMLInputElement && t.type === "number") {
          persistedQty = clampQty(Number(t.value));
        }
      });

      // Some templates update qty via click buttons; keep persisted in sync after click too
      node.addEventListener("click", () => {
        persistedQty = readQtyFromNode(node);
      });
    }

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

      const ui = await sdk.UI.onReady(client);
      if (cancelled) return;

      const node = document.getElementById(nodeId);
      if (!node) return;

      // Prevent duplicates on client navigation / re-renders
      node.innerHTML = "";

      // Theme tokens
      const accentBg = hslVar("--accent", "hsl(210 40% 96.1%)");
      const accentFg = hslVar("--accent-foreground", "hsl(222 47% 11%)");
      const border = hslVar("--border", "hsl(214 32% 91%)");
      const bg = hslVar("--background", "hsl(0 0% 100%)");
      const fg = hslVar("--foreground", "hsl(222 47% 11%)");
      const mutedFg = hslVar("--muted-foreground", "hsl(215.4 16.3% 46.9%)");

      const radius = `${borderRadiusPx}px`;

      const baseControl = {
        "font-family": "inherit",
        "border-radius": radius,
      } as const;

      const inputControl = {
        ...baseControl,
        border: `1px solid ${border}`,
        "background-color": bg,
        color: fg,
        "min-height": "44px",
      } as const;

      const buttonStyles = {
        ...baseControl,
        "background-color": accentBg,
        color: accentFg,
        "min-height": "44px",
        padding: "0 16px",
        "font-weight": "600",
        ":hover": {
          "background-color": accentBg,
          filter: "brightness(0.95)",
        },
        ":active": {
          "background-color": accentBg,
          filter: "brightness(0.9)",
        },
        ":focus": {
          "background-color": accentBg,
        },
      } as const;

      // IMPORTANT: avoid buttonWithQuantity; explicitly render quantity + button
      const order = showPrice
        ? (["options", "price", "quantity", "button"] as const)
        : (["options", "quantity", "button"] as const);

      ui.createComponent("product", {
        id: productId,
        node,
        moneyFormat: "%24%7B%7Bamount%7D%7D",
        options: {
          product: {
            width: String(width),
            iframe: true,
            order,
            contents: {
              img: false,
              title: false,
              variantTitle: false,
              description: false,
              options: showOptions,
              price: showPrice,
              // ✅ quantity UI
              quantity: true,
              quantityInput: true,
              quantityIncrement: false,
              quantityDecrement: false,
              // ✅ main button
              button: true,
              // ❌ do not use this template
              buttonWithQuantity: false,
            },
            text: {
              button: buttonText,
            },
            styles: {
              // Keep layout tight and consistent
              product: {
                "font-family": "inherit",
                "text-align": "left",
              },

              // ✅ Put qty + button on one row
              controls: {
                display: "flex",
                "align-items": "center",
                "justify-content": "flex-start",
                gap: "12px",
                margin: "12px 0 0 0",
              },

              // Variant dropdowns
              select: {
                ...inputControl,
                width: "100%",
                padding: "0 12px",
                "font-size": "14px",
              },
              selectIcon: { fill: mutedFg },
              option: { color: fg },

              // Price
              price: {
                "font-family": "inherit",
                color: fg,
                "font-size": "14px",
                "font-weight": "600",
              },

              // Quantity wrapper (now uses controls row)
              quantity: {
                display: "flex",
                "align-items": "center",
                margin: "0",
                padding: "0",
              },
              quantityInput: {
                ...inputControl,
                width: "80px",
                "text-align": "center",
              },
              quantityIncrement: {
                ...inputControl,
                width: "44px",
                padding: "0",
              },
              quantityDecrement: {
                ...inputControl,
                width: "44px",
                padding: "0",
              },

              // Button (no longer full width)
              button: {
                ...buttonStyles,
                margin: "0",
                width: "auto",
                "white-space": "nowrap",
              },
            },

            // ✅ Fix “qty resets to 1 when changing variants”
            // Variant changes trigger re-renders. Re-apply our persisted qty each render.
            events: {
              afterRender: () => {
                const host = document.getElementById(nodeId);
                if (!host) return;
                ensureQtyListeners(host);
                writeQtyToNode(host, persistedQty);
              },
              addVariantToCart: () => {
                const host = document.getElementById(nodeId);
                if (!host) return;
                persistedQty = readQtyFromNode(host);
                writeQtyToNode(host, persistedQty);
              },
              updateQuantity: () => {
                const host = document.getElementById(nodeId);
                if (!host) return;
                persistedQty = readQtyFromNode(host);
              },
            },
          },

          cart: {
            text: { total: "Subtotal", button: checkoutText },
            styles: { button: buttonStyles },
          },

          toggle: {
            styles: {
              toggle: { ...buttonStyles, padding: "0 12px" },
              count: {
                color: accentFg,
                "font-family": "inherit",
                "font-weight": "700",
              },
            },
          },
        },
      });
    }

    void init();

    return () => {
      cancelled = true;
      const node = document.getElementById(nodeId);
      if (node) node.innerHTML = "";
    };
  }, [
    productId,
    width,
    buttonText,
    checkoutText,
    borderRadiusPx,
    showOptions,
    showPrice,
    nodeId,
  ]);

  return <div id={nodeId} />;
}
