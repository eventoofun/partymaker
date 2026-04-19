/**
 * Video invitation orchestrator.
 *
 * Full lifecycle of a VideoProject:
 *   1. generateProcessedImage() — upload photo → NanaBanana Pro → styled image
 *   2. generatePreview()        — styled image + prompt → Seedance 2 → preview video
 *   3. approveFinal()           — user approves preview → Seedance 720p final render
 *   4. handleKieCallback()      — processes Kie.ai webhook/poll results for all job types
 *
 * All DB writes go through Drizzle. All Kie.ai calls go through lib/kie.ts.
 * All Storage calls go through ./storage.ts.
 */

import { eq, and, or, desc } from "drizzle-orm";
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
  submitNanaBananaPro,
  submitSeedancePreview,
  submitLipsync,
  getTaskStatus,
} from "@/lib/kie";
import {
  submitRHImageGen,
  submitRHLipsync,
  submitRHVideoGen,
  getRHTaskStatus,
} from "@/lib/runninghub";
import { compilePrompt } from "./prompt-engine";
import { assertTransition, type VideoProjectStatus } from "./state-machine";
import { storeVideoFromUrl, storeImageFromUrl, getSignedAssetUrl } from "./storage";
import { swapFaceOnScene } from "@/lib/falai";

// ─── Step 1: Generate Processed Image (NanaBanana Pro) ───────────────────────

export interface GenerateImageResult {
  jobId: string;
  taskId: string;
  model: string;
}

/**
 * Compile the scene prompt and submit a NanaBanana Pro image-processing job.
 * Takes the protagonist photos (up to 3) and transforms them into a styled
 * image that matches the scene description. Returns immediately.
 *
 * @param additionalImagePaths - Extra Supabase storage paths uploaded in step 0
 *   (beyond the primary protagonistImagePath). They are signed and passed to
 *   NanaBanana Pro as additional reference images for better results.
 */
export async function generateProcessedImage(
  projectId: string,
  additionalImagePaths?: string[],
): Promise<GenerateImageResult> {
  const project = await getProjectOrThrow(projectId);

  if (!project.protagonistImagePath) {
    throw new Error("Sube la foto del protagonista antes de continuar.");
  }

  // Allow starting from assets_uploaded or prompt_compiled (legacy)
  if (!["assets_uploaded", "prompt_compiled"].includes(project.status)) {
    throw new Error(
      `No se puede procesar la imagen en estado: ${project.status}. ` +
      "Sube la foto del protagonista primero.",
    );
  }

  assertTransition(project.status as VideoProjectStatus, "image_processing");

  // 1. Get signed URLs for all protagonist images (NanaBanana accepts up to 3)
  const imageUrl = await getSignedAssetUrl(project.protagonistImagePath, 3600);
  const extraUrls = additionalImagePaths?.length
    ? await Promise.all(additionalImagePaths.map((p) => getSignedAssetUrl(p, 3600)))
    : [];
  // Deduplicate: primary is always first, then extras (skip if same path)
  const allImageUrls = [imageUrl, ...extraUrls.filter((u) => u !== imageUrl)];

  // 2. Compile the image prompt (style + scene description → NanaBanana prompt)
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

  // 3. Save prompt version
  const [promptVersion] = await db
    .insert(promptVersions)
    .values({
      projectId,
      kind: "preview",
      visualPrompt: compiled.visualPrompt,
      negativePrompt: compiled.negativePrompt,
      model: "runninghub-nana-banana-pro",
      inputSnapshot: { image_input: allImageUrls, aspect_ratio: project.aspectRatio },
    })
    .returning();

  // 4. Submit to RunningHub (sole engine for image generation — no Kie.ai fallback)
  const nanaBananaPrompt = buildNanaBananaPrompt(project, compiled.visualPrompt);

  let rh: Awaited<ReturnType<typeof submitRHImageGen>>;
  try {
    rh = await submitRHImageGen({
      imageUrl: allImageUrls[0],
      prompt: nanaBananaPrompt,
      aspectRatio: project.aspectRatio ?? "9:16",
      resolution: "1k",
    });
    console.log(`[generateProcessedImage] RunningHub submitted — taskId=${rh.taskId}`);
  } catch (rhErr) {
    const errorMsg = rhErr instanceof Error ? rhErr.message : String(rhErr);
    console.error(`[generateProcessedImage] RunningHub submission failed: ${errorMsg}`);
    // Store the failure in DB so it surfaces in the UI error message
    await db.insert(generationJobs).values({
      projectId,
      promptVersionId: promptVersion.id,
      kind: "image",
      status: "failed",
      provider: "runninghub",
      providerModel: process.env.RUNNINGHUB_WORKFLOW_IMAGE_GEN ?? "unknown",
      providerTaskId: "submission-failed",
      errorMessage: errorMsg,
      requestPayload: { imageUrl: allImageUrls[0], prompt: nanaBananaPrompt },
      startedAt: new Date(),
      completedAt: new Date(),
    });
    await db
      .update(videoProjects)
      .set({ status: "image_failed", updatedAt: new Date() })
      .where(eq(videoProjects.id, projectId));
    throw new Error(`RunningHub: ${errorMsg}`);
  }

  // 5. Create generation job record
  const [job] = await db
    .insert(generationJobs)
    .values({
      projectId,
      promptVersionId: promptVersion.id,
      kind: "image",
      status: "queued",
      provider: "runninghub",
      providerModel: rh.workflowId,
      providerTaskId: rh.taskId,
      requestPayload: rh.requestPayload,
      startedAt: new Date(),
    })
    .returning();

  // 6. Advance project state
  await db
    .update(videoProjects)
    .set({ status: "image_processing", updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));

  return { jobId: job.id, taskId: rh.taskId, model: rh.workflowId };
}

