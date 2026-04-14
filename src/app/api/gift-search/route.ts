import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { searchGifts } from "@/lib/gift-search";

const schema = z.object({
  query:  z.string().min(2).max(200),
  budget: z.number().positive().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (!process.env.SERPER_API_KEY) {
    // Return empty results gracefully when not yet configured
    return NextResponse.json({ results: [], unconfigured: true });
  }

  try {
    const results = await searchGifts(parsed.data.query, parsed.data.budget);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Gift search error:", err);
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  }
}
