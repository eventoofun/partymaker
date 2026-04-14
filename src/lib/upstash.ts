import { Redis } from "@upstash/redis";
import { Client as QStash } from "@upstash/qstash";

// ─── Redis ────────────────────────────────────────────────────────────────────

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Cache helpers ────────────────────────────────────────────────────────────

const DEFAULT_TTL = 60 * 5; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl = DEFAULT_TTL,
): Promise<void> {
  await redis.set(key, value, { ex: ttl });
}

export async function invalidate(key: string): Promise<void> {
  await redis.del(key);
}

// Invalidate all keys matching a pattern prefix (e.g. "event:abc123:*")
export async function invalidatePrefix(prefix: string): Promise<void> {
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length > 0) await redis.del(...keys);
}

// ─── Cache key namespaces ────────────────────────────────────────────────────

export const cacheKeys = {
  event:         (id: string) => `event:${id}`,
  eventGuests:   (id: string) => `event:${id}:guests`,
  eventRsvp:     (id: string) => `event:${id}:rsvp`,
  giftList:      (eventId: string) => `event:${eventId}:gifts`,
  videoStatus:   (videoId: string) => `video:${videoId}:status`,
  userEvents:    (userId: string) => `user:${userId}:events`,
};

// ─── QStash ──────────────────────────────────────────────────────────────────

export const qstash = new QStash({ token: process.env.QSTASH_TOKEN! });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com";

// ─── Job payloads ─────────────────────────────────────────────────────────────

export interface VideoRenderJobPayload {
  videoInvitationId: string;
  eventId: string;
}

export interface FaceSwapJobPayload {
  faceSwapJobId: string;
  eventId: string;
  guestId?: string;
}

export interface EmailJobPayload {
  type: "rsvp_confirmation" | "gift_list_invite" | "contribution_notification";
  data: Record<string, unknown>;
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

/** Enqueue a video render job — triggers the n8n pipeline via internal API */
export async function enqueueVideoRender(payload: VideoRenderJobPayload) {
  return qstash.publishJSON({
    url:  `${BASE_URL}/api/jobs/video-render`,
    body: payload,
    retries: 3,
    delay: 0,
  });
}

/** Enqueue a face swap job */
export async function enqueueFaceSwap(payload: FaceSwapJobPayload) {
  return qstash.publishJSON({
    url:  `${BASE_URL}/api/jobs/face-swap`,
    body: payload,
    retries: 3,
  });
}

/** Enqueue a transactional email */
export async function enqueueEmail(payload: EmailJobPayload) {
  return qstash.publishJSON({
    url:  `${BASE_URL}/api/jobs/email`,
    body: payload,
    retries: 5,
  });
}

/** Schedule a delayed job (e.g. GDPR auto-delete face swap sources after 24h) */
export async function scheduleDelayedJob(
  endpoint: string,
  payload: Record<string, unknown>,
  delaySeconds: number,
) {
  return qstash.publishJSON({
    url:   `${BASE_URL}/api/jobs/${endpoint}`,
    body:  payload,
    delay: delaySeconds,
    retries: 3,
  });
}
