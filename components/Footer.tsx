import Image from "next/image";
import Link from "next/link";

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
              with care.
            </p>

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
            </div>

            <div className="mt-6 text-xs text-center sm:text-left">
              © {new Date().getFullYear()} 531 Workshop. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
