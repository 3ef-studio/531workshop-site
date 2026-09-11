// lib/gallery-data.ts

export type GalleryCategory =
  | "tables"
  | "cabinets"
  | "specialty-projects"
  | "commercial-projects"
  | "cutting-boards";

export type GalleryImage = {
  /**
   * Stable internal identifier. Do not rename or reuse — lib/hero-data.ts
   * references gallery items by `id` for the homepage hero rotation.
   */
  id: string;

  /**
   * Stable, human-readable, URL-safe identifier used for routing
   * (/gallery/[category]/[slug]) and, later, for passing project context to
   * the contact flow (e.g. /contact?project=<slug>). Treat as a public URL
   * once published — avoid renaming after the page has shipped.
   */
  slug: string;

  /**
   * Single primary category. Drives which /gallery/[category] page the item
   * appears on and its canonical project URL. Use `tags` below for any
   * secondary/cross-cutting classification instead of adding more categories.
   */
  category: GalleryCategory;

  /**
   * Path under /public (e.g., "/images/projects/dining-table-01.webp")
   */
  src: string;

  /**
   * Accessible alt text. Keep it short, descriptive, and natural.
   */
  alt: string;

  /**
   * Optional display title/caption used in cards.
   */
  title?: string;

  /**
   * Longer project copy used for search context and optional project detail content.
   * This does not need to be shown inside the gallery cards.
   */
  description?: string;

  /**
   * Optional details you may want later.
   */
  materials?: string[];
  year?: string;
  dimensions?: string;

  /**
   * Optional: helps with layout stability if you know it.
   * If you don't want to measure now, leave undefined.
   */
  width?: number;
  height?: number;

  /**
   * Optional: feature a few at the top or for homepage callouts later.
   */
  featured?: boolean;

  /**
   * Optional grouping for filtering and search context.
   * e.g., ["table", "bench", "shelf", "cabinet"]
   */
  tags?: string[];
};

/**
 * Keep `src` paths under /public so they work with next/image.
 * Descriptions are intentionally stored here for search/detail context but are not
 * shown in the gallery cards by default.
 */
