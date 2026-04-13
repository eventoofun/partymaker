import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET     = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://media.cumplefy.com

// ─── Key helpers ────────────────────────────────────────────────────────────

export const r2Keys = {
  eventCover:        (eventId: string, ext = "jpg") => `events/${eventId}/cover.${ext}`,
  guestPhoto:        (eventId: string, guestId: string, ext = "jpg") => `events/${eventId}/guests/${guestId}.${ext}`,
  eventMomento:      (eventId: string, photoId: string, ext = "jpg") => `events/${eventId}/momentos/${photoId}.${ext}`,
  protagonistImage:  (eventId: string, ext = "jpg") => `events/${eventId}/protagonist.${ext}`,
  faceSwapSource:    (jobId: string, ext = "jpg") => `face-swap/${jobId}/source.${ext}`,
  faceSwapResult:    (jobId: string, ext = "jpg") => `face-swap/${jobId}/result.${ext}`,
  videoResult:       (videoId: string, format: "vertical" | "horizontal" | "square") => `videos/${videoId}/${format}.mp4`,
  videoThumbnail:    (videoId: string) => `videos/${videoId}/thumbnail.jpg`,
};

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | Blob | ReadableStream,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body as never, ContentType: contentType }),
  );
  return `${PUBLIC_URL}/${key}`;
}

// ─── Presigned upload URL (client-side direct upload) ───────────────────────

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
  return { uploadUrl, publicUrl: `${PUBLIC_URL}/${key}` };
}

// ─── Presigned download URL (private objects) ────────────────────────────────

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  );
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
