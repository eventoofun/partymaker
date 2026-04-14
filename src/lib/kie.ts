/**
 * KIE.ai REST client — Unified Task API
 *
 * Endpoint: POST https://api.kie.ai/api/v1/jobs/createTask
 * Status:   GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...
 *
 * Models used:
 *   Preview  → Seedance 2.0  (bytedance/seedance-2)   — fast, built-in audio, native 9:16
 *   Preview  → Wan 2.5       (wan2.5/image-to-video)  — alternative preview model
 *   Final    → Kling 3.0     (kling-v3)                — premium quality
 *   Lipsync  → InfiniteTalk  (infinitetalk/from-audio)
 *
 * Env vars: KIE_API_KEY, KIE_API_BASE_URL, KIE_CALLBACK_URL, KIE_WEBHOOK_SECRET
 */

const KIE_BASE = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

// ─── Low-level types ──────────────────────────────────────────────────────────

export type KieTaskStatus =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

export interface KieTaskResult {
  taskId: string;
  status: KieTaskStatus;
  /** Available when status === "success" */
  resultUrl?: string;
  /** Available when status === "fail" */
  errorMessage?: string;
  /** Raw provider response */
  raw?: Record<string, unknown>;
}

interface KieApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function apiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY is not set");
  return key;
}

