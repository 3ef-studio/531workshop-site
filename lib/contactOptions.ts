// lib/contactOptions.ts
//
// Shared option lists for the enhanced contact form's optional project
// fields. Used by the client form (to render selects), the API route (to
// validate incoming values), and the internal notification email (to turn a
// stored value back into a human label). Single source of truth so the
// client and server never disagree about what a valid value looks like.

import { CATEGORIES, type GalleryCategory } from "./gallery-data";

/**
 * "What are you interested in?" — reuses the existing Gallery categories
 * (so a Gallery-driven inquiry's category can preselect this directly, with
 * no separate mapping table) plus one catch-all that has no Gallery
 * equivalent.
 */
export type ProjectType = GalleryCategory | "other";

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  ...CATEGORIES.map((c) => ({ value: c.value as ProjectType, label: c.label })),
  { value: "other", label: "Other" },
];

export function isProjectType(value: string): value is ProjectType {
  return PROJECT_TYPE_OPTIONS.some((o) => o.value === value);
}

export function getProjectTypeLabel(value: string): string | undefined {
  return PROJECT_TYPE_OPTIONS.find((o) => o.value === value)?.label;
}

export type Timeframe = "flexible" | "1-3-months" | "3-6-months" | "exploring";

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "flexible", label: "No rush / flexible" },
  { value: "1-3-months", label: "Within 1–3 months" },
  { value: "3-6-months", label: "Within 3–6 months" },
  { value: "exploring", label: "Just exploring" },
];

export function isTimeframe(value: string): value is Timeframe {
  return TIMEFRAME_OPTIONS.some((o) => o.value === value);
}

export function getTimeframeLabel(value: string): string | undefined {
  return TIMEFRAME_OPTIONS.find((o) => o.value === value)?.label;
}

/** Free-text "approximate dimensions" field — generous but bounded. */
export const MAX_DIMENSIONS_LENGTH = 200;
