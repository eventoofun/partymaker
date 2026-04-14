import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { videoInvitations, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId:       z.string().uuid(),
  theme:         z.string().min(1),                    // protagonist id used as theme
  protagonistType: z.enum(["adult", "baby", "group"]).optional(),
  scriptText:    z.string().optional(),
  musicTrack:    z.string().optional(),
  customization: z.record(z.unknown()).optional(),
  /** If provided, mark as ready immediately (browser-player mode) */
  ready:         z.boolean().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { eventId, theme, protagonistType, scriptText, musicTrack, customization, ready } = parsed.data;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { ownerId: true },
  });
  if (!event || event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [video] = await db
    .insert(videoInvitations)
    .values({
      eventId,
      theme,
      protagonistType: protagonistType ?? "adult",
      scriptText,
      musicTrack,
      customization: customization ?? {},
      status: ready ? "ready" : "pending",
    })
    .returning();

  return NextResponse.json({ video }, { status: 201 });
}
