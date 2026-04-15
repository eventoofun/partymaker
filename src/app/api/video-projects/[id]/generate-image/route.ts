/**
 * POST /api/video-projects/[id]/generate-image
 *
 * Step 1 of the generation pipeline: submit a NanaBanana Pro job to
 * transform the protagonist photo(s) into a styled image matching the scene.
 * The result (stored image URL) is later used as the first frame for Seedance.
 *
 * Body (optional): { additionalImagePaths?: string[] }
 *   Up to 2 extra Supabase storage paths uploaded in step 0.
 *   All images are passed to NanaBanana Pro for better identity preservation.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { generateProcessedImage } from "@/lib/video-invitations/orchestrator";

const bodySchema = z.object({
  additionalImagePaths: z.array(z.string()).max(5).optional(),
}).optional();

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

  // Parse optional body
  let additionalImagePaths: string[] | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (parsed.success && parsed.data?.additionalImagePaths?.length) {
      additionalImagePaths = parsed.data.additionalImagePaths;
    }
  } catch {
    // Body is optional — proceed without extra paths
  }

  try {
    const result = await generateProcessedImage(id, additionalImagePaths);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    console.error("[generate-image] Error:", message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
