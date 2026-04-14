/**
 * POST /api/orders/simple
 * Creates an order directly (without Stripe) from the carrito checkout form.
 * Used in Phase 2.2 before Stripe integration in Phase 2.3.
 */
import { db } from "@/db";
import { events, eventStores, orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  variantId:      z.string().uuid(),
  qty:            z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  productName:    z.string(),
  variantName:    z.string().optional().nullable(),
});

const schema = z.object({
  slug:            z.string(),
  guestName:       z.string().min(1),
  guestEmail:      z.string().email(),
  guestPhone:      z.string().optional().nullable(),
  items:           z.array(itemSchema).min(1),
  shippingAddress: z.object({
    line1:      z.string(),
    city:       z.string(),
    postalCode: z.string(),
    country:    z.string().default("ES"),
  }),
  subtotalCents: z.number().int(),
  shippingCents: z.number().int(),
  totalCents:    z.number().int(),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { slug, items, ...orderData } = parsed.data;

  // Look up event by slug
  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Look up store
  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, event.id),
    columns: { id: true },
  });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Get product IDs from variants
  const { productVariants } = await import("@/db/schema");
  const { inArray } = await import("drizzle-orm");
  const variantIds = items.map((i) => i.variantId);
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    columns: { id: true, productId: true },
  });
  const variantProductMap = new Map(variants.map((v) => [v.id, v.productId]));

  // Create order
  const [order] = await db.insert(orders).values({
    eventId:         event.id,
    storeId:         store.id,
    guestName:       orderData.guestName,
    guestEmail:      orderData.guestEmail,
    guestPhone:      orderData.guestPhone ?? null,
    status:          "pending_payment",
    subtotalCents:   orderData.subtotalCents,
    shippingCents:   orderData.shippingCents,
    taxCents:        0,
    totalCents:      orderData.totalCents,
    shippingAddress: orderData.shippingAddress,
  }).returning();

  // Create order items
  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId:         order.id,
      productId:       variantProductMap.get(item.variantId) ?? item.variantId,
      variantId:       item.variantId,
      quantity:        item.qty,
      unitPriceCents:  item.unitPriceCents,
      productName:     item.productName,
      variantName:     item.variantName ?? null,
      personalization: {},
    }))
  );

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
