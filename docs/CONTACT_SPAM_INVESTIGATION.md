# Contact Form Spam Investigation — 531 Workshop Site

_Investigation date: 2026-09-14. Research and design only — no application code, database
schema, Vercel configuration, or environment variables were modified as part of this
report. Two temporary, read-only Node scripts were used against the production database to
gather aggregate statistics; both were deleted after use and nothing was written to any
table. No production emails were sent._

---

## 1. Executive Summary

Starting **2026-09-13**, the site began receiving a burst of contact-form submissions that
are, with high confidence, **automated and non-human**. In the ~33 hours from 2026-09-13
08:38 to 2026-09-14 17:23, **18 of 19 submissions** matched a single, extremely uniform
signature: a "message" field consisting of one 20–24 character run of random mixed-case
letters/digits **with no spaces at all**, paired with an "Approximate size" field
containing a similarly random string, `Project type` always defaulted to "Tables" (the
first option in the select), and `Timeframe` always "No rush / flexible" (also the first
real option). Several of these submissions were routed through known Tor exit-node IP
ranges, and the great majority shared one single User-Agent string — one that, notably,
was stored with literal quotation marks around it, something a real browser never sends.
This does not look like a targeted human spammer or an SEO/marketing pitch (there are no
links, no keywords, no coherent sentences anywhere in the batch) — it looks like a generic,
unsophisticated automated form-filling tool indiscriminately hitting the endpoint.

Against that backdrop, **Kaitlin's inquiry** (2026-09-14, 01:05 UTC) and one earlier
inquiry from a coffee-shop business (2026-09-03) are unambiguously real: multi-sentence,
grammatical messages with spaces and real words, plausible project details, and no
automation fingerprints.

The site's historical baseline is roughly **1 submission every 1–3 weeks** — this is a
low-volume custom-furniture site, not a high-traffic consumer form. Twenty-plus junk
submissions in two days is a dramatic, unambiguous anomaly against that baseline, not
normal noise.

**Recommendation (details in §7):** a **honeypot field** plus a **deterministic
content-shape check** on the free-text fields (reject a "message" or "dimensions" value
that contains no whitespace at all) would, on the evidence gathered here, have caught
**100% of the observed junk** with **zero risk of rejecting a message shaped like
Kaitlin's**. Raise the server-side message minimum to match the client's existing 20-char
rule as cheap hygiene. Do **not** reach for a CAPTCHA/Turnstile yet — the observed bot is
unsophisticated, and there is no evidence it would survive the fixes above. Treat Turnstile
as a Stage 2 fallback only if the junk continues after Stage 1 ships.

---

## 2. Current Contact Architecture

Request path: **User → `/contact` (`app/contact/page.tsx`) → `ContactForm.tsx` (client) →
`POST /api/contact` (`app/api/contact/route.ts`) → Postgres `app.leads` +
`app.email_verification_tokens` → Resend (confirmation email) → user clicks link →
`GET /api/contact/verify` (`app/api/contact/verify/route.ts`) → Postgres (mark verified) →
Resend (internal notification to the shop owner) → redirect to `/contact?confirmed=1`.**

- **Fields captured:** `first_name`, `last_name`, `email` (required client + server-side);
  `phone`, `message` (required, but only client-enforced at 20–4000 chars — see below);
  optional `projectType`, `dimensions` (≤200 chars), `timeframe`; plus
  `source='contact'`, `referer`, `ip` (from `x-forwarded-for`/`x-real-ip`), and `user_agent`
  captured server-side from request headers — **not** submitted by the client form itself.
- **Client-side validation** (`lib/contactValidation.ts`): first/last name required, email
  regex, phone (if present) ≥10 digits, **message 20–4000 characters**, dimensions capped
  at 200 chars. This runs in the browser only.
