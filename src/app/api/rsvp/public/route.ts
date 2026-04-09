import { db } from "@/db";
import { guests, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  rsvpStatus: z.enum(["attending", "not_attending", "maybe"]),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { eventId, name, email, rsvpStatus, adults, children, dietaryRestrictions, notes } = parsed.data;

  // Verify event exists and allows RSVP
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { id: true, isPublic: true, allowRsvp: true },
  });

  if (!event || !event.isPublic || !event.allowRsvp) {
    return NextResponse.json({ error: "Event not found or RSVP disabled" }, { status: 404 });
  }

  // Upsert guest by email (if provided) or create new
  if (email) {
    const existing = await db.query.guests.findFirst({
      where: and(eq(guests.eventId, eventId), eq(guests.email, email)),
      columns: { id: true },
    });

    if (existing) {
      await db.update(guests).set({
        rsvpStatus,
        adults: adults ?? 1,
        children: children ?? 0,
        dietaryRestrictions: dietaryRestrictions || null,
        notes: notes || null,
        respondedAt: new Date(),
      }).where(eq(guests.id, existing.id));
      return NextResponse.json({ ok: true, updated: true });
    }
  }

  await db.insert(guests).values({
    eventId,
    name,
    email: email || null,
    rsvpStatus,
    adults: adults ?? 1,
    children: children ?? 0,
    dietaryRestrictions: dietaryRestrictions || null,
    notes: notes || null,
    rsvpToken: nanoid(16),
    respondedAt: new Date(),
  });

  return NextResponse.json({ ok: true, created: true });
}
