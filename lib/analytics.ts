// lib/analytics.ts

// Augment the Window type to include Plausible
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}
// ensure this file is treated as a module (required for global augmentation)
export {};

type PlausibleProps = Record<string, string | number | boolean>;

/**
 * Call Plausible event safely on the client.
 * Use only from client components.
 */
export function track(event: string, props?: PlausibleProps) {
  if (typeof window === "undefined") return;
  const fn = window.plausible;
  if (typeof fn !== "function") return;

  fn(event, props ? { props } : undefined);
}
