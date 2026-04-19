/**
 * fal.ai — Face swap for party invitation images.
 *
 * Pipeline:
 *   1. NanaBanana Pro (RunningHub) → stylised party scene
 *   2. fal-ai/face-swap → protagonist's real face inserted into that scene
 *
 * This two-step approach is far superior to identity-conditioning models
 * (PuLID, InstantID) because:
 *   - The scene/style is 100% preserved from NanaBanana
 *   - The face is taken directly from the photo — no generation variance
 *   - InsightFace blends lighting naturally
 *
 * Model: fal-ai/face-swap (InsightFace-based)
 *   base_image_url  → the scene image — face goes INTO this
 *   swap_image_url  → the protagonist's photo — face taken FROM this
 */

import { fal } from "@fal-ai/client";

// ─── Face-swap on scene ───────────────────────────────────────────────────────

export interface SwapFaceParams {
  /** NanaBanana styled scene — the face from the photo will be inserted here */
  sceneImageUrl: string;
  /** Protagonist's uploaded photo — their face will be taken from here */
  faceImageUrl: string;
}

interface FaceSwapOutput {
  image: { url: string; width: number; height: number };
}

/**
 * Insert the protagonist's real face into the NanaBanana styled scene.
 * Returns the URL of the face-swapped image.
 */
export async function swapFaceOnScene(params: SwapFaceParams): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not set");

  fal.config({ credentials: key });

  const result = await fal.subscribe("fal-ai/face-swap", {
    input: {
      base_image_url: params.sceneImageUrl,  // scene: face goes INTO here
      swap_image_url: params.faceImageUrl,   // photo: face taken FROM here
    },
  });

  const output = result.data as FaceSwapOutput;
  if (!output?.image?.url) {
    throw new Error("fal.ai face-swap returned no image");
  }

  return output.image.url;
}
