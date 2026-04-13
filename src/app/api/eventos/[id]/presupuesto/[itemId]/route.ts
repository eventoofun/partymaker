import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventBudgetItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  category:      z.string().min(1).max(50).optional(),
  name:          z.string().min(1).max(150).optional(),
  vendor:        z.string().max(150).optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  actualCost:    z.number().min(0).optional().nullable(),
  notes:         z.string().max(500).optional().nullable(),
  isPaid:        z.boolean().optional(),
  sortOrder:     z.number().int().optional(),
});

interface Props {
  params: Promise<{ id: string; itemId: string }>;
}

async function verifyOwner(eventId: string, userId: string) {
  return db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
}

export async function PATCH(req: Request, { params }: Props) {
  const { id, itemId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.category      !== undefined) updateData.category      = parsed.data.category;
  if (parsed.data.name          !== undefined) updateData.name          = parsed.data.name;
  if (parsed.data.vendor        !== undefined) updateData.vendor        = parsed.data.vendor;
  if (parsed.data.notes         !== undefined) updateData.notes         = parsed.data.notes;
  if (parsed.data.isPaid        !== undefined) updateData.isPaid        = parsed.data.isPaid;
  if (parsed.data.sortOrder     !== undefined) updateData.sortOrder     = parsed.data.sortOrder;
  if (parsed.data.estimatedCost !== undefined) updateData.estimatedCost = parsed.data.estimatedCost?.toString() ?? null;
  if (parsed.data.actualCost    !== undefined) updateData.actualCost    = parsed.data.actualCost?.toString() ?? null;

  const [updated] = await db.update(eventBudgetItems)
    .set(updateData)
    .where(and(eq(eventBudgetItems.id, itemId), eq(eventBudgetItems.eventId, id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id, itemId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(eventBudgetItems)
    .where(and(eq(eventBudgetItems.id, itemId), eq(eventBudgetItems.eventId, id)));

  return NextResponse.json({ ok: true });
}
