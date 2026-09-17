# INTEGRATIONS — 531 Workshop Site

_Last reviewed: 2026-09-11. Environment variables are listed by NAME
ONLY. No secret values appear in this document or should ever be added to it._

No new environment variables were introduced by the Gallery/Hero/Contact-enhancement work
described in `FEATURES.md` and `ARCHITECTURE.md` — the only externally-required change was
a database schema addition (`app.leads.project_context JSONB`, applied to production
out-of-band; see §1 below and `TECHNICAL_DEBT.md` A8).

---

## Environment variables (names only)

Names present in the local `.env` (gitignored, not committed):

| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `lib/site.ts` → `SITE.url` | Canonical/base URL for metadata (`metadataBase`, OpenGraph). Falls back to `http://localhost:3000`. |
| `SITE_URL` | `app/api/contact/route.ts` (`baseUrlFromRequest`) | Base URL used to build the email verification link. Falls back to the request's protocol+host. |
| `DATABASE_URL` | `app/api/contact/route.ts`, `app/api/contact/verify/route.ts` | Postgres connection string for the `pg` `Pool`. |
| `RESEND_API_KEY` | both contact routes (`new Resend(...)`) | Auth for the Resend email API. |
| `EMAIL_FROM` | both contact routes | `From:` address/name for all outgoing email. |
| `CONTACT_TO_EMAIL` | `app/api/contact/verify/route.ts` | Recipient of the internal "new verified inquiry" notification. |
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | `components/shopify/ShopifyProductBuyButton.tsx`, `components/shopify/buyButtonUI.ts`, `app/api/shopify/product/route.ts`, `app/api/shopify/cart/route.ts` | Shopify storefront domain (e.g. `xxx.myshopify.com`). |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | same four files | Shopify Storefront API public access token. |

Names referenced in code but **not** in the committed `.env` (optional / fallback):

| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_GA_ID` | `app/layout.tsx` | If set, injects Google Tag Manager `gtag.js` + a `gtag('config', …, {anonymize_ip:true})` snippet. Absent → no analytics script. |
| `POSTGRES_URL` | contact routes | Alternative to `DATABASE_URL` (`DATABASE_URL || POSTGRES_URL`). |
| `PGSSLMODE` | contact routes | If exactly `"disable"`, the `pg` pool disables TLS; otherwise TLS with `rejectUnauthorized: false`. |
| `DDE_OUT_ROOT` | `lib/newsletter/dde.ts` (unused module) | Directory root for DDE newsletter JSON. Defaults to `<cwd>/data/dde`. |

> Note: `app/api/shopify/cart/route.ts:12` throws an error string that misspells the
> variable ("SHOPIFY_STOREFRRONT_ACCESS_TOKEN") — cosmetic only; the code reads the
> correct `NEXT_PUBLIC_*` names. Comments in `app/api/contact/route.ts` also refer to a
> `RESEND_FROM` var that the code does not use (it uses `EMAIL_FROM`).

---

## 1. PostgreSQL (lead storage)

- **Purpose:** persist contact‑form leads and their email‑verification tokens.
- **Client:** `pg` (`Pool`), `^8.16.3`.
- **Implementation files:** `app/api/contact/route.ts`, `app/api/contact/verify/route.ts`.
  Each file constructs its **own module‑scope `Pool`**.
- **Config:** `connectionString = DATABASE_URL || POSTGRES_URL`;
  `ssl = PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }`.
- **Schema (assumed to pre‑exist — not defined in this repo):**
  - `app.leads` — columns referenced: `id`, `first_name`, `last_name`, `email`, `phone`,
    `message`, `verified`, `verified_at`, `source`, `referer`, `ip`, `user_agent`,
    `created_at`, and `project_context` (nullable `JSONB` — added to production
    out-of-band via `ALTER TABLE app.leads ADD COLUMN project_context JSONB;`; stores an
    optional structured record of a Gallery-inspired inquiry — see `FEATURES.md` §7).
  - `app.email_verification_tokens` — columns referenced: `id`, `lead_id`, `email`,
    `token_hash`, `expires_at`, `used_at`.
  - `app.contact_rejections` — added 2026-09-17. Unlike the two tables above, this one
    didn't pre-exist the project — it was created for this feature, applied directly
    against production (no migration tool), and its exact schema is:
    ```sql
    CREATE TABLE app.contact_rejections (
      id UUID PRIMARY KEY DEFAULT app.uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reason TEXT NOT NULL,           -- 'honeypot' | 'message_no_whitespace'
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      honeypot_value TEXT,
      project_slug TEXT,
      project_type TEXT,
      dimensions TEXT,
      timeframe TEXT,
      referer TEXT,
      ip TEXT,
      user_agent TEXT
    );
    ```
    One row per spam-filter rejection (honeypot trigger or the no-whitespace content-shape
    check — see `FEATURES.md` §7), for manual review of possible false positives. Never
    linked to `app.leads`; no email is ever sent for a row in this table. `created_at` is
    `timestamptz`, stored as UTC like every other timestamp in this schema — convert to
    `America/Chicago` (e.g. `created_at AT TIME ZONE 'America/Chicago'`) when displaying
    it to a person; the raw value alone will look 5–6 hours off from Illinois local time
    depending on daylight saving.
- **Failure behavior:** any DB error inside the handler triggers `ROLLBACK` and returns
  HTTP 500 with a generic message (`POST /api/contact`) or a plain‑text 500 (`verify`).
  A missing/unreachable database makes the contact form non‑functional (500). There is no
  retry, no queue, and no fallback store. Connections are acquired with `pool.connect()`
  and always `client.release()`d in `finally`.
- **The database is not read anywhere else** — no admin UI, no lead listing in this repo.

## 2. Resend (transactional email)

- **Purpose:** (a) send the double opt‑in confirmation email to the lead; (b) send the
  internal "new verified inquiry" notification to the shop.
- **Client:** `resend` `^6.6.0`, `new Resend(process.env.RESEND_API_KEY)`.
- **Implementation files:** `app/api/contact/route.ts` (confirmation email),
  `app/api/contact/verify/route.ts` (internal notification).
- **From / to:** `from = EMAIL_FROM`; confirmation `to = <lead email>`; notification
  `to = CONTACT_TO_EMAIL`.
- **Failure behavior:**
  - **The routes never check the `{ data, error }` value returned by
    `resend.emails.send` — only a thrown exception is handled.** The Resend SDK resolves
    (does not throw) on API errors such as 422 / 429 / unverified domain / 5xx, so those
    are **silently swallowed** and the caller still gets `{ ok: true }`. Observed
    2026-08-28: a local `POST /api/contact` probe committed the lead, called Resend, got
    **HTTP 422** (`test@example.com` is a rejected test recipient), and the route returned
    `{ ok: true, "check your email…" }` with no log entry. (Production Resend delivery is
    confirmed working out of band — this is about failure *visibility*, not a current
    outage.)
  - `POST /api/contact`: if `EMAIL_FROM` or `RESEND_API_KEY` is missing, the route logs
    and still returns `{ ok: true }` — the user is told to check email that will never
    arrive. If `resend.emails.send` **throws** (e.g. network error), it propagates to the
    outer `catch` → `ROLLBACK` (a no‑op after `COMMIT`) → 500, so the user sees an error
    but the lead + token rows remain in the DB.
  - `verify`: the internal email is wrapped so that missing env vars just `console.warn`
    and skip; a `send` throw there propagates to the outer catch → `ROLLBACK` (after the
    verification updates were already committed) → plain‑text 500, and the user never
    reaches `/contact?confirmed=1` even though the lead is verified.
- **Email content injection:** resolved. The internal notification now runs every
  user-supplied/free-text value (name, email, phone, message, and any project-context
  `dimensions`) through a local `escapeHtml()` helper before interpolating it into the HTML
  string (`app/api/contact/verify/route.ts`). The plain-text subject-line name is
  intentionally left unescaped, since a mail header isn't HTML. See `TECHNICAL_DEBT.md` A2
  (marked Resolved).
- **Missing `Reply-To`:** the internal notification does not set a `Reply-To` header to the
  customer's email — the shop owner can read the address in the body but can't just hit
  "Reply" in their mail client to respond directly. See `TECHNICAL_DEBT.md` (new item).

## 3. Shopify — Buy Button JavaScript SDK (active purchase path)

- **Purpose:** render an embeddable add‑to‑cart / variant picker / cart drawer on the PDP
  and hand off to Shopify‑hosted checkout.
- **Loaded from:** `https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js`
  (injected at runtime via a `<script>` tag; **`latest`, unpinned**).
- **Implementation files:** `components/shopify/ShopifyProductBuyButton.tsx` (used by
  `app/shop/[slug]/page.tsx`), `components/shopify/buyButtonUI.ts` (drawer‑cart helpers —
  only imported by the unused `ConfigurableAddToCart.tsx`), `types/shopify-buy-button.d.ts`.
- **Auth:** `ShopifyBuy.buildClient({ domain: NEXT_PUBLIC_SHOPIFY_DOMAIN,
  storefrontAccessToken: NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN })`. Both values are
  `NEXT_PUBLIC_` and therefore shipped to the browser (normal for a Storefront token,
  which is meant to be public, but worth noting for rotation/scoping).
- **Product identity:** the numeric `shopify_product_id` from `data/products.json`.
- **Failure behavior:** missing env vars → `console.warn`, nothing renders (the CTA area
  is simply empty). Script load failure → the init promise rejects and is `console.error`d;
  again nothing renders. There is no visible fallback ("buy on Shopify" link, error
  message) for the shopper.

## 4. Shopify — Storefront GraphQL API (server routes, currently unreferenced)

- **Purpose (as coded):** `/api/shopify/product` fetches a product's `options` and
  `variants` (id, availableForSale, price, selectedOptions) by handle;
  `/api/shopify/cart` performs `cartCreate` / `cartLinesAdd` mutations and stores a
  `shopify_cart_id` httpOnly cookie (14‑day).
- **Endpoint:** `https://${NEXT_PUBLIC_SHOPIFY_DOMAIN}/api/${VERSION}/graphql.json`
  (`product` uses `2024-10`, `cart` uses `2024-04`), `POST` with header
  `X-Shopify-Storefront-Access-Token`, `cache: "no-store"`.
