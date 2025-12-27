import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-muted-foreground">
        <div className="grid gap-10 sm:grid-cols-12 sm:items-start">
          {/* Left: logo */}
          <div className="sm:col-span-4 flex justify-center sm:justify-start">
            <Image
              src="/brand/logo-black.png"
              alt="531 Workshop"
              width={140}
              height={140}
              className="dark:hidden"
            />
            <Image
              src="/brand/logo-white.png"
              alt="531 Workshop"
              width={140}
              height={140}
              className="hidden dark:block"
            />
          </div>

          {/* Right: text + links */}
          <div className="sm:col-span-8">
            <p className="max-w-prose text-center sm:text-left">
              Custom woodworking, built-ins, and furniture — designed and crafted
              with care. Based in the Chicagoland area.
            </p>

            {/* Page links */}
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-6">
              <Link href="/gallery2" className="hover:underline">
                Gallery
              </Link>
              <Link href="/about" className="hover:underline">
                About
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
              <Link href="/faq" className="hover:underline">
                FAQ
              </Link>
            </div>

            {/* Social icons */}
            <div className="mt-6 flex justify-center sm:justify-start gap-4">
              <a
                href="https://www.instagram.com/531workshop/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="531 Workshop on Instagram"
                className="hover:text-foreground transition"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/531workshop"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="531 Workshop on X"
                className="hover:text-foreground transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/531Workshop"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="531 Workshop on Facebook"
                className="hover:text-foreground transition"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>

            {/* Copyright + dev credit */}
            <div className="mt-6 text-xs text-center sm:text-left space-y-1">
              <div>
                © {new Date().getFullYear()} 531 Workshop. All rights reserved.
              </div>
              <div className="text-muted-foreground">
                Built by{" "}
                <a
                  href="https://3ef.studio/consulting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Three Eagles Forge Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
