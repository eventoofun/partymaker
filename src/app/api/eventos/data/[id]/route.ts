import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.userId, userId)),
    columns: {
      id: true,
      type: true,
      celebrantName: true,
      celebrantAge: true,
      eventDate: true,
      eventTime: true,
      venue: true,
      venueAddress: true,
      description: true,
      isPublic: true,
      allowRsvp: true,
      allowGifts: true,
      status: true,
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}
