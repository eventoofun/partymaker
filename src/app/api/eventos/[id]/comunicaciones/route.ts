import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, guests, notifications, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sendEventInvitation,
  sendRsvpReminder,
  sendEventDetails,
} from "@/lib/resend";

const schema = z.object({
  action: z.enum(["invite", "rsvp_reminder", "event_details"]),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { action } = parsed.data;

  // Load event + owner + guests
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    with: { guests: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Load organizer name
  const organizer = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, email: true },
  });
  const organizerName = organizer?.name ?? "El organizador";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com";
  const eventUrl = `${appUrl}/e/${event.slug}`;

  let targetGuests: typeof event.guests = [];
  let notifType: "invite" | "rsvp_reminder" | "invite" = "invite";

  if (action === "invite") {
    // Send to all guests with email who haven't been invited yet or are still pending
    targetGuests = event.guests.filter(
      (g) => g.email && (g.status === "pending" || !g.invitedAt)
    );
    notifType = "invite";
  } else if (action === "rsvp_reminder") {
    // Pending/invited guests who haven't confirmed or declined
    targetGuests = event.guests.filter(
      (g) => g.email && (g.status === "pending" || g.status === "invited")
    );
    notifType = "rsvp_reminder";
  } else if (action === "event_details") {
    // Only confirmed guests
    targetGuests = event.guests.filter((g) => g.email && g.status === "confirmed");
    notifType = "invite"; // reuse type field
  }

  if (targetGuests.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay destinatarios válidos" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const guest of targetGuests) {
    if (!guest.email) continue;
    const rsvpUrl = `${appUrl}/rsvp/${guest.inviteToken}`;

    try {
      if (action === "invite") {
        await sendEventInvitation({
          guestEmail: guest.email,
          guestName: guest.name,
          celebrantName: event.celebrantName,
          eventType: event.type,
          eventDate: event.eventDate,
          venue: event.venue,
          rsvpUrl,
          eventUrl,
          organizerName,
        });
        // Mark as invited
        await db
          .update(guests)
          .set({ status: "invited", invitedAt: new Date() })
          .where(and(eq(guests.id, guest.id), eq(guests.status, "pending")));
      } else if (action === "rsvp_reminder") {
        await sendRsvpReminder({
          guestEmail: guest.email,
          guestName: guest.name,
          celebrantName: event.celebrantName,
          eventDate: event.eventDate,
          rsvpUrl,
          organizerName,
        });
      } else if (action === "event_details") {
        await sendEventDetails({
          guestEmail: guest.email,
          guestName: guest.name,
          celebrantName: event.celebrantName,
          eventType: event.type,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          venue: event.venue,
          venueAddress: event.venueAddress,
          dressCode: event.dressCode,
          eventUrl,
          organizerName,
        });
      }

      // Record notification
      await db.insert(notifications).values({
        eventId: event.id,
        guestId: guest.id,
        type: action === "rsvp_reminder" ? "rsvp_reminder" : action === "event_details" ? "rsvp_confirm" : "invite",
        channel: "email",
        status: "sent",
        subject: action === "invite"
          ? `Invitación al evento de ${event.celebrantName}`
          : action === "rsvp_reminder"
          ? `Recordatorio de RSVP para ${event.celebrantName}`
          : `Detalles del evento de ${event.celebrantName}`,
        sentAt: new Date(),
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send to ${guest.email}:`, err);
      errors.push(guest.email);
    }
  }

  return NextResponse.json({ sent, errors, total: targetGuests.length });
}
