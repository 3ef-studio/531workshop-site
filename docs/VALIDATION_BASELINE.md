# VALIDATION BASELINE — 531 Workshop Site

_Validation run: 2026-08-28. Branch `main`, HEAD `eb40364`. Working tree carries one
pre‑existing uncommitted change (`tailwind.config.cjs`) and one untracked source file
(`components/shopify/ConfigurableAddToCart.tsx`) — neither introduced by this mission._

_Revised 2026-08-28 to correct the contact‑flow probe result: the probe wrote the lead
and reached Resend, but Resend returned HTTP 422 (`test@example.com` is a rejected test
recipient) so no email was delivered locally; production Resend delivery and the
verification click‑through are confirmed out of band by the team._

This document validates the findings in `docs/TECHNICAL_DEBT.md` against the running
application. No application code, configuration, or dependencies were changed during this
mission.

---

## 0. How validation was performed

- `npm run lint` and `npm run build` executed as‑is.
- `npm run start` (production server) run locally; every page and API route probed with
  `curl`.
- The repository's committed `.env` was present and **active** during `build`/`start`.
  That `.env` turned out to contain **working credentials**: a reachable PostgreSQL with
  the expected schema, a live Resend key, and a valid Shopify Storefront domain/token.
  Consequently:
  - **A single valid `POST /api/contact` probe wrote a real lead row + verification
    token (transaction committed) and reached Resend.** Resend returned **HTTP 422**
    because `test@example.com` is intentionally rejected as a test recipient, so **no
    email was delivered locally** — and the route still responded `{ok:true, "check your
    email"}` because it does not inspect the Resend result (see §3, A3/A4). No further
    write probes were made. Production Resend delivery has been confirmed separately
    (out of band) by the team. The email‑verification `GET` path was **not** exercised
    with a real token; per the team this does **not** need further testing.
  - Read‑only Shopify Storefront calls were made against the live store.
- Whether this `.env` matches the production deployment is unknown — treat all
  externally‑backed results as "verified against the configured environment", not
  "verified in production".

---

## 1. Build / lint results

### `npm run build` — ✅ PASS

- `next build` (Turbopack) compiles, type‑checks (`strict`), and generates 14 routes
  with **no errors**.
- Route classification from build output:
  - **Static (prerendered):** `/`, `/about`, `/faq`, `/gallery1`, `/gallery2`, `/shop`,
    `/_not-found`
  - **Dynamic (server‑rendered on demand):** `/contact` (awaits `searchParams`),
    `/shop/[slug]` (no `generateStaticParams`), `/api/contact`, `/api/contact/verify`,
    `/api/shopify/cart`, `/api/shopify/product`
- **Next 16 does not run ESLint during `build`** — a green build does **not** imply lint
  passes.
- Non‑fatal warnings observed:
  - **Multiple lockfiles.** Next inferred the workspace root as the *parent* directory
    `/Users/paulgerlach/Desktop/3ef/` because a stray `package.json`/`package-lock.json`
    lives there alongside unrelated projects. This is a **local‑machine artifact**, not a
    repo problem; it does not affect a clean CI/Vercel checkout of this repo alone. A
    `turbopack.root` / `outputFileTracingRoot` setting would silence it.
  - `baseline-browser-mapping` data "over two months old" — cosmetic dependency notice.

### `npm run lint` — ❌ FAIL (pre‑existing)

```
tailwind.config.cjs
  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports  (x2)
✖ 2 problems (2 errors, 0 warnings)
```

- Confirmed the **committed HEAD version also fails** the same rule (verified by linting
  `git show HEAD:tailwind.config.cjs`). Lint has been red on `main`; this is **not** a
  regression from the uncommitted working‑tree edit.
- The uncommitted `tailwind.config.cjs` change is a **partial, ineffective fix attempt**
  (it hoisted the `require()` calls to top‑level `const`s but they are still `require()`,
  so the rule still fires). Recommend the user either finish it (convert the file to ESM
  `tailwind.config.mjs` with `import`, or add a scoped rule override for `*.cjs`) or
  discard it.
- Practical impact: **lint cannot be added to CI until this is fixed.**

---

## 2. Functional baseline by major user path

Legend:
**VF** = Verified functional (build + local runtime) ·
**AF** = Appears functional from static/build validation ·
**RE** = Requires runtime/external verification ·
**BR** = Broken

