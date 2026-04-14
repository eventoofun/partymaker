import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products, productAssets, eventStores, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid(),
  type:      z.enum(["preview", "mockup", "production", "template"]),
  url:       z.string().url(),
  sortOrder: z.number().int().optional().default(0),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify ownership through product → store → event
  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
    with: { store: { with: { event: { columns: { id: true, ownerId: true } } } } },
  });

  if (!product || product.store.event.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [asset] = await db.insert(productAssets).values({
    productId: parsed.data.productId,
    type:      parsed.data.type,
    url:       parsed.data.url,
    sortOrder: parsed.data.sortOrder,
  }).returning();

  return NextResponse.json({ asset }, { status: 201 });
}
