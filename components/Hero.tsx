// /components/Hero.tsx
'use client';

import type { JSX } from 'react'; 
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export default function Hero(): JSX.Element {
  const reduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      data-testid="hero"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero.jpg"
          alt="Sparks flying from a forge, representing ideas being shaped into real tools."
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 md:from-black/65"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? false : 'show'}
        variants={variants}
        transition={reduceMotion ? undefined : { duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-5xl px-6 py-24 sm:py-28 md:py-32"
      >
        <div className="text-center md:text-left">
          <h1
            id="hero-title"
            className="text-text text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Forging Ideas Into Reality
          </h1>

          <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg md:mt-5">
            AI tools and digital products built in the forge.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:items-start">
            <Link
              href="/#newsletter"
              className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-black shadow-sm transition
                         hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="Get updates via the 3EF Studio newsletter"
            >
              Get Updates
            </Link>

            <Link
              href="/blog"
              className="text-muted-foreground transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-xl px-1 underline-offset-4 hover:underline"
              aria-label="Explore the blog"
            >
              Explore the Blog
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
