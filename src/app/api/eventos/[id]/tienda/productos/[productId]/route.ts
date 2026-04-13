import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventStores, products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Props { params: Promise<{ id: string; productId: string }> }

const updateSchema = z.object({
  name:          z.string().min(1).max(200).optional(),
  description:   z.string().max(2000).optional().nullable(),
  type:          z.enum(["POD_2D_APPAREL","POD_2D_ACCESSORY","POD_2D_PRINT","POD_3D_DECOR","POD_3D_FIGURE","POD_3D_GIFT","CUSTOM_ONE_OFF"]).optional(),
  status:        z.enum(["draft","active","archived"]).optional(),
  requiresQuote: z.boolean().optional(),
  sortOrder:     z.number().int().optional(),
});

async function getProductWithOwner(productId: string, eventId: string, userId: string) {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  if (!event) return null;
  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, eventId),
    columns: { id: true },
  });
  if (!store) return null;
  return db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    with: { assets: true, variants: true, personalizationSchema: true },
  });
}

export async function GET(_req: Request, { params }: Props) {
  const { id, productId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getProductWithOwner(productId, id, userId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: Props) {
  const { id, productId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getProductWithOwner(productId, id, userId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id, productId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getProductWithOwner(productId, id, userId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(products).where(eq(products.id, productId));
  return NextResponse.json({ ok: true });
}

// PATCH /api/eventos/[id]/tienda/productos/[productId]/variant — add variant
export async function PUT(req: Request, { params }: Props) {
  const { id, productId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getProductWithOwner(productId, id, userId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variantSchema = z.object({
    name:                z.string().min(1).max(200),
    sku:                 z.string().max(100).optional().nullable(),
    attributes:          z.record(z.string()).optional(),
    priceCents:          z.number().int().min(0),
    compareAtPriceCents: z.number().int().min(0).optional().nullable(),
    isAvailable:         z.boolean().optional(),
  });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [variant] = await db.insert(productVariants).values({
    productId,
    name:                parsed.data.name,
    sku:                 parsed.data.sku ?? null,
    attributes:          parsed.data.attributes ?? {},
    priceCents:          parsed.data.priceCents,
    compareAtPriceCents: parsed.data.compareAtPriceCents ?? null,
    isAvailable:         parsed.data.isAvailable ?? true,
  }).returning();

  return NextResponse.json({ variant }, { status: 201 });
}
