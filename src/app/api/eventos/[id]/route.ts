import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  celebrantName: z.string().min(1).max(120),
  celebrantAge: z.number().int().min(0).max(120).optional().nullable(),
  type: z.enum(["birthday","wedding","graduation","bachelor","communion","baptism","christmas","corporate","other"]),
  eventDate: z.string().optional().nullable(),
  eventTime: z.string().optional().nullable(),
  venue: z.string().max(200).optional().nullable(),
  venueAddress: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isPublic: z.boolean().optional(),
  allowRsvp: z.boolean().optional(),
  allowGifts: z.boolean().optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  await db.update(events).set({
    type: data.type,
    celebrantName: data.celebrantName,
    celebrantAge: data.celebrantAge ?? null,
    eventDate: data.eventDate ?? null,
    eventTime: data.eventTime ?? null,
    venue: data.venue ?? null,
    venueAddress: data.venueAddress ?? null,
    description: data.description ?? null,
    ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    ...(data.allowRsvp !== undefined && { allowRsvp: data.allowRsvp }),
    ...(data.allowGifts !== undefined && { allowGifts: data.allowGifts }),
  }).where(eq(events.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}
