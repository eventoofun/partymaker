import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  allowRsvp:    z.boolean().optional(),
  rsvpDeadline: z.string().datetime({ offset: true }).nullish(),
  rsvpMessage:  z.string().max(500).nullish(),
  allowGifts:   z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true, ownerId: true },
  });
  if (!event || event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const d = parsed.data;
  const hasFields = d.allowRsvp !== undefined || d.rsvpDeadline !== undefined
    || d.rsvpMessage !== undefined || d.allowGifts !== undefined;

  if (!hasFields) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(events)
    .set({
      ...(d.allowRsvp    !== undefined && { allowRsvp:    d.allowRsvp }),
      ...(d.rsvpDeadline !== undefined && { rsvpDeadline: d.rsvpDeadline ? new Date(d.rsvpDeadline) : null }),
      ...(d.rsvpMessage  !== undefined && { rsvpMessage:  d.rsvpMessage ?? null }),
      ...(d.allowGifts   !== undefined && { allowGifts:   d.allowGifts }),
    })
    .where(eq(events.id, id))
    .returning();

  return NextResponse.json({ event: updated });
}
