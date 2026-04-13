import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { menus, rsvpResponses } from "@/db/schema";
import { and, eq, ne, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventRole, canEdit } from "@/lib/permissions";

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    type: z
      .enum(["adult", "child", "vegan", "vegetarian", "gluten_free", "other"])
      .optional()
      .nullable(),
    isDefault: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict();

interface Props {
  params: Promise<{ id: string; menuId: string }>;
}

export async function PATCH(req: Request, { params }: Props) {
  const { id, menuId } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!canEdit(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db.query.menus.findFirst({
    where: and(eq(menus.id, menuId), eq(menus.eventId, id)),
    columns: { id: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  if (data.isDefault === true) {
    await db
      .update(menus)
      .set({ isDefault: false })
      .where(and(eq(menus.eventId, id), ne(menus.id, menuId)));
  }

  const [updated] = await db
    .update(menus)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    })
    .where(eq(menus.id, menuId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id, menuId } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!canEdit(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db.query.menus.findFirst({
    where: and(eq(menus.id, menuId), eq(menus.eventId, id)),
    columns: { id: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ total }] = await db
    .select({ total: count() })
    .from(rsvpResponses)
    .where(eq(rsvpResponses.menuChoiceId, menuId));

  if (total > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay invitados que han elegido este menú" },
      { status: 409 },
    );
  }

  await db.delete(menus).where(eq(menus.id, menuId));
  return NextResponse.json({ ok: true });
}
