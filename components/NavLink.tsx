// components/NavLink.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "px-3 py-2 rounded-xl transition-colors",
        isActive
          ? "bg-card text-white"
          : "text-muted-foreground hover:text-white hover:bg-card/60"
      )}
    >
      {children}
    </Link>
  );
}
