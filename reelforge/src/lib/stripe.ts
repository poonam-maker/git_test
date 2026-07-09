import Stripe from "stripe";
import type { PlanTier } from "@prisma/client";
import { PLANS } from "./plans";

// Stripe is optional in dev. If STRIPE_SECRET_KEY is unset, `getStripe()`
// returns null and checkout falls back to a mock "upgrade" so the whole app
// still runs end-to-end without a Stripe account.

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key, { apiVersion: "2024-10-28.acacia" });
  return cached;
}

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Resolve the Stripe price id configured for a plan tier. */
export function priceIdForTier(tier: PlanTier): string | null {
  const plan = PLANS[tier];
  if (!plan.stripePriceEnv) return null;
  return process.env[plan.stripePriceEnv] || null;
}

/** Reverse lookup: given a Stripe price id, which tier is it? */
export function tierForPriceId(priceId: string): PlanTier | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceEnv && process.env[plan.stripePriceEnv] === priceId) {
      return plan.tier;
    }
  }
  return null;
}