| Path | Status | Evidence / notes |
|---|---|---|
| **Home** `/` | **VF** | Prerendered static; `GET /` → 200; hero, value props, featured, testimonials render. |
| **About** `/about` | **VF** | Prerendered static; `GET /about` → 200. YouTube iframe + image strip are `<iframe>`/`next/image` (render client‑side — see RE note below). |
| **FAQ** `/faq` | **VF** | Prerendered static; `GET /faq` → 200; 18 `<details>` items in output. |
| **Gallery** `/gallery2` | **VF** | Prerendered static; `GET /gallery2` → 200; grid + modal component compiled. Detail modal interactivity not automatically tested (no browser) → minor RE. |
| Alternate gallery `/gallery1` | **VF (but orphaned)** | `GET /gallery1` → 200 and it **is built and deployed**; no navigation links to it anywhere. Cleanup, not breakage. |
| **Shop / catalog** `/shop` | **VF** | Prerendered static; all **7** products render with `/shop/<slug>` links; sort logic runs. One sort defect (see §4, F4). |
| **Product detail** `/shop/[slug]` | **VF** (page) / **RE** (purchase widget) | `GET /shop/small-board` → 200; `GET /shop/large-endgrain-board` → 200; `GET /shop/does-not-exist` → **404** (`notFound()` works). The page shell renders server‑side; the Shopify Buy Button mounts client‑side. |
| **Shopify Buy Button purchase path** | **RE** | Cannot be exercised without a real browser + Shopify. Boundaries verified: SDK URL `https://sdks.shopifycdn.com/buy-button/latest/...` → 200; `NEXT_PUBLIC_SHOPIFY_*` env present and valid (the Storefront API returned real data for `large-endgrain-board`). Add‑to‑cart, cart drawer, and checkout hand‑off remain **manual‑only**. |
| **Contact form** (client) `/contact` | **VF** | `GET /contact` → 200; `?confirmed=1` banner path → 200. Client‑side validation is in `ContactForm.validate` (not independently unit‑tested — no test harness). |
| **Contact API** `POST /api/contact` | **VF (against configured env)** | `{email:"nope"}` → 400 "valid email"; `{message:"hi"}` → 400 "short message"; valid payload → **200 `{ok:true}`** — the DB insert + token insert + `COMMIT` succeeded, and the request **reached Resend**. Resend returned **HTTP 422** (`test@example.com` is a rejected test recipient), so no email was delivered locally; the route returned `{ok:true}` anyway because it never checks the Resend response (§3, A3/A4). Production email delivery confirmed separately by the team. `GET /api/contact` → 405. |
| **Email verification flow** `GET /api/contact/verify` | **AF / RE** | `GET /api/contact/verify` (no token) → **400 plain text "Missing token."** The full success path (valid token → `verified=TRUE` → 302 `/contact?confirmed=1` → internal notification email) is code‑complete and its dependencies (DB reachable, Resend reachable + delivering in production) are established, but the click‑through was **not executed** this mission and — per the team — does **not** need further testing. |
| 404 handling | **VF** | Default `/_not-found` built; unknown product slug → 404. |

**Not verifiable without a browser (all paths):** client‑side `next/image` loading, the
gallery modal, the testimonials carousel, the mobile menu, and any `dark:`‑variant visual
rendering.

**Overall:** the site is **fundamentally functional**. Every user‑facing page loads, the
catalog renders, routing/404s behave, and the contact pipeline writes the lead + token
and hands off to Resend (production delivery confirmed out of band). The gaps are
(a) SEO output, (b) contact‑API robustness/abuse surface — including that the route
ignores Resend error responses, (c) a large amount of dead code, and (d) the purchase
flow, which can only be finished by manual/browser testing.

---

## 3. Validated high‑priority technical‑debt findings

