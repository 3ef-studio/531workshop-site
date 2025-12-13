// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: { type: "website", url: SITE.url, title: SITE.name, description: SITE.description, siteName: SITE.name },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description, creator: "@3EF_Studio" },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Project-specific Plausible script (uses your site ID; no data-domain needed) */}
        <Script src="https://plausible.io/js/pa-g6qES0IdXJQN8_5hlCfQc.js" defer />

        {/* Init snippet must be inline – use next/script */}
        <Script id="plausible-init" strategy="afterInteractive">
          {`
            window.plausible = window.plausible || function(){ (plausible.q = plausible.q || []).push(arguments) };
            plausible.init = plausible.init || function(opts){ plausible.o = opts || {} };
            plausible.init();
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Header />
        <main className="mx-auto max-w-6xl px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
