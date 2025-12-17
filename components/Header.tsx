"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      {/* Light mode logo */}
      <Image
        src="/brand/logo-black.png"
        alt="531 Workshop"
        width={56}
        height={56}
        className="block dark:hidden"
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/brand/logo-white.png"
        alt="531 Workshop"
        width={56}
        height={56}
        className="hidden dark:block"
        priority
      />
      <span className="text-sm font-semibold tracking-tight">
        531 Workshop
      </span>
    </Link>
  );
}

const NavItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
  >
    {children}
  </Link>
);

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
        >
          531 Workshop
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavItem href="/gallery1">Gallery 1</NavItem>
          <NavItem href="/gallery2">Gallery 2</NavItem>
          <NavItem href="/shop">Shop</NavItem>
          <NavItem href="/about">About</NavItem>
          <NavItem href="/contact">Contact</NavItem>
        </nav>

        {/* Mobile button */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="sm:hidden border-t border-border">
          <nav className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-1">
            <Link onClick={() => setOpen(false)} href="/gallery1" className="px-3 py-2 rounded-xl text-sm hover:bg-card/60">
              Gallery 1
            </Link>
            <Link onClick={() => setOpen(false)} href="/gallery2" className="px-3 py-2 rounded-xl text-sm hover:bg-card/60">
              Gallery 2
            </Link>
            <Link onClick={() => setOpen(false)} href="/shop" className="px-3 py-2 rounded-xl text-sm hover:bg-card/60">
              Shop
            </Link>
            <Link onClick={() => setOpen(false)} href="/about" className="px-3 py-2 rounded-xl text-sm hover:bg-card/60">
              About
            </Link>
            <Link onClick={() => setOpen(false)} href="/contact" className="px-3 py-2 rounded-xl text-sm hover:bg-card/60">
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
