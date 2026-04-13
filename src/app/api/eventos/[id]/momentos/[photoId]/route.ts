/**
 * PATCH /api/eventos/[id]/momentos/[photoId]
 *   - guests: increment likes (no auth)
 *   - organizer: set status (approved/rejected), usedForProduct (requires auth)
 * DELETE /api/eventos/[id]/momentos/[photoId]
 *   - organizer only: remove photo
 */
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eventPhotos, events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase";

const BUCKET = "event-momentos";

interface Props { params: Promise<{ id: string; photoId: string }> }

const patchSchema = z.union([
  // Guest like action
  z.object({ action: z.literal("like") }),
  // Organizer moderation
  z.object({
    status:         z.enum(["pending", "approved", "rejected"]).optional(),
    usedForProduct: z.boolean().optional(),
  }),
]);

export async function PATCH(req: Request, { params }: Props) {
  const { id, photoId } = await params;

  const photo = await db.query.eventPhotos.findFirst({
    where: and(eq(eventPhotos.id, photoId), eq(eventPhotos.eventId, id)),
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Like action — no auth required
  if ("action" in parsed.data && parsed.data.action === "like") {
    const [updated] = await db
      .update(eventPhotos)
      .set({ likes: photo.likes + 1 })
      .where(eq(eventPhotos.id, photoId))
      .returning();
    return NextResponse.json({ photo: updated });
  }

  // Moderation — requires organizer auth
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!role || role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updateData: Partial<typeof eventPhotos.$inferInsert> = {};
  if ("status" in parsed.data && parsed.data.status) updateData.status = parsed.data.status;
  if ("usedForProduct" in parsed.data && parsed.data.usedForProduct !== undefined) {
    updateData.usedForProduct = parsed.data.usedForProduct;
  }

  const [updated] = await db
    .update(eventPhotos)
    .set(updateData)
    .where(eq(eventPhotos.id, photoId))
    .returning();

  return NextResponse.json({ photo: updated });
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id, photoId } = await params;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!role || role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get the storage path before deleting the DB record
  const photo = await db.query.eventPhotos.findFirst({
    where: and(eq(eventPhotos.id, photoId), eq(eventPhotos.eventId, id)),
    columns: { r2Key: true },
  });

  await db.delete(eventPhotos).where(
    and(eq(eventPhotos.id, photoId), eq(eventPhotos.eventId, id))
  );

  // Delete from Supabase Storage (best-effort, don't fail if missing)
  if (photo?.r2Key) {
    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([photo.r2Key]).catch(() => {});
  }

  return new Response(null, { status: 204 });
}

// Verify event ownership helper
async function verifyEventOwner(eventId: string, userId: string) {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
  return !!event;
}
