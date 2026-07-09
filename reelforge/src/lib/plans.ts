import type { PlanTier } from "@prisma/client";

// Single source of truth for pricing, limits, and feature gating.
// The pricing page, plan-limit checks, and Stripe checkout all read from here.

export type PlanFeature =
  | "brand_kits"
  | "team_workspaces"
  | "bulk_export"
  | "repurposing_automation"
  | "scheduling_bundles"
  | "reusable_templates"
  | "multi_video_workflows"
  | "remove_watermark";

export interface Plan {
  tier: PlanTier;
  name: string;
  tagline: string;
  /** Monthly price in USD. 0 = free. */
  priceMonthly: number;
  /** env var that holds the Stripe price id, if paid. */
  stripePriceEnv?: string;
  limits: {
    projectsPerMonth: number; // -1 = unlimited
    exportsPerMonth: number; // -1 = unlimited
    seats: number;
    brandKits: number;
    maxUploadMinutes: number;
  };
  features: PlanFeature[];
  highlights: string[];
  ctaLabel: string;
  featured?: boolean;
}

export const PLANS: Record<PlanTier, Plan> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    tagline: "Try the full workflow.",
    priceMonthly: 0,
    limits: {
      projectsPerMonth: 2,
      exportsPerMonth: 5,
      seats: 1,
      brandKits: 1,
      maxUploadMinutes: 15,
    },
    features: ["reusable_templates"],
    highlights: [
      "2 projects / month",
      "5 exports / month",
      "Auto captions & clip detection",
      "ReelForge watermark on exports",
    ],
    ctaLabel: "Start free",
  },
  SOLO: {
    tier: "SOLO",
    name: "Solo Creator",
    tagline: "For creators posting consistently.",
    priceMonthly: 19,
    stripePriceEnv: "STRIPE_PRICE_SOLO",
    limits: {
      projectsPerMonth: 15,
      exportsPerMonth: 60,
      seats: 1,
      brandKits: 1,
      maxUploadMinutes: 60,
    },
    features: ["brand_kits", "reusable_templates", "remove_watermark"],
    highlights: [
      "15 projects / month",
      "60 exports / month",
      "1 brand kit",
      "No watermark",
      "All social export formats",
    ],
    ctaLabel: "Choose Solo",
  },
  CREATOR_PRO: {
    tier: "CREATOR_PRO",
    name: "Creator Pro",
    tagline: "Turn one upload into a week of content.",
    priceMonthly: 39,
    stripePriceEnv: "STRIPE_PRICE_CREATOR_PRO",
    featured: true,
    limits: {
      projectsPerMonth: 50,
      exportsPerMonth: 300,
      seats: 2,
      brandKits: 3,
      maxUploadMinutes: 120,
    },
    features: [
      "brand_kits",
      "reusable_templates",
      "remove_watermark",
      "bulk_export",
      "repurposing_automation",
      "multi_video_workflows",
    ],
    highlights: [
      "50 projects / month",
      "300 exports / month",
      "3 brand kits",
      "Bulk export bundles",
      "Repurposing automation",
    ],
    ctaLabel: "Choose Pro",
  },
  SMALL_BUSINESS: {
    tier: "SMALL_BUSINESS",
    name: "Small Business",
    tagline: "Keep your brand consistent across a team.",
    priceMonthly: 89,
    stripePriceEnv: "STRIPE_PRICE_SMALL_BUSINESS",
    limits: {
      projectsPerMonth: 150,
      exportsPerMonth: 1000,
      seats: 5,
      brandKits: 10,
      maxUploadMinutes: 240,
    },
    features: [
      "brand_kits",
      "team_workspaces",
      "reusable_templates",
      "remove_watermark",
      "bulk_export",
      "repurposing_automation",
      "scheduling_bundles",
      "multi_video_workflows",
    ],
    highlights: [
      "150 projects / month",
      "5 team seats",
      "10 brand kits",
      "Team workspace",
      "Scheduling & export bundles",
    ],
    ctaLabel: "Choose Business",
  },
  AGENCY: {
    tier: "AGENCY",
    name: "Agency",
    tagline: "Manage many brands at scale.",
    priceMonthly: 249,
    stripePriceEnv: "STRIPE_PRICE_AGENCY",
    limits: {
      projectsPerMonth: -1,
      exportsPerMonth: -1,
      seats: 20,
      brandKits: 50,
      maxUploadMinutes: 480,
    },
    features: [
      "brand_kits",
      "team_workspaces",
      "reusable_templates",
      "remove_watermark",
      "bulk_export",
      "repurposing_automation",
      "scheduling_bundles",
      "multi_video_workflows",
    ],
    highlights: [
      "Unlimited projects & exports",
      "20 seats",
      "50 brand kits",
      "Multi-brand management",
      "Priority processing",
    ],
    ctaLabel: "Choose Agency",
  },
};

export const PAID_TIERS: PlanTier[] = [
  "SOLO",
  "CREATOR_PRO",
  "SMALL_BUSINESS",
  "AGENCY",
];

export const PRICING_ORDER: PlanTier[] = [
  "SOLO",
  "CREATOR_PRO",
  "SMALL_BUSINESS",
  "AGENCY",
];

export function getPlan(tier: PlanTier): Plan {
  return PLANS[tier];
}

export function planHasFeature(tier: PlanTier, feature: PlanFeature): boolean {
  return PLANS[tier].features.includes(feature);
}

/** All features, in display order, for the comparison table. */
export const FEATURE_LABELS: Record<PlanFeature, string> = {
  reusable_templates: "Reusable templates",
  brand_kits: "Brand kits",
  remove_watermark: "No watermark",
  bulk_export: "Bulk export bundles",
  repurposing_automation: "Repurposing automation",
  multi_video_workflows: "Multi-video workflows",
  team_workspaces: "Team workspaces",
  scheduling_bundles: "Scheduling & export bundles",
};
