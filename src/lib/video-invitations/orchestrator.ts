/**
 * Video invitation orchestrator.
 *
 * Coordinates the full lifecycle of a VideoProject:
 *   1. generatePreview()  — compile prompt → submit to Seedance/Wan → store job
 *   2. handleKieCallback() — process Kie.ai webhook → store video → advance state
 *   3. approveFinal()     — user approves preview → submit Kling final render
 *
 * All DB writes go through Drizzle. All Kie.ai calls go through lib/kie.ts.
 * All Storage calls go through ./storage.ts.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  videoProjects,
  promptVersions,
  generationJobs,
  videoAssets,
  type VideoProject,
  type GenerationJob,
} from "@/db/schema";
import {
  submitSeedancePreview,
  submitKlingFinal,
  submitLipsync,
  type KieTaskResult,
} from "@/lib/kie";
import { compilePrompt } from "./prompt-engine";
import { assertTransition, type VideoProjectStatus } from "./state-machine";
import { storeVideoFromUrl, getSignedAssetUrl } from "./storage";

// ─── Generate Preview ─────────────────────────────────────────────────────────

export interface GeneratePreviewResult {
  jobId: string;
  taskId: string;
  model: string;
}

/**
 * Compile the prompt and submit a preview job to Kie.ai.
 * Returns immediately — result arrives via callback webhook.
 */
export async function generatePreview(
  projectId: string,
): Promise<GeneratePreviewResult> {
  // 1. Load project
  const project = await getProjectOrThrow(projectId);

  if (!project.protagonistImagePath) {
    throw new Error("Debes subir la foto del protagonista antes de generar el preview");
  }

  // Accept both assets_uploaded and prompt_compiled as valid starting states.
  // assets_uploaded → preview_queued is allowed in the state machine (skipping prompt_compiled
  // as a separate step since prompt compilation happens inside this function).
  if (!["assets_uploaded", "prompt_compiled"].includes(project.status)) {
    throw new Error(
      `No se puede generar un preview en estado: ${project.status}. ` +
      "Sube los archivos del protagonista primero.",
    );
  }

  assertTransition(project.status as VideoProjectStatus, "preview_queued");

  // 2. Get a signed URL for the protagonist image (Kie.ai needs a public URL)
  const imageUrl = await getSignedAssetUrl(project.protagonistImagePath, 3600);

  // 3. Compile prompt
  const compiled = compilePrompt({
    kind: "preview",
    mode: project.mode as "visual" | "lipsync",
    protagonistName: project.protagonistName,
    protagonistDescription: project.protagonistDescription,
    transformationDescription: project.transformationDescription,
    sceneDescription: project.sceneDescription,
    styleDescription: project.styleDescription,
    durationSeconds: project.durationSeconds,
    aspectRatio: project.aspectRatio,
  });

  // 4. Save prompt version
  const [promptVersion] = await db
    .insert(promptVersions)
    .values({
      projectId,
      kind: "preview",
      visualPrompt: compiled.visualPrompt,
      negativePrompt: compiled.negativePrompt,
      model: compiled.model,
      inputSnapshot: { ...compiled.modelInput, first_frame_url: imageUrl },
    })
    .returning();

  // 5. Submit to Kie.ai (lipsync vs visual)
  let submitted: { taskId: string; modelId: string; requestPayload: Record<string, unknown> };

  if (project.mode === "lipsync" && project.audioPath) {
    const audioUrl = await getSignedAssetUrl(project.audioPath, 3600);
    submitted = await submitLipsync({ imageUrl, audioUrl });
  } else {
    submitted = await submitSeedancePreview({
      prompt: compiled.visualPrompt,
      firstFrameUrl: imageUrl,
      aspectRatio: project.aspectRatio as "9:16" | "16:9" | "1:1",
      resolution: "480p",
      durationSeconds: project.durationSeconds,
      generateAudio: true,
    });
  }

  // 6. Create generation job record
  const [job] = await db
    .insert(generationJobs)
    .values({
      projectId,
      promptVersionId: promptVersion.id,
      kind: "preview",
      status: "queued",
      provider: "kie",
      providerModel: submitted.modelId,
      providerTaskId: submitted.taskId,
      requestPayload: submitted.requestPayload,
      startedAt: new Date(),
    })
    .returning();

  // 7. Advance project state
  await db
    .update(videoProjects)
    .set({ status: "preview_queued", updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));

  return { jobId: job.id, taskId: submitted.taskId, model: submitted.modelId };
}

// ─── Handle Kie.ai Callback ───────────────────────────────────────────────────

export interface CallbackPayload {
  taskId: string;
  status: "success" | "fail";
  resultUrl?: string;
  errorMessage?: string;
  raw: Record<string, unknown>;
}

/**
 * Process an incoming Kie.ai webhook callback.
 * Finds the matching job, stores the video, and advances the project state.
 */
