# 531 Workshop Website Enhancement Ideas

_Draft for walkthrough — 2026-08-30. Pricing intentionally not included; this is meant
to be a conversation starter, not a quote._

Below are several potential additions to the website that we can review together. They
can be implemented individually or combined depending on which would be most useful.

---

## 1. Homepage Refresh

### What it adds
A focused refresh of the homepage's hero area — the very first thing a visitor sees.
Right now that hero is built entirely around the cutting-board shop: the photo,
headline, and only call-to-action all point there. This would update the hero photo to
feature a strong completed custom project, adjust the headline/subtext if it makes
sense, and give visitors a clearer next step toward the custom work — something like:

**View Our Work** → Gallery

and potentially a second button:

**Start a Custom Project** → Contact

(these are just the current concept — not final wording).

### What visitors could do

`Homepage → View Our Work → Gallery`

or:

`Homepage → Start a Custom Project → Contact`

The goal is simply a clearer path from landing on the site to the custom-project
experience.

### Why it may be useful
It's a small change that makes the existing custom work more prominent right away and
gives visitors a clear next step, instead of a hero that's currently only about the
shop. It also works independently of the Gallery Upgrade below — today it can point to
the existing gallery, and if the Gallery Upgrade is built later, the same homepage CTA
becomes more useful without needing to touch the homepage again.

### Relative size
Small. This is a focused hero/CTA refresh — not a full homepage redesign.

---

## 2. Project Gallery Upgrade

### What it adds
Right now all 21 project photos live in one long scrolling gallery. This groups them
into categories (e.g. Tables, Furniture & Storage, Keepsake Pieces — just a starting
point, more on that below) and gives each project its own real page instead of a
pop-up.

### What visitors could do
Browse by the kind of work they're actually interested in, open a project to see its
full story (materials, dimensions, description), and bookmark or text that specific
project to someone — something that isn't really possible with the current one-page
mosaic.

### Why it may be useful
Most of the content this needs already exists — descriptions, materials, and
dimensions are already written for most projects. This is mainly about giving that
existing content a better home, and giving each project a link of its own.

### Relative size
Medium-Large. Most of the "hard part" here isn't code — it's deciding how to group the
projects and whether any categories need more photos before they feel complete.

---

## 3. Request Something Similar

### What it adds
A button on a project page — something like "Interested in something similar?" — that
takes a visitor straight to the contact form with that project already attached.

### What visitors could do
See a project they like, click one button, and land on a contact form that already
knows which project caught their eye — instead of having to describe it from memory.

### Why it may be useful
It's an easy way to turn "I like that one" into an actual inquiry, and it tells you
right away which piece inspired the request.

**Conceptual flow:** `Project → Request Something Similar → Inquiry`

### Relative size
Small, once the Gallery Upgrade above exists (this rides along with it).

---

## 4. Custom Project Inquiry Enhancements

### What it adds
A couple of optional extra questions on the contact form — project type, rough
timeframe, maybe a materials preference — nothing mandatory, no long questionnaire.

### What visitors could do
Answer a couple of quick optional questions instead of writing everything into one
open message box.

### Why it may be useful
Slightly better context on what someone's looking for, without adding real friction to
sending a message. This is intentionally small — no customer accounts, no file
uploads, no detailed quoting tool. Just a couple of optional questions.

### Relative size
Small.

---

## 5. Latest From the Workshop

### What it adds
A section on the website — maybe on the homepage — showing a few recent projects or
workshop moments, so visitors can see what 531 Workshop has been building lately.

### What visitors could do
See recent, real evidence the shop is active: a few recent photos, or a couple of
recent Instagram/Facebook posts featured right on the site.

### Why it may be useful
It gives someone who doesn't already know you a reason to trust that this is a real,
active business — not just a static page that hasn't changed in years.

There's more than one way to build this (a few recent hand-picked photos vs. a fully
automatic social feed), and the tradeoffs are covered in the technical appendix — the
short version is that a simple, occasionally-updated version is likely the better fit
than something fully automatic.

### Relative size
Small to Medium, depending on which version we go with.

---

## 6. Upcoming Events / See Us In Person

### What it adds
A simple way to show where 531 Workshop will be appearing next — craft fairs, markets,
shows — instead of that information living only in your head or a Facebook post.

### What visitors could do
See something like:

