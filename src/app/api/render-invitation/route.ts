import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda/client";
import { db } from "@/db";
import { videoInvitations, events } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Validación ───────────────────────────────────────────────────────────────

const schema = z.object({
  videoInvitationId: z.string().uuid(),
  props: z.object({
    celebrantName: z.string(),
    celebrantAge: z.number().optional(),
    protagonistEmoji: z.string(),
    protagonistLabel: z.string(),
    parentMessage: z.string(),
    eventDate: z.string(),
    eventTime: z.string().optional(),
    venue: z.string(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    mood: z.enum(["epic", "magical", "fun", "elegant"]),
  }),
});

// ─── Configuración Lambda ─────────────────────────────────────────────────────

function getLambdaConfig() {
  const region = process.env.REMOTION_AWS_REGION;
  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  if (!region || !functionName || !serveUrl) {
    throw new Error("Remotion Lambda no configurado. Ejecuta: node scripts/deploy-lambda.mjs");
  }
  return { region, functionName, serveUrl };
}

// ─── POST: Iniciar render ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { videoInvitationId, props } = parsed.data;

  // Verificar ownership
  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, videoInvitationId),
    with: { event: { columns: { userId: true } } },
  });

  if (!invitation || invitation.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { region, functionName, serveUrl } = getLambdaConfig();

    // Disparar render en Lambda (fire-and-forget — polling separado)
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: region as Parameters<typeof renderMediaOnLambda>[0]["region"],
      functionName,
      serveUrl,
      composition: "InvitacionFiesta",
      inputProps: props,
      codec: "h264",
      imageFormat: "jpeg",
      maxRetries: 1,
      framesPerLambda: 30,
      privacy: "public",
      outName: `invitacion-${videoInvitationId}.mp4`,
    });

    // Guardar renderId en DB para polling
    await db.update(videoInvitations)
      .set({
        dijenJobId: `lambda:${renderId}:${bucketName}:${region}`,
        status: "generating",
      })
      .where(eq(videoInvitations.id, videoInvitationId));

    return NextResponse.json({ renderId, status: "generating" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[render-invitation]", msg);

    await db.update(videoInvitations)
      .set({ status: "failed" })
      .where(eq(videoInvitations.id, videoInvitationId));

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET: Polling del progreso ────────────────────────────────────────────────
// GET /api/render-invitation?videoId=<uuid>

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, videoId),
    with: { event: { columns: { userId: true } } },
  });

  if (!invitation || invitation.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Si no tiene Lambda job, devolver estado actual
  if (!invitation.dijenJobId?.startsWith("lambda:")) {
    return NextResponse.json({ status: invitation.status, progress: 0 });
  }

  // Parsear "lambda:<renderId>:<bucketName>:<region>"
  const [, renderId, bucketName, region] = invitation.dijenJobId.split(":");

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: process.env.REMOTION_FUNCTION_NAME!,
      region: region as Parameters<typeof getRenderProgress>[0]["region"],
    });

    if (progress.done && progress.outputFile) {
      // Guardar URL pública del vídeo
      const outputUrl = progress.outputFile;
      await db.update(videoInvitations)
        .set({
          status: "ready",
          generatedUrl: outputUrl,
          shareUrl: outputUrl,
        })
        .where(eq(videoInvitations.id, videoId));

      return NextResponse.json({ status: "ready", url: outputUrl, progress: 100 });
    }

    if (progress.fatalErrorEncountered) {
      await db.update(videoInvitations)
        .set({ status: "failed" })
        .where(eq(videoInvitations.id, videoId));
      return NextResponse.json({ status: "failed", progress: 0 });
    }

    const pct = Math.round((progress.overallProgress ?? 0) * 100);
    return NextResponse.json({ status: "generating", progress: pct });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
