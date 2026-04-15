/**
 * GET  /api/video-projects/[id]  — fetch project + latest job status
 * PATCH /api/video-projects/[id] — update wizard inputs (only in draft/prompt_compiled states)
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects, generationJobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { pollAndSyncJobStatus } from "@/lib/video-invitations/orchestrator";

const patchSchema = z.object({
  protagonistName: z.string().min(1).max(100).optional(),
  protagonistDescription: z.string().max(500).nullable().optional(),
  transformationDescription: z.string().max(500).nullable().optional(),
  sceneDescription: z.string().max(500).nullable().optional(),
  styleDescription: z.string().max(500).nullable().optional(),
  language: z.string().optional(),
  durationSeconds: z.number().int().min(4).max(15).optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let project = await db.query.videoProjects.findFirst({
    where: eq(videoProjects.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getEventRole(project.eventId, userId);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If the project is waiting for a Kie.ai result, poll and sync now.
  // This makes the system work even when the KIE_CALLBACK_URL webhook is not configured.
  const processingStates = [
    "image_processing",
    "preview_queued", "preview_processing",
    "final_queued", "final_processing",
  ];
  if (processingStates.includes(project.status)) {
    try {
      const synced = await pollAndSyncJobStatus(id);
      if (synced) {
        // Re-fetch the project after the status was updated
        const refreshed = await db.query.videoProjects.findFirst({
          where: eq(videoProjects.id, id),
        });
        if (refreshed) project = refreshed;
      }
    } catch {
      // Never let polling errors break the GET response
    }
  }

  // Include latest job for status polling fallback
  const [latestJob] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.projectId, id))
    .orderBy(desc(generationJobs.createdAt))
    .limit(1);

  return NextResponse.json({ ...project, latestJob: latestJob ?? null });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await db.query.videoProjects.findFirst({
    where: eq(videoProjects.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getEventRole(project.eventId, userId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const editableStates = ["draft", "assets_uploaded", "prompt_compiled"];
  if (!editableStates.includes(project.status)) {
    return NextResponse.json(
      { error: `Cannot edit project in status: ${project.status}` },
      { status: 409 },
    );
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(videoProjects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(videoProjects.id, id))
    .returning();

  return NextResponse.json(updated);
}