> **See Us In Person**
>
> **Fall Arts & Crafts Fair**
> September 12 · Wheaton, IL · 10:00 AM – 4:00 PM
>
> `View Event →`

on the homepage for the next event or two, with an optional full events page for
anything further out.

### Why it may be useful
You already attend these regularly — this just gives the website a simple way to say
so, which could help people who find you at an event later confirm you're a real,
active local business, or catch your next one.

### Relative size
Small.

---

## How These Could Work Together

These don't have to be built as one big package, but a couple of them naturally lead
into each other:

**Custom Project Experience:**
`Homepage → Gallery → Project → Request Something Similar → Inquiry`

The Homepage Refresh can stand on its own today — pointing visitors to the existing
gallery — and naturally becomes the entry point into the fuller Gallery/Request
Something Similar experience if those are added later, without needing to be rebuilt.

**Active Workshop Presence:**
`Latest From the Workshop + Upcoming Events`

Both of the "Active Workshop Presence" pieces are about the same thing — showing the
shop is alive and working — so they might end up living near each other on the
homepage, even though they'd likely be built independently.

---

## Recommended Starting Point

### Small immediate improvement: Homepage Refresh
If you want a quick, visible improvement first, the **Homepage Refresh** is a
reasonable place to start on its own. It's small, touches only the homepage, and
immediately points more visitors toward the custom work rather than the shop — useful
whether or not any of the larger enhancements below are pursued.

### Larger potential enhancement: Project Gallery Upgrade + Request Something Similar
If we had to pick the strongest larger combination, it's **the Project Gallery Upgrade
paired with Request Something Similar**. Almost everything it needs — project
descriptions, materials, dimensions — already exists in the site today, so it's mostly
about giving that content a better structure rather than creating new material from
nothing. It also doesn't require any new outside services or changes to how your
contact form works behind the scenes.

These two don't have to happen together or in this order — the Homepage Refresh is
useful on its own, and Latest From the Workshop and Upcoming Events are both fully
independent and can be picked up whenever they make sense, whether that's now, later,
or not at all.

---

## Questions to Talk Through

- Is there a particular completed project or photo that best represents the kind of
  work you'd like featured on the homepage?
- What kinds of custom projects would you most like to get more of?
- How would you naturally group those types of projects — not necessarily how they'd
  be grouped historically, but how you'd want to be found for future work?
- Are there completed projects or photos not currently on the site that you'd want
  included?
- Would "Request Something Similar" be useful for the way you currently handle
  inquiries, or would it feel unnecessary?
- How often do you attend craft fairs or events, and where do you currently keep track
  of them?
- Would you realistically keep a "Latest From the Workshop" section updated yourself,
  or would you want 3EF to handle that?
- Of everything above, which one feels most useful to you right now?

---

# Technical Research Appendix

_Internal use — likely removed from the client-facing version of this document. This
section is more precise/engineering-oriented than the walkthrough above._

## Full enhancement assessments (internal detail)

**Complexity reference point:** a prior Shopify change adding variable product options
and pricing was rated **Medium**, ~2–3 hours of traditional implementation work.
Complexity below reflects overall delivery difficulty with Claude Code accelerating the
mechanical parts (routing, list rendering, tests) — for the larger items, the
bottleneck is content/data decisions, not code volume.

### 1. Homepage Refresh
- **Customer experience gain:** a clearer next step immediately on landing — today the
  hero has exactly one call-to-action ("Shop", to `/shop`) and no path toward custom
  work at all from the first screen a visitor sees.
- **Business value:** connects the homepage's most prominent real estate (the hero) to
  the custom-project work that the rest of the homepage already highlights further down
  (the existing "Custom Projects" value-props section and "Featured work" section both
  already point at `/contact` and `/gallery2`).
