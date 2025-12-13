// components/ClientEvent.tsx
"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires an analytics event when this component mounts.
 * Usage: <ClientEvent name="consulting_view" props={{ src: "hero" }} />
 */
export default function ClientEvent({
  name,
  props,
}: {
  name: string;
  props?: Record<string, string | number | boolean>;
}) {
  useEffect(() => {
    // Try Plausible first, then fallback to your generic track helper
    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      window.plausible(name, props ? { props } : undefined);
    } else {
      track(name, props);
    }
  }, [name, props]);

  return null;
}
