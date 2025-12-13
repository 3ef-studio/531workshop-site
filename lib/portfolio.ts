// lib/portfolio.ts

export interface PortfolioImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface PortfolioSection {
  /** Anchor id for jump navigation, e.g. #veilmark */
  id: string;
  /** Display title for the section */
  title: string;
  /** Optional short tagline or subheading */
  tagline?: string;
  /** Short overview paragraph */
  summary: string;
  /** Key technologies / tools involved */
  techStack: string[];
  /** Bullet points describing design, implementation, or impact */
  details: string[];
  /** What you were trying to learn or prove with this project */
  learningFocus?: string[];
  /** Strategy, market positioning, or product-thinking notes */
  strategyNotes?: string[];
  /** Next steps you’re considering or have queued */
  nextSteps?: string[];
  /** Screenshots, diagrams, etc. */
  images?: PortfolioImage[];
}

export const portfolioSections: PortfolioSection[] = [
  {
    id: "veilmark",
    title: "VeilMark — AI Authorship Detection",
    tagline: "An indie AI toolchain for detecting AI-generated text and images.",
    summary:
      "VeilMark is an AI-authorship detection platform that combines locally hosted machine learning models with lightweight surfaces like a Discord bot, FastAPI service, and browser extension. It’s designed for community owners and builders who need a reliable signal on when content is likely AI-generated, without turning moderation into a black box.",
    techStack: [
        "Python",
        "PyTorch",
        "FastAPI",
        "Uvicorn",
        "PostgreSQL (Neon)",
        "Next.js",
        "TypeScript",
        "Discord Bot (discord.py)",
        "Browser Extension (Manifest v3)",
        "Render",
        "Docker",
        "GitHub Actions"
    ],
    details: [
        // Core detection engine
      "Built and trained text and image classifiers to distinguish human vs. AI-generated content, optimized for low-latency self-hosted inference.",
      "Designed a dual-model image pipeline that separates general AI art detection from deepfake / face-swap detection, routed via face-detection logic.",
      "Migrated from SQLite to PostgreSQL to support multi-guild growth, better logging, and more robust caching and configuration.",
      // Discord bot surface
      "Implemented a Discord bot with slash commands for ad-hoc checks, autoscan configuration, upgrade/downgrade of plans, and user feedback capture.",
      // FastAPI / HTTP API
      "Exposed the detection engine via a FastAPI service, allowing external tools and future clients to call the same models through a clean HTTP API.",
      // Browser extension
      "Built a companion browser extension that sends webpage content and images to the VeilMark API for classification, bringing detection into normal browsing workflows.",
      // Productization & ops
      "Deployed the stack to Render with environment-based configuration, health checks, and feature flags to control OpenAI fallbacks and beta-only features.",
    ],
    learningFocus: [
      "Designing an AI-powered product where users can understand and trust the signals rather than relying on opaque \"AI says so\" outputs.",
      "Balancing local model hosting costs, latency, and reliability in a small indie setting without over-engineering the infrastructure.",
      "Evolving from a single-surface prototype (Discord bot) to a shared core with multiple clients (bot, API, browser extension) on top.",

    ],
    strategyNotes: [
      "Positioned deliberately as a practical moderation and provenance aid for community owners, not a generic \"AI detector\" chasing hype.",
      "Optimized for self-hosted and low-cost deployments so small communities and indie builders can adopt it without enterprise budgets.",
      "Uses Discord, a browser extension, and a public landing page as both delivery channels and discovery surfaces for the product.",
    ],
    nextSteps: [
      "Beta Test with small communities to gather real-world feedback on detection accuracy, UX, and value.",
      "Automate data refresh, training, and evaluation pipelines so model iterations can keep up with new AI-generation techniques.",
      "Refine the onboarding and pricing experience to support a small but sustainable base of paid guilds and power users.",
    ],
    images: [
      {
        src: "/images/portfolio/VM-botresult.png",
        alt: "VeilMark Results  as displayed on Discord",
        caption: "VeilMark Discord Bot - Sample result for text analyzed by the VeilMark bot.",
      },
      {
        src: "/images/portfolio/VM-BE.png",
        alt: "VeilMark Browser Extension in Action",
        caption: "VeilMark Browser Extention - Checking the validity of an image.",
      },
    ],
  },
{
  id: "dde",
  title: "Domain Discovery Engine — Multi-Signal Brandable Domain Scoring",
  tagline: "A systematic pipeline for generating, enriching, and ranking brandable domain names.",
  summary:
    "The Domain Discovery Engine (DDE) is a multi-stage scoring pipeline that identifies high-quality brandable domains by combining availability checks, SEO signals, linguistic heuristics, and LLM-based evaluation. It provides a structured, repeatable workflow for identifying purchase candidates rather than relying on intuition or manual searching.",  
  techStack: [
      "Python",
      "Pandas",
      "NumPy",
      "OpenAI API",
      "GitHub Actions",
      "Bash / Shell Scripts",
      "CSV Data Pipelines",
      "Next.js (3EF website integration)",
      "Jupyter Notebooks",
      "PostgreSQL (Neon, planned)"
  ],
  details: [
    // Generation
    "Built a multi-step generation pipeline that creates large batches of candidate domains using curated stems, LLM-based expansions, and semantic filters.",
    "Implemented diversity filters and linguistic rules to ensure variation across stems, structures, TLDs, and naming patterns.",

    // Signal gathering (implemented today)
    "Added RDAP lookups to identify availability and registration metadata.",
    "Added DNS checks to determine whether domains resolve.",
    "Added HTTP probing to detect active, parked, or error states.",
    "Integrated Google Ads Keyword Planner signals using a cached export workflow.",

    // Scoring engine (current state)
    "Implemented a weighted scoring model that blends availability, SEO signals, linguistic heuristics, and LLM-based evaluations.",
    "Developed a top-20 ranking algorithm with availability bonuses and diversity enforcement.",
    "Generated structured markdown run summaries that include tiered signal counts, availability, and scoring metrics.",

    // Automation & Ops
    "Set up scheduled GitHub Actions to run DDE daily/weekly, produce run summaries, and persist run artifacts.",
    "Structured the pipeline to support future migration to Neon Postgres for long-term analytics and historical comparisons.",

    // Workflow integration
    "Integrated run outputs into internal workflows for evaluating and purchasing the best domains.",
  ],
  learningFocus: [
    "Balancing heuristic scoring with LLM-based semantic evaluation to create more robust, interpretable ranking functions.",
    "Designing a pipeline that blends availability, SEO, linguistic modeling, and real market comps without overfitting to any one signal.",
    "Automating discovery so new high-quality candidates emerge consistently without manual searching.",
  ],
  strategyNotes: [
    "Positions domain discovery as a disciplined workflow blending availability, heuristics, and market-aligned patterns.",
    "Designed to scale gradually as more signals (comps, traffic, keyword trends) are integrated over time.",
    "Supports a long-term approach to building a 25–50 name portfolio through weekly automated candidate refinement.",
  ],
  nextSteps: [
    "Add NameBio and other comps datasets to improve pricing and valuation signals.",
    "Add a public-facing top-20 DDE page on the 3EF website and automate weekly newsletter output.",
    "Prototype an automated pricing engine based on pattern matching and comparables.",
    "Finalize the move from CSV to Neon Postgres to store historical runs, long-tail candidates, and analytics.",
    "Introduce an automated grading agent that categorizes Strong Buys, Buys, and Scoring Misses using LLM reasoning.",
    "Build a small internal dashboard or lander for portfolio listings, traffic analytics, and pricing feedback loops.",
    "Expand comparisons to additional datasets such as ExpiredDomains and newly available drops.",
  ],
  images: [
    {
      src: "/images/portfolio/DDE-RunSum.png",
      alt: "Domain Discovery Engine scoring summary",
      caption: "Representative weekly run summary showing top-20 candidates, availability, and scoring metrics."
    }
  ]
  },
  {
    id: "csv-tools",
    title: "csvMend & Data Utilities — Pragmatic Data Cleanup Tools",
    tagline: "Small, focused tools for cleaning, deduplicating, and reshaping CSV data.",
    summary:
      "csvMend and related utilities are targeted tools for cleaning and transforming CSV files, aimed at analysts, indie hackers, and builders who need quick, repeatable scripts rather than full-blown data platforms.",
    techStack: [
      "Python",
      "Pandas",
      "CSV CLI Utilities",
      "Next.js (3EF website)",
      "Git",
      "VS Code"
    ],
    details: [
       // Core tools
      "Built a collection of Python/Pandas scripts that handle common cleanup tasks such as trimming whitespace, normalizing column names, dropping empty rows, and fixing basic type issues.",
      "Implemented flexible deduplication flows that can key on one or more columns, with options to keep first/last rows or aggregate duplicates.",
      "Created utilities to split, merge, and filter CSV files so that repeated manual spreadsheet work becomes a single command.",
      
      // Workflow & UX
      "Designed the tools to be runnable from the command line with simple, predictable arguments so they fit easily into ad hoc workflows.",
      "Documented common patterns (e.g., ‘clean + dedupe + export subset’) as reusable recipes that can be copied into new projects.",
      
      // Packaging & distribution
      "Packaged the most useful scripts into a small product bundle that can be shared outside the codebase, testing whether there is demand for paid micro-utilities.",
      "Integrated the tools into the 3EF website as part of the broader narrative around practical, indie-scale data tooling."
    ],
    learningFocus: [
      "Validating whether narrowly scoped, high-leverage utilities can provide enough value to support micro-product pricing.",
      "Exploring how to package raw scripts in a way that non-engineers can still adopt with minimal friction.",
      "Testing a repeatable pattern for future data-focused tools, from local scripts to potential hosted APIs."
    ],
    strategyNotes: [
      "Positions csvClean as a low-friction entry point into a broader set of data quality tools under the 3EF umbrella.",
      "Acts as a proving ground for distribution, onboarding, and pricing models for small, utility-style products.",
      "Provides a practical complement to heavier projects like VeilMark and DDE, emphasizing ‘useful today’ data plumbing."
    ],
    nextSteps: [
      "Wrap the most common cleanup flows in a lightweight HTTP API so they can be triggered from web apps and automation.",
      "Add a simple web front end on the 3EF site for uploading a CSV, running a cleanup recipe, and downloading the result.",
      "Introduce basic telemetry and error reporting to understand which workflows are used most often and where people get stuck.",
      "Expand documentation with concrete before/after examples that show how the tools reduce manual spreadsheet work."
    ],
    images: [
      {
        src: "/images/portfolio/csvMend-Features.png",
        alt: "csvMend CSV feature overview",
        caption: "csvMend CSV feature overview showing key options.",
      },
    ],
  },
  {
  id: "agentic-experiments",
  title: "Agentic Experiments — Multi-Agent Prototypes & Content Workflows",
  tagline:
    "A research track exploring how multi-step and agentic workflows can improve content creation, evaluation, and decision support.",
  summary:
    "Agentic Experiments is an ongoing R&D effort focused on testing multi-agent patterns, revision loops, and stateful workflows. The goal is to understand when agentic orchestration meaningfully improves output quality over single-prompt LLM calls, and how these patterns can support real 3EF products like PostStream, DDE scoring, and future decision-support tools.",
  techStack: [
    "Python",
    "TypeScript",
    "Next.js",
    "OpenAI API",
    "Custom Multi-Agent Loops",
    "Jupyter Notebooks",
    "VS Code"
  ],
  details: [
    // Core experiments
    "Prototyped multi-agent workflows (planner → writer → editor → revisor) to generate and refine content across X, Reddit, and LinkedIn.",
    "Designed evaluation loops where a second agent critiques or validates the output of the first agent, enabling structured revision.",
    "Explored lightweight graph-based sequences for state management, including explicit memory stores and iterative decision branches.",
    
    // Application-level prototypes
    "Tested agentic flows for DDE grading — categorizing Strong Buys, Buys, and Misses using LLM reasoning and justification layers.",
    "Built early PostStream cycles that turn rough ideas into channel-specific posts with consistent tone and formatting rules.",
    "Validated how agent-based approaches can support founder workflows: brainstorming, summarizing research, and producing long-form content.",
    
    // Learning cycles
    "Created sprint-based learning plans to iterate on core patterns like reflection, self-critique, evaluator agents, and tool calling.",
    "Captured findings on when agentic flows provide real lift vs. when they add unnecessary overhead compared to a single LLM call.",
    
    // Integration with 3EF products
    "Used agentic insights to refine detection prompts for VeilMark and improve DDE scoring explanations.",
  ],
  learningFocus: [
    "Determining when multi-agent workflows materially improve quality and reliability compared to single-prompt generation.",
    "Understanding the tradeoffs between graph-based state orchestration, explicit evaluator loops, and simpler sequential prompts.",
    "Testing whether repeatable patterns can be standardized into reusable modules for future indie products.",
  ],
  strategyNotes: [
    "Acts as a research sandbox that informs concrete product development — particularly PostStream and DDE scoring.",
    "Helps define a reusable agentic architecture that could become part of the 3EF internal toolkit.",
    "Supports long-term positioning of 3EF as an indie shop applying modern AI patterns to real workflows, not just demos.",
  ],
  nextSteps: [
    "Select and finalize one or two proven agent patterns to productionize for PostStream.",
    "Develop a small library of reusable agent nodes (planner, evaluator, editor) that can be plugged into different workflows.",
    "Experiment with persistence layers for agent memory using Neon or simple local embeddings.",
    "Document insights in a series of posts: agentic patterns that worked, patterns that didn’t, and guidelines for indie-scale usage.",
  ],
  images: [
   
  ]
}

];
