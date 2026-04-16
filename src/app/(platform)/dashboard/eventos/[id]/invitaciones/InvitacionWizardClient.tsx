"use client";

/**
 * InvitacionWizardClient — Wizard de Invitación Mágica con El Genio.
 *
 * Producto 1 de 3 (el punto de entrada gratuito).
 *
 * Flujo:
 *   Paso 0: Sube fotos del protagonista
 *   Paso 1: Describe la escena y el estilo
 *   Paso 2: El Genio crea la imagen mágica (NanaBanana, GRATIS)
 *           → Upsell: upgrade a Videoinvitación (€2,99) o Retrato que habla (€2,99) o Los dos (€4,99)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check, ArrowLeft, ArrowRight,
  Loader2, Image as ImageIcon, Video, Share2, Sparkles, RefreshCw, X, Wand2, Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventInfo {
  celebrantName: string;
  celebrantAge?: number | null;
  type: string;
  eventDate?: string | null;
  venue?: string | null;
}

interface VideoProject {
  id: string;
  status: string;
  mode: string;
  protagonistName: string;
  protagonistDescription?: string | null;
  transformationDescription?: string | null;
  sceneDescription?: string | null;
  styleDescription?: string | null;
  durationSeconds: number;
  aspectRatio: string;
  processedImageUrl?: string | null;
  previewVideoUrl?: string | null;
  finalVideoUrl?: string | null;
  regenerationCount: number;
  maxRegenerations: number;
  animationPaid: boolean;
}

interface Props {
  eventId: string;
  event: EventInfo;
  existingProject?: VideoProject | null;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Fotos",  icon: ImageIcon },
  { label: "Escena", icon: Sparkles  },
  { label: "Imagen", icon: Wand2     },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "28px" }}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done || active ? "var(--brand-primary)" : "var(--surface-card)",
              border: active ? "2px solid var(--brand-primary)" : done ? "none" : "2px solid var(--neutral-700)",
              color: done || active ? "#fff" : "var(--neutral-500)",
              flexShrink: 0,
            }}>
              {done ? <Check size={14} /> : <Icon size={14} />}
            </div>
            <span style={{
              marginLeft: "6px", fontSize: "0.73rem",
              color: active ? "var(--neutral-100)" : "var(--neutral-500)",
              fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
            }}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: "1px", margin: "0 8px",
                background: done ? "var(--brand-primary)" : "var(--neutral-700)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── El Genio tip box ─────────────────────────────────────────────────────────

function GenieTip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", gap: "12px", alignItems: "flex-start",
      background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(245,158,11,0.1) 100%)",
      border: "1px solid rgba(139,92,246,0.3)",
      borderRadius: "14px", padding: "14px 16px",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/genio/genio.png"
        alt="El Genio"
        style={{ width: "52px", height: "52px", objectFit: "contain", flexShrink: 0, animation: "genieLevitate 3s ease-in-out infinite" }}
      />
      <p style={{ fontSize: "0.82rem", color: "var(--neutral-300)", margin: 0, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

// ─── Photo slot ───────────────────────────────────────────────────────────────

function PhotoSlot({
  index, file, preview, required, onFile, onRemove,
}: {
  index: number;
  file: File | null;
  preview: string | null;
  required: boolean;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const labels = ["Foto de frente", "Foto de perfil", "Otra foto"];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--brand-primary)" : preview ? "rgba(139,92,246,0.5)" : "var(--neutral-700)"}`,
          borderRadius: "12px",
          background: preview ? "#000" : dragging ? "rgba(139,92,246,0.05)" : "var(--surface-card)",
          cursor: preview ? "default" : "pointer",
          overflow: "hidden",
          aspectRatio: "3/4",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.2s",
          position: "relative",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`foto ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--neutral-500)", padding: "12px", textAlign: "center" }}>
            <ImageIcon size={24} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: required ? "var(--neutral-300)" : "var(--neutral-500)" }}>
              {required ? "⭐ " : "✨ "}{labels[index]}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--neutral-600)" }}>
              {required ? "Obligatoria" : "Recomendada"}
            </span>
          </div>
        )}
      </div>

      {preview && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: "absolute", top: "6px", right: "6px",
            background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
            width: "24px", height: "24px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >
          <X size={12} />
        </button>
      )}

      {preview && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px", padding: "4px 10px", cursor: "pointer",
            color: "#fff", fontSize: "0.7rem",
          }}
        >
          Cambiar
        </button>
      )}
    </div>
  );
}

// ─── Processing spinner ───────────────────────────────────────────────────────

function ProcessingState() {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/genio/genio.png" alt="El Genio" style={{ width: "140px", objectFit: "contain", animation: "genieLevitate 3s ease-in-out infinite" }} />
      <Loader2 size={32} style={{ color: "var(--brand-primary)", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "var(--neutral-100)", fontSize: "1rem", fontWeight: 600, maxWidth: "300px" }}>
        El Genio está creando tu imagen mágica…
      </p>
      <p style={{ color: "var(--neutral-400)", fontSize: "0.82rem", maxWidth: "320px" }}>
        El Genio está tejiendo la magia. Suele tardar 1–3 minutos.
      </p>
      <p style={{ color: "var(--neutral-600)", fontSize: "0.78rem" }}>
        Puedes cerrar esta ventana y volver más tarde.
      </p>
    </div>
  );
}

// ─── Upsell copy por tipo de evento ──────────────────────────────────────────

function getUpsellCopy(eventType: string, celebrantName: string, celebrantAge?: number | null) {
  if (eventType === "birthday") {
    if (celebrantAge != null && celebrantAge <= 12) {
      return {
        headline: `¿Lo ves? ${celebrantName} ya está increíble… 😍`,
        body: `Pero imagínate que esa imagen **se mueve**, que ${celebrantName} cobra vida y se convierte en el héroe que sus amigos recordarán para siempre. Por solo **2,99 €**, El Genio lo hace realidad.`,
      };
    }
    return {
      headline: `La imagen ya es mágica… el vídeo será ÉPICO. 🔥`,
      body: `Por **2,99 €**, El Genio convierte este retrato de ${celebrantName} en una videoinvitación que nadie olvidará. El impacto llega cuando aparece en el móvil de cada invitado.`,
    };
  }
  if (eventType === "wedding") {
    return {
      headline: `Qué momento tan especial… 💍`,
      body: `Por **2,99 €**, El Genio anima este retrato para que cuente vuestra historia antes de que empiece la magia. Una videoinvitación que los invitados guardarán para siempre.`,
    };
  }
  if (eventType === "graduation") {
    return {
      headline: `El logro merece más que una imagen. 🎓`,
      body: `Por **2,99 €**, El Genio convierte este retrato de ${celebrantName} en un vídeo que captura todo el esfuerzo y la emoción de este momento histórico.`,
    };
  }
  if (eventType === "bachelor") {
    return {
      headline: `¡La despedida debe recordarse con estilo! 🥂`,
      body: `Por **2,99 €**, El Genio anima la imagen y crea una videoinvitación que el/la protagonista nunca olvidará.`,
    };
  }
  if (eventType === "communion") {
    return {
      headline: `Un día único merece una invitación única. ✝️`,
      body: `Por **2,99 €**, El Genio da vida a este retrato de ${celebrantName} y crea una videoinvitación que los familiares guardarán como recuerdo.`,
    };
  }
  return {
    headline: `La imagen es preciosa… el vídeo será épico. ✨`,
    body: `Por **2,99 €**, El Genio anima este retrato y crea una videoinvitación que sorprenderá a todos los invitados.`,
  };
}

function renderBold(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--neutral-100)" }}>{part}</strong>
      : <span key={i}>{part}</span>
  );
}

// ─── Upsell principal (imagen ya lista, no pagado aún) ────────────────────────

function UpsellHero({
  projectId,
  eventId,
  eventType,
  celebrantName,
  celebrantAge,
}: {
  projectId: string;
  eventId: string;
  eventType: string;
  celebrantName: string;
  celebrantAge?: number | null;
}) {
  const [loading, setLoading] = useState<"video" | "both" | null>(null);
  const copy = getUpsellCopy(eventType, celebrantName, celebrantAge);

  async function handleCheckout(product: "video" | "both") {
    setLoading(product);
    try {
      const res = await fetch(`/api/video-projects/${projectId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el pago");
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Genio + copy emocional */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(245,158,11,0.12) 100%)",
        border: "1px solid rgba(139,92,246,0.45)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/genio/genio.png"
            alt="El Genio"
            style={{ width: "60px", objectFit: "contain", flexShrink: 0, animation: "genieLevitate 3s ease-in-out infinite" }}
          />
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--neutral-100)", margin: "0 0 6px" }}>
              {copy.headline}
            </p>
            <p style={{ fontSize: "0.83rem", color: "var(--neutral-400)", margin: 0, lineHeight: 1.55 }}>
              {renderBold(copy.body)}
            </p>
          </div>
        </div>

        {/* CTA principal: Videoinvitación */}
        <button
          onClick={() => handleCheckout("video")}
          disabled={loading !== null}
          style={{
            padding: "15px 18px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, var(--brand-primary), #f59e0b)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>
            {loading === "video"
              ? "Redirigiendo al pago…"
              : "🎬 ¡Animar como videoinvitación!"}
          </span>
          <span style={{
            background: "rgba(0,0,0,0.25)", padding: "3px 10px",
            borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
          }}>
            2,99 €
          </span>
        </button>

        {/* CTA secundario: Los dos juntos */}
        <button
          onClick={() => handleCheckout("both")}
          disabled={loading !== null}
          style={{
            padding: "13px 18px",
            borderRadius: "12px",
            border: "1px solid rgba(139,92,246,0.5)",
            background: "rgba(139,92,246,0.1)",
            color: "var(--neutral-100)",
            fontWeight: 600,
            fontSize: "0.87rem",
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>
            {loading === "both"
              ? "Redirigiendo al pago…"
              : "🎬🎙️ Vídeo + Retrato que habla (pack completo)"}
          </span>
          <span style={{
            background: "rgba(0,0,0,0.25)", padding: "3px 10px",
            borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
          }}>
            4,99 €
          </span>
        </button>
      </div>

      {/* Retrato que habla (product independiente) */}
      <a
        href={`/dashboard/eventos/${eventId}/invitacion-hablante`}
        style={{
          padding: "13px 18px",
          borderRadius: "12px",
          border: "1px solid var(--neutral-700)",
          background: "var(--surface-card)",
          color: "var(--neutral-300)",
          fontWeight: 500,
          fontSize: "0.85rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span>🎙️ Solo quiero el Retrato que habla</span>
        <span style={{ fontSize: "0.82rem", color: "var(--neutral-500)", flexShrink: 0 }}>2,99 €</span>
      </a>
    </div>
  );
}

// ─── Estado post-pago: imagen + CTA a videoinvitación ─────────────────────────

function PaidState({
  eventId,
  processedImageUrl,
  onRegenerate,
  loading,
  regenLeft,
}: {
  eventId: string;
  processedImageUrl: string;
  onRegenerate: () => void;
  loading: boolean;
  regenLeft: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Badge de confirmación */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: "12px", padding: "12px 16px",
      }}>
        <span style={{ fontSize: "1.4rem" }}>🎉</span>
        <div>
          <p style={{ fontWeight: 700, color: "#22c55e", margin: "0 0 2px", fontSize: "0.9rem" }}>
            ¡Pago completado!
          </p>
          <p style={{ color: "var(--neutral-400)", fontSize: "0.8rem", margin: 0 }}>
            El Genio ya puede animar tu invitación. Pulsa el botón para empezar.
          </p>
        </div>
      </div>

      {/* Imagen */}
      <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "380px", margin: "0 auto", width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={processedImageUrl}
          alt="Imagen mágica"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* CTA principal: ir a videoinvitación */}
      <a
        href={`/dashboard/eventos/${eventId}/videoinvitacion`}
        style={{
          padding: "16px 24px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, var(--brand-primary), #f59e0b)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <Video size={20} />
        ¡Crear la videoinvitación animada!
      </a>

      {/* Regenerar imagen (por si no les gusta) */}
      <button
        onClick={onRegenerate}
        disabled={loading || regenLeft <= 0}
        style={{
          padding: "10px", borderRadius: "10px",
          border: "1px solid var(--neutral-700)", background: "transparent",
          color: "var(--neutral-400)", cursor: regenLeft <= 0 ? "default" : "pointer",
          display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
          fontSize: "0.82rem", opacity: regenLeft <= 0 ? 0.4 : 1,
        }}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          : <RefreshCw size={14} />}
        {regenLeft <= 0 ? "Sin regeneraciones" : `Regenerar imagen (${regenLeft} restantes)`}
      </button>
    </div>
  );
}

// ─── Determine initial step ───────────────────────────────────────────────────

function getInitialStep(status: string): number {
  if (["image_processing", "image_ready", "image_failed",
       "preview_queued", "preview_processing", "preview_ready", "preview_failed",
       "awaiting_approval", "approved_for_final", "final_queued", "final_processing",
       "final_ready", "published"].includes(status)) return 2;
  if (["assets_uploaded", "prompt_compiled"].includes(status)) return 1;
  return 0;
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function InvitacionWizardClient({ eventId, event, existingProject }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(() =>
    existingProject ? getInitialStep(existingProject.status) : 0,
  );
  const [project, setProject] = useState<VideoProject | null>(existingProject ?? null);
  const [loading, setLoading] = useState(false);
  const [showImageStatic, setShowImageStatic] = useState(false);

  // Paso 0: fotos
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
  const [photoStoragePaths, setPhotoStoragePaths] = useState<string[]>([]);

  // Paso 1: descripción
  const [protagonistName, setProtagonistName] = useState(existingProject?.protagonistName || event.celebrantName);
  const [protagonistDescription, setProtagonistDescription] = useState(existingProject?.protagonistDescription ?? "");
  const [transformationDescription, setTransformationDescription] = useState(existingProject?.transformationDescription ?? "");
  const [sceneDescription, setSceneDescription] = useState(existingProject?.sceneDescription ?? "");
  const [styleDescription, setStyleDescription] = useState(existingProject?.styleDescription ?? "");
  const [durationSeconds, setDurationSeconds] = useState(existingProject?.durationSeconds ?? 8);

  // ── Detectar retorno desde Stripe ──
  useEffect(() => {
    const paid = searchParams.get("paid");
    const pid  = searchParams.get("pid");
    if (paid !== "1" || !pid) return;
    router.replace(window.location.pathname, { scroll: false });
    fetch(`/api/video-projects/${pid}`)
      .then(r => r.ok ? r.json() as Promise<VideoProject> : null)
      .then(data => {
        if (data) {
          setProject(data);
          setStep(2);
          toast.success("🎉 ¡Pago completado! Ahora puedes crear la videoinvitación.");
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling mientras El Genio genera la imagen ──
  const isPolling = project?.status === "image_processing";

  const pollProject = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/video-projects/${project.id}`);
      if (!res.ok) return;
      const data: VideoProject = await res.json();
      setProject(data);
    } catch { /* silencioso */ }
  }, [project?.id]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(pollProject, 8000);
    return () => clearInterval(id);
  }, [isPolling, pollProject]);

  // ── Subida de assets ──
  async function uploadAsset(projectId: string, kind: "protagonist_image", file: File): Promise<string> {
    const presignRes = await fetch(`/api/video-projects/${projectId}/assets/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, filename: file.name, contentType: file.type }),
    });
    if (!presignRes.ok) {
      const e = await presignRes.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error ?? "Error generando URL de subida");
    }
    const { uploadUrl, storagePath } = await presignRes.json() as { uploadUrl: string; storagePath: string };

    const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadRes.ok) throw new Error("Error subiendo el archivo");

    const confirmRes = await fetch(`/api/video-projects/${projectId}/assets/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, storagePath }),
    });
    if (!confirmRes.ok) {
      const e = await confirmRes.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error ?? "Error confirmando la subida");
    }
    return storagePath;
  }

  // ── Paso 0 → subir fotos ──
  async function handleStep0Submit() {
    const filledFiles = imageFiles.filter(Boolean) as File[];
    if (filledFiles.length === 0) {
      toast.error("🧞 El Genio necesita al menos una foto del protagonista");
      return;
    }
    setLoading(true);
    try {
      let proj = project;
      if (!proj) {
        toast.loading("🧞 El Genio está preparando tu proyecto…", { id: "step0" });
        const res = await fetch("/api/video-projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, mode: "visual", protagonistName, language: "es", durationSeconds, aspectRatio: "9:16" }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error((e as { error?: string }).error ?? "Error creando el proyecto");
        }
        proj = await res.json() as VideoProject;
        setProject(proj);
      }

      const paths: string[] = [];
      for (let i = 0; i < filledFiles.length; i++) {
        toast.loading(`✨ Subiendo foto ${i + 1} de ${filledFiles.length}…`, { id: "step0" });
        const path = await uploadAsset(proj!.id, "protagonist_image", filledFiles[i]);
        paths.push(path);
      }
      setPhotoStoragePaths(paths);

      toast.success("✨ ¡Fotos listas! Ahora cuéntale al Genio cómo quieres la escena.", { id: "step0" });
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "step0", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 1 → lanzar generación de imagen ──
  async function handleStep1Submit() {
    if (!project) { toast.error("Error: no hay proyecto activo."); return; }
    setLoading(true);
    toast.loading("🧞 El Genio está leyendo tu descripción…", { id: "gen-image" });
    try {
      const patchRes = await fetch(`/api/video-projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protagonistName, protagonistDescription: protagonistDescription || null, transformationDescription: transformationDescription || null, sceneDescription: sceneDescription || null, styleDescription: styleDescription || null, durationSeconds }),
      });
      if (!patchRes.ok) {
        const e = await patchRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error guardando los datos");
      }
      const updatedProject = await patchRes.json() as VideoProject;
      setProject(updatedProject);

      toast.loading("✨ ¡El Genio está comenzando su magia!", { id: "gen-image" });
      const genRes = await fetch(`/api/video-projects/${project.id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalImagePaths: photoStoragePaths }),
      });
      if (!genRes.ok) {
        const e = await genRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el proceso mágico");
      }

      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(2);
      toast.success("🧞 ¡El Genio está trabajando! Tardará 1–3 minutos.", { id: "gen-image" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "gen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Regenerar imagen ──
  async function handleRegenerateImage() {
    if (!project) return;
    setLoading(true);
    try {
      toast.loading("🧞 El Genio lo intentará de nuevo…", { id: "regen-image" });
      const res = await fetch(`/api/video-projects/${project.id}/regenerate-image`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error lanzando nueva magia");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      toast.success("✨ ¡El Genio lo está intentando de nuevo!", { id: "regen-image" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "regen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const regenLeft = project ? project.maxRegenerations - project.regenerationCount : 3;
  const filledPhotos = imageFiles.filter(Boolean).length;

  return (
    <div style={{ maxWidth: "520px" }}>
      <StepIndicator current={step} />

      {/* ── PASO 0: Subir fotos ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <GenieTip>
            <strong>¡El secreto de los mejores resultados!</strong> Sube 3 fotos del protagonista desde distintos ángulos — frente, perfil y otra perspectiva. Cuantas más fotos le des al Genio, más fiel y espectacular será la imagen mágica. 🪄
          </GenieTip>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "10px" }}>
              Fotos del protagonista <span style={{ color: "#ef4444" }}>*</span>
              <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginLeft: "8px" }}>
                ({filledPhotos}/3 · mínimo 1, recomienda 3)
              </span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[0, 1, 2].map((i) => (
                <PhotoSlot
                  key={i}
                  index={i}
                  file={imageFiles[i]}
                  preview={imagePreviews[i]}
                  required={i === 0}
                  onFile={(f) => {
                    const newFiles = [...imageFiles];
                    const newPreviews = [...imagePreviews];
                    newFiles[i] = f;
                    newPreviews[i] = URL.createObjectURL(f);
                    setImageFiles(newFiles);
                    setImagePreviews(newPreviews);
                  }}
                  onRemove={() => {
                    const newFiles = [...imageFiles];
                    const newPreviews = [...imagePreviews];
                    newFiles[i] = null;
                    newPreviews[i] = null;
                    setImageFiles(newFiles);
                    setImagePreviews(newPreviews);
                  }}
                />
              ))}
            </div>
            {filledPhotos === 1 && (
              <p style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "8px", textAlign: "center" }}>
                💡 Con 2 o 3 fotos el Genio consigue resultados mucho más precisos
              </p>
            )}
          </div>

          <button
            onClick={handleStep0Submit}
            disabled={loading || filledPhotos === 0}
            style={{
              padding: "14px 24px", borderRadius: "10px", border: "none",
              background: "var(--brand-primary)", color: "#fff",
              fontWeight: 600, cursor: loading || filledPhotos === 0 ? "not-allowed" : "pointer",
              opacity: loading || filledPhotos === 0 ? 0.6 : 1,
              display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              : <ArrowRight size={18} />}
            Continuar
          </button>
        </div>
      )}

      {/* ── PASO 1: Descripción de escena ───────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <GenieTip>
            Describe la escena soñada con todo el detalle que quieras. Cuanto más específico seas, más espectacular será la magia del Genio. ¡Déjate llevar! ✨
          </GenieTip>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              Nombre del protagonista <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              value={protagonistName}
              onChange={e => setProtagonistName(e.target.value)}
              placeholder={event.celebrantName}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--neutral-700)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              ¿Cómo es el protagonista? <span style={{ color: "var(--neutral-600)" }}>(opcional)</span>
            </label>
            <textarea
              value={protagonistDescription}
              onChange={e => setProtagonistDescription(e.target.value)}
              placeholder="Ej: niña de 6 años con pelo rizado y ojos grandes, muy alegre y curiosa"
              rows={2}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--neutral-700)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem", resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              ¿Qué momento mágico ocurre? <span style={{ color: "var(--neutral-600)" }}>(opcional)</span>
            </label>
            <textarea
              value={transformationDescription}
              onChange={e => setTransformationDescription(e.target.value)}
              placeholder="Ej: se convierte en una superheroína que vuela sobre la ciudad"
              rows={2}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--neutral-700)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem", resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              Escenario y ambiente <span style={{ color: "var(--neutral-600)" }}>(opcional)</span>
            </label>
            <textarea
              value={sceneDescription}
              onChange={e => setSceneDescription(e.target.value)}
              placeholder="Ej: castillo de fantasía al amanecer con confeti dorado y globos mágicos"
              rows={2}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--neutral-700)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem", resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              Duración del vídeo (si animas): <strong>{durationSeconds}s</strong>
            </label>
            <input
              type="range" min={4} max={15} step={1}
              value={durationSeconds}
              onChange={e => setDurationSeconds(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--neutral-600)", marginTop: "4px" }}>
              <span>4s (rápido)</span><span>15s (épico)</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setStep(0)}
              style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid var(--neutral-700)", background: "transparent", color: "var(--neutral-300)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={16} /> Atrás
            </button>
            <button
              onClick={handleStep1Submit}
              disabled={loading || !protagonistName}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, var(--brand-primary), #f59e0b)",
                color: "#fff", fontWeight: 700,
                cursor: loading || !protagonistName ? "not-allowed" : "pointer",
                opacity: loading || !protagonistName ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                fontSize: "0.95rem",
              }}
            >
              {loading
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : <span>🧞</span>}
              ¡Crear mi imagen mágica! (gratis)
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Imagen mágica ──────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Generando */}
          {(!project || project.status === "image_processing") && (
            <ProcessingState />
          )}

          {/* Error */}
          {project?.status === "image_failed" && (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>😔</span>
              <p style={{ color: "var(--neutral-300)", fontWeight: 600 }}>El Genio necesita otra oportunidad</p>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem", maxWidth: "280px" }}>
                Algo no salió bien. Puedes intentarlo de nuevo o cambiar las fotos.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setStep(0)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid var(--neutral-700)", background: "transparent", color: "var(--neutral-300)", cursor: "pointer" }}
                >
                  <ArrowLeft size={14} style={{ marginRight: "6px" }} />
                  Cambiar fotos
                </button>
                <button
                  onClick={handleRegenerateImage}
                  disabled={loading || regenLeft <= 0}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />}
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Imagen lista */}
          {project?.processedImageUrl && project.status !== "image_failed" && (
            <>
              {/* Imagen */}
              <div>
                <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "420px", margin: "0 auto" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.processedImageUrl}
                    alt="Imagen mágica"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>

              {/* ── Si ya pagó: estado post-pago ── */}
              {project.animationPaid ? (
                <PaidState
                  eventId={eventId}
                  processedImageUrl={project.processedImageUrl}
                  onRegenerate={handleRegenerateImage}
                  loading={loading}
                  regenLeft={regenLeft}
                />
              ) : showImageStatic ? (
                /* ── "Me quedo con la imagen" expandido ── */
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--neutral-400)", margin: 0 }}>
                    Tu imagen mágica está lista. Puedes descargarla y compartirla como quieras.
                  </p>
                  <a
                    href={project.processedImageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "12px 20px", borderRadius: "10px",
                      border: "1px solid var(--neutral-600)", background: "var(--surface-card)",
                      color: "var(--neutral-200)", fontWeight: 600, textDecoration: "none",
                      display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                    }}
                  >
                    <Download size={16} /> Descargar imagen
                  </a>
                  <button
                    onClick={() => setShowImageStatic(false)}
                    style={{
                      background: "transparent", border: "none",
                      color: "var(--brand-primary)", fontSize: "0.82rem", cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ← Ver opciones de upgrade
                  </button>
                </div>
              ) : (
                /* ── Bloque de upsell principal ── */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <UpsellHero
                    projectId={project.id}
                    eventId={eventId}
                    eventType={event.type}
                    celebrantName={event.celebrantName}
                    celebrantAge={event.celebrantAge}
                  />

                  {/* Regenerar / quedarse con imagen */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={handleRegenerateImage}
                      disabled={loading || regenLeft <= 0}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "10px",
                        border: "1px solid var(--neutral-700)", background: "transparent",
                        color: "var(--neutral-400)", cursor: regenLeft <= 0 ? "default" : "pointer",
                        display: "flex", alignItems: "center", gap: "6px", justifyContent: "center",
                        fontSize: "0.8rem", opacity: regenLeft <= 0 ? 0.4 : 1,
                      }}
                    >
                      {loading
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <RefreshCw size={13} />}
                      {regenLeft <= 0 ? "Sin magias" : `Nueva imagen (${regenLeft})`}
                    </button>
                    <button
                      onClick={() => setShowImageStatic(true)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "10px",
                        border: "1px solid var(--neutral-700)", background: "transparent",
                        color: "var(--neutral-500)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px", justifyContent: "center",
                        fontSize: "0.78rem",
                      }}
                    >
                      <Share2 size={13} />
                      Me quedo con la imagen
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes genieLevitate { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}
