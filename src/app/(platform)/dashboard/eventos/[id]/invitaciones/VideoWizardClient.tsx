"use client";

/**
 * VideoWizardClient — Wizard de invitación mágica con El Genio de Cumplefy.
 *
 * Flujo:
 *   Paso 0: Sube 3 fotos del protagonista (+ audio si lipsync)
 *   Paso 1: Describe la escena y el estilo
 *   Paso 2: El Genio crea la imagen mágica (polling)
 *   Paso 3: El Genio anima tu historia (polling) → el usuario aprueba
 *   Paso 4: El Genio finaliza la invitación
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check, Play, ArrowLeft, ArrowRight,
  Loader2, Image as ImageIcon, Mic, Video, Share2, AlertCircle, Wand2, Sparkles, RefreshCw, X, Gift,
} from "lucide-react";
import WizardStepGifts from "@/components/wizard/WizardStepGifts";
import WizardStepRsvp from "@/components/wizard/WizardStepRsvp";
import WizardStepComplete from "@/components/wizard/WizardStepComplete";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventInfo {
  celebrantName: string;
  celebrantAge?: number | null;
  type: string;
  eventDate?: string | null;
  venue?: string | null;
  slug: string;
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
  { label: "Fotos",   icon: ImageIcon },
  { label: "Escena",  icon: Sparkles  },
  { label: "Imagen",  icon: Wand2     },
  { label: "Preview", icon: Play      },
  { label: "Final",   icon: Video     },
  { label: "Regalos", icon: Gift      },
  { label: "RSVP",    icon: Check     },
  { label: "¡Listo!", icon: Share2    },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "32px" }}>
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
      <img src="/genio/genio.png" alt="El Genio" style={{ width: "52px", height: "52px", objectFit: "contain", flexShrink: 0, animation: "genieLevitate 3s ease-in-out infinite" }} />
      <p style={{ fontSize: "0.82rem", color: "var(--neutral-300)", margin: 0, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

// ─── Photo slot (one of the 3 protagonist photo dropzones) ────────────────────

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

  const labels = [
    "Foto de frente",
    "Foto de perfil / ángulo",
    "Otra foto (diferente ángulo)",
  ];

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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--neutral-500)", padding: "16px", textAlign: "center" }}>
            <ImageIcon size={28} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: required ? "var(--neutral-300)" : "var(--neutral-500)" }}>
              {required ? "⭐ " : "✨ "}{labels[index]}
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--neutral-600)" }}>
              {required ? "Obligatoria" : "Recomendada"}
            </span>
          </div>
        )}
      </div>

      {/* Remove button */}
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

      {/* Replace button */}
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

// ─── Audio dropzone ───────────────────────────────────────────────────────────

