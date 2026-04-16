import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventHosts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getEventRole } from "@/lib/permissions";
import EventDashboardClient from "./EventDashboardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      giftLists: { with: { items: true } },
      guests: true,
      videoInvitations: true,
      budgetItems: true,
    },
  });

  if (!event) notFound();

  const cohosts =
    role === "owner"
      ? await db
          .select({
            userId: eventHosts.userId,
            role: eventHosts.role,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(eventHosts)
          .innerJoin(users, eq(users.id, eventHosts.userId))
          .where(eq(eventHosts.eventId, id))
      : [];

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;

  const allItems = event.giftLists.flatMap((gl) => gl.items);
  const stats = {
    totalGuests:    event.guests.length,
    attending:      event.guests.filter((g) => g.status === "confirmed").length,
    totalItems:     allItems.length,
    availableItems: allItems.filter((i) => i.isAvailable).length,
    videoCount:     event.videoInvitations.length,
    totalBudget:    event.budgetItems.reduce((s, b) => s + (b.estimatedCost ? parseFloat(b.estimatedCost) : 0), 0),
    totalSpent:     event.budgetItems.reduce((s, b) => s + (b.actualCost ? parseFloat(b.actualCost) : 0), 0),
  };

  const eventData = {
    id:             event.id,
    type:           event.type,
    celebrantName:  event.celebrantName,
    celebrantAge:   event.celebrantAge,
    eventDate:      event.eventDate,
    eventTime:      event.eventTime,
    venue:          event.venue,
    description:    event.description,
    status:         event.status,
    slug:           event.slug,
  };

  const validCohosts = cohosts
    .filter(
      (h): h is typeof h & { role: "cohost" | "operator" | "viewer"; email: string } =>
        (h.role === "cohost" || h.role === "operator" || h.role === "viewer") &&
        h.email != null,
    )
    .map((h) => ({
      userId:    h.userId,
      role:      h.role,
      name:      h.name ?? null,
      email:     h.email,
      avatarUrl: h.avatarUrl ?? null,
    }));

  return (
    <EventDashboardClient
      eventId={id}
      event={eventData}
      stats={stats}
      role={role as "owner" | "cohost" | "operator" | "viewer"}
      cohosts={validCohosts}
      publicUrl={publicUrl}
    />
  );
}