async function kiePost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${KIE_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KIE.ai POST ${path} → ${res.status}: ${text}`);
  }
  const json = (await res.json()) as KieApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(`KIE.ai POST ${path} error ${json.code}: ${json.message}`);
  }
  return json.data;
}

async function kieGet<T>(path: string): Promise<T> {
  const res = await fetch(`${KIE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KIE.ai GET ${path} → ${res.status}: ${text}`);
  }
  const json = (await res.json()) as KieApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(`KIE.ai GET ${path} error ${json.code}: ${json.message}`);
  }
  return json.data;
}

// ─── Unified task submission ──────────────────────────────────────────────────

export interface SubmitTaskOptions {
  modelId: string;
  input: Record<string, unknown>;
  /** Override default callback URL (useful for testing) */
  callbackUrl?: string;
}

export interface SubmittedTask {
  taskId: string;
  modelId: string;
  requestPayload: Record<string, unknown>;
}

/**
 * Submit any Kie.ai task. Returns the taskId immediately.
 * Kie.ai will POST the result to KIE_CALLBACK_URL when done.
 */
export async function submitTask(
  opts: SubmitTaskOptions,
): Promise<SubmittedTask> {
  const callBackUrl =
    opts.callbackUrl ?? process.env.KIE_CALLBACK_URL ?? "";

  const body: Record<string, unknown> = {
    modelId: opts.modelId,
    input: opts.input,
  };
  if (callBackUrl) body.callBackUrl = callBackUrl;

  const data = await kiePost<{ taskId: string }>(
    "/api/v1/jobs/createTask",
    body,
  );

  return {
    taskId: data.taskId,
    modelId: opts.modelId,
    requestPayload: body,
  };
}

// ─── Status polling (fallback for local dev without ngrok) ───────────────────

export async function getTaskStatus(taskId: string): Promise<KieTaskResult> {
  const data = await kieGet<{
    taskId: string;
    status: string;
    resultUrl?: string;
    errorMessage?: string;
    [key: string]: unknown;
  }>(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);

  return {
    taskId: data.taskId,
    status: data.status as KieTaskStatus,
    resultUrl: data.resultUrl,
    errorMessage: data.errorMessage,
    raw: data as Record<string, unknown>,
  };
}

// ─── Seedance 2.0 — Preview video (image → video, built-in audio) ─────────────

export const MODEL_SEEDANCE_PREVIEW = "bytedance/seedance-2";

export interface SeedanceInput {
  /** Main generation prompt (English recommended for best quality) */
  prompt: string;
  /** Image URL to use as the first frame */
  firstFrameUrl: string;
  /** "9:16" for portrait (invitations), "16:9" for landscape */
  aspectRatio?: "9:16" | "16:9" | "1:1";
  /** "480p" for fast preview, "720p" for decent quality */
  resolution?: "480p" | "720p";
  /** Duration in seconds (4–15) */
  durationSeconds?: number;
  /** Generate background audio/music */
  generateAudio?: boolean;
}

/**
 * Submit a Seedance 2.0 preview job.
 * Fast, native 9:16, built-in audio — ideal for draft previews.
 */
export async function submitSeedancePreview(
  input: SeedanceInput,
  callbackUrl?: string,
): Promise<SubmittedTask> {
  return submitTask({
    modelId: MODEL_SEEDANCE_PREVIEW,
    input: {
      prompt: input.prompt,
      first_frame_url: input.firstFrameUrl,
      web_search: false,
      aspect_ratio: input.aspectRatio ?? "9:16",
      resolution: input.resolution ?? "480p",
      duration: input.durationSeconds ?? 8,
      generate_audio: input.generateAudio ?? true,
    },
    callbackUrl,
  });
}

// ─── Wan 2.5 — Alternative preview model ─────────────────────────────────────

export const MODEL_WAN25 = "wan2.5/image-to-video";

export interface Wan25Input {
  /** Main generation prompt */
  prompt: string;
  /** Image URL to animate */
  imageUrl: string;
  /** "9:16" for portrait, "16:9" for landscape */
  aspectRatio?: "9:16" | "16:9" | "1:1";
  /** Duration in seconds (typically 3–10) */
  durationSeconds?: number;
  /** Negative prompt to avoid unwanted elements */
  negativePrompt?: string;
}

/**
 * Submit a Wan 2.5 image-to-video job.
 * Alternative preview model — good motion quality, open-source based.
 */
export async function submitWan25Preview(
  input: Wan25Input,
  callbackUrl?: string,
): Promise<SubmittedTask> {
  return submitTask({
    modelId: MODEL_WAN25,
    input: {
      prompt: input.prompt,
      image_url: input.imageUrl,
      aspect_ratio: input.aspectRatio ?? "9:16",
      duration: input.durationSeconds ?? 5,
      negative_prompt:
        input.negativePrompt ?? "blurry, low quality, distorted",
    },
    callbackUrl,
  });
}

// ─── Kling 3.0 — Final video (high quality render) ───────────────────────────

export const MODEL_KLING_FINAL = "kling-v3";

export interface KlingInput {
  prompt: string;
  negativePrompt?: string;
  firstFrameUrl: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  durationSeconds?: number;
  /** "std" = standard, "pro" = higher quality */
  mode?: "std" | "pro";
}

/**
 * Submit a Kling 3.0 final render job.
 * Higher quality than Seedance/Wan — used after the user approves the preview.
 */
export async function submitKlingFinal(
  input: KlingInput,
  callbackUrl?: string,
): Promise<SubmittedTask> {
  return submitTask({
    modelId: MODEL_KLING_FINAL,
    input: {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt ?? "blurry, low quality, artifacts",
      image_url: input.firstFrameUrl,
      aspect_ratio: input.aspectRatio ?? "9:16",
      duration: String(input.durationSeconds ?? 8),
      mode: input.mode ?? "std",
    },
    callbackUrl,
  });
}

// ─── InfiniteTalk — Lipsync (audio-driven face animation) ────────────────────

export const MODEL_INFINITETALK = "infinitetalk/from-audio";

export interface LipsyncInput {
  /** URL of the portrait image or silent video */
  imageUrl: string;
  /** URL of the audio (mp3/wav/m4a) */
  audioUrl: string;
}

/**
 * Submit an InfiniteTalk lipsync job.
 * Animates a portrait image to match the audio track.
 */
export async function submitLipsync(
  input: LipsyncInput,
  callbackUrl?: string,
): Promise<SubmittedTask> {
  return submitTask({
    modelId: MODEL_INFINITETALK,
    input: {
      image_url: input.imageUrl,
      audio_url: input.audioUrl,
    },
    callbackUrl,
  });
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify that an incoming callback POST came from Kie.ai.
 * Kie.ai signs with a shared secret in the X-Kie-Signature header (HMAC-SHA256).
 */
export async function verifyKieSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = process.env.KIE_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured — skip verification in dev

  if (!signatureHeader) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = Buffer.from(signatureHeader.replace("sha256=", ""), "hex");
  const bodyBytes = encoder.encode(rawBody);

  return crypto.subtle.verify("HMAC", key, sigBytes, bodyBytes);
}

// ─── Legacy exports (kept for backward compatibility) ────────────────────────

export type VideoTheme =
  | "cinematic_birthday"
  | "epic_wedding"
  | "magical_kids"
  | "elegant_graduation"
  | "festive_christmas"
  | "corporate_gala";

export type ProtagonistType = "adult" | "baby" | "group";

export const themePrompts: Record<VideoTheme, string> = {
  cinematic_birthday:
    "Cinematic birthday celebration, golden confetti, bokeh lights, warm color grading, professional film look, 4K quality",
  epic_wedding:
    "Epic wedding scene, romantic lighting, soft white flowers, cinematic lens flare, elegant atmosphere, golden hour",
  magical_kids:
    "Magical children's party, vibrant colors, sparkles and stars, whimsical fantasy atmosphere, joyful and dreamy",
  elegant_graduation:
    "Elegant graduation ceremony, blue and gold tones, academic atmosphere, pride and achievement, cinematic quality",
  festive_christmas:
    "Festive Christmas celebration, warm red and gold, snow bokeh, cozy fireplace lighting, magical winter atmosphere",
  corporate_gala:
    "Corporate gala event, sophisticated ambiance, dark navy and gold, professional lighting, luxury atmosphere",
};

/** @deprecated Use submitSeedancePreview or submitWan25Preview instead */
export async function generateBaseVideo(input: {
  imageUrl: string;
  prompt: string;
  duration?: number;
}): Promise<{ videoUrl: string; requestId: string }> {
  const task = await submitSeedancePreview({
    prompt: input.prompt,
    firstFrameUrl: input.imageUrl,
    durationSeconds: input.duration ?? 5,
  });
  return { videoUrl: "", requestId: task.taskId };
}

/** @deprecated Use submitLipsync instead */
export async function applyLipsync(input: {
  videoUrl: string;
  audioUrl: string;
}): Promise<{ videoUrl: string; requestId: string }> {
  const task = await submitLipsync({
    imageUrl: input.videoUrl,
    audioUrl: input.audioUrl,
  });
  return { videoUrl: "", requestId: task.taskId };
}

export async function getJobStatus(
  _modelId: string,
  requestId: string,
): Promise<{ status: string }> {
  return getTaskStatus(requestId);
}

export async function getJobResult(
  _modelId: string,
  requestId: string,
): Promise<unknown> {
  return getTaskStatus(requestId);
}
