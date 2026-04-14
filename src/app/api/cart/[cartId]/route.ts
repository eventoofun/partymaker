import { db } from "@/db";
import { carts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Props { params: Promise<{ cartId: string }> }

// GET — fetch cart with items
export async function GET(_req: Request, { params }: Props) {
  const { cartId } = await params;

  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    with: {
      items: {
        with: {
          variant: {
            with: { product: { with: { assets: true } } },
          },
        },
      },
    },
  });

  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  return NextResponse.json({ cart });
}
