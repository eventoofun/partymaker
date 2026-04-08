import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { wishItems, wishLists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const item = await db.query.wishItems.findFirst({
    where: eq(wishItems.id, id),
    with: {
      wishList: {
        with: { event: true },
      },
    },
  });

  if (!item || item.wishList.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(wishItems).where(eq(wishItems.id, id));

  return NextResponse.json({ ok: true });
}
