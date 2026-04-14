import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { contributions, giftItems } from "@/db/schema";
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
    const { wishItemId: giftItemId, contributorName, message, isAnonymous, giftListId } =
      pi.metadata ?? {};

    if (!giftItemId || !giftListId) return NextResponse.json({ ok: true });

    // Upsert contribution record
    const existing = await db.query.contributions.findFirst({
      where: eq(contributions.stripePaymentIntentId, pi.id),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(contributions).values({
        giftListId,
        giftItemId,
        contributorName: contributorName ?? "Anónimo",
        amount: pi.amount,
        message: message ?? undefined,
        isAnonymous: isAnonymous === "true",
        stripePaymentIntentId: pi.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      });
    } else {
      await db.update(contributions).set({ paymentStatus: "paid", paidAt: new Date() })
        .where(eq(contributions.stripePaymentIntentId, pi.id));
    }

    // Mark item as unavailable if quantityTaken reaches quantityWanted
    const item = await db.query.giftItems.findFirst({
      where: eq(giftItems.id, giftItemId),
      columns: { id: true, quantityWanted: true, quantityTaken: true },
    });

    if (item) {
      const newTaken = (item.quantityTaken ?? 0) + 1;
      await db.update(giftItems).set({
        quantityTaken: sql`${giftItems.quantityTaken} + 1`,
        isAvailable: newTaken < item.quantityWanted,
      }).where(eq(giftItems.id, giftItemId));
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await db
      .update(contributions)
      .set({ paymentStatus: "failed" })
      .where(eq(contributions.stripePaymentIntentId, pi.id));
  }

  return NextResponse.json({ ok: true });
}
