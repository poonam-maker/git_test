"use client";

import { useState } from "react";
import { PricingTable } from "@/components/pricing-table";
import type { PlanTier } from "@prisma/client";

// Wraps the shared pricing table with checkout behavior. Selecting a tier hits
// /api/stripe/checkout, which either redirects to Stripe or (in dev) upgrades
// instantly and returns a URL back to settings.

export function BillingPanel({ currentTier }: { currentTier: PlanTier }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function select(tier: string) {
    setError(null);
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
      setLoading(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {loading && (
        <p className="mb-4 text-sm text-ink-400">Starting checkout…</p>
      )}
      <PricingTable currentTier={currentTier} onSelect={select} />
    </div>
  );
}
