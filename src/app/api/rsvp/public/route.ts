import { db } from "@/db";
import { guests, rsvpResponses, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["attending", "not_attending", "maybe"]),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

// Maps public-facing RSVP status to guest.status enum
const STATUS_MAP = {
  attending:     "confirmed",
  not_attending: "declined",
  maybe:         "pending",
} as const;

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { eventId, name, email, status, adults, children, dietaryRestrictions, notes } = parsed.data;

  // Verify event exists and allows RSVP
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { id: true, isPublic: true, allowRsvp: true },
  });

  if (!event || !event.isPublic || !event.allowRsvp) {
    return NextResponse.json({ error: "Event not found or RSVP disabled" }, { status: 404 });
  }

  const guestStatus = STATUS_MAP[status];

  // Find existing guest by email (if provided)
  let guestId: string;
  if (email) {
    const existing = await db.query.guests.findFirst({
      where: and(eq(guests.eventId, eventId), eq(guests.email, email)),
      columns: { id: true },
    });

    if (existing) {
      await db.update(guests).set({ status: guestStatus }).where(eq(guests.id, existing.id));
      guestId = existing.id;
    } else {
      const [created] = await db.insert(guests).values({
        eventId, name, email, status: guestStatus,
      }).returning({ id: guests.id });
      guestId = created.id;
    }
  } else {
    const [created] = await db.insert(guests).values({
      eventId, name, status: guestStatus,
    }).returning({ id: guests.id });
    guestId = created.id;
  }

  // Upsert RSVP response record
  const existingResponse = await db.query.rsvpResponses.findFirst({
    where: eq(rsvpResponses.guestId, guestId),
    columns: { id: true },
  });

  const responseData = {
    guestId,
    eventId,
    attending: status === "attending",
    plusOneAttending: (adults ?? 1) > 1,
    childrenCount: children ?? 0,
    dietaryNotes: dietaryRestrictions || null,
    messageToHost: notes || null,
  };

  if (existingResponse) {
    await db.update(rsvpResponses).set(responseData).where(eq(rsvpResponses.id, existingResponse.id));
    return NextResponse.json({ ok: true, updated: true });
  } else {
    await db.insert(rsvpResponses).values(responseData);
    return NextResponse.json({ ok: true, created: true });
  }
}
