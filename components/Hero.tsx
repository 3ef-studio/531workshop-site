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
                <p className="text-xs tracking-wide uppercase text-white/80">
                  Hardwood Cutting Boards
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Crafted for you and your home.
                </h1>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  Handmade, food safe finishes - elevate your kitchen.
                </p>

                {/* CTAs: stack on mobile so both are visible */}
                <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                  <Link
                    href="/gallery2"
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-medium bg-white text-black hover:opacity-90 transition text-center"
                  >
                    View Our Work
                  </Link>

                  <Link
                    href="/contact"
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-medium border border-white/70 text-white hover:bg-white/10 transition text-center"
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
                className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-xs font-semibold text-white transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:left-3 sm:top-3"
              >
                i
              </button>

              {showInfo && activeSlide ? (
                <div
                  id="hero-slide-info"
                  className="absolute left-2 top-11 max-w-[80%] rounded-xl bg-black/60 p-3 text-white backdrop-blur-sm sm:left-3 sm:top-12 sm:max-w-xs"
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

              {/* Prev / dots / next grouped in one bottom-center cluster, below the
                  headline+CTA block so it never overlaps hero text on any breakpoint. */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:bottom-3">
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

        {/* Caption bar only on desktop to keep mobile tight */}
        <div className="hidden sm:block px-8 py-2 text-sm text-muted-foreground">
          High quality boards, finished with care.
        </div>
      </div>
    </section>
  );
}