- **Server-side validation** (`app/api/contact/route.ts`): email regex re-checked;
  **message length minimum is only 5 characters** (`message.length < 5`), with **no upper
  bound**. `projectType`/`timeframe` are validated against a fixed allow-list
  (`lib/contactOptions.ts`) and silently dropped if invalid; `dimensions` is truncated to
  200 chars rather than rejected. Any request that skips the browser entirely and POSTs
  directly to `/api/contact` only has to clear this much lower 5-character bar, not the
  client's 20-character one.
- **No spam-specific protections exist today:** no honeypot field, no minimum-time-to-submit
  check, no rate limiting (per-IP or global), no CAPTCHA/Turnstile, no content-based
  filtering (link count, keyword list, gibberish detection). This matches
  `docs/TECHNICAL_DEBT.md` item A1 ("No rate limiting, CAPTCHA, or honeypot on the live
  contact form"), which was already an open, known gap before this investigation.
- **Double opt-in** does provide *some* implicit filtering today: an unverified lead sits
  in `app.leads` with `verified = FALSE` and **never triggers the internal "New verified
  inquiry" email** to the shop owner. Only a *verified* lead reaches the owner's inbox. As
  detailed in §3, a meaningful fraction of this junk batch **did** get verified anyway —
  double opt-in reduced but did not eliminate what reached the inbox.
- **Error handling:** any thrown error rolls back the transaction and returns a generic
  500; a missing `EMAIL_FROM`/`RESEND_API_KEY` still returns `{ok:true}` (existing,
  unrelated debt item A4). None of this is implicated in the spam itself.
- **Logging:** only `console.error`/`console.warn` on failure paths — there is no
  structured logging of successful submissions beyond the database row itself.

---

## 3. Recent Submission Analysis

**Method:** connected read-only to the production Postgres database (the same
`DATABASE_URL` the live site uses) and queried `app.leads` directly. No rows were modified,
inserted, or deleted. Aggregate statistics and masked/redacted values are presented below;
raw records are not reproduced.

### Volume and baseline

| Day | Submissions |
|---|---|
| 2026-09-14 | 12 |
| 2026-09-13 | 7 |
| 2026-09-11 | 3 |
| 2026-09-03 and earlier (back to 2026-01-21) | 1 every 1–3 weeks, never more than 2/day |

34 leads exist total, spanning 2026-01-21 to 2026-09-14. Prior to 2026-09-11, the
**highest single-day count in the entire history was 2**. The jump to 7 (09-13) and 12
(09-14) is a step-change, not a gradual trend — **the increase started abruptly on
2026-09-11 and has escalated on each subsequent active day.**

### The 2026-09-11 submissions are not spam — they are known internal test traffic

Three of the 2026-09-11 submissions are from an email address matching this project's own
developer/owner account, one of them from `ip = ::1` (localhost) — i.e., someone running
the app locally (`npm run dev`) and submitting the form as part of testing the
recently-shipped Gallery→Contact project-context feature. These are legitimate,
explainable, and unrelated to the spam wave; they are excluded from the analysis below.

### The 2026-09-13 → 2026-09-14 batch: one dominant, highly uniform pattern

Of the 19 non-test submissions from 2026-09-13 08:38 onward, **18 share the same shape**:

- **`message` field:** a single unbroken token — no spaces anywhere — of 20 to 24
  mixed-case alphanumeric characters. Every single one of the 18 has this exact shape.
  Length clusters tightly at "just at or above 20," which is suspicious in itself: the
  client-side form requires a 20-character minimum, and this batch's messages are
  consistently *at least* 20 characters and rarely much more — consistent with a tool that
  has learned (by trial, or by reading the page's own JavaScript) exactly where the
  minimum-length bar sits and generates just enough garbage to clear it.
- **`dimensions` field (optional "Approximate size"):** the same style of random,
  no-space, mixed-case alphanumeric string (15–24 characters) — structurally identical
  "junk" to the message field, never a real measurement like `6' x 3'`.
- **`projectType`:** **"tables" in every single one of the 18.** "Tables" is the first
  entry in the `Project type` dropdown's option list.
- **`timeframe`:** **"flexible" ("No rush / flexible") in every single one of the 18.**
  That is the first real (non-placeholder) option in the `Timeframe` dropdown.
- **Names and emails:** each submission uses a different first/last name and a different
  email address — no exact name or email repeats across the batch. Domains are a mix of
  common free providers (`gmail.com` — 11 of 18 — plus one each of `hotmail.com`/`yahoo.com`
  outside this batch) **and several real-looking corporate/government domains** that have
  no plausible connection to a small Illinois woodworking shop (a `.gov` county domain, and
  domains belonging to a well-known game company, a construction firm, a media company,
  and a lumber-industry company, among others). Mixing everyday free-mail addresses with
  scattered real corporate/government domains, with no two submissions sharing a domain
  more than twice, is a pattern much more consistent with a **generated or harvested
  identity list** than with real people typing their own information.
- **No spam keywords found anywhere:** a scan of every message body in this batch for
  common spam markers (URLs, "SEO," "backlink," "crypto," "casino," "loan," "marketing
  agency," etc.) turned up **zero matches**. This is not link-drop or marketing-pitch spam
  — the payload itself is meaningless.
- **No exact duplicate messages:** every random string is unique (as expected from a
  generator), so simple "same message twice" duplicate-detection would not catch this
  batch — the tell is the *shape* of each message, not repetition between them.

### Kaitlin's and the earlier legitimate inquiry, for contrast

Kaitlin's message (2026-09-14, 01:05 UTC) is 145 characters, contains 22 space-separated
words, 16 of which are ordinary English words, and describes a real project with a
specific size and timeframe she chose deliberately (not defaulted to the first option).
The 2026-09-03 inquiry (171 characters, similarly natural language) is the only other
submission in the last several months that reads the same way. Both are trivially
distinguishable from the batch above by the single test "does the message contain more
than one word" — Kaitlin's has 22; every junk submission has exactly 1.

### Verification status — why this reached the owner's inbox at all

Of the 18 junk-shaped submissions, **4 were marked `verified = TRUE`** — meaning their
confirmation link was "clicked" and the internal "New verified inquiry" email was actually
sent to the shop owner for those 4. This is very likely what triggered the client's report
of an increase in messages, since unverified junk sits invisibly in the database and never
reaches an inbox. **How a bot-submitted, unowned email address gets "verified" is not
directly observable from the data available** (this is inference, not confirmed fact), but
the most plausible explanations, in rough order of likelihood, are:
1. The submitting tool follows its own confirmation link automatically as part of a
   scripted "complete the whole flow" routine (some spam/testing tools do this to look more
   legitimate or to exercise the full funnel).
2. Automated corporate email-security scanners ("safe link" pre-fetchers, common at
   companies running Microsoft Defender/Proofpoint/Mimecast-style gateways) can visit every
   link in an inbound email — including a spoofed "confirm your request" email sent to a
   real corporate mailbox the bot doesn't actually control — without any human ever seeing
   it. The verified batch entries using real corporate/`.gov` domains fit this pattern well.

Both are plausible; neither is proven by the evidence in hand.

---

## 4. Vercel Traffic Analysis

**Method:** `vercel logs` (CLI, authenticated, project linked read-only) against the
production environment.

**What Vercel's request logs actually expose** (confirmed by direct inspection of the log
schema): `timestamp`, `requestMethod`, `requestPath`, `responseStatusCode`, `source`
(static/lambda/edge), `cache` status, `domain`, and a `traceId`. **They do not include IP
address, User-Agent, Referer, or geographic/edge-region data** — those fields are simply
absent from every log entry pulled. This is an observed limitation of what the CLI/log
stream exposes here, not an inference. Everything in §3 about IP, User-Agent, and Referer
comes from the application's **own** database records (captured server-side by
`app/api/contact/route.ts` from request headers at submission time) — Vercel's logs cannot
corroborate or add to that picture.

**What Vercel's logs did confirm, within the windows I was able to pull:**
- **Zero HTTP 5xx responses** anywhere in the last 24 hours, and none observed in the
  narrower windows checked around the spam burst. The application is not erroring while
  processing this traffic — it is accepting the junk as perfectly valid input, which is
  consistent with §2's finding that server-side validation is much looser than the
  client-side rules.
- A small amount of unrelated background noise: two `POST /` and `POST /index` requests
  (returning 404/405, since this app has no route accepting POST at either path) in the
  last 24 hours. This looks like generic internet scanning/probing traffic aimed at the
  domain, not contact-form-specific — it's mentioned for completeness but is a separate
  phenomenon from the form spam.
- One `POST /api/contact` (200) visible in the most recent log window correlates exactly,
  by timestamp, with one of the §3 junk-shaped database rows — a useful sanity check that
  the DB and Vercel's logs agree where they overlap. (Note: in an earlier, less-informed
  pass through the logs — before this investigation had DB context — that same request was
  described as "a real lead submission." With the database evidence now in hand, it is
  clear that request was in fact one of the junk-pattern submissions, not a genuine
  inquiry. Flagging this correction here for the record.)

