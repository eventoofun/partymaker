import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import ComunicacionesClient from "./ComunicacionesClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ComunicacionesPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      notifications: {
        orderBy: [desc(notifications.sentAt)],
        with: { guest: { columns: { name: true, email: true } } },
      },
      guests: true,
    },
  });

  if (!event || event.ownerId !== userId) notFound();

  const totalGuests   = event.guests.length;
  const withEmail     = event.guests.filter((g) => g.email).length;
  const pendingCount  = event.guests.filter(
    (g) => g.email && (g.status === "pending" || g.status === "invited")
  ).length;
  const confirmedCount = event.guests.filter(
    (g) => g.email && g.status === "confirmed"
  ).length;

  return (
    <ComunicacionesClient
      eventId={id}
      celebrantName={event.celebrantName}
      totalGuests={totalGuests}
      withEmail={withEmail}
      pendingCount={pendingCount}
      confirmedCount={confirmedCount}
      notifications={event.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        channel: n.channel,
        status: n.status,
        subject: n.subject,
        sentAt: n.sentAt,
        guestName: n.guest?.name ?? null,
        guestEmail: n.guest?.email ?? null,
      }))}
    />
  );
}
