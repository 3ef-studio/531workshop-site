// app/api/shopify/product/route.ts
import { NextResponse } from "next/server";

const SHOPIFY_API_VERSION = "2024-10"; // ok to keep / update if you're using a different version

type ShopifyProductResponse = {
  data?: {
    productByHandle?: {
      title: string;
      options: Array<{ name: string; values: string[] }>;
      variants: {
        nodes: Array<{
          id: string; // gid://shopify/ProductVariant/...
          availableForSale: boolean;
          price: { amount: string; currencyCode: string };
          selectedOptions: Array<{ name: string; value: string }>;
        }>;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    return NextResponse.json(
      { error: "Missing Shopify env vars" },
      { status: 500 }
    );
  }

  const query = /* GraphQL */ `
    query ProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        title
        options {
          name
          values
        }
        variants(first: 100) {
          nodes {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  `;

  const resp = await fetch(
    `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query,
        variables: { handle },
      }),
      cache: "no-store",
    }
  );

  const json = (await resp.json()) as ShopifyProductResponse;

  if (!resp.ok) {
    return NextResponse.json(
      { error: "Shopify request failed", details: json },
      { status: 502 }
    );
  }

  if (json.errors?.length) {
    return NextResponse.json({ error: json.errors[0]?.message ?? "Shopify error" }, { status: 502 });
  }

  const p = json.data?.productByHandle;
  if (!p) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Return EXACTLY what ConfigurableAddToCart expects
  return NextResponse.json({
    title: p.title,
    options: p.options,
    variants: p.variants.nodes,
  });
}
