"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { HERO_SLIDES, HERO_ROTATION_INTERVAL_MS } from "@/lib/hero-data";

const FALLBACK_SRC = "/images/projects/Cutting-board-collage.webp";
const FALLBACK_ALT = "Custom woodworking project by 531 Workshop";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotionChange(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return typeof window === "undefined" ? false : window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function Hero() {
  const slides = HERO_SLIDES;
  const hasMultipleSlides = slides.length > 1;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // useSyncExternalStore renders `false` (matching SSR) until React re-syncs to
  // the real matchMedia value right after hydration — unlike a plain useMemo
  // read, this can't leave attributes derived from it (e.g. the pause/resume
  // control's disabled state) stuck on a stale, un-reconciled hydration value.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChange,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Auto-advance. Stops permanently once the visitor interacts (see stopAutoRotate),
  // and never runs at all if the visitor prefers reduced motion.
  useEffect(() => {
    if (!hasMultipleSlides || isPaused || prefersReducedMotion) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, HERO_ROTATION_INTERVAL_MS);

    return () => clearInterval(id);
  }, [hasMultipleSlides, isPaused, prefersReducedMotion, slides.length]);

  function stopAutoRotate() {
    setIsPaused(true);
  }

  function goTo(i: number) {
    stopAutoRotate();
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }

  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  }

  function toggleInfo() {
    // Opening/closing project details is not a rotation command, so it must not
    // affect auto-rotation either way.
    setShowInfo((v) => !v);
  }

  function togglePause() {
    setIsPaused((p) => !p);
  }

  const activeSlide = slides[index];

  return (
    <section className="mx-auto max-w-6xl px-0 sm:px-6 pt-0 sm:pt-4">
      {/* Full-bleed on mobile, card on desktop */}
      <div className="overflow-hidden sm:ui-card">
        <div
          className="relative w-full aspect-4/5 sm:aspect-16/7"
          role={hasMultipleSlides ? "region" : undefined}
          aria-label={hasMultipleSlides ? "531 Workshop project highlights" : undefined}
          aria-roledescription={hasMultipleSlides ? "carousel" : undefined}
          tabIndex={hasMultipleSlides ? 0 : undefined}
          onKeyDown={hasMultipleSlides ? onKeyDown : undefined}
        >
          {slides.length > 0 ? (
            slides.map((slide, i) => (
              <div
                key={slide.id}
                className="absolute inset-0"
                aria-hidden={i === index ? undefined : true}
                style={{
                  opacity: i === index ? 1 : 0,
                  transition: prefersReducedMotion ? "none" : "opacity 700ms ease",
                }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            ))
          ) : (
            // Defensive fallback: only renders if lib/hero-data.ts resolves to zero
            // valid slides (e.g. every configured id was misspelled).
            <Image
              src={FALLBACK_SRC}
              alt={FALLBACK_ALT}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          )}

          {/* Stronger overlay on mobile for legibility */}
          <div className="absolute inset-0 bg-black/35 sm:bg-black/25" />

          {/* Logo watermark (subtle) */}
          <div className="pointer-events-none absolute top-3 right-3 sm:top-6 sm:right-6">
            <div className="relative w-30 h-30 sm:w-45 sm:h-45 opacity-60">
              <Image
                src="/brand/logo-white.png"
                alt=""
                fill
                aria-hidden="true"
                className="object-contain"
                sizes="180px"
              />
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-4 sm:p-6 pb-10 sm:pb-14">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Crafted for you and your home.
                </h1>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  Custom built, designed to last a lifetime.
                </p>

                {/* CTAs: compact and side-by-side by default; wrap to a second row
                    (still natural-width, never mid-word) if they don't both fit. */}
                <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
                  <Link
                    href="/gallery2"
                    className="whitespace-nowrap rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:opacity-90 sm:px-5 sm:py-3"
                  >
                    View Our Work
                  </Link>

                  <Link
                    href="/contact"
                    className="whitespace-nowrap rounded-2xl border border-white/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:px-5 sm:py-3"
                  >
                    Start a Custom Project
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Rotation controls — only rendered when there's something to rotate through */}
          {hasMultipleSlides ? (
            <>
              {/* Project info/details: desktop only (hidden on mobile per design). */}
              <button
                type="button"
                onClick={toggleInfo}
                aria-expanded={showInfo}
                aria-controls="hero-slide-info"
                aria-label={
                  showInfo
                    ? "Hide project details"
                    : `Show project details${activeSlide?.title ? ` for ${activeSlide.title}` : ""}`
                }
                className="absolute left-3 top-3 hidden h-7 w-7 items-center justify-center rounded-full bg-black/30 text-xs font-semibold text-white transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:flex"
              >
                i
              </button>

              {showInfo && activeSlide ? (
                <div
                  id="hero-slide-info"
                  className="absolute left-3 top-12 hidden max-w-xs rounded-xl bg-black/60 p-3 text-white backdrop-blur-sm sm:block"
                >
                  {activeSlide.title ? (
                    <div className="text-sm font-semibold">{activeSlide.title}</div>
                  ) : null}
                  {activeSlide.description ? (
                    <p className="mt-1 text-xs leading-5 text-white/85">
                      {activeSlide.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Prev / dots / next / pause, overlaid on the photo — desktop only.
                  On mobile this same cluster renders below the image instead
                  (see the block right after this image container closes). */}
              <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-3 sm:flex">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous project photo"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">‹</span>
                </button>

                <div className="flex items-center gap-2">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Show project photo ${i + 1}${slide.title ? `: ${slide.title}` : ""}`}
                      aria-current={i === index ? "true" : undefined}
                      className={`h-2 w-2 rounded-full transition ${
                        i === index ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={next}
                  aria-label="Next project photo"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">›</span>
                </button>

                <button
                  type="button"
                  onClick={togglePause}
                  disabled={prefersReducedMotion}
                  aria-label={
                    prefersReducedMotion
                      ? "Automatic rotation is off because your device prefers reduced motion"
                      : isPaused
                      ? "Resume automatic rotation"
                      : "Pause automatic rotation"
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:hover:bg-black/30"
                >
                  <span aria-hidden="true">
                    {!prefersReducedMotion && isPaused ? "►" : "❚❚"}
                  </span>
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Prev / dots / next / pause again, mobile only — plain page background
            instead of overlaying the photo. Same handlers/state as the desktop
            overlay cluster above; only placement and colors differ. */}
        {hasMultipleSlides ? (
          <div className="flex items-center justify-center gap-3 py-3 sm:hidden">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous project photo"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div className="flex items-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show project photo ${i + 1}${slide.title ? `: ${slide.title}` : ""}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-2 w-2 rounded-full transition ${
                    i === index ? "bg-foreground" : "bg-foreground/30"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next project photo"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              onClick={togglePause}
              disabled={prefersReducedMotion}
              aria-label={
                prefersReducedMotion
                  ? "Automatic rotation is off because your device prefers reduced motion"
                  : isPaused
                  ? "Resume automatic rotation"
                  : "Pause automatic rotation"
              }
              className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground disabled:opacity-50 disabled:hover:bg-foreground/10"
            >
              <span aria-hidden="true">
                {!prefersReducedMotion && isPaused ? "►" : "❚❚"}
              </span>
            </button>
          </div>
        ) : null}

        {/* Caption bar only on desktop to keep mobile tight */}
        <div className="hidden sm:block px-8 py-2 text-sm text-muted-foreground">
          High quality boards, finished with care.
        </div>
      </div>
    </section>
  );
}
