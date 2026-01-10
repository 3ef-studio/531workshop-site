// lib/gallery-data.ts

export type GalleryImage = {
  id: string;

  /**
   * Path under /public (e.g., "/images/projects/dining-table-01.webp")
   */
  src: string;

  /**
   * Accessible alt text (keep it descriptive: "Walnut dining table with ...")
   */
  alt: string;

  /**
   * Optional display title/caption used in cards.
   */
  title?: string;

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
   * Optional grouping for future filtering (not used in Sprint 3).
   * e.g., ["table", "bench", "shelf", "cabinet"]
   */
  tags?: string[];
};

/**
 * TODO: Update these entries with real filenames, alt text, and any details.
 * Keep `src` paths under /public so they work with next/image.
 */
export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "p02",
    src: "/images/projects/Barnwood-Beam-Console-table.webp",
    alt: "Barnwood Beam Console Table",
    title: "Barnwood Beam Console Table",
  },
  {
    id: "p03",
    src: "/images/projects/Bedroom-remodel.webp",
    alt: "Bedroom Remodel",
    title: "Bedroom Remodel",
  },
  {
    id: "p04",
    src: "/images/projects/Bookshelf-unit.webp",
    alt: "Bookshelf Unit",
    title: "Bookshelf Unit",
  },
  {
    id: "p06",
    src: "/images/projects/Checkerboard-cutting-board.webp",
    alt: "Checkerboard cutting board",
    title: "Checkerboard Cutting Board",
  },
  {
    id: "p07",
    src: "/images/projects/Epoxy-River-Coffee-Table-Sycamore.webp",
    alt: "Epoxy River Coffee Table Sycamore",
    title: "Epoxy River Coffee Table Sycamore",
    materials: ["Sycamore", "Epoxy"],
    year: "2021",
    dimensions: "48\" x 24\" x 18\"",
  },
  {
    id: "p08",
    src: "/images/projects/Epoxy-River-Coffee-Table-Walnut.webp",
    alt: "Epoxy River Coffee Table Walnut",
    title: "Epoxy River Coffee Table Walnut",
  },
  {
    id: "p09",
    src: "/images/projects/Fireplace-TV-Stand.webp",
    alt: "Fireplace and TV Stand",
    title: "Fireplace and TV Stand",
  },
  {
    id: "p10",
    src: "/images/projects/Front-Room-Coat-Storage.webp",
    alt: "Front Room Coat Storage",
    title: "Front Room Coat Storage",
  },
  {
    id: "p11",
    src: "/images/projects/Garage-Bar.webp",
    alt: "Garage Bar",
    title: "Garage Bar",
  },
  {
    id: "p12",
    src: "/images/projects/Live-Edge-Coffee-Table.webp",
    alt: "Live Edge Coffee Table",
    title: "Live Edge Coffee Table",
  },
  {
    id: "p13",
    src: "/images/projects/Living-Room-Cabinet.webp",
    alt: "Living Room Cabinet",
    title: "Living Room Cabinet",
  },
  {
    id: "p14",
    src: "/images/projects/Puzzle-Dining-Table.webp",
    alt: "Puzzle Dining Table",
    title: "Puzzle Dining Table",
  },
  {
    id: "p15",
    src: "/images/projects/Wine-Table.webp",
    alt: "Wine Table",
    title: "Wine Table",
  },
  {
    id: "p16",
    src: "/images/projects/Stools.webp",
    alt: "Stools",
    title: "Stools",
  },
];

/**
 * Convenience export for featured images (optional).
 */
export const FEATURED_GALLERY_IMAGES = GALLERY_IMAGES.filter((img) => img.featured);
