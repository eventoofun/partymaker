/**
 * POST /api/video-projects/[id]/generate-preview
 * Compile the prompt and submit a preview job to Kie.ai.
 * Advances project status to preview_queued immediately.
 * Result arrives asynchronously via /api/integrations/kie/callback.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { generatePreview } from "@/lib/video-invitations/orchestrator";

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

  // El modo visual requiere pago del upsell de animación.
  // El modo lipsync tiene su propio flujo (publish-lipsync) y no requiere este pago.
  if (project.mode === "visual" && !project.animationPaid) {
    return NextResponse.json(
      { error: "Payment required", code: "ANIMATION_UNPAID" },
      { status: 402 },
    );
  }

  // If already past image_ready (auto-triggered server-side), treat as success.
  const alreadyAdvanced = ["preview_queued", "preview_processing", "preview_ready", "awaiting_approval", "published"].includes(project.status);
  if (alreadyAdvanced) {
    return NextResponse.json({ message: "Preview already in progress", status: project.status });
  }

  try {
    const result = await generatePreview(id);
    return NextResponse.json({
      message: "Preview generation started",
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
