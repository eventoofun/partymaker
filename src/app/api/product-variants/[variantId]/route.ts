import { db } from "@/db";
import { productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Props { params: Promise<{ variantId: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { variantId } = await params;

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    with: {
      product: {
        columns: { id: true, name: true },
        with: { assets: { orderBy: (a, { asc }) => [asc(a.sortOrder)] } },
      },
    },
  });

  if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ variant });
}
