/**
 * POST /api/video-projects/[id]/assets/confirm
 * Called after the browser finishes uploading to Supabase Storage.
 * Updates the project record with the storage path and advances state to assets_uploaded.
 *
 * Body: { kind: "protagonist_image" | "audio", storagePath: string, publicUrl?: string }
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";

const confirmSchema = z.object({
  kind: z.enum(["protagonist_image", "audio"]),
  storagePath: z.string().min(1),
  publicUrl: z.string().url().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await db.query.videoProjects.findFirst({
    where: eq(videoProjects.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getEventRole(project.eventId, userId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, storagePath, publicUrl } = parsed.data;

  const fields =
    kind === "protagonist_image"
      ? { protagonistImagePath: storagePath, protagonistImageUrl: publicUrl ?? null }
      : { audioPath: storagePath, audioUrl: publicUrl ?? null };

  // Determine next status
  const hasImage =
    kind === "protagonist_image" ? true : !!project.protagonistImagePath;
  const hasAudio =
    kind === "audio" ? true : !!project.audioPath;
  const needsAudio = project.mode === "lipsync";

  const readyForPrompt = hasImage && (!needsAudio || hasAudio);
  const nextStatus = readyForPrompt ? "assets_uploaded" : project.status;

  const [updated] = await db
    .update(videoProjects)
    .set({ ...fields, status: nextStatus, updatedAt: new Date() })
    .where(eq(videoProjects.id, id))
    .returning();

  return NextResponse.json(updated);
}
