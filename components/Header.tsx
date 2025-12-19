"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      {/* Light mode logo */}
      <Image
        src="/brand/logo-black.png"
        alt="531 Workshop"
        width={72}
        height={72}
        className="block dark:hidden"
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/brand/logo-white.png"
        alt="531 Workshop"
        width={72}
        height={72}
        className="hidden dark:block"
        priority
      />
      <span className="text-lg font-semibold tracking-tight">531 Workshop</span>
    </Link>
  );
}

const NavItem = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className={[
      "px-3 py-2 rounded-xl text-md text-muted-foreground",
      "border border-transparent", // ensures no layout shift
      "hover:text-foreground hover:bg-card/60 hover:border-[hsl(var(--accent))]",
      "transition-colors transition-[border-color] duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
    ].join(" ")}
  >
    {children}
  </Link>
);

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // initialize on load
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu if resizing up to desktop (prevents “stuck open”)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled
          ? "border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70"
          : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <BrandLogo />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavItem href="/shop">Shop</NavItem>
          <NavItem href="/gallery2">Custom Gallery</NavItem>
          <NavItem href="/about">About</NavItem>
          <NavItem href="/contact">Contact</NavItem>
        </nav>

        {/* Mobile button */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm bg-background/60 backdrop-blur"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur">
          <nav className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-1">
             <Link
              onClick={() => setOpen(false)}
              href="/shop"
              className="px-3 py-2 rounded-xl text-sm hover:bg-card/60"
            >
              Shop
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/gallery2"
              className="px-3 py-2 rounded-xl text-sm hover:bg-card/60"
            >
              Custom Gallery
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/about"
              className="px-3 py-2 rounded-xl text-sm hover:bg-card/60"
            >
              About
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/contact"
              className="px-3 py-2 rounded-xl text-sm hover:bg-card/60"
            >
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