- **Existing foundation (confirmed by inspecting `components/Hero.tsx` and
  `app/page.tsx`):**
  - The hero currently renders one full-bleed image
    (`/images/projects/Cutting-board-collage.webp`), an eyebrow ("Hardwood Cutting
    Boards"), a headline ("Crafted for you and your home."), a subhead ("Handmade,
    food safe finishes - elevate your kitchen."), and a single CTA button ("Shop" →
    `/shop`) — all cutting-board/shop-oriented, with no reference to custom work.
  - The CTA area is already a flexible container
    (`mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3`) built to hold more than
    one button — a second CTA can be added without restructuring the layout.
  - Both likely destinations already exist and are already used elsewhere on the same
    page: `/gallery2` (linked from "Featured work" and "View full gallery →") and
    `/contact` (linked from the "Custom Projects" section's "Request a quote" button).
  - A number of strong, already-used project photos exist to draw from for the hero
    image (e.g. `Live-Edge-Coffee-Table.webp`, the Epoxy River Coffee Table photos) —
    no new photography is required, pending the client's own preference.
- **Technical approach:** update `Hero.tsx`'s image `src`, eyebrow/headline/subhead
  copy, and CTA link(s)/label(s) within the existing component and layout; optionally
  add a second `Link` in the existing CTA container. No new route, component, data
  source, or dependency is required.
- **Complexity:** **Small** — confirmed after inspecting the actual component; this is
  a copy/prop-level change to one existing component, not a new page, data model, or
  layout restructuring.
- **Risks / dependencies:** essentially none technically. The only open question is
  which photo and wording best represent the work the client wants to be known for —
  a content decision, not an engineering one (see the added discussion question).
- **Recommendation:** **Recommend.** Low-risk, high-visibility, and useful whether or
  not the Gallery Upgrade is pursued.

### 2. Gallery → Project Pages (Gallery V2)
- **Customer experience gain:** a bookmarkable, shareable, individually-indexable page
  per project, replacing a modal that only exists inside `/gallery2`.
- **Business value:** turns the site's richest existing content (21 written-up
  projects) into something individually discoverable and shareable; foundation for
  "Request Something Similar" and for any future marketing links.
- **Existing foundation:** `GALLERY_IMAGES` (21 items, most fields already populated —
  description, materials, year, dimensions); `GalleryCard.tsx`'s modal already renders
  exactly this content and is directly adaptable into a page; `app/shop/[slug]/page.tsx`
  is a working, proven template in this exact codebase for "dynamic route +
  `generateMetadata` + sitemap entry" that a project detail route can mirror closely.
- **Technical approach:** add `slug` and `category` to `GalleryImage`; add a category
  index route and a `[category]/[slug]` (or `/projects/[slug]`) detail route reusing the
  modal's content layout as a full page with `generateMetadata`; keep `/gallery2` as the
  category hub or redirect it; add new routes to `app/sitemap.ts`; extend the test suite
  following `test/products.test.ts` / `e2e/seo.spec.ts` patterns, which already cover an
  almost identical routed-content shape for products.
- **Complexity — reassessed, split into two concerns:**
  - *Implementation complexity is Medium.* This is largely "do again, for the gallery,
    what already exists and works for `/shop/[slug]`" — a proven, repeatable pattern in
    this codebase, not new architecture. Adding two fields to 21 existing records,
    building one new route type, and extending an existing test suite are all mechanical
    tasks that Claude Code accelerates well.
  - *Product/content complexity is the real driver of size:* deciding final categories,
    deciding which projects belong together, and deciding whether thin categories (e.g.
    Bedroom has 1 item today) get merged or need more photos. This is a client
    conversation, not an engineering task, but it genuinely affects scope and timing —
    it can stall the build if left undecided, or run in parallel if resolved early via
    the "Questions to Talk Through" above.
  - **Net classification: Medium-Large.** Not `Large` in the sense of broad technical
    risk — the code side has a direct template to copy — but not a clean `Medium`
    either, since the categorization/content decisions are real work that a pure code
    estimate would hide. Previously classified as `Large`; revised down after separating
    implementation effort (which has a proven in-repo template) from content decisions
    (which are inherently client-paced, not effort-heavy).
- **Risks / dependencies:** thin categories need client input or more photos (see the
  corrected photo-inventory finding below — do not assume dozens of ready additional
  projects exist without review); duplicate/mismatched filenames in
  `public/images/projects/` (debt item G7) should be resolved first so the "canonical"
  photo per project is unambiguous; needs care to avoid breaking any existing inbound
  links to `/gallery2`.
- **Note — folded in rather than separate:** correct Open Graph/social-preview metadata
  (title/description/image per project page, mirroring `/shop/[slug]`'s existing
  pattern) and category pages functioning as clean shareable/marketing links are both
  natural properties of building this correctly — not separate line items to scope or
  price independently.
- **Recommendation:** **Strongly Recommend.**

### 3. "Request Something Similar" CTA
- **Customer experience gain:** one click from a project to a pre-filled inquiry instead
  of re-describing the project from scratch.