**Limitation, stated plainly:** the CLI's log retrieval is capped at 100 rows per call, and
on a wider multi-day historical window with a status-code filter it became slow/unreliable
to paginate fully within a reasonable time. Rather than continuing to fight that, I relied
on Postgres — which independently captures a timestamped, complete record of every
successful submission (including IP/UA/referer, which Vercel's own logs don't carry
anyway) — as the authoritative source for timing and correlation. I did not attempt to
reconstruct a full request-by-request Vercel timeline for the entire 2026-09-11–09-14
window beyond what's reported above; nothing found suggests it would change the
conclusions in §3.

---

## 5. Spam Classification

**Classification: Automated, unsophisticated form-abuse / probing traffic.**
**Confidence: High** that it is automated and non-human. **Moderate** on the specific
motive (see below — likely a generic form-testing/harvesting tool rather than a
targeted attack on this site specifically).

Evidence supporting "automated, not human":
- Every one of 18 submissions has an identical, mechanically-generated content shape
  (single no-space random token, 20–24 characters) in two independent free-text fields.
- `Project type` and `Timeframe` are the first dropdown option in 100% of cases — consistent
  with a script that either never actually interacts with the `<select>` elements
  meaningfully, or always picks index 0/1.
- The great majority share one single User-Agent string, and that stored value has literal
  quote characters around it — a real browser's `User-Agent` header is never wrapped in
  quotes; this is a strong technical fingerprint of a hardcoded value in a script.
