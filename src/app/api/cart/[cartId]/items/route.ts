import { db } from "@/db";
import { carts, cartItems, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Props { params: Promise<{ cartId: string }> }

const schema = z.object({
  variantId:       z.string().uuid(),
  quantity:        z.number().int().min(1).max(99).optional().default(1),
  personalization: z.record(z.string()).optional().default({}),
});

export async function POST(req: Request, { params }: Props) {
  const { cartId } = await params;

  // Verify cart exists
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    columns: { id: true },
  });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Get variant price
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
    columns: { id: true, priceCents: true, isAvailable: true },
  });
  if (!variant || !variant.isAvailable) {
    return NextResponse.json({ error: "Variant not available" }, { status: 400 });
  }

  const [item] = await db.insert(cartItems).values({
    cartId,
    variantId:       parsed.data.variantId,
    quantity:        parsed.data.quantity,
    unitPriceCents:  variant.priceCents,
    personalization: parsed.data.personalization,
  }).returning();

  return NextResponse.json({ item }, { status: 201 });
}