- **Business value:** directly converts gallery browsing into inquiries; gives clear
  context on which project prompted the request.
- **Existing foundation:** `ContactForm.tsx` + `/api/contact` + `app.leads` already
  handle the entire lead lifecycle; `lib/contactValidation.ts` is easy to extend.
- **Technical approach (MVP):** pass the project name/slug via a query string
  (`/contact?project=<slug>`) and have `ContactForm` pre-fill the message field with a
  reference sentence and link — no schema change needed. **Fuller version (not
  currently recommended unless the client specifically wants it):** persist a
  `source_project` column on `app.leads` so the association survives cleanly into the
  internal notification email — this requires coordinating a schema change with
  whoever manages the database, since (per `docs/ARCHITECTURE.md`) no migrations exist
  in this repo and the schema is assumed to pre-exist externally. Default to the
  no-schema-change MVP unless there's a clear reason to do otherwise.
- **Complexity:** **Small** for the MVP (query string + prefill); **Medium** only if
  paired with the database column + notification-email template change.
- **Risks / dependencies:** depends on Gallery V2 existing first; the fuller version
  depends on external DB coordination, not just a code change.
- **Recommendation:** **Strongly Recommend** (MVP version, paired with Gallery V2).

### 4. Custom Project Inquiry Enhancements (lightweight)
- **Customer experience gain:** a couple of optional quick-pick fields (project type,
  timeframe, materials preference) instead of writing everything into one open text
  box.
- **Business value:** modestly better-qualified leads with minimal added friction.
- **Existing foundation:** `ContactForm.tsx`'s message placeholder already invites
  "rough dimensions, timeline, and any inspiration links" — this formalizes what users
  are already being asked to type freely.
- **Technical approach:** add 1–2 optional fields to `ContactFormValues` /
  `lib/contactValidation.ts` / `ContactForm.tsx`; fold answers into the existing
  `message` text server-side to avoid a schema change, or add columns only if the
  client wants them queryable/reportable later.
- **Complexity:** **Small** (folded into message, no schema change); **Medium** only if
  backed by new database columns and an updated notification email template.
- **Risks / dependencies:** every additional required field is friction — keep it
  optional. A full dedicated inquiry experience (structured budget ranges, customer
  accounts, configurators, or photo upload) was evaluated and is **not recommended**:
  no evidence of need, and photo upload specifically requires new file-storage
  infrastructure, size/type limits, and content moderation — disproportionate for an
  unvalidated need.
- **Recommendation:** **Consider** (lightweight version only); **Do Not Recommend** a
  full structured inquiry system, customer accounts, or file upload at this time.

### 5. "Latest From the Workshop"
- **Customer experience gain:** visible evidence the shop is currently active, without
  relying on a feed that could break or go stale unnoticed.
- **Business value:** builds trust with visitors who don't already know the business
  personally.
- **Existing foundation:** `components/Footer.tsx` already links out to Instagram,
  Facebook, and TikTok — there is no on-site social content today, only outbound links.
- **Technical approach — three options, not equally recommended:**
  1. **Curated manual embeds** of a handful of specific public posts (copy-paste embed
     code for an individual post). Static content, swapped out occasionally by whoever
     maintains the site.
  2. **Website-native "Workshop Updates"** — a small new content module (e.g.
     `lib/updates-data.ts`) rendered as its own homepage section, entirely inside the
     existing "content as code" pattern; could later be the *source* that gets shared
     out to social rather than the reverse.
  3. **Live, auto-syncing Instagram/Facebook feed** via Meta's Graph API — technically
     possible but requires converting to a Business/Creator account, a registered Meta
     developer app, and indefinite recurring access-token maintenance.
- **Complexity:** Option 1 — **Small**. Option 2 — **Medium** (new content model + new
  homepage section + an ongoing content workflow for whoever updates it). Option 3 —
  **Large/XL**, and the size is mostly operational (recurring maintenance with no
  current owner), not code.
- **Risks / dependencies:** Option 3 depends on Meta account setup the client may not
  currently have, plus an ongoing maintenance commitment from someone. Options 1 and 2
  depend only on someone occasionally choosing content to feature. **See the research
  caution below** — the specific claims about Meta's current embed policy come from
  third-party sources and should be verified against Meta's own developer
  documentation before this is scoped for implementation.
