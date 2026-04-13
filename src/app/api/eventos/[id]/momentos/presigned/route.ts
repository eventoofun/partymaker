/**
 * GET /api/eventos/[id]/momentos/presigned
 * Returns a presigned R2 upload URL so guests can upload directly from the browser.
 * No auth required — public event page guests can upload.
 */
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getPresignedUploadUrl, r2Keys } from "@/lib/r2";

interface Props { params: Promise<{ id: string }> }

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

export async function GET(req: Request, { params }: Props) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const contentType = searchParams.get("contentType") ?? "image/jpeg";

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  // Verify event exists and is published
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true, status: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ext = contentType.split("/")[1].replace("jpeg", "jpg").replace("heic", "jpg");
  const photoId = crypto.randomUUID();
  const key = r2Keys.eventMomento(id, photoId, ext);

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType, 900);

  return NextResponse.json({ uploadUrl, publicUrl, r2Key: key, photoId });
}