- **Implementation files:** `app/api/shopify/product/route.ts`, `app/api/shopify/cart/route.ts`.
- **Consumers:** `/api/shopify/product` is fetched only by
  `components/shopify/ConfigurableAddToCart.tsx`, which is imported nowhere.
  `/api/shopify/cart` is fetched by nothing in the repo.
- **Failure behavior:** `product` returns 400 (missing handle), 500 (missing env),
  502 (Shopify non‑OK or GraphQL `errors`), 404 (product not found).
  `cart` returns 400 (bad `variantId` prefix / quantity out of 1–99), 400 (Shopify
  `userErrors`), 500 (thrown). Because nothing calls them, these behaviors are latent.

## 5. YouTube (embedded video)

- **Purpose:** marketing videos on `/about` and `/gallery`.
- **Implementation:** plain `<iframe src="https://www.youtube-nocookie.com/embed/<id>?rel=0&modestbranding=1" loading="lazy">`
  in `app/about/page.tsx` (`R8_fj2ljYIM`) and `app/gallery/page.tsx` (`wQ63sQTePeE`).
  Uses the privacy‑enhanced `youtube-nocookie.com` domain. No API key, no SDK.
- **Failure behavior:** if a video is removed/private, the iframe shows YouTube's own
  error UI. No app‑level handling.

## 6. Google Analytics / Tag Manager (optional, inactive by default)

- **Purpose:** page analytics if enabled.
- **Implementation:** `app/layout.tsx` — two `next/script` tags
  (`strategy="afterInteractive"`) rendered only when `NEXT_PUBLIC_GA_ID` is truthy;
  initializes `gtag` with `anonymize_ip: true`.
- **State:** `NEXT_PUBLIC_GA_ID` is not in the committed `.env`, so no analytics script is
  served unless it is set in the deployment environment.

## 7. Plausible Analytics (referenced, not integrated)

- **Purpose (intended):** custom event tracking (`newsletter_subscribe_*`,
  `consulting_lead_*`, `consulting_cta_click`, and any `ClientEvent` name).
- **Implementation:** `lib/analytics.ts` (`track()`), `components/ClientEvent.tsx`,
  `components/CtaTrack.tsx`, and the unused forms all call `window.plausible(...)` behind a
  `typeof … === "function"` guard.
- **State:** **no Plausible script tag exists anywhere in the codebase**, so
  `window.plausible` is always undefined and every call is a no‑op. This is effectively a
  non‑integration today.

## 8. Fonts — Google Fonts via `next/font`

- `Geist` and `Geist_Mono` from `next/font/google` (`app/layout.tsx`). Fetched/optimized
  at build time by Next; no runtime third‑party request, no env var.

## 9. Shopify‑hosted checkout (implicit)

- When a shopper checks out from the Buy Button cart drawer, they are redirected to
  Shopify's hosted checkout on the store domain. Payment, tax, shipping, and order
  management all live in Shopify, outside this repo.

---

## Integration summary table

| Service | Kind | Active? | Files | Key env vars |
|---|---|---|---|---|
| PostgreSQL | Datastore | Yes | `app/api/contact/*` | `DATABASE_URL` (or `POSTGRES_URL`), `PGSSLMODE` |
| Resend | Email API | Yes | `app/api/contact/*` | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL` |
| Shopify Buy Button SDK | Client commerce widget | Yes (PDP) | `components/shopify/ShopifyProductBuyButton.tsx` | `NEXT_PUBLIC_SHOPIFY_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` |
| Shopify Storefront GraphQL | Server API | Code present, unreferenced | `app/api/shopify/*` | same two `NEXT_PUBLIC_SHOPIFY_*` |
| Shopify hosted checkout | Redirect | Yes (via SDK) | — | — |
| YouTube (nocookie) | iframe embed | Yes | `app/about/page.tsx`, `app/gallery2/page.tsx` | none |
| Google Analytics/GTM | Script | Only if `NEXT_PUBLIC_GA_ID` set | `app/layout.tsx` | `NEXT_PUBLIC_GA_ID` |
| Plausible | Script | No (never loaded) | `lib/analytics.ts` et al. | none |
| Google Fonts (`next/font`) | Build‑time | Yes | `app/layout.tsx` | none |
