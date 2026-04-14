import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Params {
  params: Promise<{ token: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Evento",
};

// GET — load guest info for RSVP page
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const guest = await db.query.guests.findFirst({
    where: eq(guests.inviteToken, token),
    with: {
      event: {
        columns: { celebrantName: true, type: true, eventDate: true, venue: true, slug: true },
      },
    },
  });

  if (!guest) return NextResponse.json({ guest: null }, { status: 404 });

  const eventName = `${TYPE_LABEL[guest.event.type] ?? "Evento"} de ${guest.event.celebrantName}`;

  return NextResponse.json({
    guest: {
      name: guest.name,
      eventName,
      eventDate: guest.event.eventDate,
      venue: guest.event.venue,
      slug: guest.event.slug,
      currentStatus: guest.status,
    },
  });
}

// POST — submit RSVP
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const body = await req.json();

  const parsed = z.object({
    status: z.enum(["confirmed", "declined", "pending"]),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const guest = await db.query.guests.findFirst({
    where: eq(guests.inviteToken, token),
    columns: { id: true },
  });

  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(guests)
    .set({ status: parsed.data.status })
    .where(eq(guests.id, guest.id));

  return NextResponse.json({ ok: true });
}
