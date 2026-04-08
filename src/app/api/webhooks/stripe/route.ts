import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { contributions, wishItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { wishItemId, contributorName, contributorEmail, message, isAnonymous } =
      pi.metadata ?? {};

    if (!wishItemId) return NextResponse.json({ ok: true });

    // Update contribution status
    await db
      .update(contributions)
      .set({ status: "completed" })
      .where(eq(contributions.stripePaymentIntentId, pi.id));

    // Upsert contribution record if not exists
    const existing = await db.query.contributions.findFirst({
      where: eq(contributions.stripePaymentIntentId, pi.id),
    });

    if (!existing) {
      await db.insert(contributions).values({
        wishItemId,
        contributorName: contributorName ?? "Anónimo",
        contributorEmail: contributorEmail ?? "",
        amount: pi.amount,
        message: message ?? undefined,
        isAnonymous: isAnonymous === "true",
        stripePaymentIntentId: pi.id,
        status: "completed",
      });
    }

    // Increment collectedAmount on wish item
    await db
      .update(wishItems)
      .set({
        collectedAmount: sql`${wishItems.collectedAmount} + ${pi.amount}`,
      })
      .where(eq(wishItems.id, wishItemId));

    // Update status if fully funded
    const item = await db.query.wishItems.findFirst({
      where: eq(wishItems.id, wishItemId),
    });

    if (item && item.targetAmount && (item.collectedAmount ?? 0) >= item.targetAmount) {
      await db
        .update(wishItems)
        .set({ status: "funded" })
        .where(eq(wishItems.id, wishItemId));
    } else if (item && item.targetAmount && (item.collectedAmount ?? 0) > 0) {
      await db
        .update(wishItems)
        .set({ status: "partially_funded" })
        .where(eq(wishItems.id, wishItemId));
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await db
      .update(contributions)
      .set({ status: "failed" })
      .where(eq(contributions.stripePaymentIntentId, pi.id));
  }

  return NextResponse.json({ ok: true });
}
