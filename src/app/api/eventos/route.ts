import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, giftLists, users } from "@/db/schema";
import { NextResponse } from "next/server";
import { generateEventSlug } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  celebrantName: z.string().min(1),
  celebrantAge:  z.number().int().min(0).max(120).optional(),
  type:          z.enum(["birthday","wedding","graduation","bachelor","communion","baptism","christmas","corporate","other"]),
  eventDate:     z.string().optional(),
  eventTime:     z.string().optional(),
  venue:         z.string().optional(),
  venueAddress:  z.string().optional(),
  description:   z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user record exists — Clerk webhook may not have fired yet
  const clerkUser = await currentUser();
  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name  = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined;
    await db
      .insert(users)
      .values({ id: userId, email, name, plan: "free" })
      .onConflictDoNothing();
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("[POST /api/eventos] Validation error:", parsed.error.flatten());
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const slug  = generateEventSlug(data.celebrantName);

  try {
    const [event] = await db
      .insert(events)
      .values({
        ownerId:       userId,
        slug,
        title:         data.celebrantName,
        celebrantName: data.celebrantName,
        celebrantAge:  data.celebrantAge,
        type:          data.type,
        eventDate:     data.eventDate,
        eventTime:     data.eventTime,
        venue:         data.venue,
        venueAddress:  data.venueAddress,
        description:   data.description,
        status:        "draft",
      })
      .returning();

    // Create default gift list
    await db.insert(giftLists).values({ eventId: event.id, title: "Lista de regalos" });

    return NextResponse.json({ eventId: event.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/eventos] DB error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
