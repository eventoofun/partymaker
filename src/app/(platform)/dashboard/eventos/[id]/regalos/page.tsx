import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, giftLists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import RegalosClient from "./RegalosClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RegalosPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    with: {
      giftLists: {
        with: {
          items: {
            orderBy: (i, { asc }) => [asc(i.sortOrder)],
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Create default gift list if none exists
  let giftList = event.giftLists[0];
  if (!giftList) {
    const [created] = await db
      .insert(giftLists)
      .values({ eventId: event.id, title: "Lista de regalos" })
      .returning();
    giftList = { ...created, items: [] };
  }

  return (
    <RegalosClient
      eventId={event.id}
      eventSlug={event.slug}
      celebrantName={event.celebrantName}
      giftListId={giftList.id}
      initialItems={giftList.items.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        price: i.price,
        url: i.url,
        imageUrl: i.imageUrl,
        quantityWanted: i.quantityWanted ?? 1,
        quantityTaken: i.quantityTaken ?? 0,
        isAvailable: i.isAvailable ?? true,
        sortOrder: i.sortOrder ?? 0,
      }))}
    />
  );
}
