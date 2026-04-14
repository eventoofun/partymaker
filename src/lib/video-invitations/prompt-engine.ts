/**
 * Prompt engine for video invitations.
 *
 * Compiles a Kie.ai-ready visual prompt from the project's wizard inputs.
 * Prompts are written in English (best quality for Seedance / Kling).
 * The engine selects the right model based on job kind and project mode.
 */

import {
  MODEL_SEEDANCE_PREVIEW,
  MODEL_WAN25,
  MODEL_KLING_FINAL,
  MODEL_INFINITETALK,
} from "@/lib/kie";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromptInput {
  kind: "preview" | "final";
  mode: "visual" | "lipsync";
  protagonistName: string;
  protagonistDescription?: string | null;
  transformationDescription?: string | null;
  sceneDescription?: string | null;
  styleDescription?: string | null;
  language?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  /** Event type for context-aware prompt building */
  eventType?: string;
}

export interface CompiledPrompt {
  model: string;
  visualPrompt: string;
  negativePrompt: string;
  /** Full input object to pass to the model */
  modelInput: Record<string, unknown>;
}

// ─── Style presets ────────────────────────────────────────────────────────────

const EVENT_STYLE_MAP: Record<string, string> = {
  birthday:    "festive birthday atmosphere, colorful balloons, golden bokeh lights, warm celebration mood",
  wedding:     "romantic wedding atmosphere, soft white flowers, cinematic golden hour, elegant and timeless",
  graduation:  "proud graduation ceremony, academic colors, confetti, achievement and joy",
  bachelor:    "fun bachelor party vibes, energetic, modern city night lights",
  communion:   "sacred first communion, soft white and gold tones, spiritual and warm",
  baptism:     "gentle baptism ceremony, soft pastel tones, tender and sacred",
  christmas:   "magical Christmas celebration, warm reds and golds, snow bokeh, cozy fireplace",
  corporate:   "sophisticated corporate gala, dark navy and gold, professional luxury atmosphere",
  other:       "joyful celebration, warm and festive atmosphere",
};

const NEGATIVE_PROMPT_BASE =
  "blurry, low quality, distorted face, deformed hands, watermark, text overlay, " +
  "ugly, artifacts, noise, overexposed, dark, flat lighting";

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildVisualPrompt(input: PromptInput): string {
  const parts: string[] = [];

  // 1. Subject intro
  const name = input.protagonistName || "the protagonist";
  parts.push(`${name} as the main character`);

  // 2. Protagonist appearance
  if (input.protagonistDescription) {
    parts.push(input.protagonistDescription);
  }

  // 3. Transformation / magical moment
  if (input.transformationDescription) {
    parts.push(input.transformationDescription);
  }

  // 4. Scene context
  if (input.sceneDescription) {
    parts.push(input.sceneDescription);
  } else if (input.eventType && EVENT_STYLE_MAP[input.eventType]) {
    parts.push(EVENT_STYLE_MAP[input.eventType]);
  }

  // 5. Visual style override
  if (input.styleDescription) {
    parts.push(input.styleDescription);
  }

  // 6. Technical quality suffix (always appended)
  const qualitySuffix =
    input.kind === "final"
      ? "cinematic quality, sharp details, professional color grading, 4K, highly detailed"
      : "smooth motion, clear image, good lighting";

  parts.push(qualitySuffix);

  return parts.join(", ");
}

function selectModel(input: PromptInput): string {
  if (input.mode === "lipsync") return MODEL_INFINITETALK;
  if (input.kind === "final") return MODEL_KLING_FINAL;
  // For preview, default to Seedance 2.0 (has built-in audio)
  return MODEL_SEEDANCE_PREVIEW;
}

// ─── Main compiler ────────────────────────────────────────────────────────────

export function compilePrompt(input: PromptInput): CompiledPrompt {
  const model = selectModel(input);
  const visualPrompt = buildVisualPrompt(input);
  const negativePrompt = NEGATIVE_PROMPT_BASE;
  const duration = input.durationSeconds ?? 8;
  const aspectRatio = input.aspectRatio ?? "9:16";

  let modelInput: Record<string, unknown>;

  switch (model) {
    case MODEL_SEEDANCE_PREVIEW:
      modelInput = {
        prompt: visualPrompt,
        web_search: false,
        aspect_ratio: aspectRatio,
        resolution: "480p",
        duration,
        generate_audio: true,
      };
      break;

    case MODEL_WAN25:
      modelInput = {
        prompt: visualPrompt,
        aspect_ratio: aspectRatio,
        duration,
        negative_prompt: negativePrompt,
      };
      break;

    case MODEL_KLING_FINAL:
      modelInput = {
        prompt: visualPrompt,
        negative_prompt: negativePrompt,
        aspect_ratio: aspectRatio,
        duration: String(duration),
        mode: "std",
      };
      break;

    case MODEL_INFINITETALK:
      // Lipsync: prompt not used by InfiniteTalk — image + audio drive it
      modelInput = {};
      break;

    default:
      modelInput = { prompt: visualPrompt };
  }

  return { model, visualPrompt, negativePrompt, modelInput };
}

/**
 * Compile prompt using Wan 2.5 instead of the default Seedance 2.0 for preview.
 * Useful when the user explicitly selects Wan as preview model.
 */
export function compilePromptWan25(input: PromptInput): CompiledPrompt {
  const compiled = compilePrompt({ ...input, kind: "preview", mode: "visual" });
  const duration = input.durationSeconds ?? 5;
  const aspectRatio = input.aspectRatio ?? "9:16";

  return {
    ...compiled,
    model: MODEL_WAN25,
    modelInput: {
      prompt: compiled.visualPrompt,
      aspect_ratio: aspectRatio,
      duration,
      negative_prompt: compiled.negativePrompt,
    },
  };
}
