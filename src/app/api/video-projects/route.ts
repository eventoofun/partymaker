/**
 * POST /api/video-projects
 * Create a new VideoProject for an event.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";

const createSchema = z.object({
  eventId: z.string().uuid(),
  mode: z.enum(["visual", "lipsync"]).default("visual"),
  protagonistName: z.string().min(1).max(100),
  protagonistDescription: z.string().max(500).optional(),
  transformationDescription: z.string().max(500).optional(),
  sceneDescription: z.string().max(500).optional(),
  styleDescription: z.string().max(500).optional(),
  language: z.string().default("es"),
  durationSeconds: z.number().int().min(4).max(15).default(8),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId, ...rest } = parsed.data;

  // Check event access
  const role = await getEventRole(eventId, userId);
  if (!canEdit(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [project] = await db
    .insert(videoProjects)
    .values({ eventId, ...rest, status: "draft" })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
