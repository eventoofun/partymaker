import { db } from "@/db";
import { events, eventHosts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type EventRole = "owner" | "cohost" | "operator" | "viewer";

/**
 * Returns the role of `userId` in `eventId`, or null if no access.
 * Checks events.ownerId first, then eventHosts.
 */
export async function getEventRole(
  eventId: string,
  userId: string,
): Promise<EventRole | null> {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { ownerId: true },
  });
  if (!event) return null;
  if (event.ownerId === userId) return "owner";

  const host = await db.query.eventHosts.findFirst({
    where: and(eq(eventHosts.eventId, eventId), eq(eventHosts.userId, userId)),
    columns: { role: true },
  });
  return host?.role ?? null;
}

/** Can create/edit menus, edit event data, send communications */
export function canEdit(role: EventRole | null): boolean {
  return role === "owner" || role === "cohost";
}

/** Can manage guests (CRUD). Operator can check-in only. */
export function canManageGuests(role: EventRole | null): boolean {
  return role === "owner" || role === "cohost";
}

/** Can perform check-in */
export function canCheckIn(role: EventRole | null): boolean {
  return role === "owner" || role === "cohost" || role === "operator";
}
