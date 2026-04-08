import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, wishLists } from "@/db/schema";
import { NextResponse } from "next/server";
import { generateEventSlug } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  celebrantName: z.string().min(1),
  celebrantAge: z.number().int().min(0).max(18).optional(),
  type: z.enum(["cumpleanos", "comunion", "bautizo", "navidad", "graduacion", "otro"]),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const slug = generateEventSlug(data.celebrantName);

  const [event] = await db
    .insert(events)
    .values({
      userId,
      slug,
      type: data.type,
      celebrantName: data.celebrantName,
      celebrantAge: data.celebrantAge,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      venue: data.venue,
      venueAddress: data.venueAddress,
      description: data.description,
      status: "active",
    })
    .returning();

  // Auto-create wish list
  await db.insert(wishLists).values({ eventId: event.id });

  return NextResponse.json({ eventId: event.id }, { status: 201 });
}
