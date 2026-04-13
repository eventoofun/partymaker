/**
 * GET  /api/eventos/[id]/momentos  — list photos
 * POST /api/eventos/[id]/momentos  — upload photo (multipart/form-data)
 */
import { db } from "@/db";
import { events, eventPhotos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 30;

interface Props { params: Promise<{ id: string }> }

const BUCKET = "event-momentos";
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const photos = await db.query.eventPhotos.findMany({
    where: eq(eventPhotos.eventId, id),
    orderBy: [desc(eventPhotos.createdAt)],
  });

  return NextResponse.json({ photos });
}

// ── POST ─────────────────────────────────────────────────────────────────────
// Accepts multipart/form-data:
//   file       - the image File (required)
//   guestName  - optional string
//   guestEmail - optional string
//   caption    - optional string
export async function POST(req: Request, { params }: Props) {
  const { id } = await params;

  // Verify event exists
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Parse multipart body
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const contentType = ALLOWED.includes(file.type) ? file.type : "image/jpeg";
  const ext = contentType.split("/")[1]
    .replace("jpeg", "jpg")
    .replace("heif", "jpg")
    .replace("heic", "jpg");

  const photoId = crypto.randomUUID();
  const storagePath = `${id}/${photoId}.${ext}`;

  // Upload to Supabase Storage (server-side, no CORS issues)
  const adminClient = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[momentos] Supabase Storage upload error:", uploadError);
    return NextResponse.json({ error: "Upload failed", detail: uploadError.message }, { status: 502 });
  }

  // Build public URL
  const { data: urlData } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Save record in DB
  const guestName  = (formData.get("guestName")  as string | null) || null;
  const guestEmail = (formData.get("guestEmail") as string | null) || null;
  const caption    = (formData.get("caption")    as string | null) || null;

  const [photo] = await db.insert(eventPhotos).values({
    id:         photoId,
    eventId:    id,
    url:        publicUrl,
    r2Key:      storagePath,   // repurpose field to store storage path
    guestName:  guestName?.slice(0, 120) ?? null,
    guestEmail: guestEmail?.slice(0, 200) ?? null,
    caption:    caption?.slice(0, 280) ?? null,
    status:     "pending",
  }).returning();

  return NextResponse.json({ photo }, { status: 201 });
}