function AudioDropzone({ preview, onFile }: { preview: string | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "var(--brand-primary)" : "var(--neutral-700)"}`,
        borderRadius: "12px", padding: "24px", textAlign: "center",
        cursor: "pointer", background: dragging ? "rgba(139,92,246,0.05)" : "var(--surface-card)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/m4a"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {preview ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--brand-primary)" }}>
          <Mic size={32} />
          <span style={{ fontSize: "0.85rem" }}>🎵 Audio listo ✓</span>
          <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)" }}>Haz clic para cambiar</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--neutral-500)" }}>
          <Mic size={32} />
          <span style={{ fontSize: "0.85rem" }}>Sube el audio del mensaje</span>
          <span style={{ fontSize: "0.75rem", color: "var(--neutral-600)" }}>mp3, wav, m4a · Arrastra o haz clic</span>
        </div>
      )}
    </div>
  );
}

// ─── GenieUpsell block (aparece en paso 2 cuando la imagen está lista) ────────

function getUpsellCopy(eventType: string, celebrantName: string, celebrantAge?: number | null) {
  const name = celebrantName;

  if (eventType === "birthday") {
    if (celebrantAge != null && celebrantAge <= 12) {
      return {
        headline: `¿Lo ves? ${name} ya está increíble... 😍`,
        body: `Pero imagínate que esa imagen se mueve, que ${name} cobra vida y se convierte en el héroe que sus amigos recordarán para siempre. Por solo **2,99 €**, El Genio lo hace realidad. ¿Se lo merece?`,
        emoji: "🎂",
      };
    }
    return {
      headline: `La imagen ya es mágica... pero animada es ÉPICA. 🔥`,
      body: `Por **2,99 €**, El Genio convierte este retrato de ${name} en una videoinvitación que nadie olvidará. El momento del impacto es cuando llega el vídeo.`,
      emoji: "🎉",
    };
  }

  if (eventType === "wedding") {
    return {
      headline: `Qué momento tan especial... 💍`,
      body: `Por **2,99 €**, El Genio puede animar este retrato para que cuente vuestra historia antes de que empiece la magia. Una videoinvitación que los invitados guardarán para siempre.`,
      emoji: "💍",
    };
  }

  if (eventType === "graduation") {
    return {
      headline: `El logro merece más que una imagen. 🎓`,
      body: `Por **2,99 €**, El Genio convierte este retrato de ${name} en un vídeo que captura todo el esfuerzo y la emoción de este momento histórico.`,
      emoji: "🎓",
    };
  }

  if (eventType === "bachelor") {
    return {
      headline: `¡La despedida debe recordarse con estilo! 🥂`,
      body: `Por **2,99 €**, El Genio anima la imagen y crea una videoinvitación que el/la protagonista nunca olvidará. ¿Quién se niega a eso?`,
      emoji: "🥂",
    };
  }

  if (eventType === "communion") {
    return {
      headline: `Un día único merece una invitación única. ✝️`,
      body: `Por **2,99 €**, El Genio da vida a este retrato de ${name} y crea una videoinvitación que los familiares guardarán como recuerdo para siempre.`,
      emoji: "✝️",
    };
  }

  return {
    headline: `La imagen es preciosa... el vídeo será épico. ✨`,
    body: `Por **2,99 €**, El Genio anima este retrato y crea una videoinvitación que sorprenderá a todos los invitados.`,
    emoji: "🎉",
  };
}

function renderMarkdownBold(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--neutral-100)" }}>{part}</strong>
      : <span key={i}>{part}</span>
  );
}

function GenieUpsellBlock({
  projectId,
  eventId,
  eventType,
  celebrantName,
  celebrantAge,
  onPaid,
}: {
  projectId: string;
  eventId: string;
  eventType: string;
  celebrantName: string;
  celebrantAge?: number | null;
  onPaid: () => void;
}) {
  const [loading, setLoading] = useState<"video" | "both" | null>(null);
  const copy = getUpsellCopy(eventType, celebrantName, celebrantAge);

  async function handleUpsell(product: "video" | "both") {
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
    <div style={{
      background: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(245,158,11,0.12) 100%)",
      border: "1px solid rgba(139,92,246,0.4)",
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    }}>
      {/* Genio + headline */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/genio/genio.png"
          alt="El Genio"
          style={{ width: "56px", objectFit: "contain", flexShrink: 0, animation: "genieLevitate 3s ease-in-out infinite" }}
        />
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--neutral-100)", margin: "0 0 6px" }}>
            {copy.headline}
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--neutral-400)", margin: 0, lineHeight: 1.5 }}>
            {renderMarkdownBold(copy.body)}
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          onClick={() => handleUpsell("video")}
          disabled={loading !== null}
          style={{
            padding: "13px 18px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, var(--brand-primary), #f59e0b)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {loading === "video"
              ? "Redirigiendo al pago…"
              : "🎬 ¡Quiero la videoinvitación animada!"}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.9 }}>2,99 €</span>
        </button>

        <button
          onClick={() => handleUpsell("both")}
          disabled={loading !== null}
          style={{
            padding: "13px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(139,92,246,0.5)",
            background: "rgba(139,92,246,0.12)",
            color: "var(--neutral-100)",
            fontWeight: 600,
            fontSize: "0.87rem",
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {loading === "both"
              ? "Redirigiendo al pago…"
              : "🎬🎙️ Vídeo + Retrato que habla"}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.85 }}>4,99 €</span>
        </button>

        <a
          href={`/dashboard/eventos/${eventId}/invitacion-hablante`}
          style={{
            padding: "11px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "var(--neutral-400)",
            fontWeight: 500,
            fontSize: "0.82rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>🎙️ Solo Retrato que habla</span>
          <span style={{ fontSize: "0.82rem" }}>2,99 €</span>
        </a>

        <button
          onClick={onPaid}
          disabled={loading !== null}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--neutral-600)",
            fontSize: "0.76rem",
            cursor: "pointer",
            padding: "4px",
            textDecoration: "underline",
          }}
        >
          No gracias, me quedo con la imagen
        </button>
      </div>
    </div>
  );
}

// ─── Processing spinner ───────────────────────────────────────────────────────

function ProcessingState({ status }: { status: string }) {
  const messages: Record<string, { title: string; subtitle: string }> = {
    image_processing:   {
      title: "El Genio está haciendo su magia…",
      subtitle: "Está creando una imagen única y especial para el protagonista. Suele tardar 1–3 minutos.",
    },
    preview_queued:     {
      title: "El Genio está preparando la animación…",
      subtitle: "En unos momentos comenzará a dar vida a tu historia.",
    },
    preview_processing: {
      title: "¡El Genio está animando tu historia!",
      subtitle: "Está dando movimiento a la imagen mágica. Suele tardar 2–5 minutos.",
    },
    final_queued:       {
      title: "El Genio está preparando la versión definitiva…",
      subtitle: "Tu invitación especial estará lista en breve.",
    },
    final_processing:   {
      title: "¡El Genio está creando tu invitación mágica!",
      subtitle: "Está dando los toques finales para que sea perfecta. Puede tardar 5–10 minutos.",
    },
  };

  const msg = messages[status] ?? { title: "El Genio está trabajando…", subtitle: "Espera unos instantes." };

  return (
    <div style={{ textAlign: "center", padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/genio/genio.png" alt="El Genio" style={{ width: "160px", objectFit: "contain", animation: "genieLevitate 3s ease-in-out infinite" }} />
      <Loader2 size={32} style={{ color: "var(--brand-primary)", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "var(--neutral-100)", fontSize: "1rem", fontWeight: 600, maxWidth: "300px" }}>{msg.title}</p>
      <p style={{ color: "var(--neutral-400)", fontSize: "0.82rem", maxWidth: "320px" }}>{msg.subtitle}</p>
      <p style={{ color: "var(--neutral-600)", fontSize: "0.78rem" }}>
        Puedes cerrar esta ventana y volver más tarde.
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Determine initial wizard step from project status ────────────────────────

function getInitialStep(status: string): number {
  if (["final_ready", "published"].includes(status)) return 4;
  if (["approved_for_final", "final_queued", "final_processing", "final_failed"].includes(status)) return 4;
  // awaiting_approval → paso 3 para que el botón "Aprobar" sea accesible
  if (["preview_queued", "preview_processing", "preview_ready", "preview_failed", "awaiting_approval"].includes(status)) return 3;
  if (["image_processing", "image_ready", "image_failed"].includes(status)) return 2;
  if (["assets_uploaded", "prompt_compiled"].includes(status)) return 1;
  return 0;
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function VideoWizardClient({ eventId, event, existingProject }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(() =>
    existingProject ? getInitialStep(existingProject.status) : 0,
  );
  const [project, setProject] = useState<VideoProject | null>(existingProject ?? null);
  const [loading, setLoading] = useState(false);
  // Controla si el upsell está "omitido" (usuario hizo clic en "No gracias")
  const [upsellDismissed, setUpsellDismissed] = useState(false);

  // Paso 0: foto frontal y audio
  const [mode, setMode] = useState<"visual" | "lipsync">("visual");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  // Paso 1
  const [protagonistName, setProtagonistName] = useState(existingProject?.protagonistName || event.celebrantName);
  const [protagonistDescription, setProtagonistDescription] = useState(existingProject?.protagonistDescription ?? "");
  const [transformationDescription, setTransformationDescription] = useState(existingProject?.transformationDescription ?? "");
  const [sceneDescription, setSceneDescription] = useState(existingProject?.sceneDescription ?? "");
  const [styleDescription, setStyleDescription] = useState(existingProject?.styleDescription ?? "");
  const [durationSeconds, setDurationSeconds] = useState(existingProject?.durationSeconds ?? 8);

  // ── Detectar retorno desde Stripe (?paid=1&pid=…) ──
  useEffect(() => {
    const paid = searchParams.get("paid");
    const pid  = searchParams.get("pid");
    if (paid !== "1" || !pid) return;

    // Limpiar los query params para evitar reactivaciones
    router.replace(window.location.pathname, { scroll: false });

    // Refrescar el proyecto desde el servidor para obtener animationPaid: true
    fetch(`/api/video-projects/${pid}`)
      .then(r => r.ok ? r.json() as Promise<VideoProject> : null)
      .then(data => {
        if (data) {
          setProject(data);
          toast.success("🎉 ¡Pago completado! El Genio ya puede empezar la animación.");
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling cuando el Genio está trabajando ──
  const isPolling = project && [
    "image_processing",
    "preview_queued", "preview_processing",
    "final_queued", "final_processing",
  ].includes(project.status);

  const pollProject = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/video-projects/${project.id}`);
      if (!res.ok) return;
      const data: VideoProject = await res.json();
      setProject(data);

      if (data.status === "image_ready")       setStep(2);
      if (data.status === "awaiting_approval") setStep(3);
      if (["final_ready", "published"].includes(data.status)) setStep(4);
    } catch { /* silencioso */ }
  }, [project?.id]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(pollProject, 8000);
    return () => clearInterval(id);
  }, [isPolling, pollProject]);

  // ── Helper de subida ──

  async function uploadAsset(
    projectId: string,
    kind: "protagonist_image" | "audio",
    file: File,
  ): Promise<string> {
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

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
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

  // ── Paso 0: Subir foto ──

  async function handleStep0Submit() {
    if (!imageFile) {
      toast.error("🧞 El Genio necesita la foto frontal del protagonista");
      return;
    }
    if (mode === "lipsync" && !audioFile) {
      toast.error("🎙️ Para el modo talking head necesitas subir el audio del mensaje");
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
          body: JSON.stringify({
            eventId, mode,
            protagonistName,
            language: "es",
            durationSeconds,
            aspectRatio: "9:16",
          }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error((e as { error?: string }).error ?? "Error creando el proyecto");
        }
        proj = await res.json() as VideoProject;
        setProject(proj);
      }

      toast.loading("✨ Subiendo foto…", { id: "step0" });
      await uploadAsset(proj!.id, "protagonist_image", imageFile);

      if (mode === "lipsync" && audioFile) {
        toast.loading("🎵 Subiendo audio…", { id: "step0" });
        await uploadAsset(proj!.id, "audio", audioFile);
      }

      toast.success("✨ ¡Foto lista! Ahora cuéntale al Genio cómo quieres la escena.", { id: "step0" });
      setStep(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg, { id: "step0", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 1: Guardar escena → lanzar la magia ──

  async function handleStep1Submit() {
    if (!project) {
      toast.error("Error: no hay proyecto activo. Vuelve al paso anterior.");
      return;
    }
    setLoading(true);
    toast.loading("🧞 El Genio está leyendo tu descripción…", { id: "gen-image" });
    try {
      const patchRes = await fetch(`/api/video-projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protagonistName,
          protagonistDescription: protagonistDescription || null,
          transformationDescription: transformationDescription || null,
          sceneDescription: sceneDescription || null,
          styleDescription: styleDescription || null,
          durationSeconds,
        }),
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
        body: JSON.stringify({}),
      });
      if (!genRes.ok) {
        const e = await genRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el proceso mágico");
      }

      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(2);
      toast.success("🧞 ¡El Genio está trabajando! Esto tardará un par de minutos.", { id: "gen-image" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg, { id: "gen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 2: Aprobar imagen → animar ──

  async function handleApproveImage() {
    if (!project) return;
    setLoading(true);
    try {
      toast.loading("🎬 El Genio está preparando la animación…", { id: "gen-preview" });
      const res = await fetch(`/api/video-projects/${project.id}/generate-preview`, {
        method: "POST",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando la animación");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(3);
      toast.success("🎬 ¡El Genio está animando tu historia! Tardará unos minutos.", { id: "gen-preview" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "gen-preview", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateImage() {
    if (!project) return;
    setLoading(true);
    try {
      toast.loading("🧞 El Genio lo intentará de nuevo…", { id: "regen-image" });
      const res = await fetch(`/api/video-projects/${project.id}/regenerate-image`, {
        method: "POST",
      });
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

  // ── Paso 3: Aprobar preview → render final ──

  async function handleApprovePreview() {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/video-projects/${project.id}/approve`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el render final");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`).then(r => r.json() as Promise<VideoProject>);
      setProject(updated);
      setStep(4);
      toast.success("🌟 ¡El Genio está creando tu invitación definitiva!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegeneratePreview() {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/video-projects/${project.id}/regenerate`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error regenerando");
      }
      const updated = await res.json() as VideoProject;
      setProject(updated);
      setStep(2);
      toast.success("✨ Vuelve a la imagen y genera una nueva animación");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const regenLeft = project ? project.maxRegenerations - project.regenerationCount : 0;

  return (
    <div style={{ maxWidth: "560px" }}>
      <StepIndicator current={step} />

      {/* ── PASO 0: Subir foto frontal ──────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Selector de modo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(["visual", "lipsync"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "16px", borderRadius: "12px", cursor: "pointer",
                border: `2px solid ${mode === m ? "var(--brand-primary)" : "var(--neutral-700)"}`,
                background: mode === m ? "rgba(139,92,246,0.1)" : "var(--surface-card)",
                color: "var(--neutral-100)", textAlign: "left",
              }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>{m === "visual" ? "🎬" : "🎙️"}</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                  {m === "visual" ? "Vídeo visual" : "Talking head"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--neutral-400)" }}>
                  {m === "visual" ? "Escena cinematográfica con el protagonista" : "El protagonista habla sincronizado con tu audio"}
                </div>
              </button>
            ))}
          </div>

          {/* Tip del Genio */}
          <GenieTip>
            <strong>Para que la magia funcione perfectamente</strong>, sube una foto frontal del protagonista donde se vea bien la cara — bien iluminada, mirando a cámara. Cuanto más clara sea la foto, más realista será el resultado. 🪄
          </GenieTip>

          {/* 1 slot de foto frontal */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "10px" }}>
              Foto del protagonista <span style={{ color: "#ef4444" }}>*</span>
              <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginLeft: "8px" }}>
                Frontal, cara visible, buena luz
              </span>
            </label>
            <div style={{ maxWidth: "180px", margin: "0 auto" }}>
              <PhotoSlot
                index={0}
                file={imageFile}
                preview={imagePreview}
                required
                onFile={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}
                onRemove={() => { setImageFile(null); setImagePreview(null); }}
              />
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--neutral-600)", marginTop: "10px", textAlign: "center" }}>
              ✅ Frontal · 😊 Cara centrada · 💡 Buena iluminación
            </p>
          </div>

          {/* Audio (solo lipsync) */}
          {mode === "lipsync" && (
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "8px" }}>
                Audio del mensaje <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <AudioDropzone preview={audioPreview} onFile={(f) => { setAudioFile(f); setAudioPreview(URL.createObjectURL(f)); }} />
            </div>
          )}

          <button
            onClick={handleStep0Submit}
            disabled={loading || !imageFile}
            style={{
              padding: "14px 24px", borderRadius: "10px", border: "none",
              background: "var(--brand-primary)", color: "#fff",
              fontWeight: 600, cursor: loading || !imageFile ? "not-allowed" : "pointer",
              opacity: loading || !imageFile ? 0.6 : 1,
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
            Describe la escena soñada con todo el detalle que quieras. Cuanto más específico seas, más espectacular será la magia del Genio. ¡Déjate llevar por la imaginación! ✨
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
              Duración del vídeo: <strong>{durationSeconds}s</strong>
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

          {project && project.regenerationCount > 0 && (
            <div style={{ fontSize: "0.8rem", color: "var(--neutral-500)" }}>
              Magias usadas: {project.regenerationCount} / {project.maxRegenerations}
            </div>
          )}

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
                color: "#fff", fontWeight: 600,
                cursor: loading || !protagonistName ? "not-allowed" : "pointer",
                opacity: loading || !protagonistName ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
              }}
            >
              {loading
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : <span style={{ fontSize: "1rem" }}>🧞</span>}
              ¡Lanzar la magia del Genio!
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Imagen mágica ──────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project?.status === "image_processing" ? (
            <ProcessingState status="image_processing" />
          ) : project?.status === "image_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>😔</span>
              <p style={{ color: "var(--neutral-300)", fontWeight: 600 }}>El Genio necesita otra oportunidad</p>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem", maxWidth: "280px" }}>
                Algo no salió bien. Puedes intentarlo de nuevo o volver atrás para cambiar las fotos.
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
                  Reintentar magia
                </button>
              </div>
            </div>
          ) : project?.processedImageUrl ? (
            <>
              {/* Imagen generada por NanaBanana */}
              <div>
                <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "400px", margin: "0 auto" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.processedImageUrl}
                    alt="Imagen mágica del protagonista"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>

              {/* ── Upsell del Genio (solo si no está pagado y no fue omitido) ── */}
              {!project.animationPaid && !upsellDismissed ? (
                <GenieUpsellBlock
                  projectId={project.id}
                  eventId={eventId}
                  eventType={event.type}
                  celebrantName={event.celebrantName}
                  celebrantAge={event.celebrantAge}
                  onPaid={() => setUpsellDismissed(true)}
                />
              ) : (
                <>
                  <GenieTip>
                    {project.animationPaid
                      ? "¡Genial! El pago está confirmado. Ahora pulsa «¡Animar!» para que El Genio dé vida a la imagen. ✨"
                      : "¡El Genio ha hecho su magia! Si te gusta la imagen, anímala. Si no, pide otra versión. ✨"}
                  </GenieTip>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={handleRegenerateImage}
                      disabled={loading || regenLeft <= 0}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px",
                        border: "1px solid var(--neutral-700)", background: "transparent",
                        color: "var(--neutral-300)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                        opacity: regenLeft <= 0 ? 0.4 : 1,
                      }}
                    >
                      {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
                      {regenLeft <= 0 ? "Sin magias" : `Nueva imagen (${regenLeft})`}
                    </button>
                    <button
                      onClick={handleApproveImage}
                      disabled={loading}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px", border: "none",
                        background: "var(--brand-primary)", color: "#fff", fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={16} />}
                      ¡Animar la imagen!
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <ProcessingState status="image_processing" />
          )}
        </div>
      )}

      {/* ── PASO 3: Preview del vídeo ──────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project && ["preview_queued", "preview_processing"].includes(project.status) ? (
            <ProcessingState status={project.status} />
          ) : project?.status === "preview_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>😔</span>
              <p style={{ color: "var(--neutral-300)", fontWeight: 600 }}>El Genio necesita otro intento</p>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem" }}>La animación no salió bien. ¡Inténtalo de nuevo!</p>
              <button
                onClick={handleRegeneratePreview}
                disabled={loading}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <RefreshCw size={16} />
                Reintentar animación
              </button>
            </div>
          ) : project?.previewVideoUrl ? (
            <>
              <GenieTip>
                ¡El Genio ha animado tu historia! Este es el preview. Si te gusta, crea la versión definitiva en máxima calidad. Si no, pide otra versión. 🎬
              </GenieTip>
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "480px", margin: "0 auto" }}>
                <video src={project.previewVideoUrl} controls autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleRegeneratePreview}
                  disabled={loading || regenLeft <= 0}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "10px",
                    border: "1px solid var(--neutral-700)", background: "transparent",
                    color: "var(--neutral-300)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                    opacity: regenLeft <= 0 ? 0.4 : 1,
                  }}
                >
                  <RefreshCw size={16} />
                  {regenLeft <= 0 ? "Sin magias" : `Otra versión (${regenLeft})`}
                </button>
                <button
                  onClick={handleApprovePreview}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <span>🌟</span>}
                  ¡Crear mi invitación!
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── PASO 4: Invitación final ──────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project && ["approved_for_final", "final_queued", "final_processing"].includes(project.status) ? (
            <ProcessingState status={project.status === "approved_for_final" ? "final_queued" : project.status} />
          ) : project?.finalVideoUrl ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "2.5rem" }}>🎉</span>
                <p style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.1rem", margin: "8px 0 4px" }}>
                  ¡La magia del Genio está lista!
                </p>
                <p style={{ color: "var(--neutral-400)", fontSize: "0.85rem" }}>
                  Tu invitación aparecerá en la página pública del evento.
                </p>
              </div>
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "480px", margin: "0 auto" }}>
                <video src={project.finalVideoUrl} controls autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <a
                href={project.finalVideoUrl}
                download
                style={{ padding: "12px 24px", borderRadius: "10px", border: "1px solid var(--neutral-700)", color: "var(--neutral-300)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
              >
                <Share2 size={16} /> Descargar vídeo
              </a>
              <button
                onClick={() => setStep(5)}
                style={{
                  width: "100%", padding: "11px 16px",
                  borderRadius: "10px", border: "1px solid rgba(139,92,246,0.3)",
                  background: "rgba(139,92,246,0.06)", color: "var(--neutral-300)",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                🎁 Continuar con regalos y RSVP →
              </button>
            </>
          ) : project?.status === "final_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>😔</span>
              <p style={{ color: "var(--neutral-300)", fontWeight: 600 }}>El Genio necesita otro intento para la versión final</p>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem" }}>¡Casi lo tenemos! Inténtalo de nuevo.</p>
              <button
                onClick={handleApprovePreview}
                disabled={loading}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
                Reintentar
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── PASO 5: Regalos ────────────────────────────────────────────────── */}
      {step === 5 && (
        <WizardStepGifts
          eventId={eventId}
          celebrantName={event.celebrantName}
          onNext={() => setStep(6)}
          onSkip={() => setStep(6)}
        />
      )}

      {/* ── PASO 6: RSVP ───────────────────────────────────────────────────── */}
      {step === 6 && (
        <WizardStepRsvp
          eventId={eventId}
          onNext={() => setStep(7)}
          onSkip={() => setStep(7)}
        />
      )}

      {/* ── PASO 7: Listo ──────────────────────────────────────────────────── */}
      {step === 7 && (
        <WizardStepComplete
          eventId={eventId}
          eventSlug={event.slug}
          celebrantName={event.celebrantName}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}
