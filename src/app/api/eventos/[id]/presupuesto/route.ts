import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventBudgetItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  category:      z.string().min(1).max(50),
  name:          z.string().min(1).max(150),
  vendor:        z.string().max(150).optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  actualCost:    z.number().min(0).optional().nullable(),
  notes:         z.string().max(500).optional().nullable(),
  isPaid:        z.boolean().default(false),
  sortOrder:     z.number().int().default(0),
});

interface Props {
  params: Promise<{ id: string }>;
}

async function verifyOwner(eventId: string, userId: string) {
  return db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.ownerId, userId)),
    columns: { id: true },
  });
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db.query.eventBudgetItems.findMany({
    where: eq(eventBudgetItems.eventId, id),
    orderBy: (b, { asc }) => [asc(b.sortOrder), asc(b.createdAt)],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const [item] = await db.insert(eventBudgetItems).values({
      eventId:       id,
      category:      parsed.data.category,
      name:          parsed.data.name,
      vendor:        parsed.data.vendor ?? null,
      estimatedCost: parsed.data.estimatedCost?.toString() ?? null,
      actualCost:    parsed.data.actualCost?.toString() ?? null,
      notes:         parsed.data.notes ?? null,
      isPaid:        parsed.data.isPaid,
      sortOrder:     parsed.data.sortOrder,
    }).returning();

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[presupuesto POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
