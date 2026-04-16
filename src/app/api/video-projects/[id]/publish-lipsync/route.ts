/**
 * POST /api/video-projects/[id]/publish-lipsync
 *
 * Publishes a lipsync (InfiniteTalk) project directly from awaiting_approval.
 * For lipsync mode the preview IS the final product — no additional render needed.
 *
 * Promotes previewVideoUrl → finalVideoUrl and sets status to "published".
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await db.query.videoProjects.findFirst({
    where: eq(videoProjects.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getEventRole(project.eventId, userId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (project.mode !== "lipsync") {
    return NextResponse.json(
      { error: "This endpoint is only for lipsync projects" },
      { status: 400 },
    );
  }

  const validStatuses = ["awaiting_approval", "preview_ready"];
  if (!validStatuses.includes(project.status)) {
    return NextResponse.json(
      { error: `Cannot publish from status: ${project.status}. Expected awaiting_approval.` },
      { status: 409 },
    );
  }

  if (!project.previewVideoUrl) {
    return NextResponse.json(
      { error: "No preview video URL available to publish" },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(videoProjects)
    .set({
      status: "published",
      finalVideoUrl: project.previewVideoUrl,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(videoProjects.id, id))
    .returning();

  return NextResponse.json(updated);
}
