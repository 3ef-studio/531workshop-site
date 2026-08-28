# TESTING

How to run and extend the automated tests for the 531 Workshop site.

The suite is a **regression safety net**, not exhaustive coverage. It exists so we can
change production behavior (SEO, contact hardening, cleanup) with confidence.

---

## Stack

| Kind | Tool | Location | Runs against |
|---|---|---|---|
| Unit + API route tests | Vitest 3 | `test/**/*.test.ts` | code imported directly, Node env, **all I/O mocked** |
| Browser smoke tests | Playwright 1 (Chromium) | `e2e/**/*.spec.ts` | a real `next build && next start`, **all third-party requests blocked** |

Config: `vitest.config.ts`, `test/setup.ts`, `playwright.config.ts`, `e2e/fixtures.ts`.

**No test touches a real database, sends real email, or calls Shopify / any external
host.** `test/setup.ts` throws if a unit test makes an un-mocked `fetch`; `e2e/fixtures.ts`
aborts every non-`localhost` request.

---

## Commands

```bash
npm run test        # unit + API tests once (alias: npm run test:unit)
npm run test:watch  # unit tests in watch mode
npm run test:e2e    # Playwright smoke tests
npm run lint        # eslint (must pass)
npm run build       # production build (must pass)
```

First-time Playwright setup (once per machine):

```bash
npx playwright install chromium
```

`npm run test:e2e` locally runs `npm run build && npm run start` itself (via Playwright's
`webServer`); if you already have a server on :3000 it is reused. In CI the build step
runs first and Playwright just starts the server.

---

## What is covered

**Unit / API (`test/`)**

- `contactValidation.test.ts` — the client form rules in `lib/contactValidation.ts`.
- `products.test.ts` — `lib/products.ts`: catalog loading, `parsePriceNumber`,
  `sortProducts` (available-first, price ascending, title tiebreak).
- `api-contact.test.ts` — `POST /api/contact`: validation, success path (lead + token
  insert, commit, Resend call), and failure modes (missing `EMAIL_FROM`, Resend throw,
  DB down).
- `api-contact-verify.test.ts` — `GET /api/contact/verify`: missing/invalid token,
  successful verification + redirect, already-verified lead, DB error.
- `api-shopify-product.test.ts` — `GET /api/shopify/product`: missing handle / env,
  response reshaping, GraphQL errors, unknown handle.

**Playwright (`e2e/smoke.spec.ts`)**

- Pages load with a 200 and the right `<h1>`: `/`, `/about`, `/faq`, `/gallery2`, `/shop`.
- `/shop` renders all 7 product cards.
- `/shop/small-board` renders the Buy Button mount point and the Details section.
- `/shop/<unknown>` returns 404.
- Header navigation works.
- Contact form: empty submit shows client validation; valid input clears it; **no POST is
  made to `/api/contact`**.

Some tests deliberately assert *current* (imperfect) behavior and reference
`docs/TECHNICAL_DEBT.md` — e.g. `parsePriceNumber("$175 - $290") === Infinity` (F4) and
`/api/contact` returning `{ok:true}` with `EMAIL_FROM` unset (A4). When those bugs are
fixed, flip the assertion in the same test.

---

## Left manual (not automated)

- Shopify add-to-cart / cart drawer / checkout / order creation.
- Real email delivery and the confirmation-link click-through.
- Live Shopify price/variant accuracy.
- Visual / theme review.
- `/api/shopify/cart` and unrendered dead components.

---

## Adding tests

### A unit test

1. Add `test/<name>.test.ts`. Import from `@/...` (the `@` alias is wired in
   `vitest.config.ts`).
2. Prefer testing a **pure function**. If the logic lives inside a React component or a
   page, extract it to `lib/` first (see `lib/contactValidation.ts` and the
   `sortProducts` extraction in `lib/products.ts` for the pattern — move verbatim, keep
   the component importing it).
3. For an API route: `import { POST } from "@/app/api/.../route"` and call it with a
   `new Request(...)`. Mock `pg` / `resend` with `vi.mock` + `vi.hoisted` (copy
   `test/api-contact.test.ts`). Never let a route reach a real service.
4. Dummy env lives in `vitest.config.ts` → `test.env`. Override per-test with
   `vi.stubEnv("NAME", "value")` (auto-restored).

### A Playwright test

1. Add to `e2e/smoke.spec.ts` or a new `e2e/<name>.spec.ts`.
2. **Import `test` and `expect` from `./fixtures`, not `@playwright/test`** — the fixture
   is what blocks external requests.
3. Keep it a smoke check: page loads, key heading/content present, primary interaction
   works. Do not submit the contact form to the backend; do not drive Shopify checkout.

---

## CI

`.github/workflows/ci.yml` (push to `main` + all PRs) runs, in order:
`npm ci` → `lint` → `test` → `build` → install Chromium (cached) → `test:e2e`,
then uploads the Playwright HTML report as an artifact.

All env vars it needs are fake non-secrets defined in the workflow. **Do not add
production secrets to CI** — every integration is mocked or blocked.
