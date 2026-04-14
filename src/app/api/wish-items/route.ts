import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { giftItems, giftLists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { injectAffiliateTag } from "@/lib/affiliates";

const schema = z.object({
  giftListId:     z.string().uuid(),
  title:          z.string().min(1),
  description:    z.string().nullish(),
  url:            z.string().url().nullish(),
  price:          z.number().int().positive().nullish(),
  imageUrl:       z.string().url().nullish(),
  quantityWanted: z.number().int().min(1).default(1),
  sortOrder:      z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;

  // Verify ownership: giftList → event → ownerId
  const giftList = await db.query.giftLists.findFirst({
    where: eq(giftLists.id, data.giftListId),
    with: { event: { columns: { ownerId: true } } },
  });

  if (!giftList || giftList.event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [item] = await db
    .insert(giftItems)
    .values({
      giftListId:     data.giftListId,
      title:          data.title,
      description:    data.description,
      url:            data.url ? injectAffiliateTag(data.url) : null,
      price:          data.price,
      imageUrl:       data.imageUrl,
      quantityWanted: data.quantityWanted,
      sortOrder:      data.sortOrder,
      isAvailable:    true,
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}
