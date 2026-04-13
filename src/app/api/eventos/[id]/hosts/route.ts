import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eventHosts, users, events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventRole } from "@/lib/permissions";

interface Props {
  params: Promise<{ id: string }>;
}

/** GET /api/eventos/[id]/hosts — list co-hosts (any role except null) */
export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hosts = await db
    .select({
      userId: eventHosts.userId,
      role: eventHosts.role,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(eventHosts)
    .innerJoin(users, eq(users.id, eventHosts.userId))
    .where(eq(eventHosts.eventId, id));

  return NextResponse.json(hosts);
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["cohost", "operator", "viewer"]),
});

/** POST /api/eventos/[id]/hosts — invite co-host by email (owner only) */
export async function POST(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getEventRole(id, userId);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, role: newRole } = parsed.data;

  // Find user by email
  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "Este email no tiene cuenta en Cumplefy. El usuario debe registrarse primero." },
      { status: 404 },
    );
  }

  // Cannot invite yourself (owner)
  if (targetUser.id === userId) {
    return NextResponse.json({ error: "No puedes invitarte a ti mismo" }, { status: 400 });
  }

  // Check if already a co-host
  const existing = await db.query.eventHosts.findFirst({
    where: and(eq(eventHosts.eventId, id), eq(eventHosts.userId, targetUser.id)),
    columns: { userId: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Este usuario ya es co-organizador del evento" }, { status: 409 });
  }

  await db.insert(eventHosts).values({
    eventId: id,
    userId: targetUser.id,
    role: newRole,
  });

  return NextResponse.json(
    {
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      role: newRole,
    },
    { status: 201 },
  );
}
