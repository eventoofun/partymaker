import { db } from "@/db";
import { giftItems, giftLists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createContributionPaymentIntent } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  giftItemId: z.string().uuid(),
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

  // Load item → giftList → event → owner (for Stripe Connect account)
  const item = await db.query.giftItems.findFirst({
    where: eq(giftItems.id, data.giftItemId),
    with: {
      giftList: {
        with: {
          event: {
            columns: { slug: true, ownerId: true },
          },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  if (!item.isAvailable) {
    return NextResponse.json({ error: "Gift no longer available" }, { status: 409 });
  }

  const event = item.giftList.event;

  const paymentIntent = await createContributionPaymentIntent({
    amount: data.amount,
    wishItemId: data.giftItemId,
    eventSlug: event.slug,
    contributorEmail: data.contributorEmail,
    connectedAccountId: undefined, // configure Stripe Connect separately
    metadata: {
      contributorName: data.contributorName,
      message: data.message ?? "",
      isAnonymous: String(data.isAnonymous),
      giftListId: item.giftListId,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
