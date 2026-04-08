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
    with: { event: { columns: { userId: true } } },
  });

  if (!video || video.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If generating, poll Dijen.ai for status
  if (video.status === "generating" && video.dijenJobId) {
    const apiKey = process.env.DIJEN_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.dijen.ai/v1/jobs/${video.dijenJobId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            const [updated] = await db.update(videoInvitations)
              .set({
                status: "ready",
                generatedUrl: data.videoUrl,
                thumbnailUrl: data.thumbnailUrl,
                shareUrl: data.shareUrl,
              })
              .where(eq(videoInvitations.id, id))
              .returning();
            return NextResponse.json(updated);
          } else if (data.status === "failed") {
            await db.update(videoInvitations).set({ status: "failed" }).where(eq(videoInvitations.id, id));
            return NextResponse.json({ ...video, status: "failed" });
          }
        }
      } catch {
        // Keep returning current status
      }
    }
  }

  return NextResponse.json(video);
}
