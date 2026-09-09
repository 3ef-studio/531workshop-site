// lib/hero-data.ts
//
// Configuration for the homepage hero's rotating background image.
// Slides are resolved from the existing GALLERY_IMAGES data (by id) so titles and
// descriptions are reused rather than duplicated here.

import { GALLERY_IMAGES } from "./gallery-data";

/**
 * How long each hero image stays on screen before auto-advancing, in milliseconds.
 * This is the single place to change the rotation speed.
 */
export const HERO_ROTATION_INTERVAL_MS = 15_000;

/**
 * Which project photos appear in the hero, and in what order. Reorder, add, or
 * remove entries here — each id must match an `id` in `lib/gallery-data.ts`.
 */
export const HERO_SLIDE_IDS: string[] = [
  "p12", // Live Edge Coffee Table
  "p14", // Puzzle Dining Table
  "p07", // Epoxy River Coffee Table - Sycamore
  "p31", // Keepsake Boxes
];

export type HeroSlide = {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
};

function resolveHeroSlides(): HeroSlide[] {
  const slides: HeroSlide[] = [];

  for (const id of HERO_SLIDE_IDS) {
    const item = GALLERY_IMAGES.find((image) => image.id === id);

    if (!item) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `lib/hero-data.ts: HERO_SLIDE_IDS references "${id}", which is not in GALLERY_IMAGES. Skipping.`
        );
      }
      continue;
    }

    slides.push({
      id: item.id,
      src: item.src,
      alt: item.alt,
      title: item.title,
      description: item.description,
    });
  }

  return slides;
}

export const HERO_SLIDES: HeroSlide[] = resolveHeroSlides();