| ID | Finding | Validation result |
|---|---|---|
| **D1** | Every page emits `<link rel="canonical" href="/">` | **CONFIRMED at build time**, then **RESOLVED 2026-08-28.** The global `alternates.canonical` was removed from `app/layout.tsx` and each indexable route now declares its own (`/`, `/about`, `/faq`, `/gallery2`, `/shop`, `/contact`, and `/shop/<slug>` via `generateMetadata`). Verified in built/served HTML + covered by `e2e/seo.spec.ts`. |
| **D2** | No `sitemap`/`robots` | **CONFIRMED**, then **RESOLVED 2026-08-28.** Added `app/sitemap.ts` (6 static routes + 7 product pages, derived from `data/products.json`; excludes `/gallery1`, API, framework routes) and `app/robots.ts` (`Allow: /`, `Disallow: /api/`, `Sitemap:` pointer). Verified at `/sitemap.xml` and `/robots.txt` + covered by `test/sitemap.test.ts` and `e2e/seo.spec.ts`. |
| **C1** | Plausible referenced but never loaded | **CONFIRMED.** No `plausible` string in any built HTML; no script tag anywhere. All `track()` / `window.plausible(...)` calls are no‑ops. |
| **C2** | GA gated on unset env; events target Plausible only | **CONFIRMED.** No `googletagmanager` in built HTML (`NEXT_PUBLIC_GA_ID` unset). Even if set, no custom event calls GA. |
| **B1** | `/api/shopify/*` routes are dead | **PARTIALLY REVISED.** They are **built, deployed, and `/api/shopify/product` actually works** (returned live variant data). They remain **unreferenced by any rendered component** (`/api/shopify/product` is only called by the unused `ConfigurableAddToCart.tsx`; `/api/shopify/cart` by nothing). So: *working but unused public endpoints*, not "broken code". |
| **F6** | `products.json` `variants` not reconciled with Shopify | **CONFIRMED and worse than documented.** Shopify reports **3 option dimensions** for `large-endgrain-board` (Material: Walnut/Maple/Cherry; Feet: Included/No Feet; Juice Groove: Included/No Groove). `products.json` lists one dimension `Material: ["Maple","Cherry","Walnut"]` (wrong order, missing two dimensions). Not an active purchase defect — the PDP Buy Button pulls options straight from Shopify by product ID; the JSON array is used only as a boolean "has options" flag. |
| **F3** | Local price strings drift from Shopify | **CONFIRMED.** `large-endgrain-board` `price_display` is `"$175 - $290"`; the one variant inspected is `$290`. `/shop` shows the local string; the PDP hides it (because the product has options). Accuracy risk on the catalog page. |
| **F4** | Range‑price sort → `+Infinity` | **CONFIRMED.** `toPriceNumber("$175 - $290")` → `"175-290"` → `NaN` → `+Infinity`; `large-endgrain-board` sorts to the end of `/shop` regardless of its real starting price. Low blast radius (7 products). |
| **A3/A4** | Contact API failure semantics | **CONFIRMED at runtime — and broader than first documented.** The live probe wrote the lead + token, committed, called Resend, got **HTTP 422 back**, and the route **still returned `{ok:true, "check your email"}`** — because it only `await`s `resend.emails.send(...)` and never checks the returned `{ error }` object. So a rejected/failed send (bad recipient, rate limit, unverified domain, transient 5xx) is **silently swallowed** and the user is told to check an inbox that got nothing. Separately: missing `EMAIL_FROM`/`RESEND_API_KEY` also returns `{ok:true}` (A4); a *thrown* Resend error (network) yields a 500 after the lead is already committed/verified (A3). The fix must inspect the Resend response, not just catch exceptions. |
| **A5/H6** | Server validation weaker than client | **CONFIRMED.** Server accepts `message.length >= 5` (client requires ≥20), treats names as optional (client requires them), and enforces **no maximum** message length. Direct API callers bypass the client rules. |
| **A9** | Verify route never renders the styled `?error=` banner | **CONFIRMED.** `GET /api/contact/verify` with a bad/missing token returns an unstyled `text/plain` 400; it only ever redirects on success. The `?error=expired` handling in `app/contact/page.tsx` is unreachable. |
| **G1** | `sharp` undeclared dependency | **CONFIRMED but currently working.** `require('sharp')` resolves (v0.34.5, pulled in transitively by Next). Only `scripts/optimize-images.mjs` imports it directly; `next build` uses its own copy. Fragile, not broken. |
| **A8** | DB schema absent from repo | **CONFIRMED — and the schema exists in the target DB** (the INSERT succeeded). This is a reproducibility/onboarding gap, not a runtime defect for the current environment. |
| **A6/A7** | `pg` `Pool` per module; TLS `rejectUnauthorized:false` | **CONFIRMED in code.** Connection worked locally (single instance). Serverless connection‑exhaustion and MITM exposure depend on the production DB setup. |
| **E1** | `<html class="dark">` with a light‑only palette | **CONFIRMED.** Built HTML has `class="dark"` on `<html>`; active `theme-b.css` defines only light `:root` tokens. Renders light; `dark:` variants permanently active. Cosmetically confusing, not broken. |
| **NEW‑1** | `npm run lint` fails | **CONFIRMED**, pre‑existing on `main` (see §1). |
| **NEW‑2** | Live `.env` committed‑adjacent and functional | The repo's `.env` is gitignored and **not tracked** (verified), but it exists on disk with **working production‑grade secrets** (DB, Resend, Shopify). Anyone with repo/filesystem access has live credentials. Rotate if this tree has been shared. |

---

## 4. Active defects and risks requiring attention

### Active Defects (currently produce incorrect behavior)

| ID | Defect | Proportionate fix (do NOT implement yet) |
|---|---|---|
| **D1** | ~~All pages report canonical URL `/`~~ | **RESOLVED 2026-08-28.** Global `alternates.canonical` removed from `app/layout.tsx`; each indexable route declares its own `alternates.canonical` (see §3 and `TECHNICAL_DEBT.md` D1). |
| **NEW‑1** | `npm run lint` exits non‑zero (`require()` in `tailwind.config.cjs`). Blocks adding lint to CI; masks future lint errors. | Convert to `tailwind.config.mjs` with `import`, **or** add `{ files: ["*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } }` to `eslint.config.mjs`. Also resolve the dangling uncommitted edit to this file. |
| **A9** | Expired/invalid confirmation links show an unstyled plain‑text 400 instead of the site's error banner. | In `app/api/contact/verify/route.ts`, replace the plain‑text 400s with `NextResponse.redirect('/contact?error=expired'|'invalid')`. |
| **F4** | `/shop` sorts range‑priced products last regardless of real price. | Parse the **first** number in `price_display` (e.g. `s.match(/[\d.]+/)`) in `toPriceNumber`, or add an explicit `sort_price` field to `products.json`. |

### Active Risks (path works today but is fragile / unsafe)

