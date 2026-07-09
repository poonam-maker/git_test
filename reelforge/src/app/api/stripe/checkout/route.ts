import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { getStripe, priceIdForTier } from "@/lib/stripe";
import { PAID_TIERS } from "@/lib/plans";
import type { PlanTier } from "@prisma/client";

// Starts a Stripe Checkout session for the chosen tier. If Stripe is not
// configured (dev), it "upgrades" the workspace immediately so the whole
// billing-gated UX is testable without a Stripe account.

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier } = (await req.json().catch(() => ({}))) as { tier?: PlanTier };
  if (!tier || !PAID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // --- Dev / no-Stripe fallback ---
  if (!stripe) {
    await prisma.workspace.update({
      where: { id: ctx.workspace.id },
      data: {
        planTier: tier,
        planRenewsAt: new Date(Date.now() + 30 * 864e5),
      },
    });
    return NextResponse.json({ url: `${appUrl}/settings?upgraded=1` });
  }

  const priceId = priceIdForTier(tier);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${tier}` },
      { status: 400 }
    );
  }

  // Ensure a Stripe customer exists for this workspace.
  let customerId = ctx.workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.user.email,
      metadata: { workspaceId: ctx.workspace.id },
    });
    customerId = customer.id;
    await prisma.workspace.update({
      where: { id: ctx.workspace.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/settings`,
    metadata: { workspaceId: ctx.workspace.id, tier },
    subscription_data: {
      metadata: { workspaceId: ctx.workspace.id, tier },
    },
  });

  return NextResponse.json({ url: session.url });
}
