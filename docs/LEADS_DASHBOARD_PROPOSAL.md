# LEADS DASHBOARD PROPOSAL — 531 Workshop Site

_Prepared: 2026-10-15. Research and design only. No application code, database schema,
Vercel configuration, or environment variables were changed while writing this. No
production database was queried and no customer records were viewed. Every statement
about the data model comes from the repository source and the existing docs
(`ARCHITECTURE.md`, `INTEGRATIONS.md`, `FEATURES.md`, `TECHNICAL_DEBT.md`,
`CONTACT_SPAM_INVESTIGATION.md`)._

---

## 0. Summary

- **What we're building:** a private, **read-only** page at `/admin/leads` inside the
  existing Next.js app. It lists contact-form leads straight from the Postgres database
  the site already writes to.
- **Recommended auth:** one **shared passphrase** that sets a **signed, HttpOnly session
  cookie** for 30 days. It uses only Node's built-in `crypto`. That means no new
  dependency, no new service, and no schema change. The page fails closed: if the admin
  environment variables aren't set, `/admin` returns 404.
- **The UI:** one mobile-friendly page. It has three tabs (**Confirmed** by default,
  **Not confirmed**, **All**) and a card or row per lead showing submitted date, name,
  email/phone (tap to contact), project context, message and confirmation status.
- **Status tracking (new / contacted / closed):** **defer it to Phase 2.** It's the only
  part that needs a schema change and write access. Without it, Phase 1 stays strictly
  read-only, which removes most of the security surface. The data model below is
  designed so it can be added later without rework.
- **Effort:** Phase 1 is **about 2–3 developer days**, including tests and docs. Phase 2
  (status) is about 1–1.5 days plus a coordinated DB change.
- **Reuse:** build it as a self-contained `app/admin/` + `lib/admin/` module with a small
  config object, so it can be copied to other 3EF client sites. Only extract it into a
  shared package once a second or third site actually uses it.

---

## 1. Current-state architecture

### 1.1 Components involved

| Piece | Where | Role |
|---|---|---|
| Contact form | `components/ContactForm.tsx`, `app/contact/page.tsx` | Collects name, email, phone, message, optional project type / dimensions / timeframe, optional `?project=<slug>` Gallery context, hidden honeypot `referenceId` |
| Shared validation | `lib/contactValidation.ts`, `lib/contactOptions.ts` | Message length 20–4000, no-whitespace spam check, allow-lists for project type and timeframe, plus their human labels |
| Submit API | `app/api/contact/route.ts` (`POST`) | Spam short-circuit, validation, lead + token insert, confirmation email |
| Verify API | `app/api/contact/verify/route.ts` (`GET`) | Consumes the token, marks the lead verified, emails the owner |
| Database | Hosted Postgres (Neon/Supabase/Vercel-Postgres style, inferred), schema `app` | Lead storage. **Schema is not in the repo** (`TECHNICAL_DEBT.md` A8) |
| Email | Resend (`resend` SDK) | Customer confirmation email and owner notification |
| Hosting | Vercel (inferred, `OPERATIONS.md`) | Serverless Node runtime; `x-forwarded-for` gives the client IP |

### 1.2 Submission pipeline

```
Visitor ──POST /api/contact──▶ honeypot filled? ──yes──▶ INSERT app.contact_rejections ──▶ fake 200 "check your email"
                                     │no
                                     ▼
                             validate email / message length
                                     │
                       message has no whitespace? ──yes──▶ INSERT app.contact_rejections ──▶ 400
                                     │no
                                     ▼
                  BEGIN
                    INSERT app.leads (verified = FALSE, source='contact', ip, ua, referer, project_context)
                    INSERT app.email_verification_tokens (sha256(token), expires_at = now()+24h)
                  COMMIT
                                     │
                                     ▼
                  Resend → customer: "Confirm your request" (link = /api/contact/verify?token=…)

Customer clicks link ──GET /api/contact/verify──▶ BEGIN
                                                   find unused, unexpired token by hash
                                                   UPDATE app.leads SET verified = TRUE, verified_at = now()
                                                   UPDATE token SET used_at = now()
                                                 COMMIT
                                                   │
                                                   ▼
                       Resend → CONTACT_TO_EMAIL: "New verified inquiry — 531 Workshop (Name)"
                                                   │
                                                   ▼
                                       302 → /contact?confirmed=1
```

### 1.3 Database schema (as referenced by code)

