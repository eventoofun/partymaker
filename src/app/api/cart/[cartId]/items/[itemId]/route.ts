import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Props { params: Promise<{ cartId: string; itemId: string }> }

export async function PATCH(req: Request, { params }: Props) {
  const { itemId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = z.object({ quantity: z.number().int().min(1).max(99) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(cartItems)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Props) {
  const { itemId } = await params;
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  return NextResponse.json({ ok: true });
}
