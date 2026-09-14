# DECISIONS — 531 Workshop Site

A short log of specific, deliberate decisions made during the Gallery/Hero/Contact
enhancement work, kept separate from `ARCHITECTURE.md` so the reasoning behind a choice
doesn't get lost the next time the surrounding code is refactored. Ordered roughly as the
decisions were made, not by importance.

---

### `/gallery` is the one canonical Gallery route
`/gallery2` (the previous primary gallery) is retired: the page was deleted and
`next.config.ts` now issues a permanent (308) redirect from `/gallery2` to `/gallery`, so
old links and any external backlinks keep working. `/gallery1` (a pre-existing, unlinked
design alternative) was explicitly left alone — it predates this work and rebuilding or
removing it was out of scope.

### Category subpages + individual project pages, not a single mosaic + modal
The previous Gallery showed every item in one mosaic grid with a click-to-open detail
modal. That was replaced with a real page hierarchy: `/gallery` (landing + category nav +
full mosaic) → `/gallery/[category]` (one category) → `/gallery/[category]/[slug]` (one
project). Reasoning: real pages are indexable and linkable (each gets its own metadata,
canonical, and sitemap entry), a modal is not; and a per-project URL is what makes
`?project=<slug>` on Contact possible at all.

### One primary category per project, not multiple
Each `GalleryImage` has exactly one `category` (a fixed `GalleryCategory` union), which
determines its one canonical URL. `tags[]` remains available for secondary/free-form
classification (material, style, etc.) but never affects routing. Reasoning: a single
category keeps the URL scheme, the category page counts, and the sitemap unambiguous —
multi-category items would otherwise need either duplicate URLs or an arbitrary
"primary" pick anyway.

### Stable slugs added while keeping the legacy `id`
Every `GalleryImage` kept its original `id` and gained a new, URL-facing `slug`.
Reasoning: `lib/hero-data.ts`'s `HERO_SLIDE_IDS` list already referenced items by `id`;
changing the identifier scheme in place would have silently broken the Hero rotation. The
`id` stays as the stable internal key; `slug` is the one identifier meant to be public and
should not be renamed once a project page has shipped and been indexed.

### Gallery → Contact passes only the slug — never a title or category
Both the Hero's "Start a Custom Project" CTA and a Gallery project page's "I want something
like this" CTA link to `` `/contact?project=<slug>` ``. The slug is the only Gallery data
that ever appears in the URL or in the `ContactForm` → `/api/contact` request body. Both
`/contact`'s server component and `POST /api/contact` independently look the slug back up
against the trusted `GALLERY_IMAGES` data to get the real title/category. Reasoning:
defense in depth — a client that could inject an arbitrary title/category into a lead
record or the owner-notification email would be a spoofing vector; making the slug a pure
lookup key removes that entirely, at the cost of one extra lookup per request.

### Project context stored as one additive `JSONB` column
`app.leads.project_context` is a single nullable `JSONB` column holding whichever of
`gallerySlug`/`galleryTitle`/`galleryCategory`/`projectType`/`dimensions`/`timeframe` are
actually present, rather than six new nullable text columns. Reasoning: this data is
sparse (most leads will have none or a few of these fields) and was added after the table
already existed in production with no migration framework in the repo — one additive
column is a smaller, safer out-of-band schema change than several, and avoids widening the
table for fields that may still change shape later.

### Contact stays a low-friction inquiry form, not a project configurator
The new optional fields (Project type, Approximate size, Timeframe) are validated leniently
on the server: an invalid `projectType`/`timeframe` value is silently dropped rather than
rejecting the whole submission, and `dimensions` is truncated rather than rejected.
Reasoning: these are inspiration/context fields for the shop owner, not required
structured data — the form's job is still to capture a low-friction inquiry, and rejecting
a submission over a malformed optional field would be a worse outcome than just discarding
that one field.

### The Hero routes contextually; "View Our Work" stays static
The Hero rotates through a curated set of Gallery photos and its "Start a Custom Project"
CTA links to whichever slide is currently showing (`` `/contact?project=${activeSlide.slug}` ``),
while "View Our Work" always links to the static `/gallery` regardless of rotation state.
Reasoning: "start a project around what you're looking at right now" is a stronger,
more specific call to action than a generic contact link, and costs nothing extra since the
slide's slug is already known; but the Gallery link is a browse action, not tied to any one
slide, so it should stay stable and predictable as the hero rotates.

### Home's "Featured work" section became a Shop preview, not a Gallery preview
The old static "Featured work" section (two hard-coded items linking to the gallery) was
replaced with a "Shop" preview: a config-driven list of product slugs
(`FEATURED_PRODUCT_SLUGS` in `lib/home-data.ts`) resolved against the real product catalog
and rendered with the *same* `ProductCard` used on `/shop` — no duplicated card markup.
Reasoning: the Hero and the Gallery link already cover custom-project inspiration on the
home page; a second "Featured work"-style section pointing at the Gallery would have been
redundant. A Shop preview instead gives the purchasable catalog a home-page entry point it
didn't have before.
</content>
