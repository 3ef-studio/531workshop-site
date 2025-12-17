// lib/home-data.ts

export type ValueProp = {
  title: string;
  description: string;
};

export type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  imageSrc: string; // under /public
  href: string;
  tag?: string; // e.g. "Featured"
};

export type Testimonial = {
  quote: string;
  name: string;
  location?: string;
};

export const VALUE_PROPS: ValueProp[] = [
  {
    title: "Craftsmanship first",
    description:
      "Clean, durable builds with attention to the details that matter—fit, finish, and longevity.",
  },
  {
    title: "Designed for your space",
    description:
      "Custom furniture, shelving, and built-ins that feel intentional and look at home.",
  },
  {
    title: "Straightforward process",
    description:
      "Clear communication from first conversation through delivery—no surprises.",
  },
];

export const FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: "feat-1",
    title: "Checkerboard Cutting Board",
    description: "A beautiful checkerboard pattern with a durable finish.",
    imageSrc: "/images/projects/Checkerboard-Cutting-Board.webp",
    href: "/gallery1",
    tag: "Featured",
  },
  {
    id: "feat-2",
    title: "Live Edge Coffee Table",
    description: "Natural edge detail with a durable topcoat.",
    imageSrc: "/images/projects/Live-Edge-Coffee-Table.webp",
    href: "/gallery2",
    tag: "New",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The piece fits the space perfectly—beautiful craftsmanship and a smooth process from start to finish.",
    name: "Paul G.",
    location: "Lombard, IL",
  },
  {
    quote:
      "Amazing craftsmanship and attention to detail. Couldn't be happier with the result!",
    name: "Basil W.",
    location: "Villa Park, IL",
  },
  {
    quote:
      "Great communication, great work, and the final result exceeded expectations.",
    name: "Rich C.",
    location: "Villa Park, IL",
  },
];

export const TESTIMONIAL_META = {
  rating: 4.9,
  count: 18,
};