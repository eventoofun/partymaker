import { db } from "@/db";
import { carts, cartItems, orders, orderItems, eventStores, productVariants, products } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const addressSchema = z.object({
  line1:      z.string().min(1),
  line2:      z.string().optional(),
  city:       z.string().min(1),
  state:      z.string().optional(),
  postalCode: z.string().min(1),
  country:    z.string().min(2).max(2).default("ES"),
});

const schema = z.object({
  cartId:          z.string().uuid(),
  guestName:       z.string().min(1).max(200),
  guestEmail:      z.string().email(),
  guestPhone:      z.string().max(30).optional().nullable(),
  shippingAddress: addressSchema,
  notes:           z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Load cart + items
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, parsed.data.cartId),
    with: { items: true },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty or not found" }, { status: 400 });
  }

  // Get store for the event
  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, cart.eventId),
    columns: { id: true },
  });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Load variant + product snapshots
  const variantIds = cart.items.map((i) => i.variantId);
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    with: { product: { columns: { id: true, name: true } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Calculate totals
  let subtotalCents = 0;
  for (const item of cart.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 400 });
    subtotalCents += item.unitPriceCents * item.quantity;
  }

  const shippingCents = 499; // flat €4.99 shipping (configurable later)
  const totalCents = subtotalCents + shippingCents;

  // Create order
  const [order] = await db.insert(orders).values({
    eventId:         cart.eventId,
    storeId:         store.id,
    guestName:       parsed.data.guestName,
    guestEmail:      parsed.data.guestEmail,
    guestPhone:      parsed.data.guestPhone ?? null,
    status:          "pending_payment",
    subtotalCents,
    shippingCents,
    taxCents:        0,
    totalCents,
    shippingAddress: parsed.data.shippingAddress,
    notes:           parsed.data.notes ?? null,
  }).returning();

  // Create order items
  await db.insert(orderItems).values(
    cart.items.map((item) => {
      const variant = variantMap.get(item.variantId)!;
      return {
        orderId:         order.id,
        productId:       variant.productId,
        variantId:       variant.id,
        quantity:        item.quantity,
        unitPriceCents:  item.unitPriceCents,
        productName:     variant.product.name,
        variantName:     variant.name,
        personalization: item.personalization as Record<string, string>,
      };
    })
  );

  // Delete the cart
  await db.delete(carts).where(eq(carts.id, cart.id));

  return NextResponse.json({ orderId: order.id, totalCents }, { status: 201 });
}
