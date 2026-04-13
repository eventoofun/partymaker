import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventStores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

interface Props { params: Promise<{ id: string }> }

const schema = z.object({
  isActive:    z.boolean().optional(),
  title:       z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  visibility:  z.enum(["public", "guests_only", "vip_only"]).optional(),
});

async function getOwnedEvent(id: string, userId: string) {
  return db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    columns: { id: true },
  });
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getOwnedEvent(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, id),
    with: {
      products: {
        with: {
          assets:                true,
          variants:              true,
          personalizationSchema: { orderBy: (s, { asc }) => [asc(s.sortOrder)] },
        },
        orderBy: (p, { asc }) => [asc(p.sortOrder)],
      },
    },
  });

  return NextResponse.json({ store: store ?? null });
}

export async function POST(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getOwnedEvent(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Idempotent — return existing if already created
  const existing = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, id),
  });
  if (existing) return NextResponse.json({ store: existing }, { status: 200 });

  const [store] = await db.insert(eventStores).values({ eventId: id }).returning();
  return NextResponse.json({ store }, { status: 201 });
}

export async function PATCH(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getOwnedEvent(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, id),
    columns: { id: true },
  });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(eventStores)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(eventStores.id, store.id))
    .returning();

  return NextResponse.json({ store: updated });
}