`app.leads` (pre-existing, not defined in the repo):

| Column | Notes |
|---|---|
| `id` | Returned as a string; likely UUID (same schema uses `app.uuid_generate_v4()`) |
| `created_at` | `timestamptz` (UTC); displayed in `America/Chicago` |
| `first_name`, `last_name` | Nullable (optional server-side, `TECHNICAL_DEBT.md` A5) |
| `email` | Normalized to lower case |
| `phone` | Nullable, stored as entered |
| `message` | 20–4000 chars |
| `verified`, `verified_at` | Double opt-in state |
| `source` | Always `'contact'` today |
| `referer`, `ip`, `user_agent` | Request metadata (PII, `TECHNICAL_DEBT.md` A10) |
| `project_context` | Nullable `JSONB`: any of `gallerySlug`, `galleryTitle`, `galleryCategory`, `projectType`, `dimensions`, `timeframe`. Built server-side only |

`app.email_verification_tokens`: `id`, `lead_id`, `email`, `token_hash`, `expires_at`,
`used_at`.

`app.contact_rejections` (2026-09-17, exact DDL in `INTEGRATIONS.md` §1): one row per
honeypot or no-whitespace rejection. It isn't linked to leads and exists so false
positives can be reviewed by hand.

### 1.4 Notification workflow and today's gaps

- The owner **only** learns about a lead through the "New verified inquiry" email. That
  email is sent **only after the customer clicks the confirmation link**.
- Today a lead is invisible to the business in these cases:
  1. The customer never clicks the link (spam filter, missed email, link expired).
  2. Resend fails to deliver either email. Send results are never checked, so these
     failures are silent (`TECHNICAL_DEBT.md` A3, A4).
  3. The notification email is lost, deleted or buried in the owner's inbox.
  4. A real customer was caught by the spam filter (`contact_rejections`).
