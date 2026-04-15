/**
 * Supabase Storage helpers for video invitation assets.
 *
 * Buckets:
 *   event-assets  (private) — protagonist images, audio files uploaded by user
 *   event-videos  (public)  — generated preview/final videos stored from Kie.ai
 */

import { createAdminClient } from "@/lib/supabase";

const ASSETS_BUCKET = "event-assets";
const VIDEOS_BUCKET = "event-videos";

// ─── Presigned upload URL (client uploads directly to Supabase) ───────────────

export interface PresignResult {
  uploadUrl: string;
  storagePath: string;
  token: string;
}

/**
 * Generate a short-lived presigned URL so the browser can upload
 * a protagonist image or audio file directly to Supabase Storage.
 */
export async function createPresignedUpload(opts: {
  projectId: string;
  kind: "protagonist_image" | "audio";
  filename: string;
  contentType: string;
}): Promise<PresignResult> {
  const admin = createAdminClient();
  const ext = opts.filename.split(".").pop() ?? "bin";
  const storagePath = `video-projects/${opts.projectId}/${opts.kind}.${ext}`;

  const { data, error } = await admin.storage
    .from(ASSETS_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: true });

  if (error || !data) {
    throw new Error(`Failed to create presigned upload URL: ${error?.message}`);
  }

  return {
    uploadUrl: data.signedUrl,
    storagePath,
    token: data.token,
  };
}

/**
 * Get the public URL for a private asset via a signed download URL (1 hour TTL).
 * Used to pass the protagonist image URL to Kie.ai.
 */
export async function getSignedAssetUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to sign asset URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ─── Store generated video from Kie.ai → Supabase ────────────────────────────

export interface StoredVideo {
  storagePath: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Download a video from Kie.ai's CDN and store it permanently in Supabase.
 * Returns the permanent public URL (not Kie.ai's ephemeral URL).
 */
export async function storeVideoFromUrl(opts: {
  projectId: string;
  jobId: string;
  kind: "preview_video" | "final_video";
  sourceUrl: string;
}): Promise<StoredVideo> {
  const admin = createAdminClient();

  // 1. Download from Kie.ai
  const response = await fetch(opts.sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download video from Kie.ai: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const sizeBytes = buffer.byteLength;
  const mimeType = response.headers.get("content-type") ?? "video/mp4";
  const ext = mimeType.includes("webm") ? "webm" : "mp4";

  const storagePath = `video-projects/${opts.projectId}/${opts.kind}-${opts.jobId}.${ext}`;

  // 2. Upload to Supabase event-videos bucket (public)
  const { error } = await admin.storage
    .from(VIDEOS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload video to Supabase: ${error.message}`);
  }

  // 3. Get public URL
  const { data: urlData } = admin.storage
    .from(VIDEOS_BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
    sizeBytes,
    mimeType,
  };
}

// ─── Store processed image from NanaBanana Pro → Supabase ────────────────────

export interface StoredImage {
  storagePath: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Download a processed image from Kie.ai's CDN and store it permanently
 * in the event-assets bucket (private, accessed via signed URL).
 */
export async function storeImageFromUrl(opts: {
  projectId: string;
  jobId: string;
  sourceUrl: string;
}): Promise<StoredImage> {
  const admin = createAdminClient();

  // 1. Download from Kie.ai
  const response = await fetch(opts.sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download image from Kie.ai: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const sizeBytes = buffer.byteLength;
  const mimeType = response.headers.get("content-type") ?? "image/jpeg";
  const ext = mimeType.includes("png") ? "png" : "jpg";

  const storagePath = `video-projects/${opts.projectId}/processed-image-${opts.jobId}.${ext}`;

  // 2. Upload to event-assets bucket (private)
  const { error } = await admin.storage
    .from(ASSETS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload processed image to Supabase: ${error.message}`);
  }

  // 3. Get a long-lived signed URL (7 days) so the video models can access it
  const { data: signedData, error: signError } = await admin.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  if (signError || !signedData) {
    throw new Error(`Failed to sign processed image URL: ${signError?.message}`);
  }

  return {
    storagePath,
    publicUrl: signedData.signedUrl,
    sizeBytes,
    mimeType,
  };
}

/**
 * Delete all storage objects for a project (cleanup on project deletion).
 */
export async function deleteProjectAssets(projectId: string): Promise<void> {
  const admin = createAdminClient();
  const prefix = `video-projects/${projectId}/`;

  // List and remove from both buckets
  for (const bucket of [ASSETS_BUCKET, VIDEOS_BUCKET]) {
    const { data: files } = await admin.storage.from(bucket).list(prefix);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${prefix}${f.name}`);
      await admin.storage.from(bucket).remove(paths);
    }
  }
}
