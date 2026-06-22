// Default homepage content. These mirror the original hardcoded copy, so the
// live site is unchanged until an admin edits and saves in /dashboard/homepage.
// The web accessor and admin editor both merge DB values over these defaults.

export type HomepageContent = {
  hero: {
    badge: string;
    headlineLine1: string;
    headlineAccent: string;
    subhead: string;
    note: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  founder: { heading: string; body1: string; body2: string };
  deskSuite: { heading: string; subhead: string };
  howItWorks: { heading: string; subhead: string };
  agencyServices: { heading: string; subhead: string };
  testimonials: { heading: string; subhead: string };
  finalCta: { heading: string; subhead: string };
};

export const homepageDefaults: HomepageContent = {
  hero: {
    badge: "JK Technology Limited \u2014 Nigerian Software Company \u2014 CAC Registered",
    headlineLine1: "Vertical Software Built",
    headlineAccent: "for African Businesses.",
    subhead:
      "The Desk suite \u2014 industry-specific management systems for churches, schools, and auto detailing businesses. Self-service onboarding. Real-time deployment. Subscription billing.",
    note: "No developer needed. No IT consultant. Go live the same day.",
    primaryCta: { label: "Explore Desk Products", href: "/desk" },
    secondaryCta: { label: "Get Started Today", href: "/get-started" },
  },
  founder: {
    heading: "Built by a Nigerian founder,\nfor African businesses.",
    body1:
      "JK Technology Limited is a registered Nigerian software company, founded in 2019. We have been building digital systems for businesses since then. Desk is the product we always wanted to exist \u2014 vertical software that actually fits how African businesses operate. Not adapted from foreign tools. Built from scratch, in Nigeria, for Nigeria.",
    body2:
      "Every product has Paystack integrated, works with Nigerian phone numbers, and is priced in Naira. Our support team answers on WhatsApp. We understand your context because we live in it.",
  },
  deskSuite: {
    heading: "The Desk Suite",
    subhead: "Industry-specific software. Self-service onboarding. Live today.",
  },
  howItWorks: {
    heading: "Go live in under 10 minutes.",
    subhead: "Self-service. No developer. No waiting.",
  },
  agencyServices: {
    heading: "Agency Services",
    subhead:
      "Custom digital systems for businesses that need something specific \u2014 websites, SEO, CRM, AI chatbots, payment infrastructure, email automation. Not self-service. Scoped, built, and delivered by our team.",
  },
  testimonials: {
    heading: "What our clients say",
    subhead: "Real businesses, real results.",
  },
  finalCta: {
    heading: "Ready to get started?",
    subhead:
      "Pick a product and go live today. Or tell us what you need and we will build it for you.",
  },
};

// Deep-merge a partial stored doc over the defaults (one level into each section).
export function mergeHomepage(stored: unknown): HomepageContent {
  const base = homepageDefaults as unknown as Record<string, Record<string, unknown>>;
  const over = (stored && typeof stored === "object" ? stored : {}) as Record<string, Record<string, unknown>>;
  const out: Record<string, Record<string, unknown>> = {};
  for (const section of Object.keys(base)) {
    out[section] = { ...base[section], ...(over[section] || {}) };
  }
  return out as unknown as HomepageContent;
}
