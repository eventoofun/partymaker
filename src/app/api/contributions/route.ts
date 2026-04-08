import { db } from "@/db";
import { wishItems, wishLists, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createContributionPaymentIntent } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  wishItemId: z.string().uuid(),
  amount: z.number().int().min(100), // min €1
  contributorName: z.string().min(1),
  contributorEmail: z.string().email(),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;

  // Load item → wishList → event → user (for Stripe Connect account)
  const item = await db.query.wishItems.findFirst({
    where: eq(wishItems.id, data.wishItemId),
    with: {
      wishList: {
        with: {
          event: {
            with: { user: true },
          },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  if (item.status === "purchased" || item.status === "funded") {
    return NextResponse.json({ error: "Gift already fulfilled" }, { status: 409 });
  }

  const event = item.wishList.event;
  const organizer = event.user;
  const connectedAccountId =
    organizer.stripeConnectOnboarded && organizer.stripeConnectId
      ? organizer.stripeConnectId
      : undefined;

  const paymentIntent = await createContributionPaymentIntent({
    amount: data.amount,
    wishItemId: data.wishItemId,
    eventSlug: event.slug,
    contributorEmail: data.contributorEmail,
    connectedAccountId,
    metadata: {
      contributorName: data.contributorName,
      message: data.message ?? "",
      isAnonymous: String(data.isAnonymous),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