export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "p07",
    slug: "epoxy-river-coffee-table-sycamore",
    category: "tables",
    src: "/images/projects/Epoxy-River-Coffee-Table-Sycamore.webp",
    alt: "Custom sycamore epoxy river coffee table with red tinted epoxy and black metal legs.",
    title: "Epoxy River Coffee Table Sycamore",
    description:
      "Wood species, epoxy color, and leg style are all customizable. This coffee table is made from sycamore with a red tinted deep pour epoxy, paired with black hammertone metal legs.",
    materials: ["Sycamore", "Epoxy", "Metal"],
    year: "2021",
    dimensions: "48\" x 24\" x 18\"",
    featured: true,
    tags: ["coffee table", "epoxy river table", "sycamore", "custom furniture"],
  },
  {
    id: "p02",
    slug: "barnwood-beam-console-table",
    category: "tables",
    src: "/images/projects/Barnwood-Beam-Console-table.webp",
    alt: "Console table made from reclaimed hardwood barn beams from Western Illinois.",
    title: "Barnwood Beam Console Table",
    description:
      "Made from authentic hardwood beams removed from a barn in Western Illinois. Massively heavy and massively cool. Planed down for a flat top surface while keeping all the charm of the original beams.",
    materials: ["Reclaimed hardwood barn beams"],
    tags: ["console table", "barnwood", "reclaimed wood", "rustic furniture"],
  },
  {
    id: "p31",
    slug: "keepsake-boxes",
    category: "specialty-projects",
    src: "/images/projects/Keepsake-boxes.webp",
    alt: "Solid mahogany keepsake boxes finished with tung oil.",
    title: "Keepsake Boxes",
    description:
      "Constructed with solid mahogany boards and finished with tung oil, these keepsake boxes are built to contain cherished memories for a lifetime.",
    materials: ["Mahogany", "Tung oil"],
    tags: ["keepsake box", "memory box", "mahogany", "custom woodworking"],
  },
  {
    id: "p03",
    slug: "bedroom-remodel",
    category: "specialty-projects",
    src: "/images/projects/Bedroom-remodel.webp",
    alt: "Bedroom remodel with red oak queen bed frame, side tables, shelf risers, and headboard.",
    title: "Bedroom Remodel",
    description:
      "The queen bed frame is made from solid red oak with matching side tables. On the outside of that, custom shelf risers support existing wardrobes. The simple yet stunning headboard caps off the project.",
    materials: ["Red oak"],
    tags: ["bedroom remodel", "bed frame", "headboard", "red oak", "custom furniture"],
  },
  {
    id: "p04",
    slug: "bookshelf-unit",
    category: "specialty-projects",
    src: "/images/projects/Bookshelf-unit.webp",
    alt: "Wall-spanning red oak bookshelf unit stained to match existing furniture.",
    title: "Bookshelf Unit",
    description:
      "Solid red oak plywood and hardwoods, stained to match existing units, span this wall for the ultimate book collector.",
    materials: ["Red oak plywood", "Red oak hardwood"],
    tags: ["bookshelf", "bookcase", "built-in storage", "red oak", "custom cabinetry"],
  },
  {
    id: "p06",
    slug: "checkerboard-cutting-board",
    category: "cutting-boards",
    src: "/images/projects/Checkerboard-cutting-board.webp",
    alt: "Maple and walnut checkerboard cutting board with juice groove.",
    title: "Checkerboard Cutting Board",
    description:
      "This maple and walnut board is great for cutting meats. The juice groove captures anything that may stray away from your carefully grilled cut. All boards are soaked in food grade mineral oil and a food grade finishing oil for added protection.",
    materials: ["Maple", "Walnut", "Food grade mineral oil"],
    tags: ["cutting board", "checkerboard cutting board", "maple", "walnut", "kitchen"],
  },
  {
    id: "p13",
    slug: "living-room-cabinet",
    category: "cabinets",
    src: "/images/projects/Living-Room-Cabinet.webp",
    alt: "Living room storage cabinet with live edge cherry slab top and custom base.",
    title: "Living Room Cabinet",
    description:
      "A custom live edge cherry wood slab top is paired with stock cabinets and a custom base to make this functional storage unit for the client's living room.",
    materials: ["Cherry", "Cabinetry"],
    tags: ["living room cabinet", "storage cabinet", "live edge", "cherry", "custom base"],
  },
  {
    id: "p08",
    slug: "epoxy-river-coffee-table-walnut",
    category: "tables",
    src: "/images/projects/Epoxy-River-Coffee-Table-Walnut.webp",
    alt: "Custom walnut epoxy river coffee table with blue tinted epoxy and black metal legs.",
    title: "Epoxy River Coffee Table Walnut",
    description:
      "Wood species, epoxy color, and leg style are all customizable. This coffee table is made from walnut with a blue tinted deep pour epoxy, paired with black hammertone metal legs.",
    materials: ["Walnut", "Epoxy", "Metal"],
    featured: true,
    tags: ["coffee table", "epoxy river table", "walnut", "custom furniture"],
  },
  {
    id: "p09",
    slug: "fireplace-tv-stand",
    category: "cabinets",
    src: "/images/projects/Fireplace-TV-Stand.webp",
    alt: "Custom maple fireplace and TV stand with storage for AV equipment.",
    title: "Fireplace & TV Stand",
    description:
      "This custom unit was designed around the client's fireplace unit. Constructed with hardwood maple and maple plywood, there are spaces for specific AV needs.",
    materials: ["Hardwood maple", "Maple plywood"],
    tags: ["fireplace", "tv stand", "media cabinet", "maple", "custom built-in"],
  },
  {
    id: "p10",
    slug: "front-room-coat-storage",
    category: "cabinets",
    src: "/images/projects/Front-Room-Coat-Storage.webp",
    alt: "Front room coat storage with solid red oak board and batten.",
    title: "Front Room Coat Storage",
    description:
      "An entryway area needed storage help to accommodate everyday living. Solid red oak board and batten give new life to the area and make it functional.",
    materials: ["Red oak"],
    tags: ["entryway storage", "coat storage", "board and batten", "red oak", "mudroom"],
  },
  {
    id: "p5841",
    slug: "baptismal-font",
    category: "commercial-projects",
    src: "/images/projects/IMG_5841.webp",
    alt: "Custom baptismal font.",
    title: "Baptismal font",
    description: "For a B2B client who sells just about everything a church could ask for. Constructed from walnut hardwood and plywood, this baptism font is delivered sanded and prepped for final finishing by the client. We follow the custom design given to us by the client, including all the specific angles, routing, and access doors.",
    materials: ["Walnut hardwood", "Walnut plywood"],
    tags: ["baptism font", "church furniture", "walnut", "b2b woodworking", "custom design"],
  },
  {
    id: "p5857",
    slug: "display-cabinet",
    category: "cabinets",
    src: "/images/projects/IMG_5857.webp",
    alt: "Display Cabinet.",
    title: "Display Cabinet",
    description: "Solid red oak hardwood and plywood, stained to match an existing piece of furniture. Custom glass insert panel on the top so the client can view their collection. The drawers are interchangeable so the display collection can be swapped out easily.",
    materials: ["Red oak hardwood", "Red oak plywood", "Glass"],
    tags: ["display cabinet", "red oak", "custom cabinetry", "storage"],
  },
  {
    id: "p004",
    slug: "hickory-coffee-table",
    category: "tables",
    src: "/images/projects/Hickory-coffee-table.webp",
    alt: "Custom hickory coffee table with natural wood grain.",
    title: "Hickory Coffee Table",
    materials: ["Hickory"],
    tags: ["coffee table", "hickory", "custom furniture"],
  },
  {
    id: "p11",
    slug: "garage-bar",
    category: "specialty-projects",
    src: "/images/projects/Garage-Bar.webp",
    alt: "Custom garage bar woodworking project with storage and counter space.",
    title: "Garage Bar",
    tags: ["garage bar", "bar", "custom woodworking", "storage"],
  },
  {
    id: "p47",
    slug: "inscription",
    category: "specialty-projects",
    src: "/images/projects/Inscription-LD.webp",
    alt: "Laser engraved handwriting inscription preserved in a custom memory box.",
    title: "Inscription",
    description:
      "Would you like to preserve a special memory? This handwriting script was taken from a greeting card, saved, and laser engraved in a memory box to preserve a most important moment in time.",
    materials: ["Wood", "Laser engraving"],
    year: "2022",
    dimensions: "24\" x 36\" x 1\"",
    tags: ["inscription", "laser engraving", "memory box", "keepsake", "custom gift"],
  },
  {
    id: "p12",
    slug: "live-edge-coffee-table",
    category: "tables",
    src: "/images/projects/Live-Edge-Coffee-Table.webp",
    alt: "Custom live edge coffee table showing the natural edge of the wood slab.",
    title: "Live Edge Coffee Table",
    tags: ["coffee table", "live edge", "wood slab", "custom furniture"],
  },
  {
    id: "p005",
    slug: "baptism-fonts",
    category: "commercial-projects",
    src: "/images/projects/Fonts.webp",
    alt: "Red oak baptism fonts built for a church supply client and prepared for final finishing.",
    title: "Baptism Fonts",
    description:
      "For a B2B client who sells just about everything a church could ask for. Constructed from red oak hardwood and plywood, these baptism fonts are delivered sanded and prepped for final finishing by the client. We follow the custom design given to us by the client, including all the specific angles, routing, and access doors.",
    materials: ["Red oak hardwood", "Red oak plywood"],
    tags: ["baptism font", "church furniture", "red oak", "b2b woodworking", "custom design"],
  },
  {
    id: "p14",
    slug: "puzzle-dining-table",
    category: "tables",
    src: "/images/projects/Puzzle-Dining-Table.webp",
    alt: "Custom dining table top with hidden puzzle table functionality.",
    title: "Puzzle Dining Table",
    description:
      "This custom dining table top was created to be multi-functional. Dinner first, hidden puzzle table after. Crafted to mimic the original top and custom stained to match the original table base.",
    tags: ["dining table", "puzzle table", "custom tabletop", "multi-functional furniture"],
  },
  {
    id: "p15",
    slug: "wine-table",
    category: "tables",
    src: "/images/projects/Wine-Table.webp",
    alt: "Custom wine table with bottle storage designed for a unique home space.",
    title: "Wine Table",
    description:
      "Designed and crafted to fit a unique space in the client's home, this custom wine table holds seven bottles of wine with plenty of storage.",
    tags: ["wine table", "wine storage", "custom table", "home storage"],
  },
  {
    id: "p16",
    slug: "stools",
    category: "specialty-projects",
    src: "/images/projects/Stools.webp",
    alt: "Small custom wooden stools for sitting while putting on or taking off shoes.",
    title: "Stools",
    description:
      "Ever wished you had a convenient place to sit down and put on or take off your shoes? These stools are the perfect size to make your space more functional. Would you rather have a bench? We can do that too.",
    tags: ["stools", "bench", "entryway seating", "custom seating", "functional furniture"],
  },

  // Cutting Boards — additional examples reusing existing Shop product photography
  // (see data/products.json). These are craftsmanship examples only: no price,
  // no purchase link. Update/replace if the client prefers different examples.
  {
    id: "cb-endgrain-walnut",
    slug: "large-end-grain-cutting-board",
    category: "cutting-boards",
    src: "/images/projects/Walnut-End-Grain-Cutting-Board.webp",
    alt: "Handmade walnut end-grain cutting board with chamfered edges.",
    title: "Large End-Grain Cutting Board",
    description:
      "Hand-built end-grain cutting board in walnut. End-grain construction rotates the wood so the blade cuts into the end of the grain, making the board structurally stronger and gentler on knife edges. Finished with food-grade mineral and finishing oils.",
    materials: ["Walnut"],
    tags: ["cutting board", "end grain", "walnut", "kitchen"],
  },
  {
    id: "cb-juice-groove",
    slug: "large-cutting-board-with-juice-groove",
    category: "cutting-boards",
    src: "/images/projects/Large-cutting-board-with-juice-groove.webp",
    alt: "Handmade hardwood cutting board with a built-in juice groove.",
    title: "Large Cutting Board with Juice Groove",
    description:
      "A handmade hardwood cutting board with a built-in juice groove to catch runoff when carving meats. Finished with food-grade mineral and finishing oils — no stains or dyes, just the natural color of the wood.",
    tags: ["cutting board", "juice groove", "kitchen"],
  },
  {
    id: "cb-round-handle",
    slug: "large-cutting-board-with-round-handle",
    category: "cutting-boards",
    src: "/images/projects/Cutting-board-with-circle-handle.webp",
    alt: "Handmade hardwood cutting board with a round carrying handle.",
    title: "Large Cutting Board with Round Handle",
    description:
      "A handmade hardwood cutting board with a rounded handle cut into one end for easy carrying. Finished with food-grade mineral and finishing oils.",
    tags: ["cutting board", "round handle", "kitchen"],
  },
];