| ID | Risk | Proportionate fix (do NOT implement yet) |
|---|---|---|
| **A1** | `POST /api/contact` has no rate limiting / CAPTCHA / honeypot; each call writes 2 rows and sends an email. Spam + Resend cost + DB growth. | Add a lightweight IP/(or `x-forwarded-for`) rate limit (in‑memory token bucket for a single instance, or a small KV/Upstash counter), plus a hidden honeypot field checked server‑side. |
| **A2** | Internal "new verified inquiry" email interpolates `first_name`/`last_name`/`phone`/`message` into HTML unescaped → HTML/link injection into the owner's inbox. | Add an `escapeHtml()` helper and apply to every interpolated field, or switch the notification to a plain‑text body. |
| **A3 / A4** | The route ignores Resend's response object — a 422 / rate‑limit / domain‑unverified / 5xx send failure is swallowed and the user is still told "check your email" (observed live: 422 → `{ok:true}`). Missing email env also returns `{ok:true}`; a thrown Resend error 500s after the lead is committed. | Check the `{ data, error }` returned by `resend.emails.send`; on error return a distinct response (e.g. `{ok:true, emailed:false}` + a "we got your request but couldn't send the confirmation" message) and log to a real channel. Move the send outside the DB transaction's rollback path. Add a "resend confirmation" affordance. |
| **A5 / H6** | Weak/asymmetric server‑side validation; unbounded `message`. | Mirror the client rules server‑side (names required, message 20–4000 chars) and cap length before insert. |
| **A7** | `ssl: { rejectUnauthorized: false }` for Postgres. | Supply the provider CA (`ssl: { ca }`) or set `sslmode=verify-full` in the connection string. |
| **A10** | Stores `ip`/`user_agent`/`referer` + contact PII with **no `/privacy` page** and no consent notice. | Add a privacy policy page and link it from the contact form; confirm retention/lawful‑basis with the business. |
| **D2** | ~~No `sitemap.xml` / `robots.txt`~~ | **RESOLVED 2026-08-28.** Added `app/sitemap.ts` and `app/robots.ts` (see §3 and `TECHNICAL_DEBT.md` D2). |
| **F1** | Buy Button SDK loaded from `.../latest/...` (unpinned) with a DOM‑poking quantity workaround coupled to current SDK internals. | Pin a specific SDK version in the script URL; add a comment tying the workaround to that version. |
| **F2** | If the SDK/CDN/Shopify is unavailable, the PDP shows an empty CTA area with no message. | Render a plain `https://<store-domain>/products/<handle>` fallback link when the SDK fails to initialize. |
| **G2 / G3** | No `.env.example`; `SITE_URL` and `NEXT_PUBLIC_SITE_URL` are separate and can disagree (wrong canonical / broken verification links). | Add `.env.example` (names only) and collapse to one base‑URL variable. |
| **G4** | No security headers (CSP, `X-Frame-Options`, `Referrer-Policy`, HSTS, `Permissions-Policy`). Third‑party scripts + iframes are unconstrained. | Add a `headers()` block in `next.config.ts` with a conservative CSP that allowlists `sdks.shopifycdn.com`, `*.myshopify.com`, `www.youtube-nocookie.com`, and (if used) `www.googletagmanager.com`. |
| **G5 / NEW‑1** | No automated tests, and lint is red so it can't gate CI. | See §8. |
| **NEW‑2** | Working secrets present in the on‑disk `.env`. | Rotate DB/Resend/Shopify credentials if this working tree has been shared or synced anywhere; keep `.env` gitignored (already is). |
| **A6** | `pg` `Pool` per route module under serverless. | Share one `Pool` from a `lib/db.ts` module; ensure the production DB is behind a pooler. (Also **Environment Dependent** — see §6.) |
| **H2** | `next/image` with hard‑coded local `src` and no existence guard; a filename typo = runtime 404 image. | Covered by the catalog/gallery data test in §8; longer term, validate `products.json`/`gallery-data.ts` paths against `public/` in a test or build step. |

---

## 5. Cleanup‑only findings (no effect on the active application)

These are abandoned or unused implementations. Removing them reduces the deployed surface
and reviewer confusion; leaving them does not break anything.

| ID | Item | Notes |
|---|---|---|
| **B1** | `app/api/shopify/cart/route.ts` (unused), `app/api/shopify/product/route.ts` (works, unused), `components/shopify/ConfigurableAddToCart.tsx` (untracked, imported nowhere), `components/shopify/buyButtonUI.ts` (only used by `ConfigurableAddToCart`) | The active purchase path is the Buy Button SDK only. Either finish the custom cart UI or delete all four. The two API routes are **live public endpoints** while they exist. |
| **B2** | `components/LeadForm.tsx` → `POST /api/lead`, `components/NewsletterForm.tsx` → `POST /api/subscribe` | Both endpoints 404; both components are unrendered. Delete, or build the endpoints if the features are wanted. |
| **B3** | `lib/portfolio.ts`, `lib/newsletter/dde.ts`, `components/ProjectCard.tsx`, `components/ClientEvent.tsx`, `components/CtaTrack.tsx`, RapidAPI `pricing` types/branches | Leftovers from a different 3EF project. Unreachable here. |
| **B4** | `app/gallery1/page.tsx` (deployed, unlinked), `app/theme-a.css`, `app/theme-c.css` (never imported) | Decide which gallery is canonical; delete the other and the unused themes. |
| **B5** | Duplicate `postcss.config.cjs` + `postcss.config.mjs` (identical) | Keep one. |
| **C1** | Dead Plausible tracking calls throughout | Remove, or actually add the Plausible script (see §4 — analytics is a business gap, not just cleanup). |
| **E3** | `app/theme-c.css` header comment says `app/theme-b.css` | Trivial. |
| **F5** | `Product.status === "made_to_order"` is in the type union but unhandled in UI; no data uses it | Drop from the union or handle it. |
| **F7** | Hard‑coded, mismatched Storefront API versions (`2024-10` vs `2024-04`) | Only matters if the `/api/shopify/*` routes are kept. Align + track Shopify's version sunset. |
| **G7** | Re‑committed spaced‑filename image duplicates (`"Bar shelving.webp"` vs `Bar-shelving.webp`) | Pick one naming convention; the current `git status` is adding ~25 duplicate assets. |
| **H1** | Misspelled env name in an error string (`SHOPIFY_STOREFRRONT_ACCESS_TOKEN`); stale `RESEND_FROM` comments | Cosmetic. |

