# Email Deliverability — Design

_Drafted: 2026-10-25. Design only — no application code, environment variables, Resend
settings, or DNS records have been changed. Status: **proposed, not started**. Open
decisions are listed in §7; resolve them before implementing._

---

## 1. Purpose

Reduce the chance that the site's two emails land in spam, by porting the deliverability
work done in the Cosmo repository (Cosmo commits `6613cf4` "Improve agent email
deliverability…" and `c437b36` "Ignore a malformed APP_BASE_URL…", 2026-10-22) where it
applies to this site, and skipping what doesn't.

### Emails in scope

| Email | Sent from | To | Trigger |
|---|---|---|---|
| **Confirmation** ("Confirm your request — 531 Workshop") | `app/api/contact/route.ts` (`POST`) | the address typed into the contact form | every non-honeypot submission that passes validation |
| **Internal notification** ("New verified inquiry — 531 Workshop (Name)") | `app/api/contact/verify/route.ts` (`GET`) | `CONTACT_TO_EMAIL` | the lead's confirm link is opened |

Both go through Resend (`resend.emails.send`), `from = EMAIL_FROM`. The site sends no
newsletter or other recurring mail (`components/NewsletterForm.tsx` posts to
`/api/subscribe`, which does not exist in this repo).

### Current gaps (as of 2026-10-25)

1. **No plain-text part.** Both emails send `html` only. An HTML-only message is one of the
   more common spam-filter signals; this is the single largest code gap.
2. **Bare HTML fragments.** Both bodies are a lone `<div>` — no doctype, `<html lang>`,
   charset, or `<title>`.
3. **No Reply-To.** Replies to the confirmation (typically from a no-reply sender) go
   nowhere useful; the notification can't be replied to straight back to the customer
   (TECHNICAL_DEBT **A12**).
4. **Unvalidated link base.** `baseUrlFromRequest` uses `SITE_URL` verbatim (only trailing
   slashes stripped). A malformed value produces a broken link; a value on a different
   domain from `EMAIL_FROM` produces a sender/link mismatch filters penalise.
5. **The confirm link acts on a plain GET.** Opening `/api/contact/verify?token=…` marks
   the lead verified, consumes the token, and sends the internal notification. Link
   scanners (Outlook Safe Links, corporate gateways, some antivirus) fetch every link in
   an inbound message, so a bot that submits a real company address gets that lead
   "confirmed" by the company's scanner — defeating the double opt-in and sending the
   owner notifications nobody actually confirmed.
6. **No "you didn't ask for this" line.** Anyone can enter someone else's address; a
   recipient who didn't submit the form and marks the email as spam damages the sending
   domain's reputation.

---

## 2. Cosmo → 531 mapping

| Cosmo change | Applies here? | Decision |
|---|---|---|
| `APP_BASE_URL` for every email link; malformed value ignored (`new URL(v).origin`, fallback) | Yes — `SITE_URL` already plays this role | **Port** (validate `SITE_URL`) |
| `emailDocument()` wraps every body in a complete HTML document | Yes | **Port** |
| Plain `text` alternative on every email | Yes — missing today | **Port** |
| Optional `EMAIL_REPLY_TO` on every email | Yes | **Port** |
| `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058) one-click unsubscribe | No — both emails are one-off transactional mail, not a list. Cosmo also omits these headers from its own transactional mail (sign-in, invitations) | **Skip**; use the "didn't request this" line instead (§3.2) |
| Unsubscribe endpoint: GET never changes anything (scanners prefetch), POST acts | Yes, by analogy — the confirm link has exactly this problem | **Port the pattern** to `/api/contact/verify` — needs approval (§7, D1) |
| Subject-line rewording ("quick question" → plainer) | Current subjects are already plain | No change |
| Resend idempotency key | Useful but minor | Optional |
| Out-of-code: verified sending domain with SPF/DKIM/DMARC; link domain = sender domain | Yes | **Operations checklist** (§5) |

---

## 3. Design

### 3.1 New module: `lib/email.ts`

A small shared module both contact routes import. No template framework, no new
dependency.

- **`emailBaseUrl(req: Request): string`** — replaces `baseUrlFromRequest` in
  `app/api/contact/route.ts`. Reads `SITE_URL`, trims it, and returns
  `new URL(value).origin`; if unset **or unparseable**, falls back to the request's own
  `protocol//host`. (Mirrors Cosmo's `config.appBaseUrl`.)
- **`emailDocument(subject: string, bodyHtml: string): string`** — returns
  `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">`, viewport meta,
  `<title>` (escaped subject), and a `<body>` with simple inline styling and a
  ~560px centred container around `bodyHtml`. No images, no tracking pixels, no external
  CSS.
- **`escapeHtml(value: string): string`** — moved here from
  `app/api/contact/verify/route.ts` (identical behaviour) so both routes share one copy.
- **`emailReplyTo(): string | undefined`** — `process.env.EMAIL_REPLY_TO` or `undefined`.

The `resend.emails.send` calls stay in the routes (no sender abstraction is needed for two
emails).

### 3.2 Confirmation email (`app/api/contact/route.ts`)

- Build `verifyUrl` with `emailBaseUrl(req)`.
- `html: emailDocument(subject, body)` — body content unchanged apart from the line below.
- Add a `text` version: greeting, one sentence, the raw confirm URL on its own line,
  "This link expires in 24 hours.", and the line below.
- Add to both versions: _"If you didn't contact 531 Workshop, you can ignore this email —
  we won't contact you again."_
- `replyTo: emailReplyTo()` when set (omit the key otherwise).
- Optional: `{ idempotencyKey: \`contact-confirm:${leadId}\` }` as the second argument to
  `emails.send`.

No user-supplied data is interpolated into this email today; keep it that way.

### 3.3 Internal notification (`app/api/contact/verify/route.ts`)

- `html: emailDocument(subject, body)` — body content unchanged.
- Add a `text` version with the same fields (name, email, phone, project context lines,
  message, submitted timestamp). Plain text is **not** HTML-escaped.
- `replyTo: row.email` (TECHNICAL_DEBT **A12** — needs approval, §7 D2). The customer's
  address is a header value, so it is not HTML-escaped; it was already validated by
  `isValidEmail` and normalised on submission. `EMAIL_REPLY_TO` does not apply to this
  email.
- Factor `renderProjectContext` so it yields label/value pairs that both the HTML and text
  renderers use (avoids two copies of the "suppress Category when it equals Project type"
  rule).

### 3.4 Confirm on POST, not GET (recommended — §7 D1)

Change `/api/contact/verify` so that merely fetching the link changes nothing:

- **`GET /api/contact/verify?token=…`** — looks the token up **read-only** (same
  valid/unused/unexpired query, no `BEGIN`/`UPDATE`). Invalid/expired → today's 400 text.
  Valid → a minimal HTML page: "Confirm your request to 531 Workshop?" and one button in a
  `<form method="post">` carrying the token in a hidden field.
- **`POST /api/contact/verify`** — reads the token from the form body
  (`application/x-www-form-urlencoded`), then runs today's GET logic unchanged:
  transaction, mark verified, mark token used, send the internal notification, `303`
  redirect to `/contact?confirmed=1` (303 so the browser follows with a GET).
- The emailed URL does not change, so links already in inboxes keep working (they land on
  the confirm page).

Same pattern as Cosmo's `app/api/email/unsubscribe/route.ts`. Side benefit: the token
reaches the state-changing request in a POST body rather than the query string, which
partly addresses TECHNICAL_DEBT **A11**.

Trade-off: a genuine customer clicks twice instead of once. The page could alternatively
live at `app/contact/confirm/page.tsx` with a server action; the route-handler form above
is the smaller change and keeps everything in one file.

### 3.5 What is deliberately not changing

- No `List-Unsubscribe` headers (transactional mail; see §2).
- No change to spam filtering of submissions (honeypot, whitespace rule —
  `docs/CONTACT_SPAM_INVESTIGATION.md`).
- No database schema change.
- No email templating library or redesign.

---

## 4. Environment variables

| Variable | Change |
|---|---|
| `SITE_URL` | Now validated; malformed → falls back to request origin. Should be set in production to the **same domain as `EMAIL_FROM`**. |
| `EMAIL_REPLY_TO` | **New, optional.** A monitored inbox, e.g. `531 Workshop <hello@<domain>>`. Used as Reply-To on the confirmation email only. |
| `EMAIL_FROM`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL` | Unchanged. |
| `RESEND_FROM` | Not read by the code (INTEGRATIONS.md note); remove from Vercel to avoid confusion. |

Add `EMAIL_REPLY_TO` to `vitest.config.ts`'s `test.env` only within the tests that need it
(set/unset per test), so the default suite exercises the "unset" path.

---

## 5. Operations checklist (outside the code — most of the deliverability gain)

1. `EMAIL_FROM` uses an address on the site's own domain (not a shared/free domain).
2. That domain is **verified in Resend**, with the DKIM and SPF (Resend's return-path /
   `send` subdomain) records Resend provides showing as verified.
3. A **DMARC** record exists for the domain — start with `v=DMARC1; p=none; rua=mailto:…`,
   watch reports for a few weeks, then move to `p=quarantine`.
4. `SITE_URL` in Vercel production is set to the canonical `https://` origin on that same
   domain (links match the sender).
5. `EMAIL_REPLY_TO` set to an inbox someone reads.
6. After deploying: send one real submission to a Gmail address and check "Show original"
   for `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`, and that a text part is present.

---

## 6. Validation plan

Tests stay fully mocked (`vi.mock("resend")`, mocked `pg`), per `vitest.config.ts`.

`test/api-contact.test.ts`:
- Confirmation send includes a non-empty `text` containing the confirm URL and the
  "didn't contact" line.
- `html` starts with `<!doctype html>` and contains `<title>`.
- `replyTo` present when `EMAIL_REPLY_TO` is set; key absent when unset.
- Malformed `SITE_URL` (e.g. `"not a url"`) → link uses the request origin; a `SITE_URL`
  with a path/trailing slash → link uses its origin.

`test/api-contact-verify.test.ts`:
- Notification has `text` (name, email, message, project context lines, unescaped) and a
  full-document `html`.
- `replyTo` equals the lead's email (if D2 approved).
- If D1 approved: `GET` with a valid token issues **no** `UPDATE`, sends **no** email, and
  returns the confirm page; `POST` with the token performs today's work and returns 303 to
  `/contact?confirmed=1`; `POST` with an invalid/used token → 400. Temporarily make `GET`
  run the old logic once to prove the "GET changes nothing" test fails.

`e2e/` — check whether any spec follows the confirm link; update it for the extra click if
D1 is approved.

Then `npm run lint`, `npm test`, `npm run build`.

---

## 7. Open decisions

- **D1 — Confirm on POST (§3.4).** Recommended. Changes customer flow (one extra click).
- **D2 — `replyTo: row.email` on the internal notification (TECHNICAL_DEBT A12).** Small,
  recommended; it's an existing backlog item, so it needs an explicit go-ahead to bundle.
- **D3 — Also fix TECHNICAL_DEBT A3/A4 in the same change?** Not a spam-filtering issue,
  but A3 (Resend's returned `error` is never checked) means a rejected send still tells the
  customer "check your email", and is the only way failures would ever surface. A4 (missing
  email env vars reported as success) is the same shape. Natural to do alongside, since the
  same `emails.send` calls are being edited — but it widens scope.
- **D4 — Idempotency key on the confirmation send?** Optional, low value at current volume.

---

## 8. Files expected to change

- `lib/email.ts` (new)
- `app/api/contact/route.ts`
- `app/api/contact/verify/route.ts`
- `test/api-contact.test.ts`, `test/api-contact-verify.test.ts`
- `docs/INTEGRATIONS.md` (env table, Resend section), `docs/OPERATIONS.md` (env list,
  checklist §5), `docs/DECISIONS.md` (D1 if adopted), `docs/TECHNICAL_DEBT.md` (mark A12 —
  and A3/A4/A11 as applicable — resolved), and this document's status line.
