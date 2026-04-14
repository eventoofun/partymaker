import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";

// Render is handled by KIE.ai + n8n pipeline — this route returns status only

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, videoId),
    with: { event: { columns: { ownerId: true } } },
  });

  if (!invitation || invitation.event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: invitation.status,
    url: invitation.videoUrlVertical ?? null,
    progress: invitation.status === "ready" ? 100 : 0,
  });
}
