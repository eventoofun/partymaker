import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, giftLists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

async function getEventOwnership(eventId: string, userId: string) {
  return db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { id: true, ownerId: true, celebrantName: true },
  }).then(e => (e && e.ownerId === userId ? e : null));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await getEventOwnership(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lists = await db.query.giftLists.findMany({
    where: eq(giftLists.eventId, id),
    with: { items: true },
  });

  return NextResponse.json({ lists });
}

const postSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await getEventOwnership(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  const title = parsed.success && parsed.data.title
    ? parsed.data.title
    : `Lista de regalos de ${event.celebrantName}`;

  const [list] = await db
    .insert(giftLists)
    .values({ eventId: id, title, type: "wishlist" })
    .returning();

  return NextResponse.json({ list }, { status: 201 });
}
