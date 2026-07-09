import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, tierForPriceId } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Keeps workspace billing state in sync with Stripe. Configure the endpoint in
// the Stripe dashboard to point at /api/stripe/webhook and set
// STRIPE_WEBHOOK_SECRET.

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${String(err)}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const tier = session.metadata?.tier;
      if (workspaceId && tier) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            planTier: tier as any,
            stripeSubscriptionId: (session.subscription as string) ?? null,
            stripeCustomerId: (session.customer as string) ?? undefined,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier = priceId ? tierForPriceId(priceId) : null;
      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (workspace && tier) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            planTier: tier as any,
            stripeSubscriptionId: sub.id,
            planRenewsAt: new Date(sub.current_period_end * 1000),
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (workspace) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { planTier: "FREE", stripeSubscriptionId: null },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