/**
 * Build the NanaBanana Pro prompt — styles the protagonist for the scene.
 * Focuses on the desired output image characteristics.
 */
function buildNanaBananaPrompt(
  project: VideoProject,
  visualPrompt: string,
): string {
  const parts: string[] = [
    `Portrait of ${project.protagonistName || "the protagonist"}`,
  ];

  if (project.protagonistDescription) {
    parts.push(project.protagonistDescription);
  }

  if (project.transformationDescription) {
    parts.push(project.transformationDescription);
  }

  if (project.sceneDescription) {
    parts.push(project.sceneDescription);
  }

  if (project.styleDescription) {
    parts.push(project.styleDescription);
  }

  parts.push("cinematic portrait, professional photography, high quality, sharp focus, perfect lighting");

  return parts.join(", ");
}

// ─── Step 2: Generate Preview Video (Seedance 2) ─────────────────────────────

export interface GeneratePreviewResult {
  jobId: string;
  taskId: string;
  model: string;
}

/**
 * Submit a preview video job to Seedance 2 using the NanaBanana processed image.
 * Must be called after generateProcessedImage() completes (status: image_ready).
 * Returns immediately — result arrives via polling or webhook callback.
 */
export async function generatePreview(
  projectId: string,
): Promise<GeneratePreviewResult> {
  const project = await getProjectOrThrow(projectId);

  if (!project.protagonistImagePath) {
    throw new Error("Foto del protagonista no encontrada.");
  }

  // Lipsync skips NanaBanana and can start from assets_uploaded.
  // Visual mode must wait for image_ready (NanaBanana processed image as first frame).
  const validFromStatuses = project.mode === "lipsync"
    ? ["assets_uploaded", "image_ready"]
    : ["image_ready"];

  if (!validFromStatuses.includes(project.status)) {
    throw new Error(
      `No se puede generar el preview en estado: ${project.status}. ` +
      "Espera a que la imagen IA esté lista primero.",
    );
  }

  assertTransition(project.status as VideoProjectStatus, "preview_queued");

  // Atomically claim → preview_queued BEFORE any Kie.ai work.
  // If two requests race here, only one wins — the other gets null and throws.
  const [claimed] = await db
    .update(videoProjects)
    .set({ status: "preview_queued", updatedAt: new Date() })
    .where(and(
      eq(videoProjects.id, projectId),
      or(eq(videoProjects.status, "assets_uploaded"), eq(videoProjects.status, "image_ready")),
    ))
    .returning();

  if (!claimed) {
    throw new Error(
      "El preview ya está siendo generado (otro proceso se adelantó).",
    );
  }

  // Use the NanaBanana processed image as first frame (fallback to original)
  const firstFrameUrl = project.processedImageUrl
    ?? await getSignedAssetUrl(project.protagonistImagePath, 3600);

  // Compile prompt
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

  // Save prompt version
  const [promptVersion] = await db
    .insert(promptVersions)
    .values({
      projectId,
      kind: "preview",
      visualPrompt: compiled.visualPrompt,
      negativePrompt: compiled.negativePrompt,
      model: compiled.model,
      inputSnapshot: { ...compiled.modelInput, first_frame_url: firstFrameUrl },
    })
    .returning();

  // Submit to AI — RunningHub (primary) with Kie.ai (fallback)
  let submitted: { taskId: string; modelId: string; provider: "runninghub" | "kie"; requestPayload: Record<string, unknown> };
  try {
    if (project.mode === "lipsync" && project.audioPath) {
      console.log(
        `[generatePreview] Submitting lipsync for ${projectId} — audioPath=${project.audioPath} imageUrl=${firstFrameUrl.substring(0, 60)}...`,
      );
      const audioUrl = await getSignedAssetUrl(project.audioPath, 3600);
      try {
        const rh = await submitRHLipsync({
          imageUrl: firstFrameUrl,
          audioUrl,
          prompt: compiled.visualPrompt,
        });
        submitted = { taskId: rh.taskId, modelId: rh.workflowId, provider: "runninghub", requestPayload: rh.requestPayload };
        console.log(`[generatePreview] RunningHub lipsync submitted — taskId=${submitted.taskId}`);
      } catch (rhErr) {
        console.warn(`[generatePreview] RunningHub lipsync failed, falling back to Kie.ai: ${rhErr instanceof Error ? rhErr.message : rhErr}`);
        const kie = await submitLipsync({
          imageUrl: firstFrameUrl,
          audioUrl,
          prompt: compiled.visualPrompt,
          resolution: "480p",
        });
        submitted = { taskId: kie.taskId, modelId: kie.modelId, provider: "kie", requestPayload: kie.requestPayload };
        console.log(`[generatePreview] Kie.ai lipsync submitted — taskId=${submitted.taskId}`);
      }
    } else {
      console.log(
        `[generatePreview] Submitting video for ${projectId} — mode=${project.mode} audioPath=${project.audioPath ?? "NULL"}`,
      );
      try {
        const rh = await submitRHVideoGen({
          imageUrl: firstFrameUrl,
          prompt: compiled.visualPrompt,
          duration: String(project.durationSeconds ?? 8),
          resolution: "480p",
        });
        submitted = { taskId: rh.taskId, modelId: rh.workflowId, provider: "runninghub", requestPayload: rh.requestPayload };
        console.log(`[generatePreview] RunningHub video submitted — taskId=${submitted.taskId}`);
      } catch (rhErr) {
        console.warn(`[generatePreview] RunningHub video failed, falling back to Kie.ai: ${rhErr instanceof Error ? rhErr.message : rhErr}`);
        const kie = await submitSeedancePreview({
          prompt: compiled.visualPrompt,
          firstFrameUrl,
          aspectRatio: project.aspectRatio as "9:16" | "16:9" | "1:1",
          resolution: "480p",
          durationSeconds: project.durationSeconds,
          generateAudio: true,
        });
        submitted = { taskId: kie.taskId, modelId: kie.modelId, provider: "kie", requestPayload: kie.requestPayload };
        console.log(`[generatePreview] Kie.ai Seedance submitted — taskId=${submitted.taskId}`);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[generatePreview] All providers failed for ${projectId}: ${errMsg}`);
    // Roll back: lipsync → assets_uploaded; visual mode → image_ready (processed image still valid).
    const rollbackStatus = project.mode === "lipsync" ? "assets_uploaded" : "image_ready";
    await db
      .update(videoProjects)
      .set({ status: rollbackStatus, updatedAt: new Date() })
      .where(eq(videoProjects.id, projectId));
    throw err;
  }

  // Create generation job record
  const [job] = await db
    .insert(generationJobs)
    .values({
      projectId,
      promptVersionId: promptVersion.id,
      kind: "preview",
      status: "queued",
      provider: submitted.provider,
      providerModel: submitted.modelId,
      providerTaskId: submitted.taskId,
      requestPayload: submitted.requestPayload,
      startedAt: new Date(),
    })
    .returning();

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
 * Process an incoming Kie.ai webhook callback (or polling result).
 * Handles all job kinds: image, preview, final.
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

  // Guard against double-processing
  if (job.status === "ready" || job.status === "failed") {
    console.warn(`[kie-callback] Job ${job.id} already processed (${job.status}), skipping`);
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
    if (job.kind === "image") {
      await handleImageJobSuccess(job, payload);
    } else {
      await handleVideoJobSuccess(job, payload);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await handleJobFailure(job, msg, payload.raw);
  }
}

/**
 * Process a completed NanaBanana Pro image job.
 * Stores the processed image and advances project to image_ready.
 */
async function handleImageJobSuccess(
  job: GenerationJob,
  payload: CallbackPayload,
): Promise<void> {
  // Download and store the processed image in Supabase Assets
  const stored = await storeImageFromUrl({
    projectId: job.projectId,
    jobId: job.id,
    sourceUrl: payload.resultUrl!,
  });

  // Save asset record
  await db.insert(videoAssets).values({
    projectId: job.projectId,
    jobId: job.id,
    kind: "processed_image",
    storagePath: stored.storagePath,
    publicUrl: stored.publicUrl,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
  });

  // ── fal.ai face-swap: insert protagonist's real face into the NanaBanana scene ─
  // Two-step pipeline: NanaBanana generates the themed scene, face-swap inserts
  // the real child's face into that scene. This preserves the stylised party
  // aesthetic while guaranteeing face identity.
  //
  //   base_image_url = NanaBanana scene  (face goes INTO here)
  //   swap_image_url = protagonist photo  (face taken FROM here)
  let finalImageUrl    = stored.publicUrl;
  let finalStoragePath = stored.storagePath;

  if (process.env.FAL_KEY) {
    try {
      const project = await getProjectOrThrow(job.projectId);
      const faceUrl  = await getSignedAssetUrl(project.protagonistImagePath!, 3600);

      console.log(`[faceswap] Inserting protagonist face for project ${job.projectId}`);
      const swappedUrl = await swapFaceOnScene({
        sceneImageUrl: stored.publicUrl,  // NanaBanana styled scene
        faceImageUrl:  faceUrl,           // protagonist's real photo
      });

      const swappedStored = await storeImageFromUrl({
        projectId: job.projectId,
        jobId:     job.id,
        sourceUrl: swappedUrl,
      });

      finalImageUrl    = swappedStored.publicUrl;
      finalStoragePath = swappedStored.storagePath;
      console.log(`[faceswap] Completed for project ${job.projectId}`);
    } catch (err) {
      console.warn(
        `[faceswap] Failed for project ${job.projectId}, using NanaBanana scene as fallback: ` +
        (err instanceof Error ? err.message : err),
      );
      // Graceful degradation — the NanaBanana scene is still a good result
    }
  } else {
    console.warn("[faceswap] Skipped — FAL_KEY not configured");
  }

  // Update job to ready
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

  // Advance project: store processed image URL, move to image_ready
  await db
    .update(videoProjects)
    .set({
      status: "image_ready",
      processedImagePath: finalStoragePath,
      processedImageUrl:  finalImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(videoProjects.id, job.projectId));

  console.log(
    `[kie-callback] Image job ${job.id} completed → project ${job.projectId} → image_ready`,
  );

  // For lipsync projects: auto-trigger preview generation immediately.
  // MUST be awaited — Vercel kills fire-and-forget promises after the response is sent.
  const project = await getProjectOrThrow(job.projectId);
  console.log(
    `[auto-preview] Project ${job.projectId} — mode=${project.mode} audioPath=${project.audioPath ?? "NULL"}`,
  );
  if (project.mode === "lipsync" && project.audioPath) {
    try {
      const previewResult = await generatePreview(job.projectId);
      console.log(
        `[auto-preview] InfiniteTalk job submitted for ${job.projectId} — taskId=${previewResult.taskId} model=${previewResult.model}`,
      );
    } catch (err) {
      console.error(
        `[auto-preview] Failed to auto-trigger preview for ${job.projectId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.warn(
      `[auto-preview] Skipped for ${job.projectId} — mode=${project.mode} audioPath=${project.audioPath ?? "NULL"}`,
    );
  }
}

/**
 * Process a completed preview or final video job.
 * Stores the video and advances project state.
 */
async function handleVideoJobSuccess(
  job: GenerationJob,
  payload: CallbackPayload,
): Promise<void> {
  // Download and store the video in Supabase Storage
  const stored = await storeVideoFromUrl({
    projectId: job.projectId,
    jobId: job.id,
    kind: job.kind === "preview" ? "preview_video" : "final_video",
    sourceUrl: payload.resultUrl!,
  });

  // Save asset record
  await db.insert(videoAssets).values({
    projectId: job.projectId,
    jobId: job.id,
    kind: job.kind === "preview" ? "preview_video" : "final_video",
    storagePath: stored.storagePath,
    publicUrl: stored.publicUrl,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
  });

  // Update job to ready
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

  // Advance project state.
  // Final videos auto-publish so they immediately appear on the public event page.
  const projectNextStatus =
    job.kind === "preview" ? "awaiting_approval" :
    job.kind === "final"   ? "published"          : "final_ready";

  const videoUrlField =
    job.kind === "preview"
      ? { previewVideoUrl: stored.publicUrl }
      : { finalVideoUrl: stored.publicUrl };

  const extraFields =
    job.kind === "final" ? { publishedAt: new Date() } : {};

  await db
    .update(videoProjects)
    .set({
      status: projectNextStatus,
      ...videoUrlField,
      ...extraFields,
      updatedAt: new Date(),
    })
    .where(eq(videoProjects.id, job.projectId));

  console.log(
    `[kie-callback] ${job.kind} job ${job.id} completed → project ${job.projectId} → ${projectNextStatus}`,
  );
}

// ─── Approve Preview → Submit Final ──────────────────────────────────────────

export interface ApproveFinalResult {
  jobId: string;
  taskId: string;
}

/**
 * User approved the preview. Submit a Seedance final render job.
 * Default resolution: 480p (cost-efficient). Users can upsell to 720p/1080p.
 *
 * ATOMIC: We submit to KIE.ai BEFORE updating the DB, so if the API call
 * fails the project stays at awaiting_approval and can be retried.
 */
export async function approveFinal(
  projectId: string,
  resolution: "480p" | "720p" | "1080p" = "480p",
): Promise<ApproveFinalResult> {
  const project = await getProjectOrThrow(projectId);
  assertTransition(project.status, "approved_for_final");

  if (!project.protagonistImagePath) {
    throw new Error("Protagonist image missing");
  }

  // Use processed image if available, fall back to original
  const imageUrl = project.processedImageUrl
    ?? await getSignedAssetUrl(project.protagonistImagePath, 3600);

  // Compile final prompt
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

  // Submit to AI FIRST — if this throws, project stays at awaiting_approval
  // RunningHub (primary) with Kie.ai (fallback). Default 480p — users can upsell.
  let submitted: { taskId: string; modelId: string; provider: "runninghub" | "kie"; requestPayload: Record<string, unknown> };
  try {
    const rh = await submitRHVideoGen({
      imageUrl,
      prompt: compiled.visualPrompt,
      duration: String(project.durationSeconds ?? 8),
      resolution: resolution === "1080p" ? "720p" : resolution,
    });
    submitted = { taskId: rh.taskId, modelId: rh.workflowId, provider: "runninghub", requestPayload: rh.requestPayload };
    console.log(`[approveFinal] RunningHub submitted — taskId=${submitted.taskId}`);
  } catch (rhErr) {
    console.warn(`[approveFinal] RunningHub failed, falling back to Kie.ai: ${rhErr instanceof Error ? rhErr.message : rhErr}`);
    const kie = await submitSeedancePreview({
      prompt: compiled.visualPrompt,
      firstFrameUrl: imageUrl,
      aspectRatio: project.aspectRatio as "9:16" | "16:9" | "1:1",
      resolution: resolution === "1080p" ? "720p" : resolution,
      durationSeconds: project.durationSeconds,
      generateAudio: true,
    });
    submitted = { taskId: kie.taskId, modelId: kie.modelId, provider: "kie", requestPayload: kie.requestPayload };
    console.log(`[approveFinal] Kie.ai submitted — taskId=${submitted.taskId}`);
  }

  // Save final prompt version
  const [finalPromptVersion] = await db
    .insert(promptVersions)
    .values({
      projectId,
      kind: "final",
      visualPrompt: compiled.visualPrompt,
      negativePrompt: compiled.negativePrompt,
      model: submitted.modelId,
      inputSnapshot: { ...submitted.requestPayload, first_frame_url: imageUrl },
    })
    .returning();

  // Create job record
  const [job] = await db
    .insert(generationJobs)
    .values({
      projectId,
      promptVersionId: finalPromptVersion.id,
      kind: "final",
      status: "queued",
      provider: submitted.provider,
      providerModel: submitted.modelId,
      providerTaskId: submitted.taskId,
      requestPayload: submitted.requestPayload,
      startedAt: new Date(),
    })
    .returning();

  // Only now advance state (both steps succeed atomically)
  await db
    .update(videoProjects)
    .set({ status: "final_queued", updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId));

  return { jobId: job.id, taskId: submitted.taskId };
}

// ─── Regenerate Image (back to image_processing) ─────────────────────────────

/**
 * Re-submit a NanaBanana Pro image job with the current inputs.
 * Increments the regeneration counter.
 */
export async function regenerateImage(projectId: string): Promise<GenerateImageResult> {
  const project = await getProjectOrThrow(projectId);

  if (project.regenerationCount >= project.maxRegenerations) {
    throw new Error(
      `Límite de regeneraciones alcanzado (${project.maxRegenerations}). ` +
      "Contacta con soporte para aumentar tu límite.",
    );
  }

  if (!["image_ready", "image_failed", "preview_ready", "awaiting_approval"].includes(project.status)) {
    throw new Error(`No se puede regenerar la imagen en estado: ${project.status}`);
  }

  // Reset processed image and increment counter
  await db
    .update(videoProjects)
    .set({
      status: "assets_uploaded",
      processedImagePath: null,
      processedImageUrl: null,
      previewVideoUrl: null,
      regenerationCount: project.regenerationCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(videoProjects.id, projectId));

  // Re-fetch updated project and submit new image job
  return generateProcessedImage(projectId);
}

// ─── Regenerate Preview (keep image, redo video) ──────────────────────────────

/**
 * Reset project back to image_ready so the user can tweak inputs and
 * generate a new preview video (keeping the processed image).
 */
export async function regeneratePreview(projectId: string): Promise<void> {
  const project = await getProjectOrThrow(projectId);

  if (project.regenerationCount >= project.maxRegenerations) {
    throw new Error(
      `Límite de regeneraciones alcanzado (${project.maxRegenerations}). ` +
        "Contacta con soporte para aumentar tu límite.",
    );
  }

  if (!["awaiting_approval", "preview_ready", "preview_failed"].includes(project.status)) {
    throw new Error(`No se puede regenerar el preview en estado: ${project.status}`);
  }

  await db
    .update(videoProjects)
    .set({
      status: "image_ready",
      previewVideoUrl: null,
      regenerationCount: project.regenerationCount + 1,
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

// ─── Poll Kie.ai and sync job status ─────────────────────────────────────────

/**
 * Check Kie.ai for the latest queued job on this project and, if complete,
 * process the result exactly as the webhook callback would.
 *
 * Returns true if a job was processed (status changed), false otherwise.
 */
export async function pollAndSyncJobStatus(projectId: string): Promise<boolean> {
  // Find the latest job that is still waiting
  const [job] = await db
    .select()
    .from(generationJobs)
    .where(
      and(
        eq(generationJobs.projectId, projectId),
        eq(generationJobs.status, "queued"),
      ),
    )
    .orderBy(desc(generationJobs.createdAt))
    .limit(1);

  if (!job || !job.providerTaskId) return false;

  let pollStatus: { status: string; resultUrl?: string; errorMessage?: string; raw?: Record<string, unknown> };
  try {
    if (job.provider === "runninghub") {
      const rh = await getRHTaskStatus(job.providerTaskId);
      pollStatus = {
        status: rh.status,
        resultUrl: rh.resultUrl,
        errorMessage: rh.errorMessage,
        raw: rh.raw,
      };
    } else {
      pollStatus = await getTaskStatus(job.providerTaskId);
    }
  } catch {
    return false; // Provider unreachable — try again next poll
  }

  // Not finished yet
  if (["waiting", "queuing", "generating", "running", "queued"].includes(pollStatus.status)) return false;

  // Atomically claim the job to prevent double-processing
  const [claimed] = await db
    .update(generationJobs)
    .set({ status: "processing" })
    .where(
      and(
        eq(generationJobs.id, job.id),
        eq(generationJobs.status, "queued"),
      ),
    )
    .returning();

  if (!claimed) return false; // Another request already claimed it

  // Delegate to the same handler the webhook uses
  await handleKieCallback({
    taskId: job.providerTaskId,
    status: pollStatus.status === "success" ? "success" : "fail",
    resultUrl: pollStatus.resultUrl,
    errorMessage: pollStatus.errorMessage,
    raw: (pollStatus.raw ?? {}) as Record<string, unknown>,
  });

  return true;
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

  const failStatus =
    job.kind === "image"   ? "image_failed"   :
    job.kind === "preview" ? "preview_failed" : "final_failed";

  await db
    .update(videoProjects)
    .set({ status: failStatus, updatedAt: new Date() })
    .where(eq(videoProjects.id, job.projectId));

  console.error(`[kie-callback] Job ${job.id} (${job.kind}) failed: ${errorMessage}`);
}
