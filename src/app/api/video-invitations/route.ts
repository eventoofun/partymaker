import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { videoInvitations, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().uuid(),
  template: z.string().min(1),
  wizardData: z.record(z.string()),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { eventId, template, wizardData } = parsed.data;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { userId: true },
  });
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create record as "generating"
  const [video] = await db
    .insert(videoInvitations)
    .values({
      eventId,
      template,
      wizardData: JSON.stringify(wizardData),
      status: "generating",
    })
    .returning();

  // Fire-and-forget: call Dijen.ai API
  callDijenApi(video.id, template, wizardData).catch(console.error);

  return NextResponse.json({ video }, { status: 201 });
}

async function callDijenApi(videoId: string, template: string, wizardData: Record<string, string>) {
  const apiKey = process.env.DIJEN_API_KEY;
  if (!apiKey) {
    // No API key — simulate for dev
    await db.update(videoInvitations)
      .set({ status: "failed", dijenJobId: "no-api-key" })
      .where(eq(videoInvitations.id, videoId));
    return;
  }

  try {
    const res = await fetch("https://api.dijen.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ template, data: wizardData }),
    });

    if (!res.ok) throw new Error(`Dijen API error: ${res.status}`);
    const data = await res.json();

    await db.update(videoInvitations)
      .set({ dijenJobId: data.jobId, status: "generating" })
      .where(eq(videoInvitations.id, videoId));
  } catch (err) {
    console.error("Dijen API error:", err);
    await db.update(videoInvitations)
      .set({ status: "failed" })
      .where(eq(videoInvitations.id, videoId));
  }
}
