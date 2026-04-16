/**
 * POST /api/integrations/kie/callback
 * Receives async job results from Kie.ai.
 *
 * Kie.ai calls this URL with:
 * {
 *   taskId: string,
 *   status: "success" | "fail",
 *   resultUrl?: string,     // video URL (success only)
 *   errorMessage?: string,  // (fail only)
 *   ...rest
 * }
 *
 * Configured via KIE_CALLBACK_URL env var.
 * Secured via KIE_WEBHOOK_SECRET (HMAC-SHA256 on the raw body).
 */
import { NextResponse } from "next/server";
import { verifyKieSignature } from "@/lib/kie";
import { handleKieCallback } from "@/lib/video-invitations/orchestrator";

export async function POST(req: Request) {
  // 1. Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-kie-signature");

  // 2. Verify the request came from Kie.ai
  const isValid = await verifyKieSignature(rawBody, signature);
  if (!isValid) {
    console.warn("[kie-callback] Invalid signature — rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { taskId, status, resultUrl, errorMessage } = payload as {
    taskId?: string;
    status?: string;
    resultUrl?: string;
    errorMessage?: string;
  };

  if (!taskId || !status) {
    return NextResponse.json({ error: "Missing taskId or status" }, { status: 400 });
  }

  if (status !== "success" && status !== "fail") {
    // Intermediate status update (waiting/queuing/generating) — acknowledge and ignore
    return NextResponse.json({ ok: true, ignored: true });
  }

  // 4. Process the callback — MUST be awaited.
  // Vercel kills fire-and-forget promises after the response is sent.
  // handleKieCallback is fast enough (DB ops + Kie.ai submit < 5s).
  try {
    await handleKieCallback({
      taskId,
      status: status as "success" | "fail",
      resultUrl,
      errorMessage,
      raw: payload,
    });
  } catch (err) {
    console.error("[kie-callback] Error processing callback:", err);
    // Still return 200 — Kie.ai should not retry on our internal errors
  }

  return NextResponse.json({ ok: true });
}
