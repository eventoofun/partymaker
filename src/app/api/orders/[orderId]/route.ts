import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { orders, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Props { params: Promise<{ orderId: string }> }

// GET — public order status (by orderId, used for confirmation page)
export async function GET(_req: Request, { params }: Props) {
  const { orderId } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return safe subset (no internal fields)
  return NextResponse.json({
    order: {
      id:           order.id,
      status:       order.status,
      guestName:    order.guestName,
      guestEmail:   order.guestEmail,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents:   order.totalCents,
      items:        order.items,
      createdAt:    order.createdAt,
    },
  });
}

// PATCH — organizer updates order status
export async function PATCH(req: Request, { params }: Props) {
  const { orderId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, eventId: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, order.eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const allowedStatuses = ["draft","pending_payment","paid","in_production","shipped","delivered","failed","canceled","refunded"] as const;
  const { status } = body as { status?: string };
  if (!status || !allowedStatuses.includes(status as typeof allowedStatuses[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status: status as typeof allowedStatuses[number], updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  return NextResponse.json({ order: updated });
}
