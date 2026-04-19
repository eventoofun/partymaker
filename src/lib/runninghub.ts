/**
 * RunningHub REST client — ComfyUI Cloud API
 *
 * Endpoints:
 *   POST /task/openapi/upload  — upload image/audio, returns fileName hash
 *   POST /task/openapi/create  — launch a workflow task
 *   POST /task/openapi/status  — poll task status ("RUNNING"|"QUEUED"|outputs[])
 *   POST /task/openapi/outputs — get [{fileUrl, fileType}] on completion
 *   POST /task/openapi/cancel  — cancel a task
 *
 * Workflow IDs (from .env):
 *   RUNNINGHUB_WORKFLOW_LIPSYNC    = 1986084370261954561  (InfiniteTalk/WanVideo MultiTalk)
 *   RUNNINGHUB_WORKFLOW_IMAGE_GEN  = 1995672692068114433  (NanaBanana 2 Pro Image2Image)
 *   RUNNINGHUB_WORKFLOW_VIDEO_GEN  = 2037060865681264641  (Sparkvideo 2.0 Fast)
 *
 * NOTE: RunningHub uses polling only — no webhook callbacks.
 *
 * Env vars: RUNNINGHUB_API_KEY, RUNNINGHUB_API_BASE_URL
 */

const RH_BASE =
  process.env.RUNNINGHUB_API_BASE_URL ?? "https://www.runninghub.ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RHTaskStatus =
  | "queued"
  | "running"
  | "success"
  | "fail";

export interface RHTaskResult {
  taskId: string;
  status: RHTaskStatus;
  resultUrl?: string;
  errorMessage?: string;
  raw?: Record<string, unknown>;
}

export interface RHSubmittedTask {
  taskId: string;
  workflowId: string;
  requestPayload: Record<string, unknown>;
}

interface RHApiResponse<T = unknown> {
  code: number;
  msg: string;
  errorMessages: string | null;
  data: T;
}

