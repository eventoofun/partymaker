import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventItinerary } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  time:        z.string().min(1).max(10),
  title:       z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  type:        z.enum(["ceremony","reception","dinner","dance","speech","cake","games","photo","transport","other"]),
  icon:        z.string().max(10).optional().nullable(),
  sortOrder:   z.number().int().default(0),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Props) {
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

  const [item] = await db.insert(eventItinerary).values({
    eventId:     id,
    time:        parsed.data.time,
    title:       parsed.data.title,
    description: parsed.data.description ?? null,
    type:        parsed.data.type,
    icon:        parsed.data.icon ?? null,
    sortOrder:   parsed.data.sortOrder,
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