- **Recommendation:** **Consider** Option 1 or 2, independent of the Gallery Upgrade.
  **Do Not Recommend** Option 3 given the business's size and the lack of anyone
  positioned to own ongoing token maintenance.

### 6. Upcoming Events / See Us In Person
- **Customer experience gain:** a visitor (or someone who met the shop at a fair) can
  see where 531 Workshop will be next without needing to already follow its social
  accounts.
- **Business value:** the client already regularly attends craft fairs, markets, and
  shows — this gives that existing activity a home on the website instead of it living
  only in the client's head or scattered Facebook posts.
- **Existing foundation:** none specific to events exists yet, but the pattern fits the
  site's established "content as code" approach exactly the way `lib/faq-data.ts` and
  `lib/home-data.ts` already do — no CMS or database required.
- **Technical approach:** a `lib/events-data.ts` module (event name, date/time,
  location, short description, optional external link) rendered as (a) a homepage
  preview of the next 1–3 upcoming events, and (b) an optional `/events` page listing
  everything upcoming. **Individual per-event detail pages are not necessary** — an
  event has little content beyond what already fits in a homepage card (name, date,
  location, short description, optional link), so a single list/page covers the need
  without a second dynamic route. Past events can simply be filtered out by date or
  removed from the array; no soft-delete or archive system needed at this scale.
- **Complexity:** **Small.** This is a straightforward data module plus two rendering
  spots (homepage card + optional list page), directly analogous to how FAQ content
  already works on this site.
- **Risks / dependencies:** entirely content-as-code, so someone (client or 3EF) needs
  to actually add each event via a commit — same tradeoff as every other content update
  on this site today, not a new constraint. No external calendar/API dependency is
  needed or recommended; syncing with Facebook Events or another external calendar was
  considered and set aside in favor of this simpler, more reliable approach (see below).
- **Recommendation:** **Recommend.** Small, low-risk, directly reflects a real,
  recurring part of how the business already operates.

### Folded in / no longer standalone client options
These were presented as separate enhancement choices in an earlier draft. They're kept
here because the underlying reasoning is still useful, but they should not be offered
to the client as things to independently decide on:

- **"Recent Work, Near You" trust panel** — a small panel pairing existing testimonial
  locations (`TESTIMONIALS[].location` in `lib/home-data.ts`: Lombard, Villa Park,
  Elmhurst) with a couple of nearby completed projects. Genuinely small and low-risk
  (**Complexity: Small**), but modest enough that it reads better as a presentation
  detail folded into the Gallery Upgrade (or homepage) build than as its own decision
  point.
- **Shareable project link/preview card** — proper Open Graph metadata per project page
  (mirroring `/shop/[slug]`'s existing `generateMetadata` pattern) so a forwarded link
  shows a real photo/title/description. This should simply be part of building Gallery
  V2 project pages correctly, not a separate feature to scope.
- **Custom-work landing pages** — if Gallery V2's category pages are built well (clear
  URL, good metadata, a strong single CTA), they already function as pages the client
  could link to from Facebook groups or referrals. This is a characteristic of doing
  Gallery V2 correctly, not a second system to build.
- **Client progress-photo portal** — giving an active client a private link to
  in-progress build photos. Kept in Optional Future Ideas only; requires new per-client
  access control, a sustained content-upload workflow during every build, and has no
  demonstrated client demand yet. **Complexity: Large/XL** (the size is operational —
  an ongoing workflow per project — not just a one-time build). **Recommendation: Low
  Priority.**

## Repo-derived facts

- **Gallery content already has most of the fields a project page needs.**
  `lib/gallery-data.ts` defines `GalleryImage` with `id`, `src`, `alt`, `title`,
  `description`, `materials[]`, `year`, `dimensions`, `tags[]`, `featured` — confirmed
  21 entries (`grep -c '^\s*id:' lib/gallery-data.ts` → 21), most with a description and
  materials, some missing `year`/`dimensions`. There is no `slug` or `category` field
  today; both would need to be added.
- **`GalleryCard.tsx` already implements a detail view** — the click-to-open modal on
  `/gallery2` renders exactly the fields (description, materials, year, dimensions) a
  project detail page would need. This logic can be adapted into a real page rather than
  rebuilt.
