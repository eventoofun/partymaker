import { db } from "@/db";
import { carts, cartItems, productVariants, products, eventStores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId:    z.string().uuid(),
  guestEmail: z.string().email().optional().nullable(),
  guestName:  z.string().max(200).optional().nullable(),
});

// POST — create a new cart
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

  const [cart] = await db.insert(carts).values({
    eventId:    parsed.data.eventId,
    guestEmail: parsed.data.guestEmail ?? null,
    guestName:  parsed.data.guestName ?? null,
    expiresAt,
  }).returning();

  return NextResponse.json({ cart }, { status: 201 });
}
