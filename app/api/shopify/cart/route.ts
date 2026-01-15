import { NextResponse } from "next/server";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

function endpoint(domain: string) {
  return `https://${domain}/api/2024-04/graphql.json`;
}

async function shopifyFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("Missing SHOPIFY_DOMAIN or SHOPIFY_STOREFRRONT_ACCESS_TOKEN");
  }

  const res = await fetch(endpoint(SHOPIFY_DOMAIN), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl totalQuantity }
      userErrors { message }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity }
      userErrors { message }
    }
  }
`;

type Body = { variantId: string; quantity: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const variantId = String(body.variantId || "");
    const quantity = Number(body.quantity);

    if (!variantId.startsWith("gid://shopify/ProductVariant/")) {
      return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "Invalid quantity (1–99)" }, { status: 400 });
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const m = cookieHeader.match(/(?:^|;\s*)shopify_cart_id=([^;]+)/);
    const cartId = m ? decodeURIComponent(m[1]) : null;

    if (cartId) {
      const data = await shopifyFetch<{
        data: { cartLinesAdd: { cart: { id: string; checkoutUrl: string; totalQuantity: number }; userErrors: { message: string }[] } };
      }>(CART_LINES_ADD, { cartId, lines: [{ merchandiseId: variantId, quantity }] });

      const err = data.data.cartLinesAdd.userErrors?.[0]?.message;
      if (err) return NextResponse.json({ error: err }, { status: 400 });

      return NextResponse.json({ cart: data.data.cartLinesAdd.cart });
    }

    const data = await shopifyFetch<{
      data: { cartCreate: { cart: { id: string; checkoutUrl: string; totalQuantity: number }; userErrors: { message: string }[] } };
    }>(CART_CREATE, { lines: [{ merchandiseId: variantId, quantity }] });

    const err = data.data.cartCreate.userErrors?.[0]?.message;
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const cart = data.data.cartCreate.cart;
    const res = NextResponse.json({ cart });

    res.cookies.set("shopify_cart_id", cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