---

## 6. Items requiring production / environment verification

| ID | Question only the deployment can answer |
|---|---|
| **A6** | Is the production `DATABASE_URL` behind a connection pooler (PgBouncer / Neon pooled endpoint)? Without one, `new Pool()` per serverless function + traffic bursts can exhaust Postgres connections. |
| **A7** | What CA does the production Postgres present, and can `rejectUnauthorized: true` be enabled? |
| **A8** | Confirm the production DB actually has `app.leads` + `app.email_verification_tokens` with all referenced columns (`verified_at`, `used_at`, `ip`, `user_agent`, `referer`, …) and appropriate indexes / a unique constraint on `token_hash`. |
| **A3/A4** | Production Resend delivery is confirmed (out of band). Still open: is the `EMAIL_FROM` domain fully verified in Resend (SPF/DKIM/DMARC), and do confirmation + internal‑notification emails land in the inbox (not spam)? Note that because the route swallows Resend errors, any *future* production send failure (rate limit, domain issue, recipient reject) would be invisible in the app — worth a Resend‑side alert or log check. |
| **D1/G3** | What is `NEXT_PUBLIC_SITE_URL` / `SITE_URL` in production? Do they match, and do verification links resolve to the public domain (not a preview URL)? |
| **C2** | Is `NEXT_PUBLIC_GA_ID` set in production? If analytics is expected, is *any* analytics actually collecting data? (Locally: none.) |
| **Buy Button** | Manual browser test on the deployed PDP: does add‑to‑cart open the drawer, does quantity persist across a variant change, does "Checkout" reach Shopify‑hosted checkout, and does a completed test order appear in Shopify? |
| **Shopify catalog sync** | Do all 7 `shopify_product_id`s in `products.json` still map to live, correctly‑priced Shopify products? (`large-endgrain-board` already shows option/price drift.) |
| **E2** | Visual check: is the (always‑white) header/footer logo legible on the light‑background interior pages once the header goes opaque on scroll? |
| **Vercel build** | Does the production build environment reproduce the "multiple lockfiles" warning? (Should not, for a clean single‑repo checkout — confirm.) |
| **Security headers** | What headers does the platform already inject (Vercel adds some)? Determines how much of G4 is outstanding. |

---

## 7. Recommended remediation order

Ordered by (business impact ÷ effort), safest first. **Do not start until the §8 test
baseline exists** — several of these touch the contact API and the catalog sort.

1. **Unblock quality gates (tiny, enables everything else)**
   - NEW‑1: fix `tailwind.config.cjs` lint failure; resolve the dangling uncommitted edit.
   - G5/§8: add the automated test baseline + a CI workflow running `lint`, `build`, `test`.
2. **SEO — high impact, low effort** — ✅ **DONE 2026-08-28**
   - D1: correct per‑page canonical URLs. ✅
   - D2: add `app/sitemap.ts` + `app/robots.ts`. ✅
   - (Optional, not done) give `/about` and `/gallery2` real page `metadata` titles.
3. **Contact API correctness & safety** (one focused PR)
   - A5/H6: server‑side validation parity + message length cap.
   - A2: escape user input in the notification email.
   - A9: redirect verification failures to `/contact?error=…`.
   - A3/A4: check the Resend response object (not just exceptions); distinct "saved but not emailed" response + real error logging; keep the send off the rollback path.
   - A1: rate limiting + server‑checked honeypot.
4. **Security & environment hygiene**
   - G4: security headers / CSP in `next.config.ts`.
   - G2/G3: `.env.example`; consolidate the base‑URL variable.
   - NEW‑2/A7: rotate secrets if the tree was shared; tighten Postgres TLS.
   - A6: single shared `pg` `Pool`; confirm production pooling.
5. **Commerce robustness**
   - F1: pin the Buy Button SDK version.
   - F2: fallback "Buy on Shopify" link.
   - F4: fix range‑price sort.
   - F3/F6: reconcile `products.json` with live Shopify data (or source price/options from Shopify only).
6. **Analytics decision**
   - C1/C2: either install Plausible (and point events at it) or delete the tracking code. Pick one.
7. **Dead‑code cleanup pass** (mechanical, after the above land)
   - B1–B5, E3, F5, F7, G7, H1. Delete unused routes/components/themes/assets in a single reviewable PR.
8. **Deferred / low priority**
   - E1/E2 (theming), E4 (focus traps), D3 (marketing numbers), A11 (token in query), H4/H5.

---

## 8. Proposed automated testing baseline for the next mission

> **Status: IMPLEMENTED 2026-08-28.** See **§9** below for what was actually built and
> `docs/TESTING.md` for how to run/extend it. The proposal below is kept for context;
> the delivered suite deviates slightly (no React Testing Library — the contact
> validation rules were extracted to a pure module instead).

