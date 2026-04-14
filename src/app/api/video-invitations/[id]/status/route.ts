import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { videoInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, id),
    with: { event: { columns: { ownerId: true } } },
  });

  if (!video || video.event.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: video.id,
    status: video.status,
    videoUrlVertical: video.videoUrlVertical,
    thumbnailUrl: video.thumbnailUrl,
    renderError: video.renderError,
  });
}
