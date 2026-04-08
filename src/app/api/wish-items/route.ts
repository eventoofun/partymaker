import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { wishItems, wishLists, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  wishListId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  price: z.number().int().positive().optional(),
  category: z.enum(["juguete", "ropa", "libro", "tecnologia", "experiencia", "deporte", "otro"]).default("otro"),
  priority: z.enum(["alta", "media", "baja"]).default("media"),
  isCollective: z.boolean().default(false),
  targetAmount: z.number().int().positive().optional(),
  position: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;

  // Verify ownership: wishList → event → userId
  const wishList = await db.query.wishLists.findFirst({
    where: eq(wishLists.id, data.wishListId),
    with: { event: true },
  });

  if (!wishList || wishList.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [item] = await db
    .insert(wishItems)
    .values({
      wishListId: data.wishListId,
      title: data.title,
      description: data.description,
      url: data.url,
      price: data.price,
      category: data.category,
      priority: data.priority,
      isCollective: data.isCollective,
      targetAmount: data.targetAmount,
      position: data.position,
      status: "available",
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}
