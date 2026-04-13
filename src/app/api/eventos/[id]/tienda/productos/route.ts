import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventStores, products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Props { params: Promise<{ id: string }> }

const variantSchema = z.object({
  name:                 z.string().min(1).max(200),
  sku:                  z.string().max(100).optional().nullable(),
  attributes:           z.record(z.string()).optional(),
  priceCents:           z.number().int().min(0),
  compareAtPriceCents:  z.number().int().min(0).optional().nullable(),
  isAvailable:          z.boolean().optional(),
});

const schema = z.object({
  name:         z.string().min(1).max(200),
  description:  z.string().max(2000).optional().nullable(),
  type:         z.enum(["POD_2D_APPAREL","POD_2D_ACCESSORY","POD_2D_PRINT","POD_3D_DECOR","POD_3D_FIGURE","POD_3D_GIFT","CUSTOM_ONE_OFF"]),
  status:       z.enum(["draft","active","archived"]).optional(),
  requiresQuote: z.boolean().optional(),
  variants:     z.array(variantSchema).min(1),
});

async function getStore(eventId: string, userId: string) {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  if (!event) return null;
  return db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, eventId),
    columns: { id: true },
  });
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStore(id, userId);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const list = await db.query.products.findMany({
    where: eq(products.storeId, store.id),
    with: {
      assets:                true,
      variants:              true,
      personalizationSchema: { orderBy: (s, { asc }) => [asc(s.sortOrder)] },
    },
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
  });

  return NextResponse.json({ products: list });
}

export async function POST(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStore(id, userId);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { variants: variantsData, ...productData } = parsed.data;

  const [product] = await db.insert(products).values({
    storeId:      store.id,
    name:         productData.name,
    description:  productData.description ?? null,
    type:         productData.type,
    status:       productData.status ?? "draft",
    requiresQuote: productData.requiresQuote ?? false,
  }).returning();

  const insertedVariants = await db.insert(productVariants).values(
    variantsData.map((v) => ({
      productId:           product.id,
      name:                v.name,
      sku:                 v.sku ?? null,
      attributes:          v.attributes ?? {},
      priceCents:          v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents ?? null,
      isAvailable:         v.isAvailable ?? true,
    }))
  ).returning();

  return NextResponse.json({ product: { ...product, variants: insertedVariants } }, { status: 201 });
}
