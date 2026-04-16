/**
 * POST /api/admin/trigger-preview
 * Internal-only route to manually trigger generate-preview for a stuck project.
 * Protected by ADMIN_SECRET env var. Used for ops/recovery only.
 *
 * Body: { projectId: string, secret: string }
 */
import { NextResponse } from "next/server";
import { generatePreview } from "@/lib/video-invitations/orchestrator";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { projectId?: string; secret?: string };

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || body.secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  try {
    const result = await generatePreview(body.projectId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
