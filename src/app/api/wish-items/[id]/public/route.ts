import { db } from "@/db";
import { wishItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const item = await db.query.wishItems.findFirst({
    where: eq(wishItems.id, id),
    columns: {
      id: true,
      title: true,
      price: true,
      isCollective: true,
      targetAmount: true,
      collectedAmount: true,
      status: true,
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item });
}