- Several submissions originate from IP ranges publicly associated with Tor exit relays —
  a common way automated tools obscure origin, and not a realistic pattern for an
  individual customer's home/office connection.
- Submissions are spread over ~1–3 hour intervals rather than a single rapid-fire burst,
  suggesting deliberately paced ("low and slow") automated traffic rather than a single
  person hammering "submit."

Evidence against classifying it as **content-based marketing/SEO spam**: no links, no
promotional language, no keyword hits of any kind were found anywhere in the batch. This
rules out the "spammer trying to plant a backlink or pitch a service" category that a
typical contact-form spam filter is built around.

Most likely explanation (inference, not confirmed): a generic, automated form-discovery
and submission tool — the kind that crawls the web for contact forms and fills them with
throwaway/randomized data, either to test whether a form "works" (for resale to real
spammers later), as a byproduct of broad security/vulnerability scanning, or simply as
low-effort nuisance automation — rather than a human or a bespoke attack targeting 531
Workshop specifically. Nothing in the data suggests the submitter knows or cares that this
is a woodworking business.

---

## 6. Mitigation Options

### Server-side validation (tightening what already exists)
- **Benefit:** closes the existing gap where the server (5-char minimum, no upper bound)
  is far more permissive than the client (20–4000 chars). Free — no new code paths, just
  tightening existing checks.