- **`app/shop/[slug]/page.tsx` is a directly applicable implementation template** — it
  already demonstrates a dynamic route, per-item `generateMetadata`, and a
  purchasability-style conditional CTA in this exact codebase (Next.js 16 App Router).
  This is the main reason implementation complexity for Gallery V2 is rated `Medium`
  rather than higher — the pattern isn't new to this repo.
- **Corrected interpretation of the 93 files in `public/images/projects/`.** A previous
  draft of this document noted 93 files on disk against 21 gallery records and implied
  meaningful unused "additional project" material might exist. That framing was wrong
  and has been corrected after owner context: the original site design intentionally
  used an in-progress-photo slider on the About page (confirmed in
  `app/about/page.tsx` — a 10-image horizontal strip: `shadowbox-coffee-table.webp`,
  `Working-pic-2.jpg`, `DSC01430.webp`, `Puzzle-table-rough-layout.webp`,
  `Working-pic-3.jpg`, `DSC01524.webp`, `Fireplace-rough-layout-2.webp`,
  `DSC01489.webp`, `DSC01503.webp`, `DSC01534.webp`, plus one more sticky image,
  `DSC01558.webp`), and some older photos were deliberately kept in the repo for
  possible future use rather than deleted. Recounting what's actually referenced
  anywhere in the codebase (gallery + About page + homepage hero + `products.json`)
  accounts for 40 of the 93 files. Of the remaining 53 unreferenced files:
  - **~12 are duplicate-name twins of a photo already used elsewhere** (e.g.
    `Barnwood Beam Console table.webp` vs. the used `Barnwood-Beam-Console-table.webp`;
    same pattern for Bedroom remodel, Bookshelf unit, Checkerboard cutting board, both
    Epoxy River Coffee Tables, Fireplace TV Stand, Front Room Coat Storage, Garage Bar,
    Hickory coffee table, Live Edge Coffee Table, Living Room Cabinet, Wine Table) —
    the same debt item G7 already documented in `docs/TECHNICAL_DEBT.md`, not new
    content.
  - **~17 are numbered `DSC0####.webp` raw shots** from what appears to be the same
    photo batch as the process photos already used in the About-page strip (which pulls
    from `DSC01430`, `DSC01489`, `DSC01503`, `DSC01524`, `DSC01534`, `DSC01558`) —
    consistent with the owner's description of retained in-progress/workshop photos,
    not obviously separate finished projects.
  - **~6 are explicitly named in-progress/process shots** (`Coffee table in
    progress.webp`, `Coffee table square legs 1.webp`, `Corner cabinet in
    progress.webp`, `Fireplace rough layout 1.webp` / `3.webp`, `Puzzle table, finished,
    top off.webp`, `Wine table with props.webp`) — again consistent with retained
    process photography, not new finished-project material.
  - **5 are brand/personal images**, not project photos (`531Workshop logo - black/white
    .webp`, `531Workshop Logo w_red lettering.webp`, `Me with tablecloth.webp`,
    `Profile-pic-1.webp`).
  - **3 are wood-grain sample images** (`sample-grain2/3/4.webp`) — siblings of the
    `sample-grain1.webp` already used in `data/products.json` for a cutting board's
    material sample, not gallery projects.
  - **A small remainder (roughly 4–5 files) is genuinely ambiguous** —
    `Baptismal-font.webp` (possibly an alternate photo of the already-featured
    Baptismal Font project), `Bar shelving.webp` / `Bar-shelving.webp`, and
    `Barnwood beam side tables.webp`. These *may* represent additional finished project
    photography worth adding to the gallery, but this should be confirmed with the
    owner rather than assumed — do not treat this as "dozens of ready additional
    projects."

  **Bottom line:** the extra files are overwhelmingly explainable (duplicate filenames,
  retained process/in-progress shots, brand/personal images, product samples), not
  evidence of a large stock of unused completed-project photography. A short manual
  review of the ~4–5 ambiguous files with the owner is worthwhile before assuming any
  of them belong in Gallery V2 — treat any additional gallery content as something to
  be confirmed, not assumed.
