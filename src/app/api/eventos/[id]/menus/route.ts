// platform/src/app/api/eventos/[id]/menus/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { menus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventRole, canEdit } from "@/lib/permissions";

const createSchema = z.object({
  name:        z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  type:        z.enum(["adult", "child", "vegan", "vegetarian", "gluten_free", "other"]).optional().nullable(),
  isDefault:   z.boolean().default(false),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // sortOrder = MAX(sortOrder) + 1 for this event
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${menus.sortOrder}), 0)` })
    .from(menus)
    .where(eq(menus.eventId, id));

  const sortOrder = (maxOrder ?? 0) + 1;

  // If isDefault, clear isDefault on all other menus first
  if (parsed.data.isDefault) {
    await db.update(menus).set({ isDefault: false }).where(eq(menus.eventId, id));
  }

  try {
    const [menu] = await db.insert(menus).values({
      eventId:     id,
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      type:        parsed.data.type ?? null,
      isDefault:   parsed.data.isDefault,
      sortOrder,
    }).returning();

    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    console.error("[menus POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
