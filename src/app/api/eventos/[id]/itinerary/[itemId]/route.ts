import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventItinerary } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  time:        z.string().min(1).max(10).optional(),
  title:       z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  type:        z.enum(["ceremony","reception","dinner","dance","speech","cake","games","photo","transport","other"]).optional(),
  icon:        z.string().max(10).optional().nullable(),
  sortOrder:   z.number().int().optional(),
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

  const [updated] = await db.update(eventItinerary)
    .set({ ...parsed.data })
    .where(and(eq(eventItinerary.id, itemId), eq(eventItinerary.eventId, id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id, itemId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(eventItinerary)
    .where(and(eq(eventItinerary.id, itemId), eq(eventItinerary.eventId, id)));

  return NextResponse.json({ ok: true });
}
