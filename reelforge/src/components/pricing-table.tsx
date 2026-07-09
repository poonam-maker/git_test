"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FEATURE_LABELS,
  PLANS,
  PRICING_ORDER,
  type PlanFeature,
} from "@/lib/plans";

// Reusable pricing UI. On the public page each CTA links to signup with the
// chosen tier; inside the app you can pass `onSelect` to trigger Stripe checkout.

export function PricingTable({
  currentTier,
  onSelect,
  ctaHref = "/signup",
}: {
  currentTier?: string;
  onSelect?: (tier: string) => void;
  ctaHref?: string;
}) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !annual && "text-white font-semibold")}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setAnnual((a) => !a)}
          className={cn(
            "relative h-6 w-11 rounded-full transition",
            annual ? "bg-brand-600" : "bg-ink-600"
          )}
          aria-label="Toggle annual billing"
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
              annual ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
        <span className={cn("text-sm", annual && "text-white font-semibold")}>
          Annual <span className="text-brand-400">(2 months free)</span>
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PRICING_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const monthly = annual
            ? Math.round((plan.priceMonthly * 10) / 12)
            : plan.priceMonthly;
          const isCurrent = currentTier === tier;
          return (
            <div
              key={tier}
              className={cn(
                "card flex flex-col",
                plan.featured && "border-brand-500/60 ring-1 ring-brand-500/40"
              )}
            >
              {plan.featured && (
                <span className="badge mb-2 w-fit bg-brand-500/20 text-brand-300">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-400">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">
                  ${monthly}
                </span>
                <span className="text-sm text-ink-400">/mo</span>
              </div>
              {annual && (
                <p className="mt-1 text-xs text-ink-400">
                  billed ${plan.priceMonthly * 10}/yr
                </p>
              )}

              <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-200">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-brand-400">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {onSelect ? (
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onSelect(tier)}
                  className={cn(
                    "mt-6",
                    plan.featured ? "btn-primary" : "btn-secondary"
                  )}
                >
                  {isCurrent ? "Current plan" : plan.ctaLabel}
                </button>
              ) : (
                <Link
                  href={`${ctaHref}?plan=${tier}`}
                  className={cn(
                    "mt-6 text-center",
                    plan.featured ? "btn-primary" : "btn-secondary"
                  )}
                >
                  {plan.ctaLabel}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <FeatureComparison />
    </div>
  );
}

function FeatureComparison() {
  const features = Object.keys(FEATURE_LABELS) as PlanFeature[];
  return (
    <div className="mt-14 overflow-x-auto">
      <h3 className="mb-4 text-center text-lg font-bold text-white">
        Compare features
      </h3>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="py-3 pr-4 font-medium text-ink-400">Feature</th>
            {PRICING_ORDER.map((tier) => (
              <th key={tier} className="px-3 py-3 text-center font-semibold text-white">
                {PLANS[tier].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f} className="border-b border-white/5">
              <td className="py-3 pr-4 text-ink-200">{FEATURE_LABELS[f]}</td>
              {PRICING_ORDER.map((tier) => (
                <td key={tier} className="px-3 py-3 text-center">
                  {PLANS[tier].features.includes(f) ? (
                    <span className="text-brand-400">✓</span>
                  ) : (
                    <span className="text-ink-600">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
