import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { videoInvitations, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().uuid(),
  template: z.string().min(1),
  wizardData: z.record(z.union([z.string(), z.array(z.string())])),
  /** Props ya construidas para Remotion Player — si vienen, guardamos y marcamos ready */
  remotionProps: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { eventId, template, wizardData, remotionProps } = parsed.data;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { userId: true },
  });
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Modo browser-player: guardamos remotionProps + marcamos ready inmediatamente
  if (remotionProps) {
    const fullWizardData = JSON.stringify({ ...wizardData, remotionProps });
    const [video] = await db
      .insert(videoInvitations)
      .values({
        eventId,
        template,
        wizardData: fullWizardData,
        status: "ready",
        // La URL de compartir es la página web animada
        shareUrl: `/invitacion/PLACEHOLDER`,
      })
      .returning();

    // Actualizar con el ID real ahora que lo tenemos
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitacion/${video.id}`;
    const [updated] = await db
      .update(videoInvitations)
      .set({ shareUrl, generatedUrl: shareUrl })
      .where(eq(videoInvitations.id, video.id))
      .returning();

    return NextResponse.json({ video: updated }, { status: 201 });
  }

  // Modo legacy / Dijen.ai
  const [video] = await db
    .insert(videoInvitations)
    .values({
      eventId,
      template,
      wizardData: JSON.stringify(wizardData),
      status: "generating",
    })
    .returning();

  const prompt = typeof wizardData.generatedPrompt === "string" ? wizardData.generatedPrompt : undefined;
  callDijenApi(video.id, template, wizardData as Record<string, string>, prompt).catch(console.error);

  return NextResponse.json({ video }, { status: 201 });
}

async function callDijenApi(videoId: string, template: string, wizardData: Record<string, string>, prompt?: string) {
  const apiKey = process.env.DIJEN_API_KEY;
  if (!apiKey) {
    await db.update(videoInvitations)
      .set({ status: "failed", dijenJobId: "no-api-key" })
      .where(eq(videoInvitations.id, videoId));
    return;
  }

  try {
    const res = await fetch("https://api.dijen.ai/v1/generate", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ template, data: wizardData, prompt }),
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
