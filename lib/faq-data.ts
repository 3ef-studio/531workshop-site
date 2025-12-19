// src/lib/faq-data.ts

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Do you take custom orders?",
    answer:
      "Yes — most projects are custom. Share a rough idea, dimensions, wood preference, and timeline, and we’ll follow up with questions and a quote.",
  },
  {
    question: "What’s your typical lead time?",
    answer:
      "Lead times vary depending on project complexity and current workload. Once we review your request, we’ll provide an estimated timeline.",
  },
  {
    question: "What woods do you work with?",
    answer:
      "We commonly work with hardwoods such as oak, maple, walnut, and cherry, as well as select softwoods depending on the project and finish requirements.",
  },
  {
    question: "Can you match a specific style or reference photo?",
    answer:
      "Absolutely. Reference photos are very helpful. We’ll review them with you and suggest options that best match the look while staying within your budget.",
  },
  {
    question: "Do you deliver or ship finished pieces?",
    answer:
      "Local delivery may be available depending on size and location. Shipping can be arranged for smaller items. Logistics and costs are confirmed on a case-by-case basis.",
  },
  {
    question: "How do you price custom work?",
    answer:
      "Pricing is based on size, materials, complexity, and finish. Once the scope is clear, we’ll provide a straightforward quote before any work begins.",
  },
  {
    question: "Is a deposit required?",
    answer:
      "Most custom projects require a deposit to reserve time on the build schedule and cover materials. Deposit details are included with your quote.",
  },
  {
    question: "Do you offer installation services?",
    answer:
      "For certain projects, such as shelving or built-ins, installation may be available. Let us know what you’re planning and we’ll confirm what’s possible.",
  },
  {
    question: "What finish options are available?",
    answer:
      "We offer a range of finishes, from natural clear coats to stained options. We’ll recommend finishes based on durability, use, and overall appearance.",
  },
  {
    question: "How do I request a quote?",
    answer:
      "Use the contact form and include dimensions, reference photos, and any timing considerations. We’ll follow up with next steps and any additional questions.",
  },
];