/**
 * Convenience export for featured images (optional).
 */
export const FEATURED_GALLERY_IMAGES = GALLERY_IMAGES.filter((img) => img.featured);

/**
 * Category definitions in display order. This is the single place that maps
 * a category value to its customer-facing label — category pages, the
 * /gallery landing page's category navigation, and metadata all read from
 * this list rather than re-declaring the label elsewhere.
 */
export const CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: "tables", label: "Tables" },
  { value: "cabinets", label: "Cabinets" },
  { value: "specialty-projects", label: "Specialty Projects" },
  { value: "commercial-projects", label: "Commercial Projects" },
  { value: "cutting-boards", label: "Cutting Boards" },
];

export function isGalleryCategory(value: string): value is GalleryCategory {
  return CATEGORIES.some((c) => c.value === value);
}

export function getCategoryLabel(category: GalleryCategory): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function getGalleryItemsByCategory(category: GalleryCategory): GalleryImage[] {
  return GALLERY_IMAGES.filter((item) => item.category === category);
}

export function getGalleryItemBySlug(
  category: GalleryCategory,
  slug: string
): GalleryImage | undefined {
  return GALLERY_IMAGES.find((item) => item.category === category && item.slug === slug);
}

/**
 * Look up a gallery item by slug alone (category unknown), e.g. for
 * /contact?project=<slug>, where only the slug travels in the URL. Slugs are
 * unique across the whole catalog, so this is unambiguous. Returns undefined
 * for an unknown/stale slug — callers should fail gracefully, not error.
 */
export function findGalleryProjectBySlug(slug: string): GalleryImage | undefined {
  return GALLERY_IMAGES.find((item) => item.slug === slug);
}