- **Drawback:** on its own, **would not have stopped this specific batch** — every junk
  message is already ≥20 characters, apparently tuned to clear exactly that bar.
- **Complexity:** trivial (one-line change).
- **Friction:** none for legitimate users — the client already enforces this bar today, so
  no real customer's flow changes.
- **Effectiveness against observed activity: low on its own**, but it's free hygiene and a
  prerequisite baseline regardless.

### Content-shape check on the free-text fields (the single most targeted fix here)
- **What it would look like:** a deterministic, transparent rule — e.g. reject (or flag) a
  `message` or `dimensions` value that contains **no whitespace at all** once trimmed, or
  more generally requires at least 2–3 space-separated tokens for `message`. No keyword
  list, no scoring model — just "does this look like a sentence."
- **Benefit:** directly targets the exact, confirmed shape of 100% of the observed junk
  (every single bad message in this dataset is one word with no spaces). Kaitlin's message
  (22 words) and the 2026-09-03 inquiry (multi-sentence) pass this trivially, as would any
  plausible real inquiry — nobody writes "please build me a table" as one 20-character
  token.
- **Drawback:** narrow — only catches *this* content shape. A more careful future bot that
  generates plausible-looking sentences would sail through. It is not a general spam
  solution, but it is a near-perfect fit for what was actually observed.
- **Complexity:** small — a single pure function, easily unit-tested (this codebase already
  has a strong pattern for this: `lib/contactValidation.ts`/`lib/contactOptions.ts`).
- **Friction:** effectively zero for genuine users.
- **Effectiveness against observed activity: very high** (would have caught 18/18 in this
  dataset).

### Honeypot field
- **Benefit:** a hidden field (e.g. a `company`/`website` input, visually hidden with CSS —
  not `type="hidden"`, which some bots skip — and marked `aria-hidden`/`tabindex="-1"` so
  screen-reader and keyboard users never encounter it) that a real user never sees or
  fills. Any non-empty value on submit is a near-certain bot signal. This project already
  has an unused honeypot precedent to reference: `components/LeadForm.tsx` (dead code, but
  shows the pattern was considered before).
- **Expected effectiveness:** high against the specific bot profile observed here — a tool
  unsophisticated enough to hardcode a quoted User-Agent string and always pick the first
  dropdown option is unlikely to specifically avoid a well-hidden honeypot field, though it
  is not guaranteed (a more careful bot could skip visually-hidden fields).
- **False-positive risk:** very low, if implemented with CSS visibility (not `display:none`
  alone, and not `type="hidden"`, both of which some autofill/password-manager tools have
  been known to populate) and excluded from tab order.
