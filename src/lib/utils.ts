import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format euro cents → "€12,50" */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Generate a URL-safe event slug: "fiesta-lucia-2025-abc123" */
export function generateEventSlug(celebrantName: string): string {
  const base = celebrantName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
  const year = new Date().getFullYear();
  const id = nanoid(6);
  return `${base}-${year}-${id}`;
}

/** Generate a RSVP token for one-click RSVP links */
export function generateRsvpToken(): string {
  return nanoid(16);
}

/** Calculate funding percentage for collective gifts */
export function fundingPercent(collected: number, target: number): number {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((collected / target) * 100));
}

/** Truncate text to N chars with ellipsis */
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + "…" : text;
}

/** Absolute URL for the app */
export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

/** Public event URL */
export function eventUrl(slug: string): string {
  return absoluteUrl(`/e/${slug}`);
}
