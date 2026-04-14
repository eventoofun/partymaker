/**
 * Gift search & comparison engine.
 *
 * Provider: Serper.dev Google Shopping API (https://serper.dev)
 * Requires env var: SERPER_API_KEY
 *
 * To swap provider: implement the `rawSearch` function below with any
 * shopping/product search API that returns title, price, store, url, image.
 */

import { injectAffiliateTag } from "./affiliates";

export type GiftBadge = "best_value" | "best_price" | "best_rated";

export interface GiftSearchResult {
  title: string;
  priceEuros: number;
  priceCents: number;
  store: string;
  url: string;
  affiliateUrl: string;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  badge: GiftBadge | null;
}

// ─── Serper.dev response types ────────────────────────────────────────────────

interface SerperItem {
  title: string;
  price?: string;
  source?: string;
  link?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  rating?: number;
  ratingCount?: number;
  reviews?: number;
}

interface SerperResponse {
  shopping?: SerperItem[];
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function parsePrice(str: string | undefined): number {
  if (!str) return 0;
  // "49,99 €", "€ 49.99", "$49.99", "49.99 EUR"
  const cleaned = str
    .replace(/[€$£]/g, "")
    .replace(/\s/g, "")
    .replace(/EUR|USD|GBP/gi, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}

async function rawSearch(query: string, gl = "es", hl = "es"): Promise<SerperItem[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/shopping", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, gl, hl, num: 10 }),
    next: { revalidate: 0 }, // no cache — prices change
  });

  if (!res.ok) throw new Error(`Serper error ${res.status}`);
  const data: SerperResponse = await res.json();
  return data.shopping ?? [];
}

interface Scored extends GiftSearchResult {
  _score: number;
}

function score(item: Scored, budget?: number): number {
  const ratingScore  = item.rating ? item.rating / 5 : 0.3;
  const reviewScore  = item.reviewCount
    ? Math.min(1, Math.log10(item.reviewCount) / 3)
    : 0.1;

  let priceScore = 0.5;
  if (budget && item.priceEuros > 0) {
    const ratio = item.priceEuros / budget;
    priceScore =
      ratio <= 1
        ? 0.3 + 0.7 * Math.min(1, ratio / 0.7)
        : Math.max(0, 1 - (ratio - 1) * 2);
  }

  return ratingScore * 0.4 + reviewScore * 0.2 + priceScore * 0.4;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search for gifts matching `query`, optionally filtered by `budget` (€).
 * Returns up to 5 results, each labelled with a badge.
 */
export async function searchGifts(
  query: string,
  budget?: number
): Promise<GiftSearchResult[]> {
  const raw = await rawSearch(query);
  if (!raw.length) return [];

  // Normalize
  const items: Scored[] = raw
    .map((r): Scored | null => {
      const priceEuros = parsePrice(r.price);
      if (!priceEuros || !r.link) return null;
      return {
        title: r.title ?? "",
        priceEuros,
        priceCents: Math.round(priceEuros * 100),
        store: r.source ?? "",
        url: r.link,
        affiliateUrl: injectAffiliateTag(r.link),
        imageUrl: r.imageUrl ?? r.thumbnailUrl ?? null,
        rating: r.rating ?? null,
        reviewCount: r.ratingCount ?? r.reviews ?? null,
        badge: null,
        _score: 0,
      };
    })
    .filter((x): x is Scored => x !== null);

  if (!items.length) return [];

  // Score
  items.forEach((i) => { i._score = score(i, budget); });

  // Pick badge winners (deduplicated)
  const byScore   = [...items].sort((a, b) => b._score - a._score);
  const byPrice   = [...items].sort((a, b) => a.priceEuros - b.priceEuros);
  const byRating  = [...items]
    .filter((i) => i.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const result: Scored[] = [];
  const seen = new Set<string>();

  const pick = (candidate: Scored | undefined, badge: GiftBadge) => {
    if (!candidate) return;
    const existing = result.find((r) => r.url === candidate.url);
    if (existing) {
      // Already added — only upgrade badge to best_value if it scores highest
      if (badge === "best_value") existing.badge = "best_value";
      return;
    }
    if (seen.has(candidate.url)) return;
    candidate.badge = badge;
    result.push(candidate);
    seen.add(candidate.url);
  };

  pick(byScore[0],  "best_value");
  pick(byPrice[0],  "best_price");
  pick(byRating[0], "best_rated");

  // Fill to 5 with remaining highest-scored items
  for (const item of byScore) {
    if (result.length >= 5) break;
    if (!seen.has(item.url)) {
      result.push(item);
      seen.add(item.url);
    }
  }

  // Strip internal _score before returning
  return result.slice(0, 5).map(({ _score: _, ...rest }) => rest);
}
