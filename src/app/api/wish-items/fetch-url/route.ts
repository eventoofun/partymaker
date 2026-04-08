import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error("Fetch failed");

    const html = await res.text();

    // Extract Open Graph / meta tags
    const title =
      extract(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ??
      extract(html, /<title>([^<]+)<\/title>/i) ??
      "";

    const description =
      extract(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
      extract(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
      "";

    const image =
      extract(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ?? "";

    // Price heuristics (Amazon ES, El Corte Inglés, Zara)
    const priceRaw =
      extract(html, /itemprop="price"[^>]+content="([\d.,]+)"/i) ??
      extract(html, /"price"\s*:\s*"?([\d.]+)"?/i) ??
      null;

    const price = priceRaw
      ? Math.round(parseFloat(priceRaw.replace(",", ".")) * 100)
      : null;

    return NextResponse.json({
      title: cleanText(title),
      description: cleanText(description),
      image,
      price,
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch URL" }, { status: 422 });
  }
}

function extract(html: string, re: RegExp): string | null {
  return re.exec(html)?.[1] ?? null;
}

function cleanText(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}
