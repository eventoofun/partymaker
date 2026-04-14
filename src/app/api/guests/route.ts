import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { guests, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;

  // Verify event ownership
  const event = await db.query.events.findFirst({
    where: eq(events.id, data.eventId),
    columns: { ownerId: true },
  });
  if (!event || event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [guest] = await db
    .insert(guests)
    .values({
      eventId: data.eventId,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
      status: "invited",
    })
    .returning();

  return NextResponse.json({ guest }, { status: 201 });
}
