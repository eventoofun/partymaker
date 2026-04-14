/**
 * POST /api/video-projects/[id]/assets/presign
 * Returns a presigned upload URL so the browser can upload an asset
 * directly to Supabase Storage without going through the Next.js server.
 *
 * Body: { kind: "protagonist_image" | "audio", filename: string, contentType: string }
 * Response: { uploadUrl, storagePath, token }
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { createPresignedUpload } from "@/lib/video-invitations/storage";

const presignSchema = z.object({
  kind: z.enum(["protagonist_image", "audio"]),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
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
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, filename, contentType } = parsed.data;

  // Validate mime types per asset kind
  const allowedMimes: Record<string, string[]> = {
    protagonist_image: ["image/jpeg", "image/png", "image/webp"],
    audio: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/m4a"],
  };

  if (!allowedMimes[kind].includes(contentType)) {
    return NextResponse.json(
      { error: `Content type ${contentType} not allowed for ${kind}` },
      { status: 400 },
    );
  }

  const result = await createPresignedUpload({ projectId: id, kind, filename, contentType });

  return NextResponse.json(result);
}
