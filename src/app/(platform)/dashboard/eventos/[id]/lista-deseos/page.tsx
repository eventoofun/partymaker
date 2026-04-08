import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, wishLists, wishItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import WishListEditor from "./WishListEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListaDeseosPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  // Load event with wish list
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.userId, userId)),
    with: {
      wishList: {
        with: {
          items: {
            orderBy: (i, { asc }) => [asc(i.position)],
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Create wish list if it doesn't exist
  let wishList = event.wishList;
  if (!wishList) {
    const [created] = await db
      .insert(wishLists)
      .values({ eventId: event.id })
      .returning();
    wishList = { ...created, items: [] };
  }

  return <WishListEditor event={event} wishList={wishList} />;
}