- **Derived categories from the 21 existing gallery items** (for internal reference
  only — the client-facing conversation should be framed forward-looking, i.e. "how do
  you want to be found for future work," not simply "here is how your past work
  clusters"):
  | Category | Items | Count |
  |---|---|---|
  | Tables | Epoxy River Coffee Table (Sycamore, Walnut), Hickory Coffee Table, Live Edge Coffee Table, Puzzle Dining Table, Wine Table, Barnwood Beam Console Table | 7 |
  | Furniture & Storage | Living Room Cabinet, Fireplace & TV Stand, Front Room Coat Storage, Display Cabinet, Bookshelf Unit, Garage Bar | 6 |
  | Keepsake & Memory Pieces | Keepsake Boxes, Inscription | 2 |
  | Bedroom & Remodels | Bedroom Remodel | 1 (thin) |
  | Custom / Commercial Work | Baptismal Font, Baptism Fonts (B2B/church client work) | 2 |
  | Other / Seating | Stools, Checkerboard Cutting Board | 2 |
  This is a starting point for the client conversation, not a taxonomy to implement
  as-is — several categories are thin and the client may want to group by the work
  they want more of, not strictly by what's already been built.
- **The contact pipeline is code-simple and has no admin UI.** `/api/contact` writes to
  `app.leads` / `app.email_verification_tokens` (Postgres) and sends via Resend; there is
  no lead-viewing UI anywhere in the repo (confirmed in `docs/ARCHITECTURE.md`). Any
  enhancement that wants to *display* which project a lead came from (beyond the email
  body) would need new admin tooling — out of scope unless requested separately.
- **The database schema lives outside this repository** — `docs/ARCHITECTURE.md` and
  `docs/INTEGRATIONS.md` confirm there is no migrations directory; `app.leads`'s columns
  are assumed to pre-exist. Any enhancement that wants a new column (e.g.
  `source_project_slug`) needs coordination with whoever manages that database, not just
  a code change.
- **`types/project.ts`, `components/ProjectCard.tsx`, `lib/portfolio.ts` are unrelated
  leftovers** from a different 3EF template project (confirmed unused in
  `docs/ARCHITECTURE.md`) — they use a `Project` shape (`repo`/`docs`/`live` links) that
  has nothing to do with woodworking projects and should not be reused or confused with
  a new woodworking "project" type.
- **No CMS exists; all content is code** (`lib/*.ts`, `data/products.json`). Any of these
  enhancements that add more editable content (categories, updates, events) will still
  require a commit + redeploy to change — consistent with how the rest of the site
  already works, not a new constraint introduced by these ideas.
- **Sitemap/robots/canonical infrastructure already exists** (`app/sitemap.ts`,
  `app/robots.ts`, per-page `alternates.canonical`, per the SEO work noted in
  `docs/VALIDATION_BASELINE.md` D1/D2) and has its own test coverage
  (`test/sitemap.test.ts`, `e2e/seo.spec.ts`). New project/category/event routes should
  be added to `app/sitemap.ts` and get their own `generateMetadata`, following the
  existing pattern from `app/shop/[slug]/page.tsx`.
- **Testimonial locations already exist as data** (`lib/home-data.ts` →
  `TESTIMONIALS[].location`: Lombard, Villa Park, Elmhurst — all IL) — the "Recent Work,
  Near You" idea (folded into Gallery V2 presentation) needs no new data collection,
  just new presentation.
- **Test baseline exists and would need extending, not replacing.** `docs/TESTING.md` /
  `docs/VALIDATION_BASELINE.md` describe an established Vitest + Playwright suite (37
  unit tests, 21 e2e tests as of the last recorded run). New gallery/category/event
  routes should follow the same pattern (`test/products.test.ts` and `e2e/seo.spec.ts`
  are the closest existing templates for a routed-content test).

## External research

> **Research caution:** the following points on Meta/Instagram/Facebook integration
> come from third-party sources (industry blogs and integration-guide sites), not
> Meta's own developer documentation directly reviewed line-by-line for this project.
> They are directionally useful for early planning but **should be verified against
> Meta's first-party developer documentation before any of this is scoped for actual
> implementation.** Nothing below should be treated as a settled fact for client
> commitments or estimates.

- **Instagram Basic Display API was reported as permanently shut down December 4,
  2024.** If accurate, it is no longer a viable integration path. ([getphyllo.com](https://www.getphyllo.com/post/instagram-basic-display-api-deprecation-what-it-is-for-developers-and-businesses), [keyapi.ai](https://www.keyapi.ai/blog/instagram-basic-display-api/))
- **A live, auto-syncing Instagram feed is reported to require the Instagram Graph
  API**, which reportedly requires the Instagram account to be a Business or Creator
  account connected to a Facebook Page (personal accounts reportedly cannot be used at
  all). ([tagembed.com](https://tagembed.com/blog/instagram-api/), [wpsocialninja.com](https://wpsocialninja.com/instagram-graph-api/))
- **Graph API long-lived access tokens are reported to expire in 60 days** and require
  active refreshing — if accurate, this is a genuine, indefinite maintenance
  obligation, not a one-time setup cost, and there is no one on the current team (per
  `docs/SYSTEM_OVERVIEW.md`, this is a small marketing site with no admin backend)
  obviously positioned to own it. ([developers.facebook.com](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/), [getfishtank.com](https://www.getfishtank.com/insights/renewing-instagram-access-token))
- **Facebook's Page Plugin** (the official no-token embed of an entire Facebook Page) is
  reported to be simple to add but with real drawbacks for this site: a fixed width
  between 180–500px, and one independent test found it loads ~7.2MB with 6 tracking
  cookies — worth weighing against a site that currently has no analytics/tracking
  script loaded by default (`docs/INTEGRATIONS.md` confirms GA is off, Plausible was
  never wired up). ([developers.facebook.com](https://developers.facebook.com/documentation/plugins/page-plugin), [agilitycms.com](https://agilitycms.com/blog/how-to-embed-facebook-s-new-page-plugin-on-your-website))
- **A third-party-reported claim, not yet first-party verified:** that on June 15, 2026,
  Meta reversed a 2020 restriction and re-enabled oEmbed endpoints for Instagram,
  Facebook, and Threads with no access token and no App Review required, for embedding
  individual public posts (not a full feed). If accurate, this would make the "curated
  manual embeds" option (Option 1 above) meaningfully lower-effort and lower-maintenance
  than previously assumed. **This claim should be confirmed directly against Meta's
  current developer documentation before being used as the basis for a technical
  decision or estimate.** ([spotlightwp.com](https://spotlightwp.com/instagram-embed-wordpress/), [own.page](https://own.page/blog/how-to-embed-instagram-feed))

## Assumptions / recommendations (ours, not sourced from the client or external docs)

- We are **recommending against** a live Graph API-driven social feed for this business,
  based on the ongoing token-maintenance burden relative to the size of the business and
  the lack of anyone positioned to own that maintenance — this is a judgment call, not a
  hard technical blocker, and depends on the third-party-reported claims above holding
  up under first-party verification. If 3EF Studio is willing to take on ongoing token
  refresh as a maintained service, the calculus changes and a live feed becomes more
  viable.
- We are **assuming** the derived gallery categories above are a starting point for
  discussion, not a final taxonomy — and specifically assuming the client may want to
  group projects by the work they want to attract going forward, not strictly by how
  past work happens to cluster.
- We are **no longer assuming** that the 53 unreferenced files in
  `public/images/projects/` represent a meaningful pool of additional ready-to-use
  gallery content — see the corrected photo-inventory finding above. A short manual
  review with the owner of the small ambiguous remainder (~4–5 files) is the right next
  step, not an assumption either way.
- We are **assuming** "Request Something Similar" should not require a database schema
  change for its first version — carrying the project name/link through the URL and
  pre-filling the existing message field is sufficient to prove the idea out, and avoids
  needing to coordinate a change to a database schema that lives outside this repo. A
  dedicated `source_project` column can be added later if the client wants project
  attribution to show up cleanly in the lead notification email or a future lead-admin
  view.
- We are **recommending against** a photo/file upload field, customer accounts, or a
  structured quoting/configurator system on the contact form for now — these introduce
  real technical surface (storage, size limits, moderation, auth) for a need that isn't
  demonstrated by current behavior (the existing message field already invites
  "inspiration links," per its own placeholder text in `components/ContactForm.tsx`).
- **Unknowns that need client input before estimating any of this precisely:** final
  category groupings and whether the client wants them forward-looking vs. historical;
  whether the ~4–5 ambiguous unused photos are usable additional project content or
  should stay unused; whether the client wants project-sourced inquiries to be visible
  to the customer or fully seamless/invisible; who (client or 3EF) would own picking
  content for "Latest From the Workshop" and keeping "Upcoming Events" current; where
  event information currently lives for the client (a calendar, memory, a Facebook
  events page) — relevant to how much friction adding an event to the website would
  actually add to their routine; whether the client's Instagram/Facebook accounts are
  already Business/Creator accounts (relevant only if a live feed is reconsidered
  later).
