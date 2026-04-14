import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { giftItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { injectAffiliateTag } from "@/lib/affiliates";

interface Params {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  title:          z.string().min(1).optional(),
  description:    z.string().nullish(),
  url:            z.string().url().nullish(),
  price:          z.number().int().min(0).nullish(),
  imageUrl:       z.string().url().nullish(),
  quantityWanted: z.number().int().min(1).optional(),
  isAvailable:    z.boolean().optional(),
  sortOrder:      z.number().int().min(0).optional(),
});

async function verifyOwnership(id: string, userId: string) {
  const item = await db.query.giftItems.findFirst({
    where: eq(giftItems.id, id),
    with: {
      giftList: {
        with: { event: { columns: { ownerId: true } } },
      },
    },
  });
  if (!item || item.giftList.event.ownerId !== userId) return null;
  return item;
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await verifyOwnership(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const patchData = {
    ...parsed.data,
    url: parsed.data.url !== undefined
      ? (parsed.data.url ? injectAffiliateTag(parsed.data.url) : null)
      : undefined,
  };

  const [updated] = await db
    .update(giftItems)
    .set(patchData)
    .where(eq(giftItems.id, id))
    .returning();

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await verifyOwnership(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(giftItems).where(eq(giftItems.id, id));

  return NextResponse.json({ ok: true });
}