**Goal:** lock in the behavior that matters *before* remediation touches it. Keep it
small — this is a 7‑product marketing site.

### Tooling

| Layer | Tool | Why |
|---|---|---|
| Unit / integration | **Vitest** + `@vitejs/plugin-react` | Fast, TS‑native, works with Next 16 / React 19; run route handlers and pure functions directly. |
| Component (light) | **@testing-library/react** + `@testing-library/jest-dom` + `jsdom` | Only for `ContactForm` validation UI. |
| E2E smoke | **Playwright** (`@playwright/test`) | Real browser for page loads + the one interactive flow worth guarding (contact form). Runs against `next build && next start`. |
| CI | GitHub Actions workflow | `npm ci` → `lint` → `build` → `vitest run` → `playwright test`. |

> Do **not** add `jest` — Next's `next/jest` transform is extra config for no benefit here.

### What to mock

- **`pg`** — mock the `Pool` (`connect`/`query`/`release`) so `/api/contact` and
  `/api/contact/verify` tests never touch a database. Provide canned rows for the verify
  `SELECT`.
- **`resend`** — mock `Resend.prototype.emails.send` (assert it's called with the right
  `to`/`from`/subject; never send).
- **Shopify Storefront `fetch`** — mock `global.fetch` for `/api/shopify/product` tests
  with a captured real response fixture (options + variants JSON).
- **`window.plausible` / GA** — not needed; assert the no‑op helpers don't throw.
- Environment — set `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL`,
  `NEXT_PUBLIC_SHOPIFY_*` to dummy values in a test setup file.

### What stays manual (external, cannot be meaningfully automated here)

- Shopify add‑to‑cart / cart drawer / **checkout** and order creation.
- Actual email **delivery** and rendering (Resend, inbox, SPF/DKIM, spam placement) —
  production delivery is already confirmed out of band.
- The real end‑to‑end verification click‑through (token from a delivered email) — the
  team has accepted this as verified out of band; not required in the test suite.
- Live Shopify catalog/price accuracy.
- Visual/theme review (logo contrast, dark‑class oddity).
- Production connection‑pool behavior under load.

### Prerequisite refactors (small, call out in the next mission's PR)

- Export `toPriceNumber` (currently inline in `app/shop/page.tsx`) and
  `validate` (currently module‑private in `components/ContactForm.tsx`) so they can be
  unit‑tested directly. Alternatively test them through rendered output — but extraction
  is cleaner and cheap.

### Initial test list (~30 tests)

**A. Page smoke — Playwright (`e2e/smoke.spec.ts`) — 8 tests**
1. `/` returns 200 and shows the hero heading + a "Request a quote" link.
2. `/about` 200 + "About" heading + YouTube iframe present.
3. `/faq` 200 + at least 15 `<summary>` elements.
4. `/gallery2` 200 + gallery grid renders ≥ 12 images.
5. `/shop` 200 + exactly 7 product cards, first card is an "available" product.
6. `/shop/small-board` 200 + product title + an add‑to‑cart mount point (`#shopify-product-…` or the Buy Button container).
7. `/shop/does-not-exist` → 404 page.
8. `/contact` 200 + form has first/last/email/message fields.

**B. Catalog / product data — Vitest (`test/products.test.ts`) — 5 tests**
9. `getAllProducts()` returns 7 items; every item has `slug`, `title`, `status`, `shopify_product_id`.
10. `getProductBySlug("large-board")` resolves; `getProductBySlug("nope")` → `undefined`.
11. Every `image_thumb` / `image_hero` path in `products.json` exists under `public/`.
12. Sort: available‑before‑non‑available, then ascending price (this test **documents F4** — assert current behavior, then flip the assertion when F4 is fixed).
13. Every `cta_primary.url` points at an existing route/slug.

**C. Contact form validation (client) — Vitest + RTL (`test/contact-form.test.tsx`) — 4 tests**
14. Submitting empty → shows "required" errors, no `fetch` call.
15. Invalid email → email error shown.
16. Message < 20 chars → message error shown.
17. Valid input → `fetch("/api/contact", …)` called once with the JSON body; success banner rendered on `{ok:true}`.

**D. `/api/contact` route handler — Vitest (`test/api-contact.test.ts`, `pg` + `resend` mocked) — 6 tests**
18. Invalid email → 400 `{ok:false}`, no DB calls.
19. Message `"hi"` → 400 `{ok:false}`.
20. Valid payload → `INSERT` into `app.leads` then `app.email_verification_tokens`, `COMMIT`, `resend.emails.send` called with `to = <lead email>`, response `{ok:true}`.
21. Missing `EMAIL_FROM` → **still** `{ok:true}` and `send` **not** called (documents A4; update when A4 is fixed).
22. **`resend.emails.send` resolves with `{ error: { statusCode: 422 } }`** → route currently **still returns `{ok:true}`** (documents the observed A3/A4 behavior; flip to assert `emailed:false` once fixed).
23. `pool.connect()` rejects → 500 `{ok:false}`, `ROLLBACK` not required.

