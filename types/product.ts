export type ProductTier = {
  name: string;
  price_month?: number;
  rate_limit?: string;
  url?: string;
};

export type ProductPricing =
  | { provider: "rapidapi"; tiers?: ProductTier[] }
  | { provider: "external" | "direct"; tiers?: ProductTier[] }
  | undefined;

export type Product = {
  slug: string;
  title: string;
  summary: string;
  status: "available" | "coming-soon";
  price_display?: string;
  badges?: string[];
  cta_primary?: { label: string; url: string };
  pricing?: ProductPricing;
  features?: string[]; // optional
};
