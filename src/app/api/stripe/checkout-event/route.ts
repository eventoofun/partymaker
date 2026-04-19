import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createEventUnlockSession, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await req.json() as { eventId?: string };
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const [user, event] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true, name: true, stripeCustomerId: true },
    }),
    db.query.events.findFirst({
      where: eq(events.id, eventId),
      columns: { id: true, title: true, ownerId: true, paymentStatus: true },
    }),
  ]);

  if (!event || event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (event.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already unlocked" }, { status: 400 });
  }

  const clerkUser = await currentUser();
  const email = user?.email ?? clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  const customerId =
    user?.stripeCustomerId ??
    (await getOrCreateStripeCustomer(userId, email, user?.name));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com";

  try {
    const session = await createEventUnlockSession({
      userId,
      eventId,
      eventTitle: event.title,
      customerId,
      successUrl: `${baseUrl}/dashboard/eventos/${eventId}?unlocked=1`,
      cancelUrl: `${baseUrl}/dashboard/eventos/${eventId}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    console.error("[checkout-event]", msg);
    return NextResponse.json({ error: `No se pudo iniciar el pago: ${msg}` }, { status: 500 });
  }
}