**E. `/api/contact/verify` route handler — Vitest (mocked) — 4 tests**
24. No `token` param → 400.
25. Token not found / expired (`SELECT` returns 0 rows) → 400 (documents A9; change to redirect assertion when A9 is fixed).
26. Valid unused token → `UPDATE app.leads SET verified=TRUE`, `UPDATE …tokens SET used_at`, `COMMIT`, notification `send` to `CONTACT_TO_EMAIL`, 302 → `/contact?confirmed=1`.
27. Already‑verified lead + valid token → does **not** re‑`UPDATE leads.verified`, still marks token used, still 302.

**F. Shopify boundary — Vitest (`test/api-shopify.test.ts`, `fetch` mocked) — 3 tests**
28. `/api/shopify/product` with no `handle` → 400.
29. Missing `NEXT_PUBLIC_SHOPIFY_*` → 500.
30. Mocked Storefront success → response reshaped to `{ title, options, variants }`; GraphQL `errors` in the payload → 502.

_(Total ≈ 30 across 7 files if every optional test is kept; a lean first cut is ~21:
sections A, B, D, E.)_

### Files / configuration to add

```
package.json                 # scripts: "test": "vitest run", "test:e2e": "playwright test"
                             # devDeps: vitest, @vitejs/plugin-react, @testing-library/react,
                             #          @testing-library/jest-dom, jsdom, @playwright/test
vitest.config.ts             # environment: 'jsdom' for *.tsx, 'node' for route tests; setupFiles
test/setup.ts                # dummy env vars, @testing-library/jest-dom, global fetch mock helper
vitest.setup.ts              # (or fold into test/setup.ts)
playwright.config.ts         # webServer: "npm run build && npm run start", baseURL localhost:3000
test/                        # products.test.ts, contact-form.test.tsx, api-contact.test.ts,
                             #   api-contact-verify.test.ts, api-shopify.test.ts
test/fixtures/               # shopify-product.json (captured real response)
e2e/                         # smoke.spec.ts
.github/workflows/ci.yml     # npm ci → lint → build → vitest run → playwright test
```

**No testing dependencies were installed and no tests were written in this mission.**

---

## 9. Automated test baseline — implemented (2026-08-28)

A minimal regression safety net was added. **No production behavior changed**; the only
application-code edits were two pure-function extractions (see below) that produce
byte-identical results.

### Lint failure fixed

`npm run lint` was failing on pre-existing `require()` calls in `tailwind.config.cjs`
(`@typescript-eslint/no-require-imports`). Fix: an ESLint override in `eslint.config.mjs`
turning that rule off for `**/*.cjs` (CommonJS files legitimately use `require`). A second
override disables `react-hooks/rules-of-hooks` for `e2e/**` (Playwright's `use` fixture
parameter trips the rule). An abandoned partial edit to `tailwind.config.cjs` in the
working tree was reverted to HEAD. `npm run lint` and `npm run build` both pass.

### Test frameworks added

| Layer | Tool | Scope |
|---|---|---|
| Unit / API | **Vitest 3** (`vitest.config.ts`, `test/setup.ts`) | pure functions + route handlers, Node environment, all I/O mocked |
| Browser smoke | **Playwright 1** (`playwright.config.ts`, `e2e/fixtures.ts`) | Chromium only; every non-localhost request is aborted by a fixture |

No other test dependencies (no RTL/jsdom): the client contact-validation rules were
extracted to `lib/contactValidation.ts` and the `/shop` catalog sort to
`sortProducts` / `parsePriceNumber` in `lib/products.ts`, so both are unit-testable
without rendering React.

npm scripts: `test` / `test:unit` (`vitest run`), `test:watch` (`vitest`),
`test:e2e` (`playwright test`).

### Coverage established (37 unit + 12 e2e = 49 tests)

> Updated 2026-08-28 (SEO mission): +4 unit (`test/sitemap.test.ts`) and +12 e2e
> (`e2e/seo.spec.ts`) for canonical URLs, `sitemap.xml`, and `robots.txt`.

**Vitest (`test/`)**
- `contactValidation.test.ts` (5) — name/email/phone/message rules incl. 20–4000 char window.
- `products.test.ts` (11) — catalog loads with required fields, unique slugs, known/unknown
  slug lookup, `cta_primary` URLs resolve; `parsePriceNumber` incl. the documented range
  bug (F4); `sortProducts` available-first / price-asc / title tiebreak / no-mutation.
- `api-contact.test.ts` (7) — invalid email & short message → 400 without DB; success path
  inserts lead+token, commits, calls Resend with the lead's address; email lowercased;
  **missing `EMAIL_FROM` still returns `{ok:true}` and skips Resend (documents A4)**;
  Resend throw → 500 + rollback; DB connect failure → 500.
- `api-contact-verify.test.ts` (5) — missing token → 400 (no DB); unknown/expired token →
  400 + rollback; valid token verifies lead, consumes token, notifies owner, 302 →
  `/contact?confirmed=1`; already-verified lead not re-verified; query throw → 500.
- `api-shopify-product.test.ts` (5) — missing handle → 400; missing env → 500;
  success reshaped to `{title,options,variants}`; GraphQL errors → 502; unknown handle → 404.
- `sitemap.test.ts` (4) — `app/sitemap.ts` lists the 6 static routes + every product page
  and nothing else (no `/gallery1`, `/api`, `_not-found`, `[slug]`), all on the configured
  origin; `app/robots.ts` allows `/`, disallows `/api/`, and points at `/sitemap.xml`.

