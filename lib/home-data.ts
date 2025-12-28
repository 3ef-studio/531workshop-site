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
    imageSrc: "/images/projects/Checkerboard-cutting-board.webp",
    href: "/shop/Shopify-test",
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
      "Dave is conscientious and offers very fair pricing on his custom projects. We have used him several times to fulfill our customers' dreams of projects they desire.",
    name: "Yankee Fist",
    location: "Lombard, IL",
  },
   {
    quote:
      "Dave was fantastic with my small cabinet design. He followed my dimensions to the letter and went above and beyond. WAY nicer than expected. Highly recommend.",
    name: "DaveP603",
    location: "Villa Park, IL",
  },
  {
    quote:
      "Did an excellent job for 2 different projects for our family.  One was a new custom fireplace mantle and the other was an outdoor furniture build.  Craftsmanship and quality was outstanding.",
    name: "Basil W.",
    location: "Villa Park, IL",
  },
  {
    quote:
      "Dave created a custom cutting board for an engagement present and had great communication throughout the process. The overall product looked well put together and included a laser inscription exactly how I had requested.",
    name: "Andrew X",
    location: "Elmhurst, IL",
  },
  {
    quote:
      "Dave does great work.  He can make custom items to fit your needs.  His work is of high quality and his fees are reasonable.   We are very happy with his products.",
    name: "Nick C",
    location: "Lombard, IL",
  },
];

export const TESTIMONIAL_META = {
  rating: 4.9,
  count: 18,
};