export async function handleKieCallback(payload: CallbackPayload): Promise<void> {
  // 1. Find the job by taskId
  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.providerTaskId, payload.taskId))
    .limit(1);

  if (!job) {
    console.warn(`[kie-callback] No job found for taskId=${payload.taskId}`);
    return;
  }

  if (payload.status === "fail") {
    await handleJobFailure(job, payload.errorMessage ?? "Unknown error", payload.raw);
    return;
  }

  if (!payload.resultUrl) {
    await handleJobFailure(job, "Kie.ai returned success but no resultUrl", payload.raw);
    return;
  }

  try {
    // 2. Download and store the video in Supabase Storage
    const stored = await storeVideoFromUrl({
      projectId: job.projectId,
      jobId: job.id,
      kind: job.kind === "preview" ? "preview_video" : "final_video",
      sourceUrl: payload.resultUrl,
    });

    // 3. Save asset record
    await db.insert(videoAssets).values({
      projectId: job.projectId,
      jobId: job.id,
      kind: job.kind === "preview" ? "preview_video" : "final_video",
      storagePath: stored.storagePath,
      publicUrl: stored.publicUrl,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    });

    // 4. Update job to ready
    await db
      .update(generationJobs)
      .set({
        status: "ready",
        callbackPayload: payload.raw,
        resultVideoUrl: payload.resultUrl,
        storedVideoPath: stored.storagePath,
        completedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));

    // 5. Advance project state
    const nextStatus = job.kind === "preview" ? "preview_ready" : "final_ready";
    const videoUrlField =
      job.kind === "preview"
        ? { previewVideoUrl: stored.publicUrl }
        : { finalVideoUrl: stored.publicUrl };

    const projectNextStatus = job.kind === "preview" ? "awaiting_approval" : "final_ready";

    await db
      .update(videoProjects)
      .set({
        status: projectNextStatus,
        ...videoUrlField,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, job.projectId));

    console.log(
      `[kie-callback] Job ${job.id} (${job.kind}) completed → project ${job.projectId} → ${projectNextStatus}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await handleJobFailure(job, msg, payload.raw);
  }
}

// ─── Approve Preview → Submit Final ──────────────────────────────────────────

export interface ApproveFinalResult {
  jobId: string;
  taskId: string;
}

/**
 * User approved the preview. Submit a Kling 3.0 final render job.
 */
export async function approveFinal(
  projectId: string,
): Promise<ApproveFinalResult> {
  const project = await getProjectOrThrow(projectId);
  assertTransition(project.status, "approved_for_final");

  if (!project.protagonistImagePath) {
    throw new Error("Protagonist image missing");
  }

  // Advance to approved_for_final first
  await db
    .update(videoProjects)
    .set({ status: "approved_for_final", updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));

  // Get the last preview prompt version to reuse inputs
  const [lastPromptVersion] = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.projectId, projectId))
    .orderBy(promptVersions.createdAt)
    .limit(1);

  const imageUrl = await getSignedAssetUrl(project.protagonistImagePath, 3600);

  // Compile final prompt (higher quality suffix)
  const compiled = compilePrompt({
    kind: "final",
    mode: project.mode as "visual" | "lipsync",
    protagonistName: project.protagonistName,
    protagonistDescription: project.protagonistDescription,
    transformationDescription: project.transformationDescription,
    sceneDescription: project.sceneDescription,
    styleDescription: project.styleDescription,
    durationSeconds: project.durationSeconds,
    aspectRatio: project.aspectRatio,
  });

  // Save final prompt version
  const [finalPromptVersion] = await db
    .insert(promptVersions)
    .values({
      projectId,
      kind: "final",
      visualPrompt: compiled.visualPrompt,
      negativePrompt: compiled.negativePrompt,
      model: compiled.model,
      inputSnapshot: { ...compiled.modelInput, image_url: imageUrl },
    })
    .returning();

  // Submit to Kling 3.0
  const submitted = await submitKlingFinal({
    prompt: compiled.visualPrompt,
    negativePrompt: compiled.negativePrompt,
    firstFrameUrl: imageUrl,
    aspectRatio: project.aspectRatio as "9:16" | "16:9" | "1:1",
    durationSeconds: project.durationSeconds,
    mode: "std",
  });

  // Create job record
  const [job] = await db
    .insert(generationJobs)
    .values({
      projectId,
      promptVersionId: finalPromptVersion.id,
      kind: "final",
      status: "queued",
      provider: "kie",
      providerModel: submitted.modelId,
      providerTaskId: submitted.taskId,
      requestPayload: submitted.requestPayload,
      startedAt: new Date(),
    })
    .returning();

  // Advance project state
  await db
    .update(videoProjects)
    .set({ status: "final_queued", updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));

  return { jobId: job.id, taskId: submitted.taskId };
}

// ─── Regenerate Preview ───────────────────────────────────────────────────────

/**
 * Reset project back to prompt_compiled so the user can tweak inputs and
 * generate a new preview. Increments the regeneration counter.
 */
export async function regeneratePreview(projectId: string): Promise<void> {
  const project = await getProjectOrThrow(projectId);

  if (project.regenerationCount >= project.maxRegenerations) {
    throw new Error(
      `Maximum regenerations reached (${project.maxRegenerations}). ` +
        "Contact support to increase your limit.",
    );
  }

  assertTransition(project.status, "prompt_compiled");

  await db
    .update(videoProjects)
    .set({
      status: "prompt_compiled",
      regenerationCount: project.regenerationCount + 1,
      previewVideoUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(videoProjects.id, projectId));
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publishProject(projectId: string): Promise<void> {
  const project = await getProjectOrThrow(projectId);
  assertTransition(project.status, "published");

  await db
    .update(videoProjects)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getProjectOrThrow(projectId: string): Promise<VideoProject> {
  const [project] = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  if (!project) throw new Error(`VideoProject not found: ${projectId}`);
  return project;
}

async function handleJobFailure(
  job: GenerationJob,
  errorMessage: string,
  raw: Record<string, unknown>,
): Promise<void> {
  await db
    .update(generationJobs)
    .set({
      status: "failed",
      errorMessage,
      callbackPayload: raw,
      completedAt: new Date(),
    })
    .where(eq(generationJobs.id, job.id));

  const failStatus = job.kind === "preview" ? "preview_failed" : "final_failed";
  await db
    .update(videoProjects)
    .set({ status: failStatus, updatedAt: new Date() })
    .where(eq(videoProjects.id, job.projectId));

  console.error(`[kie-callback] Job ${job.id} failed: ${errorMessage}`);
}
