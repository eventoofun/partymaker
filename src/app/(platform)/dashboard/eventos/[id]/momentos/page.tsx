import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventPhotos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getEventRole } from "@/lib/permissions";
import MomentosClient from "./MomentosClient";

interface Props { params: Promise<{ id: string }> }

export default async function MomentosPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true, celebrantName: true, slug: true, type: true },
  });
  if (!event) notFound();

  const photos = await db.query.eventPhotos.findMany({
    where: eq(eventPhotos.eventId, id),
    orderBy: [desc(eventPhotos.createdAt)],
  });

  return (
    <MomentosClient
      eventId={id}
      eventSlug={event.slug}
      celebrantName={event.celebrantName}
      initialPhotos={photos.map((p) => ({
        id:             p.id,
        url:            p.url,
        guestName:      p.guestName,
        guestEmail:     p.guestEmail,
        caption:        p.caption,
        likes:          p.likes,
        status:         p.status,
        usedForProduct: p.usedForProduct,
        createdAt:      p.createdAt.toISOString(),
      }))}
    />
  );
}