interface NodeInfo {
  nodeId: string;
  fieldName: string;
  fieldValue: string | number;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function apiKey(): string {
  const key = process.env.RUNNINGHUB_API_KEY;
  if (!key) throw new Error("RUNNINGHUB_API_KEY is not set");
  return key;
}

async function rhPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RunningHub POST ${path} → HTTP ${res.status}: ${text}`);
  }
  const json = (await res.json()) as RHApiResponse<T>;
  if (json.code !== 0) {
    throw new Error(`RunningHub POST ${path} error ${json.code}: ${json.msg}`);
  }
  return json.data;
}

// ─── File upload ──────────────────────────────────────────────────────────────

/**
 * Fetch a file from a URL and upload it to RunningHub.
 * Returns the fileName hash that can be used in nodeInfoList.
 */
export async function uploadFileFromUrl(
  sourceUrl: string,
  fileType: "image" | "audio" | "video",
): Promise<string> {
  const fetchRes = await fetch(sourceUrl);
  if (!fetchRes.ok) {
    throw new Error(
      `RunningHub upload: failed to fetch source file from ${sourceUrl} (${fetchRes.status})`,
    );
  }
  const blob = await fetchRes.blob();

  const ext =
    fileType === "audio" ? "mp3" : fileType === "video" ? "mp4" : "jpg";
  const form = new FormData();
  form.append("file", blob, `upload.${ext}`);
  form.append("apiKey", apiKey());
  form.append("fileType", fileType);

  const res = await fetch(`${RH_BASE}/task/openapi/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RunningHub upload HTTP ${res.status}: ${text}`);
  }
  const json = (await res.json()) as RHApiResponse<{ fileName: string }>;
  if (json.code !== 0) {
    throw new Error(`RunningHub upload error ${json.code}: ${json.msg}`);
  }
  return json.data.fileName;
}

// ─── Task lifecycle ───────────────────────────────────────────────────────────

async function createTask(
  workflowId: string,
  nodeInfoList: NodeInfo[],
): Promise<{ taskId: string }> {
  return rhPost<{ taskId: string }>("/task/openapi/create", {
    apiKey: apiKey(),
    workflowId,
    nodeInfoList,
  });
}

async function cancelTask(taskId: string): Promise<void> {
  await rhPost("/task/openapi/cancel", { apiKey: apiKey(), taskId });
}

export { cancelTask as cancelRHTask };

// ─── Status polling ───────────────────────────────────────────────────────────

interface RHOutputFile {
  fileUrl: string;
  fileType: string;
}

/**
 * Poll a RunningHub task.
 * RunningHub has no webhooks — this must be called repeatedly until done.
 *
 * Response shapes:
 *   data = "RUNNING" | "QUEUED"     → still in progress
 *   data = list of {fileUrl}         → completed successfully
 *   data = "FAILED" | "ERROR"        → failed
 */
export async function getRHTaskStatus(taskId: string): Promise<RHTaskResult> {
  const res = await fetch(`${RH_BASE}/task/openapi/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: apiKey(), taskId }),
  });
  if (!res.ok) {
    throw new Error(`RunningHub status HTTP ${res.status}`);
  }
  const json = (await res.json()) as RHApiResponse<
    string | RHOutputFile[] | null
  >;

  if (json.code !== 0) {
    throw new Error(`RunningHub status error ${json.code}: ${json.msg}`);
  }

  const data = json.data;

  // Completed — data is an array of output files
  if (Array.isArray(data)) {
    const first = data[0] as RHOutputFile | undefined;
    return {
      taskId,
      status: "success",
      resultUrl: first?.fileUrl,
      raw: json as unknown as Record<string, unknown>,
    };
  }

  const statusStr = (typeof data === "string" ? data : "").toUpperCase();

  if (statusStr === "RUNNING" || statusStr === "QUEUED") {
    return { taskId, status: statusStr === "QUEUED" ? "queued" : "running" };
  }

  if (statusStr === "FAILED" || statusStr === "ERROR") {
    return {
      taskId,
      status: "fail",
      errorMessage: `RunningHub task ended with status: ${statusStr}`,
    };
  }

  // Unknown status — assume still running
  if (statusStr === "COMPLETED" || statusStr === "SUCCESS") {
    // Fetch outputs separately
    const outputs = await getRHOutputs(taskId);
    return {
      taskId,
      status: "success",
      resultUrl: outputs[0]?.fileUrl,
      raw: json as unknown as Record<string, unknown>,
    };
  }

  return { taskId, status: "running" };
}