**Playwright (`e2e/smoke.spec.ts`)** — `/`, `/about`, `/faq`, `/gallery2`, `/shop`,
`/shop/small-board` (asserts the Buy Button mount point + Details heading),
`/shop/<unknown>` → 404, header nav navigation, and the contact form (empty submit shows
client validation, valid input clears it, **asserts zero POSTs to `/api/contact`**).

**Playwright (`e2e/seo.spec.ts`)** — every indexable route (`/`, `/about`, `/faq`,
`/gallery2`, `/shop`, `/contact`, `/shop/small-board`) emits its own
`<link rel="canonical">`; interior pages no longer canonicalize to `/`; a second product
page (`/shop/large-endgrain-board`) has its own canonical; `/contact?confirmed=1`
canonicalizes to `/contact`; `/sitemap.xml` (200, XML, contains the public routes +
product pages, excludes `/gallery1` and `/api`); `/robots.txt` (200, references the
sitemap).

### External systems mocked / blocked

| System | Unit tests | e2e tests |
|---|---|---|
| Postgres (`pg`) | `vi.mock("pg")` — fake `Pool`/client, programmed per test | n/a (no API calls made) |
| Resend | `vi.mock("resend")` — `emails.send` is a spy | n/a |
| Shopify Storefront / `fetch` | `globalThis.fetch` replaced with `vi.fn()`; `test/setup.ts` throws on any un-mocked `fetch` | Buy Button SDK (`sdks.shopifycdn.com`) + `*.myshopify.com` aborted by `e2e/fixtures.ts` |
| Config/secrets | dummy values in `vitest.config.ts` `test.env` | dummy values in `playwright.config.ts` `webServer.env` |

No automated test performs a live DB write, email send, Shopify cart/checkout, or any
external network call.

### CI

`.github/workflows/ci.yml` runs on pushes to `main` and all PRs:
`npm ci` → `npm run lint` → `npm run test` → `npm run build` →
`npx playwright install --with-deps chromium` (cached) → `npm run test:e2e`, then uploads
the Playwright report. npm and Playwright-browser caches are used. All required env vars
are obviously-fake non-secrets set in the workflow — **CI needs no production secrets**.

### Intentionally left manual / untested

- Shopify add-to-cart, cart drawer, and checkout (needs the real SDK + a real store).
- Real email **delivery** (Resend) and the confirmation-link click-through — accepted as
  verified out of band by the team.
- Live Shopify catalog/price accuracy.
- Visual / theme review (logo contrast, the inert `class="dark"`).
- The dead `/api/shopify/cart` route and unrendered components (`LeadForm`,
  `NewsletterForm`, `ConfigurableAddToCart`, etc.) — not tested; slated for the cleanup pass.
- Production DB connection-pool behavior under load.

### Application issues observed while testing (NOT fixed)

- **Build has a hard dependency on `RESEND_API_KEY`.** `app/api/contact/route.ts` runs
  `new Resend(process.env.RESEND_API_KEY)` at module load, and the Resend SDK constructor
  **throws** if the key is absent. `next build` evaluates this module during page-data
  collection, so a build with no `RESEND_API_KEY` fails. CI works around it with a dummy
  value. (Relates to `TECHNICAL_DEBT.md` A4 — same construct.)
- Confirmed at the unit level: `/api/contact` returns `{ok:true}` when `EMAIL_FROM` is
  missing and never inspects the Resend response (A3/A4) — locked in by a test that will
  flip when the behavior is fixed.
- The local "multiple lockfiles" Next warning persists (stray `package-lock.json` in the
  parent directory); harmless, local-only, not reproduced on a clean CI checkout.

---

## Appendix — commands run

Original validation run (2026-08-28):

```
npm run lint          # FAIL: 2 errors in tailwind.config.cjs (pre-existing on main)
npm run build         # PASS: 14 routes, no type errors
npm run start         # served locally for route probing, then stopped
curl … (GET)          # all pages 200; /shop/does-not-exist 404; /api GETs 405/400
curl -X POST /api/contact
                      #   invalid → 400
                      #   valid   → 200 {ok:true}  ← wrote 1 real lead + token (committed);
                      #             reached Resend, which returned HTTP 422 (test@example.com
                      #             is a rejected test recipient) → no local email; route
                      #             returned {ok:true} regardless (does not check Resend response)
curl /api/shopify/product?handle=large-endgrain-board
                      #   200, real Shopify variant data returned
```

Test-baseline mission (2026-08-28), all mocked — no live DB/email/Shopify:

```
npm run lint          # PASS (after eslint .cjs / e2e overrides)
npm run test          # PASS — 33 unit/API tests, 5 files
npm run build         # PASS — 14 routes, no type errors
npm run test:e2e      # PASS — 9 Playwright smoke tests (Chromium)
```

SEO mission — D1 + D2 (2026-08-28), no external calls:

```
npm run lint          # PASS
npm run test          # PASS — 37 unit tests, 6 files (+ test/sitemap.test.ts)
npm run build         # PASS — 16 routes (+ /sitemap.xml, /robots.txt)
npm run test:e2e      # PASS — 21 Playwright tests (+ e2e/seo.spec.ts)
```
