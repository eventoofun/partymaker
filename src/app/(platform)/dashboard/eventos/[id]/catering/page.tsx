import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, menus, rsvpResponses, guests } from "@/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getEventRole, canEdit } from "@/lib/permissions";
import CateringClient from "./CateringClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CateringPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  // Verify event exists
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true },
  });
  if (!event) notFound();

  // Menus with RSVP selection count
  const menusWithCount = await db
    .select({
      id: menus.id,
      eventId: menus.eventId,
      name: menus.name,
      description: menus.description,
      type: menus.type,
      isDefault: menus.isDefault,
      sortOrder: menus.sortOrder,
      rsvpCount: sql<number>`cast(count(${rsvpResponses.id}) as int)`,
    })
    .from(menus)
    .leftJoin(rsvpResponses, eq(rsvpResponses.menuChoiceId, menus.id))
    .where(eq(menus.eventId, id))
    .groupBy(menus.id)
    .orderBy(menus.sortOrder);

  // RSVP data for CSV export (only those who chose a menu)
  const rsvpData = await db
    .select({
      guestName: guests.name,
      guestEmail: guests.email,
      menuChoiceId: rsvpResponses.menuChoiceId,
      dietaryNotes: rsvpResponses.dietaryNotes,
      allergies: rsvpResponses.allergies,
    })
    .from(rsvpResponses)
    .innerJoin(guests, eq(guests.id, rsvpResponses.guestId))
    .where(isNotNull(rsvpResponses.menuChoiceId));

  return (
    <CateringClient
      eventId={id}
      menus={menusWithCount}
      rsvpData={rsvpData}
      canEdit={canEdit(role)}
    />
  );
}