async function getRHOutputs(taskId: string): Promise<RHOutputFile[]> {
  const res = await fetch(`${RH_BASE}/task/openapi/outputs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: apiKey(), taskId }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as RHApiResponse<RHOutputFile[]>;
  if (json.code !== 0 || !Array.isArray(json.data)) return [];
  return json.data;
}

// ─── Lipsync — InfiniteTalk / WanVideo MultiTalk ──────────────────────────────
//
// Workflow: 1986084370261954561
// Key nodes:
//   [61] LoadImage  fieldName="image"  → portrait photo (fileName hash)
//   [62] LoadAudio  fieldName="audio"  → audio track (fileName hash)
//   [52] CR Text    fieldName="text"   → text prompt / scene description

export interface RHLipsyncInput {
  /** URL of the portrait image (signed Supabase URL or public URL) */
  imageUrl: string;
  /** URL of the audio file */
  audioUrl: string;
  /** Text guidance sent to the CR Text node */
  prompt?: string;
}

export async function submitRHLipsync(
  input: RHLipsyncInput,
): Promise<RHSubmittedTask> {
  const workflowId = process.env.RUNNINGHUB_WORKFLOW_LIPSYNC ?? "";
  if (!workflowId) throw new Error("RUNNINGHUB_WORKFLOW_LIPSYNC is not set");

  const [imageName, audioName] = await Promise.all([
    uploadFileFromUrl(input.imageUrl, "image"),
    uploadFileFromUrl(input.audioUrl, "audio"),
  ]);

  const nodeInfoList: NodeInfo[] = [
    { nodeId: "61", fieldName: "image", fieldValue: imageName },
    { nodeId: "62", fieldName: "audio", fieldValue: audioName },
    {
      nodeId: "52",
      fieldName: "text",
      fieldValue:
        input.prompt ??
        "Character speaking naturally, realistic lip sync, expressive face",
    },
  ];

  const { taskId } = await createTask(workflowId, nodeInfoList);
  return { taskId, workflowId, requestPayload: { workflowId, nodeInfoList } };
}

// ─── Image stylization — NanaBanana 2 Pro Image2Image ─────────────────────────
//
// Workflow: 1995672692068114433
// Key nodes:
//   [3]  LoadImage                       fieldName="image"  → reference image
//   [2]  RH_Nano_Banana2_Image2Image     fieldName="prompt" → text prompt

export interface RHImageGenInput {
  /** Portrait / reference image URL */
  imageUrl: string;
  /** Stylization prompt */
  prompt: string;
  /** "auto" | "9:16" | "16:9" | "1:1" etc. */
  aspectRatio?: string;
  /** "1k" | "2k" | "4k" */
  resolution?: string;
}

export async function submitRHImageGen(
  input: RHImageGenInput,
): Promise<RHSubmittedTask> {
  const workflowId = process.env.RUNNINGHUB_WORKFLOW_IMAGE_GEN ?? "";
  if (!workflowId) throw new Error("RUNNINGHUB_WORKFLOW_IMAGE_GEN is not set");

  const imageName = await uploadFileFromUrl(input.imageUrl, "image");

  const nodeInfoList: NodeInfo[] = [
    { nodeId: "3", fieldName: "image", fieldValue: imageName },
    { nodeId: "2", fieldName: "prompt", fieldValue: input.prompt },
    {
      nodeId: "2",
      fieldName: "aspectRatio",
      fieldValue: input.aspectRatio ?? "auto",
    },
    {
      nodeId: "2",
      fieldName: "resolution",
      fieldValue: input.resolution ?? "1k",
    },
  ];

  const { taskId } = await createTask(workflowId, nodeInfoList);
  return { taskId, workflowId, requestPayload: { workflowId, nodeInfoList } };
}

// ─── Video generation — Sparkvideo 2.0 Fast ───────────────────────────────────
//
// Workflow: 2037060865681264641
// Key nodes:
//   [2]  LoadImage                                    fieldName="image"    → first frame
//   [1]  RH_RhartVideoSparkvideo20FastMultimodalVideo fieldName="prompt"   → text prompt
//                                                     fieldName="duration" → seconds as string
//                                                     fieldName="resolution" → "720p"|"480p"

export interface RHVideoGenInput {
  /** First frame image URL */
  imageUrl: string;
  /** Generation prompt */
  prompt: string;
  /** Duration in seconds (as string, e.g. "5") */
  duration?: string;
  /** "480p" | "720p" */
  resolution?: string;
}

export async function submitRHVideoGen(
  input: RHVideoGenInput,
): Promise<RHSubmittedTask> {
  const workflowId = process.env.RUNNINGHUB_WORKFLOW_VIDEO_GEN ?? "";
  if (!workflowId) throw new Error("RUNNINGHUB_WORKFLOW_VIDEO_GEN is not set");

  const imageName = await uploadFileFromUrl(input.imageUrl, "image");

  const nodeInfoList: NodeInfo[] = [
    { nodeId: "2", fieldName: "image", fieldValue: imageName },
    { nodeId: "1", fieldName: "prompt", fieldValue: input.prompt },
    { nodeId: "1", fieldName: "duration", fieldValue: input.duration ?? "8" },
    {
      nodeId: "1",
      fieldName: "resolution",
      fieldValue: input.resolution ?? "480p",
    },
  ];

  const { taskId } = await createTask(workflowId, nodeInfoList);
  return { taskId, workflowId, requestPayload: { workflowId, nodeInfoList } };
}
