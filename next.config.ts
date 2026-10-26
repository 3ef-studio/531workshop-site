import type { NextConfig } from "next";

// Known third-party hosts this site actually loads from — see
// docs/TECHNICAL_DEBT.md G4 for the full reasoning behind each directive.
const SHOPIFY_DOMAIN = "01dwkj-e6.myshopify.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // 'unsafe-inline' is required for the one first-party GA bootstrap script
  // in app/layout.tsx (static, non-user-derived — no nonce infrastructure
  // exists to avoid it). Still restricts *which hosts* can load a script at
  // all, which is the more load-bearing protection against a compromised or
  // unexpected third-party script.
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://sdks.shopifycdn.com`,
  // 'unsafe-inline' is required for the inline style={{...}} attributes used
  // throughout the app for CSS-variable-driven theming — a much lower-severity
  // class of risk than inline script.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://${SHOPIFY_DOMAIN}`,
  "font-src 'self' data:",
  // monorail-edge.shopifysvc.com is the Buy Button SDK's own internal
  // telemetry endpoint — not referenced anywhere in this codebase, only
  // discovered by actually running the PDP in a browser and watching for
  // CSP violations (see docs/TECHNICAL_DEBT.md G4).
  `connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://${SHOPIFY_DOMAIN} https://monorail-edge.shopifysvc.com`,
  `frame-src https://www.youtube-nocookie.com https://${SHOPIFY_DOMAIN} https://sdks.shopifycdn.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/gallery2",
        destination: "/gallery",
        permanent: true,
      },
      {
        // Legacy product-detail path from an earlier version of the site
        // (e.g. /shop/p/cedar-bar-table) — still indexed by Google, 404s
        // today. No 1:1 mapping exists to current product slugs, so send
        // visitors to the shop index instead of a dead end.
        source: "/shop/p/:slug*",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
