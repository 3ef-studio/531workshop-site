"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  location?: string;
};

export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  const count = items.length;

  // 1 on mobile, 2 on md+
  useEffect(() => {
    const calc = () => (window.innerWidth >= 768 ? 2 : 1);
    const apply = () => setSlidesPerView(calc());

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  // Clamp index so we don't scroll into empty space on 2-up
  const maxIndex = Math.max(0, count - slidesPerView);
  const clampIndex = (i: number) => Math.max(0, Math.min(maxIndex, i));
  const goTo = (i: number) => setIndex(clampIndex(i));
  const prev = () => setIndex((i) => clampIndex(i - 1));
  const next = () => setIndex((i) => clampIndex(i + 1));

  // If slidesPerView changes (resize), re-clamp current index
  useEffect(() => {
    setIndex((i) => clampIndex(i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesPerView, count]);

  // Swipe handling
  const startX = useRef(0);
  const deltaX = useRef(0);
  const isDown = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    isDown.current = true;
    startX.current = e.clientX;
    deltaX.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown.current) return;
    deltaX.current = e.clientX - startX.current;
  };

  const onPointerUp = () => {
    if (!isDown.current) return;
    isDown.current = false;

    const threshold = Math.min(80, window.innerWidth * 0.08);
    if (deltaX.current > threshold) prev();
    else if (deltaX.current < -threshold) next();

    deltaX.current = 0;
  };

  // Keyboard support when focused
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  // Layout math
  const step = 100 / slidesPerView; // how far to move per index
  const pageCount = maxIndex + 1;   // dots represent valid index positions

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-xl"
        role="region"
        aria-label="Testimonials"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * step}%)`,
            transition: prefersReducedMotion ? "none" : "transform 300ms ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {items.map((t, i) => (
            <div
              key={i}
              className="shrink-0 p-4"
              style={{ width: `${100 / slidesPerView}%` }}
            >
              <div className="ui-card p-6 h-full">
                <p className="text-sm leading-6">“{t.quote}”</p>
                <div className="mt-4 text-sm font-medium">
                  {t.name}
                  {t.location ? (
                    <span
                      className="font-normal"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {" "}
                      • {t.location}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="ui-btn ui-btn-secondary px-3 py-2 disabled:opacity-50"
          onClick={prev}
          disabled={index <= 0}
          aria-label="Previous testimonials"
        >
          ←
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "bg-foreground" : "bg-foreground/30"
                }`}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonials set ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>

          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {index + 1} / {pageCount}
          </span>
        </div>

        <button
          type="button"
          className="ui-btn ui-btn-secondary px-3 py-2 disabled:opacity-50"
          onClick={next}
          disabled={index >= maxIndex}
          aria-label="Next testimonials"
        >
          →
        </button>
      </div>
    </div>
  );
}
