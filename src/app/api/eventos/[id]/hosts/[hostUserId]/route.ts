import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eventHosts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventRole } from "@/lib/permissions";

interface Props {
  params: Promise<{ id: string; hostUserId: string }>;
}

const patchSchema = z.object({
  role: z.enum(["cohost", "operator", "viewer"]),
});

/** PATCH /api/eventos/[id]/hosts/[hostUserId] — change role (owner only) */
export async function PATCH(req: Request, { params }: Props) {
  const { id, hostUserId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Cannot change own role (owner is in events.ownerId, not eventHosts)
  if (hostUserId === userId) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  const existing = await db.query.eventHosts.findFirst({
    where: and(eq(eventHosts.eventId, id), eq(eventHosts.userId, hostUserId)),
    columns: { userId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(eventHosts)
    .set({ role: parsed.data.role })
    .where(and(eq(eventHosts.eventId, id), eq(eventHosts.userId, hostUserId)))
    .returning();

  return NextResponse.json(updated);
}

/** DELETE /api/eventos/[id]/hosts/[hostUserId] — revoke co-host (owner only) */
export async function DELETE(_req: Request, { params }: Props) {
  const { id, hostUserId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hostUserId === userId) {
    return NextResponse.json({ error: "No puedes revocarte a ti mismo" }, { status: 400 });
  }

  const existing = await db.query.eventHosts.findFirst({
    where: and(eq(eventHosts.eventId, id), eq(eventHosts.userId, hostUserId)),
    columns: { userId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .delete(eventHosts)
    .where(and(eq(eventHosts.eventId, id), eq(eventHosts.userId, hostUserId)));

  return NextResponse.json({ ok: true });
}
