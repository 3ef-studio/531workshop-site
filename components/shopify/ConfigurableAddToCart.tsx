"use client";

import { useEffect, useMemo, useState } from "react";
import { addVariantToDrawerCart, ensureBuyButtonCart } from "@/components/shopify/buyButtonUI";

type Variant = {
  id: string; // gid://shopify/ProductVariant/...
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
};

type ProductData = {
  title: string;
  options: Array<{ name: string; values: string[] }>;
  variants: Variant[];
};

type Props = {
  /** Shopify product handle (public storefront handle, NOT admin id) */
  productHandle: string;

  /**
   * Numeric Shopify product id string (your existing shopify_product_id),
   * used only to seed the Buy Button cart/toggle if it's not initialized yet.
   */
  seedProductId: string;

  className?: string;
  showPrice?: boolean;
  buttonText?: string;
};

function clampQty(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(99, Math.floor(v)));
}

function findVariant(variants: Variant[], selections: Record<string, string>): Variant | null {
  return (
    variants.find((v) =>
      v.selectedOptions.every((o) => selections[o.name] === o.value)
    ) ?? null
  );
}

function formatMoney(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currencyCode}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currencyCode}`;
  }
}

export default function ConfigurableAddToCart({
  productHandle,
  seedProductId,
  className,
  showPrice = true,
  buttonText = "Add to cart",
}: Props) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setStatus(null);

    fetch(`/api/shopify/product?handle=${encodeURIComponent(productHandle)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const j = (await r.json()) as unknown;
        if (!r.ok) {
          const msg =
            typeof j === "object" && j !== null && "error" in j
              ? String((j as { error: unknown }).error)
              : "Failed to load product";
          throw new Error(msg);
        }
        return j as ProductData;
      })
      .then((p) => {
        if (!alive) return;
        setProduct(p);

        // defaults: first value for each option
        const defaults: Record<string, string> = {};
        for (const opt of p.options) defaults[opt.name] = opt.values[0] ?? "";
        setSelections(defaults);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load product");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [productHandle]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return findVariant(product.variants, selections);
  }, [product, selections]);

  async function onAddToCart() {
    setError(null);
    setStatus(null);

    if (!selectedVariant) {
      setError("No matching variant for the selected options.");
      return;
    }
    if (!selectedVariant.availableForSale) {
      setError("This selection is currently unavailable.");
      return;
    }

    setAdding(true);
    try {
      // Ensure the Buy Button cart drawer exists (seed hidden component if needed)
      await ensureBuyButtonCart(seedProductId);

        const variantId = selectedVariant.id;
        if (typeof variantId !== "string" || variantId.length === 0) {
            setError("Selected variant is missing an ID. Check /api/shopify/product response mapping.");
            setAdding(false);
        return;
        }
        if (!variantId.startsWith("gid://shopify/ProductVariant/")) {
            setError(`Unexpected variant id format: ${variantId}`);
            setAdding(false);
            return;
        }

      // Add selected variant + qty to the same drawer cart used by ShopifyProductBuyButton
      await addVariantToDrawerCart(selectedVariant.id, qty, seedProductId);

      setStatus(`Added ${qty} to cart.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add to cart failed");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className={className}>Loading…</div>;
  if (error && !product) return <div className={className}>{error}</div>;
  if (!product) return null;

  return (
    <div className={className}>
      <div className="space-y-3">
        {product.options.map((opt) => (
          <div key={opt.name}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {opt.name}
            </label>
            <select
              className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm"
              value={selections[opt.name] ?? ""}
              onChange={(e) =>
                setSelections((prev) => ({ ...prev, [opt.name]: e.target.value }))
              }
            >
              {opt.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {showPrice && selectedVariant ? (
        <div className="mt-3 text-sm font-medium">
          {formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
        </div>
      ) : null}

      <div className="mt-4 inline-flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(clampQty(Number(e.target.value) || 1))}
          className="h-11 w-20 rounded-md border border-border bg-background px-3 text-sm text-center"
        />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={adding || !selectedVariant?.availableForSale}
          className="h-11 px-5 rounded-md bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-60"
        >
          {adding ? "Adding…" : buttonText}
        </button>
      </div>

      {status ? <div className="mt-2 text-sm">{status}</div> : null}
      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