- **Complexity:** small — one extra form field, one server-side check ("if filled, silently
  succeed without writing to the DB or sending email" is the standard approach, so the bot
  doesn't learn to adapt).
- **Accessibility:** must be done carefully (see above) to avoid a screen reader announcing
  or an autofill tool populating a field meant to be invisible to humans; this is a solved,
  well-documented pattern, not a novel accessibility risk if followed correctly.

### Minimum completion time
- **What it would need:** the mission brief is right to caution against a naive
  client-only timestamp — any bot that reads the page can trivially fake a `Date.now()`
  read-out at submit time, so a bare client-side timer provides close to zero real
  protection on its own. To be meaningful, the "form loaded at" timestamp would need to be
  **server-issued and verified server-side** (e.g., a short-lived signed value handed to
  the page on load, checked against the current time when the form posts) rather than
  trusted verbatim from the client.
- **Would it help against what was observed?** Uncertain, and not clearly worth the added
  complexity right now. Nothing in the collected evidence establishes how fast these
  submissions were actually completed (Vercel's logs don't carry page-load timestamps, and
  the DB only has the final submission time) — this control would guard against a
  *different*, faster/cruder bot profile than we have direct evidence for here.
- **Recommendation:** **defer.** It adds real implementation complexity (a signed
  server-issued value, not just a form field) for a benefit that isn't clearly established
  by the evidence in hand. Revisit only if Stage 1 (below) doesn't sufficiently reduce
  volume and the remaining traffic looks fast/scripted rather than paced.

### Rate limiting
- **Does the current architecture support this cleanly?** Partially. This is a serverless
  (Vercel) deployment with no shared in-memory state between invocations, so a naive
  in-process counter would not work. However, **the existing Postgres connection already
  used by `/api/contact` can serve as the durable counter store** — e.g., a
  `SELECT count(*) FROM app.leads WHERE ip = $1 AND created_at > now() - interval '1 hour'`
  check before inserting, inside the transaction that already exists. This requires **no
  new infrastructure** (no Redis, no Upstash, no external KV) — it reuses the database this
  app already depends on.
- **Would it have caught this batch?** **Limited effectiveness, based on the evidence.**
  The 18 junk submissions came from **15 distinct IP addresses**, several inside known Tor
  exit ranges — no single IP submitted more than a handful of times, and the pacing (roughly
  one every 1–3 hours) is already well under any reasonable per-IP-per-hour threshold. A
  per-IP rate limit would likely have stopped only a couple of the higher-repeat IPs in
  this specific batch, not the bulk of it.
- **Risk of blocking legitimate users sharing an IP:** low for a small business site (no
  large NAT'd offices or campuses reported as customers), but worth noting for completeness.
- **Recommendation:** not a priority Stage 1 control given the evidence (low per-IP
  repetition), but cheap enough (via the existing Postgres connection, no new
  infrastructure) that it's reasonable to add as defense-in-depth alongside Stage 1, or
  purely as a coarse **site-wide** circuit breaker/alert (e.g., "notify if more than N
  contact submissions occur site-wide in an hour," given the true baseline is ~1/week) —
  more useful as an early-warning signal for the next spam wave than as a blocker for this
  one.

### CAPTCHA / Turnstile
- **Effectiveness:** would very likely stop this specific bot (it shows no sign of solving
  challenges), but so would the much cheaper controls above, based on the evidence gathered.
- **User friction:** real, even for something as low-friction as Cloudflare Turnstile
  (usually invisible, but not always, and adds a third-party script dependency + a visible
  widget in some cases).
- **Privacy implications:** introduces a third-party script/service into a page that
  currently has none besides optional GA — worth weighing for a small local business site
  whose customers are not especially tech-savvy.
- **Implementation effort:** small-to-moderate (a new dependency, a new env var, a
  server-side token-verification call) — more than a honeypot or a content check, not
  dramatically more.
- **Is it warranted given current volume?** **Not yet, based on the evidence.** The observed
  bot has multiple unsophisticated tells (quoted User-Agent, always-first dropdown option,
  no keyword-aware payload). There's no evidence here that it's the kind of
  challenge-solving-capable automation that would defeat a honeypot + content check.
  Reaching for Turnstile now would be treating a screwdriver problem with a power tool.

### Third-party anti-spam service
- **Recommendation:** not warranted. This is a low-volume site (34 leads in ~8 months
  before this spike); a paid or self-hosted anti-spam service is disproportionate
  infrastructure for the scale of the problem and for what the much simpler controls above
  are already expected to solve.

---

## 7. Recommended Solution

**Staged, smallest-effective-intervention approach:**

**Stage 1 — ship now, zero/near-zero friction for real customers:**
1. **Content-shape check**: reject `message` values with no whitespace (or fewer than ~3
   space-separated tokens), applied server-side in `POST /api/contact`. This is the single
   highest-leverage, most evidence-backed change — it would have caught all 18 observed
   junk submissions and none of the legitimate ones.
2. **Honeypot field** in `ContactForm.tsx` / validated in `POST /api/contact`: a visually
   hidden, `aria-hidden`, non-tabbable field; a non-empty value causes the server to return
   a normal-looking success response without writing to the database or sending any email.
3. **Raise the server-side `message` minimum to match the client's existing 20-character
   rule** (and optionally add a sane upper bound, e.g. 4000, mirroring the client). Cheap
   hygiene that also resolves the existing `TECHNICAL_DEBT.md` A5 gap between client and
   server validation.

**Stage 2 — only if junk continues after Stage 1 ships (reassess with real post-Stage-1
data, don't pre-build):**
- A lightweight, Postgres-backed per-IP rate check (no new infrastructure), primarily as
  defense-in-depth against a bot that rotates its content shape but not its IP.
- A signed, server-issued minimum-completion-time check, if the remaining traffic looks
  unrealistically fast rather than paced.
- Cloudflare Turnstile, only if what remains after Stage 1 shows evidence of being able to
  produce coherent, sentence-shaped content (i.e., the content-shape check stops working) —
  at that point a content-blind challenge becomes the right tool, but not before.

This ordering directly answers the mission's core question: **honeypot + lightweight
content-shape validation (plus closing the existing message-length gap) is the combination
that the evidence says would eliminate effectively all of the observed garbage, while
being completely invisible to a legitimate customer like Kaitlin** — her message has
whitespace, real words, and would never trip a honeypot. Turnstile is deliberately held in
reserve, not because it wouldn't work, but because nothing in the evidence justifies its
added friction and third-party dependency yet.

---

## 8. Proposed Implementation (described, not implemented)

- **`lib/contactValidation.ts`** — add a small, pure, unit-testable helper (e.g.
  `looksLikeGibberish(message: string): boolean`, checking for the presence of at least one
  whitespace character / a minimum token count) reused by both the client validator and the
  server route, so the rule is defined once. Bump the client's existing rules only if the
  chosen threshold changes (it currently already requires 20+ chars — the new check is
  about *shape*, not just length).
- **`app/api/contact/route.ts`** — server-side changes:
  - Raise `message.length < 5` to `message.length < 20` (matching the client) and add an
    upper bound.
  - Call the new gibberish/shape check on `message` (and optionally `dimensions`) and
    reject (`400`) or silently no-op, matching whatever behavior is chosen for the honeypot
    (see below — likely best to keep these two controls' failure behavior consistent).
  - Add a honeypot field check: read a new, unused payload key (e.g. `company`); if
    non-empty, return the normal `{ok:true, message:"Submitted..."}` response **without**
    opening a DB transaction or calling Resend — so the bot's own feedback loop sees
    "success" and has no signal to adapt against.
- **`components/ContactForm.tsx`** — add the hidden honeypot input:
  - A real `<input>` (not `type="hidden"`, which some bots explicitly skip), visually
    hidden via CSS (e.g. absolutely positioned off-screen or `opacity:0` + zero size —
    **not** `display:none`, which is more commonly special-cased by bots), `tabIndex={-1}`,
    `aria-hidden="true"`, and `autoComplete="off"`, with a name unlikely to be
    autofilled by a password manager (avoid `email`/`name`/`username`-style names).
  - Include its value in the existing POST body alongside `projectSlug`.
- **`test/contactValidation.test.ts`** — new cases for the gibberish-shape helper (a
  single no-space token rejected; a normal multi-word message accepted; edge cases like a
  message that's exactly on a length boundary).
- **`test/api-contact.test.ts`** — new cases: a filled honeypot field returns `ok:true`
  but does **not** call the mocked `pg`/`resend`; a no-space `message` is rejected with
  400; a message just above the new 20-char/shape bar succeeds.
- **`docs/TECHNICAL_DEBT.md`** — once implemented, item A1 ("No rate limiting, CAPTCHA, or
  honeypot") and A5 (client/server validation mismatch) would need to be updated to
  `[Resolved]` (partially, for A1 — rate limiting itself would remain open unless Stage 2
  is also implemented).

No files were modified as part of this investigation — the above is a description of the
smallest change set that would implement the Stage 1 recommendation, for scoping/estimation
purposes only.

---

## 9. Validation Plan

If Stage 1 is implemented in a future mission, verify:

- **Legitimate submissions still work:** re-run the existing `test/api-contact.test.ts` and
  `test/contactValidation.test.ts` suites (all current cases must still pass unmodified,
  since real messages already look nothing like the rejected shape); manually submit a
  realistic multi-sentence message locally against a dev database and confirm it inserts
  and the confirmation email sends.
- **DB persistence still works:** confirm a legitimate submission still produces the same
  `app.leads` row shape as today (no schema change is proposed here) and that a
  honeypot-triggered submission produces **no** row at all (by design).
- **Resend notifications still work:** confirm the existing confirmation-email and
  internal-notification flows are unaffected for a legitimate submission (this proposal
  doesn't touch `app/api/contact/verify/route.ts` at all).
- **Spam protections correctly reject bad submissions:** replay the exact junk shape
  observed in this investigation (single no-space 20-character token as `message`) against
  a local/dev instance and confirm it's rejected (or silently no-op'd, depending on the
  chosen behavior) and does not reach the database.
- **False positives are unlikely:** specifically test messages that are short-but-legitimate
  edge cases (e.g., a terse but real 2–3 word reply) against the chosen threshold before
  shipping, to make sure the token-count/whitespace rule isn't tuned so aggressively it
  could catch a genuinely brief human message. Given real inquiries in this dataset run
  145–171+ characters and 20+ words, there's a wide margin, but the exact threshold chosen
  should be tested against a few deliberately terse hand-written examples, not just the
  observed spam.
- Re-check `npm run lint`, `npm run test`, and `npm run build` all still pass, per this
  project's existing validation baseline.

---

## Summary

1. **What I found:** a sudden, dramatic spike in contact-form submissions starting
   2026-09-13 (baseline is ~1/week; this batch was 19 submissions in ~33 hours), 18 of
   which share an identical, mechanically-generated content signature — a single
   no-space random token in both free-text fields, dropdown fields always defaulted to
   their first option, several source IPs in known Tor exit ranges, and a shared,
   quote-wrapped User-Agent string. Kaitlin's inquiry and one other from early September
   are genuinely legitimate and trivially distinguishable from the junk.
2. **What's likely causing it:** an automated, relatively unsophisticated
   form-discovery/submission bot (or a small number of them) probing the contact endpoint
   with randomized filler content — not a targeted human spammer, and not
   link/SEO-pitch-style commercial spam.
3. **Recommended defense:** honeypot field + a deterministic content-shape check
   (reject a free-text field with no whitespace) + closing the existing
   client/server message-length validation gap. Hold Turnstile and rate limiting in
   reserve as a Stage 2, not because they wouldn't work, but because the evidence doesn't
   justify their added friction/complexity yet.
4. **Estimated implementation size: Small.** A few small, testable changes across
   `lib/contactValidation.ts`, `app/api/contact/route.ts`, and `components/ContactForm.tsx`,
   plus new unit tests — no new dependencies, no new infrastructure, no schema changes.
5. **Unresolved questions before implementing:**
   - Exactly how a handful of these bot-submitted addresses got `verified = TRUE` is
     inferred, not confirmed — worth keeping in mind if the same pattern recurs after
     Stage 1 ships (it would suggest the "email security auto-click" theory over the
     "bot completes its own loop" theory, or vice versa).
   - What token-count/whitespace threshold to pick for the content-shape check — the
     evidence supports something generous (Kaitlin's real message has 22 words; the spam
     has 1), but the exact cutoff should be sanity-checked against a few realistic terse
     human messages before shipping, per §9.
   - Whether the client wants the honeypot/content-check failure path to look like success
     (silent no-op, recommended, keeps the bot from adapting) or an explicit rejection —
     this is a product decision, not a technical one.
</content>