- **Nothing in the repo reads the database** (`INTEGRATIONS.md`: "no admin UI, no lead
  listing"). Looking at leads today requires a developer to run SQL against production.
  The spam investigation is the only time that has happened.
- Volume is low: about 34 leads from 2026-01 to 2026-09, including the 2026-09 spam
  wave. Before that wave there were never more than 2 per day. Pagination and query
  performance are non-issues.

**This is the dashboard's real value.** It isn't a nicer inbox. It gives one reliable
view that also shows unconfirmed leads, which are the ones the current email workflow
silently drops.

---

## 2. Recommended solution

### 2.1 Shape

A **server-rendered, read-only admin area inside the existing Next.js app**:

```
app/admin/
  layout.tsx            # noindex metadata, auth gate (authoritative check), minimal chrome
  login/page.tsx        # passphrase form → server action
  leads/page.tsx        # server component: query + render (no client JS required)
lib/admin/
  session.ts            # sign / verify session cookie (HMAC-SHA256), verify passphrase (scrypt)
  leads.ts              # read-only query + row → view-model mapping
  config.ts             # site-specific config (timezone, labels, table names) — the reuse seam
lib/leadFormatting.ts   # phone/timestamp/project-context formatting, extracted from verify/route.ts
proxy.ts                # (optional) early redirect of /admin/* to /admin/login — not the security boundary
```

Why this shape:

- **Existing infrastructure only.** It uses the same Vercel deployment, Postgres
  database, `pg` client and React/Tailwind design tokens. There are **no new runtime
  dependencies**: passphrase hashing and cookie signing use Node's built-in `crypto`
  (`scrypt`, `createHmac`, `timingSafeEqual`), the same module the contact routes already
  use for tokens.
- **No JSON API.** Leads are queried inside a React Server Component and rendered to
  HTML. No `/api/admin/leads` endpoint exists to be scraped, cached or misconfigured.
- **Read-only by construction.**
  - Every dashboard query runs inside `BEGIN READ ONLY … COMMIT`, so Postgres itself
    rejects any write that slips in. This needs no DB change.
  - The module contains only `SELECT` statements.
  - Optional hardening for later: a dedicated `SELECT`-only Postgres role (see §7, Q4).
- **Fails closed.** If `ADMIN_PASSPHRASE_HASH` or `ADMIN_SESSION_SECRET` is missing,
  every `/admin` route returns `notFound()`. That covers Preview deployments, local
  clones and new environments, so the dashboard can't be accidentally exposed.
- **Never cached or indexed.**
  - Pages are dynamic: they read `cookies()`, and also set `export const dynamic =
    "force-dynamic"`.
  - The layout sets `robots: { index: false, follow: false }`.
  - Responses carry `Cache-Control: no-store`.
  - `/admin` is **not** added to `app/robots.ts`, because listing it there would
    advertise the URL. `noindex` is enough.

### 2.2 Query (illustrative)

```sql
BEGIN READ ONLY;

SELECT
  l.id, l.created_at, l.first_name, l.last_name, l.email, l.phone, l.message,
  l.verified, l.verified_at, l.project_context,
  EXISTS (
    SELECT 1 FROM app.email_verification_tokens t
    WHERE t.lead_id = l.id AND t.used_at IS NULL AND t.expires_at > now()
  ) AS confirmation_pending
FROM app.leads l
WHERE ($1 = 'all' OR l.verified = ($1 = 'confirmed'))
ORDER BY l.created_at DESC
LIMIT 50 OFFSET $2;

COMMIT;
```

- **Deliberately not selected:** `ip`, `user_agent`, `referer`. The owner doesn't need
  them to follow up a lead, and leaving them out keeps the page's PII to a minimum. They
  stay in the database for spam forensics.
- **Derived confirmation status:**
  - `verified = TRUE` → **Confirmed**, with `verified_at`.
  - Not verified and `confirmation_pending` → **Awaiting confirmation**. The link is
    still valid, so this is less than 24 h old.
  - Not verified and not pending → **Not confirmed**. The link expired. This is either
    spam or a real person who missed the email, so it's worth a glance.

### 2.3 Reuse of existing code

| Need | Existing code | Action |
|---|---|---|
| Project type / timeframe / category labels | `getProjectTypeLabel`, `getTimeframeLabel` (`lib/contactOptions.ts`), `getCategoryLabel`, `findGalleryProjectBySlug` (`lib/gallery-data.ts`) | Import as-is |
| Phone display `(312) 555-0100` | `formatPhoneForDisplay` (private in `verify/route.ts`) | Extract to `lib/leadFormatting.ts`; verify route imports it (behavior unchanged, covered by existing tests) |
| Chicago-time timestamps | `formatBusinessTimestamp` (private in `verify/route.ts`) | Same extraction |
| "Category line suppressed when it equals project type" rule | `renderProjectContext` (HTML-string, private) | Extract the *logic* into a function returning `{label, value}[]`; email renders it to HTML, dashboard renders it as JSX |
| Pool config | duplicated in both routes (`TECHNICAL_DEBT.md` A6) | Ideally a shared `lib/db.ts`. If kept out of scope, the dashboard creates its own pool with the same config and `max: 1`–`2` |
| Test harness | `vi.mock("pg")` pattern in `test/api-contact*.test.ts` | Same pattern for `lib/admin/leads.ts` |

---

## 3. Authentication options and tradeoffs

Requirements:

- One business owner, possibly one or two staff, using a phone or laptop.
- Must be simple for a nontechnical user.
- No new services unless clearly justified.
- Data sensitivity: moderate. It's names, emails, phones and free-text messages from a
  few dozen people, with no payment or health data.

| # | Option | New deps / services | Owner experience | Security | Effort | Verdict |
|---|---|---|---|---|---|---|
| A | **Shared passphrase → signed HttpOnly cookie** (custom login page, Node `crypto`) | None | Bookmark `/admin/leads`, type passphrase once, stays signed in 30 days, "Sign out" button | Good with a long passphrase. One shared credential, no per-user audit | ~0.5–1 day | **Recommended** |
| B | **Magic link to `CONTACT_TO_EMAIL`** (stateless HMAC-signed, 15-min link via Resend, then same cookie as A) | None (reuses Resend) | "Email me a sign-in link," nothing to remember | Trust anchor = the owner's inbox, which *already* receives every lead, so no new exposure. Stateless link is replayable within its 15 min unless a DB table is added. Depends on Resend, whose failures are silent today (A3) | ~1–1.5 days | Good **Phase 3 upgrade** |
| C | HTTP Basic Auth via `proxy.ts` | None | Ugly browser pop-up, unreliable "remember me" on mobile, no logout | Credentials sent on every request; relies on the proxy layer alone | ~0.25 day | Not recommended: poor UX for a nontechnical user |
| D | Vercel Deployment Protection / Password Protection | Vercel plan feature (paid add-on on Pro) | Vercel-branded prompt | Strong, but protects the **whole deployment**, not just `/admin`. Not usable on a public marketing site | n/a | Not applicable |
| E | Auth library (Auth.js / NextAuth) + OAuth (Google) | New dependency, OAuth app setup, likely an adapter | "Sign in with Google" | Strong, per-user | ~2–3 days | Overkill for 1–2 users; revisit only if multiple staff need individual accounts |
| F | Hosted identity (Clerk, Auth0, Cloudflare Access) | New third-party service and account | Polished | Strong | ~1–2 days + vendor management | Unjustified new service |

### 3.1 Recommended design (Option A)

**Environment variables.** Set these in Vercel and scope them to **Production only**:

- `ADMIN_PASSPHRASE_HASH`: the `scrypt` hash and salt of the passphrase. Generated once
  with a tiny local script (`node scripts/hash-admin-passphrase.mjs`), so the plaintext
  never lives in Vercel.
- `ADMIN_SESSION_SECRET`: 32+ random bytes, used to HMAC-sign the session cookie.

**Login flow.** The login form calls a server action. Next.js server actions already
check that the request's `Origin` matches the host, which protects the form against
CSRF. On submit, the action:

- runs `scrypt` on the input and compares it to the stored hash with `timingSafeEqual`;
- waits a fixed ~750 ms on every attempt, which slows online guessing;
- on success, sets the cookie.

**The session cookie:**

- Name: `admin_session`.
- Value: `base64url({exp, v}) + "." + HMAC-SHA256`.
- Flags: `HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=30d`.
- `v` is a version number. Bumping it, or rotating `ADMIN_SESSION_SECRET`, signs
  everyone out instantly.

**Where the check runs.** The session is checked in `app/admin/layout.tsx` **and again**
in each data-loading function. `proxy.ts` (Next 16's renamed middleware) may redirect
early for convenience, but it must **not** be the only check: a 2025 Next.js advisory
showed middleware-only auth can be bypassed.

**Logout.** A server action clears the cookie.

**Passphrase policy.** Use a randomly generated 4–5-word passphrase (≥ 20 characters).
That plus the per-attempt delay makes brute force impractical without rate-limiting
infrastructure. The agency generates it and gives it to the owner in person or through
a password manager, never by email.

Option A is the simplest choice that meets the bar. It needs no email round-trip, so it
still works when Resend is misbehaving, which is exactly when the owner most needs the
dashboard. Option B is a natural follow-on if the owner finds the passphrase a burden.

---

## 4. Proposed UI

Design principles:

- One page and one job: see who reached out and how to reach them.
- Uses the existing Tailwind tokens (`theme-b.css`), so it looks like the site.
- Works with **no client-side JavaScript**. Expanding a lead uses native
  `<details>`/`<summary>`.
- Plain-English labels with no jargon. "Confirmed" is used instead of "verified."

### 4.1 Layout (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  531 Workshop · Inquiries                                                 [Sign out] │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  [ Confirmed (12) ]  [ Not confirmed (21) ]  [ All (33) ]                            │
│  Confirmed = the person clicked the link in their confirmation email.                │
├──────────────┬───────────────────────────┬──────────────────────────┬───────────────┤
│ Submitted    │ Contact                   │ Project                  │ Status        │
├──────────────┼───────────────────────────┼──────────────────────────┼───────────────┤
│ Oct 14, 2026 │ Jane Example              │ Tables · 1–3 months      │ ● Confirmed   │
│ 3:42 PM CDT  │ jane@example.com  ✉       │ ~ 84" x 40"              │   Oct 14      │
│              │ (312) 555-0100   ☎        │ Inspired by: Walnut      │               │
│              │                           │   Dining Table ↗         │               │
│  ▸ "We're looking for a dining table similar to the walnut one in your gallery…"     │
├──────────────┼───────────────────────────┼──────────────────────────┼───────────────┤
│ …            │                           │                          │               │
└──────────────┴───────────────────────────┴──────────────────────────┴───────────────┘
                                   ‹ Newer   Page 1 of 1   Older ›
```

_(Placeholder data for illustration only.)_

### 4.2 Layout (phone)

Each lead is a stacked card:

1. The status pill and submitted date.
2. The name in bold.
3. Large tap targets for **Email** (`mailto:`) and **Call** (`tel:`).
4. Project chips (type, timeframe, size).
5. "Inspired by" link to the Gallery project.
6. The message, collapsed to 3 lines and tappable to expand.

### 4.3 Field rules

| Field | Display |
|---|---|
| Submitted | `created_at` in `America/Chicago` via the existing `formatBusinessTimestamp` |
| Name | `first_name last_name`; "—" if both empty |
| Email | Text plus `mailto:` link (`encodeURIComponent`; the href always starts with `mailto:`) |
| Phone | `formatPhoneForDisplay`; `tel:` link built from **digits only** |
| Project | Labels from `lib/contactOptions.ts` and `lib/gallery-data.ts`; Gallery title links to `/gallery/<category>/<slug>` (internal, from trusted data); same "suppress duplicate category" rule as the email |
| Message | Plain text with `white-space: pre-wrap`. Rendered through React's default escaping, **never** `dangerouslySetInnerHTML`. **URLs inside messages are not auto-linked** (phishing risk from unconfirmed/spam rows) |
| Status | **Confirmed** (green, with date) / **Awaiting confirmation** (amber, under 24 h) / **Not confirmed** (grey, link expired) |

### 4.4 Deliberately excluded from Phase 1

- Editing or deleting leads.
- CSV export. It adds a formula-injection risk and a "data leaves the system" risk;
  revisit on request.
- Search. Volume is too low to need it.
- IP, user agent and referer.
- `contact_rejections` (see Phase 3).

---

## 5. Lead status tracking (new / contacted / closed): include now or defer?

**Recommendation: defer it to Phase 2, and design for it now.**

Reasons to defer:

1. **It's the only feature that requires a schema change.** This mission's constraints
   rule that out. The project's existing practice is also careful, coordinated,
   out-of-band changes with no migration tool (`TECHNICAL_DEBT.md` A8).
2. **It turns a read-only system into a writing one.** That brings in:
   - write privileges on the dashboard's DB connection;
   - CSRF on state changes (server actions mitigate it, but it's still surface area);
   - concurrency ("who changed this?") with a shared login and no audit;
   - more tests.

   Read-only Phase 1 avoids all of that.
3. **Volume doesn't demand it yet.** At a handful of real leads per month, the owner can
   track follow-up mentally or in the notification email thread.
4. **Ship and observe first.** If the owner actually opens the dashboard weekly, status
   tracking is clearly worth adding. If they don't, we've saved the work.

Phase 2 design, so Phase 1 needs no rework later:

```sql
-- Additive, nullable-safe, consistent with the project_context precedent (DECISIONS.md)
ALTER TABLE app.leads
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'closed')),
  ADD COLUMN status_updated_at TIMESTAMPTZ;
