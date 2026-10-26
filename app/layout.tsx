// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./theme-b.css"; // swap to theme-a.css to preview
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Shared default preview image for Open Graph / Twitter Card — pages that
// don't set their own (most don't yet) fall back to this rather than none at
// all. Twitter's card type below specifically requires an image to render.
const DEFAULT_SOCIAL_IMAGE = "/images/projects/Cutting-board-collage.webp";

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s — ${SITE.shortName}` },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    url: SITE.url,
    title: SITE.name,
    description: SITE.description,
    siteName: SITE.name,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    creator: "@3EF_Studio",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  // Canonical URLs are declared per route (see each page's `metadata` /
  // `generateMetadata`). A global canonical here would force every page to
  // canonicalize to "/".
};

// LocalBusiness structured data — name, contact, and service area only. No
// street address: the business deliberately doesn't publish one on the site
// (Contact page shows only a service area), so this doesn't either.
const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "531 Workshop",
  description: SITE.description,
  url: SITE.url,
  image: `${SITE.url}${DEFAULT_SOCIAL_IMAGE}`,
  telephone: "+1-630-638-5504",
  email: "531workshop@gmail.com",
  areaServed: "Chicagoland and surrounding areas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          // Static, trusted, build-time-only data — never includes user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  anonymize_ip: true
                });
              `}
            </Script>
          </>
        )}

      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Header />
        <main className="mx-auto max-w-6xl px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
