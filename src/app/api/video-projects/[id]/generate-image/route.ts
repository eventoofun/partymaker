/**
 * POST /api/video-projects/[id]/generate-image
 *
 * Step 1 of the generation pipeline: submit a NanaBanana Pro job to
 * transform the protagonist photo into a styled image matching the scene.
 * The result (stored image URL) is later used as the first frame for Seedance.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { generateProcessedImage } from "@/lib/video-invitations/orchestrator";

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

  try {
    const result = await generateProcessedImage(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    console.error("[generate-image] Error:", message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
