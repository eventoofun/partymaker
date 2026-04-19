/**
 * Face swap via Replicate API.
 *
 * Pipeline:
 *   sourceImageUrl  — the real face to swap IN (original protagonist photo)
 *   targetImageUrl  — the styled scene to swap face INTO (NanaBanana output)
 *   → returns URL of the face-swapped result
 *
 * Model: codeplugtech/face-swap (configurable via REPLICATE_FACESWAP_MODEL)
 * Auth:  REPLICATE_API_TOKEN
 *
 * Fails gracefully — callers should catch and fall back to the NanaBanana image.
 */

const REPLICATE_BASE = "https://api.replicate.com/v1";
const DEFAULT_MODEL   = process.env.REPLICATE_FACESWAP_MODEL ?? "codeplugtech/face-swap";

// Max 20 × 3-second polls = 60 s timeout (within Vercel serverless limit)
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 20;

interface ReplicatePrediction {
  id:     string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string | string[] | null;
  error:  string | null;
  urls:   { get: string };
}

function token(): string {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new Error("REPLICATE_API_TOKEN is not set");
  return t;
}

/**
 * Submit a face-swap prediction and poll until complete.
 * Returns the output image URL.
 */
export async function swapFace(params: {
  sourceImageUrl: string;
  targetImageUrl: string;
}): Promise<string> {
  const auth = token();

  // Create prediction using the latest model version (no version hash needed)
  const createRes = await fetch(`${REPLICATE_BASE}/models/${DEFAULT_MODEL}/predictions`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${auth}`,
      "Content-Type":  "application/json",
      "Prefer":        "wait=5",  // short server-side wait before polling
    },
    body: JSON.stringify({
      input: {
        // codeplugtech/face-swap parameter names:
        swap_image:   params.sourceImageUrl,  // face source (real child photo)
        target_image: params.targetImageUrl,  // scene to paste face into
      },
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Replicate create prediction failed (${createRes.status}): ${body}`);
  }

  const prediction = (await createRes.json()) as ReplicatePrediction;

  // If server-side wait returned a completed result already, use it
  if (prediction.status === "succeeded") {
    return extractOutput(prediction);
  }

  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(`Face swap ${prediction.status}: ${prediction.error ?? "unknown"}`);
  }

  // Poll until complete
  return pollUntilDone(prediction.id, auth);
}

async function pollUntilDone(id: string, auth: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${REPLICATE_BASE}/predictions/${id}`, {
      headers: { "Authorization": `Bearer ${auth}` },
    });

    if (!res.ok) continue; // transient error — keep polling

    const prediction = (await res.json()) as ReplicatePrediction;

    if (prediction.status === "succeeded") {
      return extractOutput(prediction);
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Face swap ${prediction.status}: ${prediction.error ?? "unknown"}`);
    }
    // "starting" | "processing" → keep polling
  }

  throw new Error(`Face swap timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`);
}

function extractOutput(prediction: ReplicatePrediction): string {
  const out = prediction.output;
  if (!out) throw new Error("Face swap returned empty output");
  if (typeof out === "string") return out;
  if (Array.isArray(out) && out.length > 0) return out[0];
  throw new Error(`Unexpected face swap output format: ${JSON.stringify(out)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
