import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/shopify/product/route";

const fetchMock = vi.fn();

function get(qs: string) {
  return GET(new Request(`http://localhost:3000/api/shopify/product${qs}`));
}

function shopifyResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const productBody = {
  data: {
    productByHandle: {
      title: "Large End-Grain Cutting Board",
      options: [{ name: "Material", values: ["Walnut", "Maple", "Cherry"] }],
      variants: {
        nodes: [
          {
            id: "gid://shopify/ProductVariant/1",
            availableForSale: true,
            price: { amount: "290.0", currencyCode: "USD" },
            selectedOptions: [{ name: "Material", value: "Walnut" }],
          },
        ],
      },
    },
  },
};

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/shopify/product", () => {
  it("returns 400 when handle is missing (no fetch)", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 500 when Shopify env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOPIFY_DOMAIN", "");
    const res = await get("?handle=large-endgrain-board");
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reshapes a successful Storefront response to { title, options, variants }", async () => {
    fetchMock.mockResolvedValueOnce(shopifyResponse(productBody));
    const res = await get("?handle=large-endgrain-board");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      title: "Large End-Grain Cutting Board",
      options: productBody.data.productByHandle.options,
      variants: productBody.data.productByHandle.variants.nodes,
    });
    // request goes to the configured storefront domain over the mocked fetch
    expect(String(fetchMock.mock.calls[0][0])).toContain("test-shop.myshopify.com");
  });

  it("returns 502 when the Storefront response carries GraphQL errors", async () => {
    fetchMock.mockResolvedValueOnce(
      shopifyResponse({ errors: [{ message: "Throttled" }] }),
    );
    const res = await get("?handle=x");
    expect(res.status).toBe(502);
  });

  it("returns 404 when the product handle does not resolve", async () => {
    fetchMock.mockResolvedValueOnce(shopifyResponse({ data: { productByHandle: null } }));
    const res = await get("?handle=missing");
    expect(res.status).toBe(404);
  });
});