```

- UI: a three-button segmented control per lead, posting to a server action that runs
  `UPDATE app.leads SET status = $1, status_updated_at = now() WHERE id = $2` (and nothing
  else).
- The default tab becomes **"Open"** (confirmed and not closed).
- Phase 1 code should map rows through a view-model (`lib/admin/leads.ts`). Adding
  `status` is then one field in one place.
- **Alternative:** a separate `app.lead_status (lead_id PK/FK, status, updated_at,
  note)` table. It keeps `app.leads` write-once and makes it easy to add a free-text
  note later. Either works. Pick based on whether a "notes" field is likely (§7, Q6).

---

## 6. Implementation phases and estimated effort

Estimates assume one developer who knows the codebase, and include tests and doc
updates. Ranges reflect uncertainty about DB-provider details (§7).

| Phase | Scope | Schema change? | Estimate |
|---|---|---|---|
| **0. Prep** | Confirm open questions (§7). Generate the passphrase and secret. Add env vars to Vercel (Production only). Write `scripts/hash-admin-passphrase.mjs` | No | 0.25 day |
| **1. Read-only dashboard** | `lib/leadFormatting.ts` extraction (verify route behavior unchanged; existing tests must still pass). `lib/admin/session.ts`, `lib/admin/leads.ts`, `lib/admin/config.ts`. `app/admin/{layout,login,leads}`. Fail-closed gating, noindex, no-store. Unit tests (session sign/verify/expiry/tamper; passphrase verify; query mapping with mocked `pg`; status derivation; fail-closed when env missing). E2E: `/admin/leads` redirects to login unauthenticated, wrong passphrase rejected, and `/admin` is 404 with env unset (no DB needed). Docs: `ARCHITECTURE.md`, `INTEGRATIONS.md` (new env vars), `OPERATIONS.md` (rotation runbook), owner one-pager | No | **2–3 days** |
| **2. Status tracking** | DB column(s) applied out-of-band with DDL recorded in `INTEGRATIONS.md`. Server action. Segmented control. "Open" tab. Tests | **Yes** (additive) | 1–1.5 days + DB coordination |
| **3. Optional extras** (each independent) | (a) **"Filtered" tab** reading `app.contact_rejections` read-only, so the owner or agency can catch spam-filter false positives: ~0.5 day. (b) **Magic-link login** (Option B): ~1–1.5 days. (c) **Dedicated read-only DB role** for the dashboard connection: ~0.25 day + DB admin access. (d) **Retention job / "delete expired unconfirmed leads"**: needs a policy decision first | (a) no, (b) no, (c) role only, (d) maybe | as noted |
| **4. Cross-site reuse** | Template-ize after a second site needs it (§8) | — | 0.5–1 day per additional site by copy; 2–3 days to extract a package |

**Total for a useful first release (Phases 0–1): about 2.5–3.5 developer days.**

---

## 7. Risks and open questions

### 7.1 Security risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **New attack surface exposing all lead PII** in one place | Medium / High | Fail-closed gating. Auth checked in layout **and** data layer, not only `proxy.ts`. Server-rendered with no JSON API. Long random passphrase. Minimal columns selected |
| **Online passphrase guessing** (no rate-limit infra; serverless instances don't share memory) | Low / High | ≥ 20-char random passphrase. Fixed per-attempt delay. `timingSafeEqual`. Optional Vercel Firewall rate-limit rule on `/admin/login` if the plan supports it (Q3). Avoid a DB-backed lockout table, which would be a schema change |
| **Session cookie theft or long-lived sessions on a lost phone** | Low / Medium | `HttpOnly; Secure; SameSite=Strict; Path=/admin`. 30-day expiry. Rotating `ADMIN_SESSION_SECRET` (or bumping `v`) signs out all devices. This is documented in `OPERATIONS.md` |
| **Shared credential with no per-person audit** | Medium / Low | Acceptable for 1–2 users. Move to per-user auth (Option E) if staff grows |
| **Stored XSS / phishing via lead content** (unconfirmed rows are attacker-controlled: names, messages, dimensions) | Medium / Medium | React escaping only, no `dangerouslySetInnerHTML`, no URL auto-linking. `mailto:`/`tel:` hrefs built from validated, encoded values. Gallery links come from trusted data only |
| **Preview deployments exposing the dashboard** (if Preview shares the production `DATABASE_URL`) | Medium / High | Admin env vars scoped to **Production only**, so Preview is 404 because it fails closed. Confirm how Preview envs are set (Q2) |
| **CDN or browser caching an authenticated page** | Low / High | Dynamic rendering, `Cache-Control: no-store`, cookie-dependent render |
| **Search indexing** | Low / Medium | `noindex, nofollow`. URL not listed in robots.txt or the sitemap. Unauthenticated requests redirect without leaking content |
| **Middleware-only auth bypass** (class of bug seen in Next.js 2025) | Low / High | Never rely on `proxy.ts` alone. The authoritative check lives with the data access |
| **DB TLS without certificate verification** (`rejectUnauthorized: false`, A7) | Existing | Unchanged by this work, but the dashboard inherits it. Note it and fix separately |

### 7.2 Privacy risks

- **There's no privacy policy on the site** (`TECHNICAL_DEBT.md` A10), and the dashboard
  increases internal access to stored personal data. The data use isn't new (the owner
  already gets these details by email), but a privacy page should exist before or
  alongside launch.
- **No retention policy.** Unconfirmed leads (mostly spam, plus some real people) and
  `contact_rejections` rows accumulate forever, including IP addresses. The dashboard
  makes this visible, which helps, but deciding retention is a business and legal call
  (Q5).
- **Data minimization.** IP, user agent and referer are deliberately kept off the page.
  No export in Phase 1.
- **Access hygiene.** Remind the owner not to share the passphrase or screenshot lead
  lists into public channels. A one-paragraph note covers this.

### 7.3 Operational risks

- **Schema drift is invisible.** The dashboard depends on column names that exist only
  in docs (A8), and unit tests mock `pg`, so a renamed column would only show up in
  production. Mitigations:
  - Keep the query in one module.
  - Have the page show a friendly "couldn't load inquiries" state and log the error,
    never a stack trace.
  - Do one manual production smoke check after deploy. That's the owner logging in, not
    the developer browsing records.
- **Connection pressure.** A third module-scope `Pool` (A6). Use `max: 1–2` or, better,
  consolidate into a shared `lib/db.ts`.
- **Secret management.** Two new env vars. They need the rotation runbook and an
  `.env.example` entry (G2).
- **Owner adoption.** If the owner keeps using email only, the dashboard still earns its
  keep as the place to catch **unconfirmed** leads. Its onboarding should say exactly
  that in one sentence.
- **Vercel plan tier.** Hobby is for non-commercial use. If this client site is on
  Hobby, that's a pre-existing issue to confirm (Q3), and it also affects which Firewall
  features are available.

### 7.4 Open questions

1. **Who should have access?** Owner only, or staff too? With more than 2 people, per-user
   accounts (Option E) become worth their cost.
2. **How are Vercel Preview environment variables configured?** Specifically, does
   Preview use the production `DATABASE_URL`? This determines how critical the
   "Production-only" scoping of admin vars is.
3. **What Vercel plan is the project on?** This affects Firewall rate-limit
   availability and commercial-use terms.
4. **Who administers the Postgres instance, and on which provider?** Could we create a
   dedicated `SELECT`-only role (`GRANT SELECT ON app.leads,
   app.email_verification_tokens TO leads_reader`) and give the dashboard its own
   `ADMIN_DATABASE_URL`? That's defense in depth beyond `BEGIN READ ONLY`. It isn't a
   schema change, but it is a DB change, so it's out of scope here.
5. **Retention.** How long should unconfirmed leads, rejected submissions and IP
   addresses be kept? Should the dashboard eventually offer "delete"?
6. **Does the owner want notes** ("quoted $X on 10/20") as well as a status? That
   decides between a `status` column and a separate `lead_status` table in Phase 2.
7. **Should the "Not confirmed" tab be visible to the owner,** or only to the agency?
   It will contain spam text from the 2026-09 wave.
8. **Domain.** `/admin` on the public domain (proposed) or a separate subdomain? The
   subdomain adds DNS and Vercel config for little gain at this scale.

---

## 8. Reuse across other client websites

The pattern fits any 3EF client site that is Next.js on Vercel with a Postgres lead
table. Recommended approach:

1. **Build it self-contained.** All dashboard code goes in `app/admin/**` and
   `lib/admin/**`. Site-specific bits go in a single `lib/admin/config.ts`:

   ```ts
   export const ADMIN_CONFIG = {
     businessName: "531 Workshop",
     timeZone: "America/Chicago",
     leadsTable: "app.leads",
     tokensTable: "app.email_verification_tokens",
     projectContextRenderer: renderProjectContextRows, // site-specific labels
     pageSize: 50,
   };
   ```

2. **Standardize the lead schema across sites.** Most of the reuse value comes from
   new sites using the same `app.leads` / `app.email_verification_tokens` shape and the
   same double opt-in flow as this one. Write that shape down once (a
   `docs/LEAD_SCHEMA.md` or a migration file in a starter template). That also helps
   close A8 here.
3. **Copy first, extract later.** Copy the module for site #2. Only extract a private
   package (e.g. `@3ef/leads-admin`) once a third site uses it and the config surface
   has stabilized. Extracting earlier risks designing the wrong abstraction.
4. **Pieces that transfer unchanged:**
   - session signing and verification;
   - passphrase hashing script;
   - fail-closed gating;
   - read-only query wrapper;
   - status derivation;
   - phone and timestamp formatting;
   - the UI shell;
   - tests for all of the above.
5. **Pieces that stay per-site:**
   - project-context rendering, which depends on each site's catalog and options;
   - branding;
   - timezone;
   - table names, if a legacy site differs.

Estimated cost per additional site once Phase 1 exists: **about 0.5–1 day** (copy,
configure, env vars, test, owner one-pager), assuming the standard lead schema.

---

## 9. Out of scope for this proposal

Explicitly not done in this mission:

- application code changes;
- database or schema changes;
- Vercel or environment changes;
- deployment;
- any access to production data.

Related existing debt the dashboard touches but doesn't fix:

- A3/A4: silent Resend failures. The dashboard mitigates the impact by showing
  unconfirmed leads.
- A6: pool duplication.
- A7: DB TLS verification.
- A8: schema not in the repo.
- A10: no privacy policy.
- A12: no `Reply-To` on the notification email.
