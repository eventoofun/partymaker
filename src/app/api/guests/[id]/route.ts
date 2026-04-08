import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guest = await db.query.guests.findFirst({
    where: eq(guests.id, id),
    with: { event: { columns: { userId: true } } },
  });

  if (!guest || guest.event.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(guests).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}
