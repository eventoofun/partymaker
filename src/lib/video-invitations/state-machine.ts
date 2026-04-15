/**
 * State machine for VideoProject.
 * Defines valid transitions and guards so no code accidentally
 * moves a project into an illegal state.
 */

export type VideoProjectStatus =
  | "draft"
  | "assets_uploaded"
  | "prompt_compiled"
  | "image_processing"    // NanaBanana Pro running
  | "image_ready"         // NanaBanana done — user sees processed image
  | "image_failed"        // NanaBanana failed
  | "preview_queued"
  | "preview_processing"
  | "preview_ready"
  | "preview_failed"
  | "awaiting_approval"
  | "approved_for_final"
  | "final_queued"
  | "final_processing"
  | "final_ready"
  | "final_failed"
  | "published";

// Valid transitions: from → set of allowed next states
const TRANSITIONS: Record<VideoProjectStatus, VideoProjectStatus[]> = {
  draft:              ["assets_uploaded"],
  assets_uploaded:    ["image_processing", "draft"],
  prompt_compiled:    ["image_processing", "assets_uploaded"],   // legacy compat
  image_processing:   ["image_ready", "image_failed"],
  image_ready:        ["preview_queued", "image_processing"],    // approve → video | retry image
  image_failed:       ["image_processing", "assets_uploaded"],   // retry or go back
  preview_queued:     ["preview_processing"],
  preview_processing: ["preview_ready", "preview_failed"],
  preview_ready:      ["awaiting_approval", "image_ready"],      // image_ready = regenerate image
  preview_failed:     ["image_ready"],                           // retry from image step
  awaiting_approval:  ["approved_for_final", "image_ready"],     // image_ready = full regenerate
  approved_for_final: ["final_queued"],
  final_queued:       ["final_processing"],
  final_processing:   ["final_ready", "final_failed"],
  final_ready:        ["published"],
  final_failed:       ["approved_for_final"],                    // retry final render
  published:          [],
};

export function canTransition(
  from: VideoProjectStatus,
  to: VideoProjectStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: VideoProjectStatus,
  to: VideoProjectStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid video project transition: ${from} → ${to}. ` +
        `Allowed: ${(TRANSITIONS[from] ?? []).join(", ") || "none"}`,
    );
  }
}

/** Returns true when the project is in a terminal success state. */
export function isPublished(status: VideoProjectStatus): boolean {
  return status === "published";
}

/** Returns true when the project is actively being processed by Kie.ai. */
export function isProcessing(status: VideoProjectStatus): boolean {
  return (
    status === "image_processing" ||
    status === "preview_queued" ||
    status === "preview_processing" ||
    status === "final_queued" ||
    status === "final_processing"
  );
}

/** Returns true when the project has failed and can be retried. */
export function isFailed(status: VideoProjectStatus): boolean {
  return status === "preview_failed" || status === "final_failed";
}
