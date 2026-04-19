"use client";

/**
 * InvitacionDigitalWizardClient
 *
 * Wizard para suscripción de Invitaciones (sin vídeo).
 *
 * Reutiliza el mismo stack que VideoWizardClient pero se detiene en image_ready:
 *   1. POST  /api/video-projects          → crea el proyecto (mode: "visual")
 *   2. POST  /api/video-projects/[id]/assets/presign + confirm → sube fotos
 *   3. PATCH /api/video-projects/[id]     → guarda estilo + mensaje
 *   4. POST  /api/video-projects/[id]/generate-image → NanaBanana Pro vía KIE.ai
 *   5. GET   /api/video-projects/[id]     → polling hasta image_ready
 *   6. Muestra processedImageUrl como invitación digital
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Check, ArrowLeft, ArrowRight, Loader2, Share2,
  Sparkles, Palette, MessageSquare, Image as ImageIcon,
  CheckCircle, Copy, ExternalLink, RefreshCw, Upload, X, Gift,
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
  venueAddress?: string | null;
  slug: string;
}

interface VideoProject {
  id: string;
  status: string;
  mode: string;
  protagonistName: string;
  sceneDescription?: string | null;
  styleDescription?: string | null;
  processedImageUrl?: string | null;
  processedImagePath?: string | null;
  regenerationCount: number;
  maxRegenerations: number;
}

interface Props {
  eventId: string;
  event: EventInfo;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Fotos",   icon: ImageIcon     },
  { label: "Diseño",  icon: Palette       },
  { label: "Magia",   icon: Sparkles      },
  { label: "¡Lista!", icon: CheckCircle   },
  { label: "Regalos", icon: Gift          },
  { label: "RSVP",    icon: Check         },
  { label: "¡Listo!", icon: Share2        },
];

const STYLES = [
  { id: "elegante",    label: "Elegante",    prompt: "elegant style, gold and ivory tones, serif typography, luxury, timeless, refined",   emoji: "✨", color: "#C4956A" },
  { id: "festivo",     label: "Festivo",     prompt: "festive celebration style, vibrant colors, confetti, balloons, joyful energy",        emoji: "🎉", color: "#FF4D6D" },
  { id: "minimalista", label: "Minimalista", prompt: "minimalist modern style, clean white background, simple typography, neutral tones",   emoji: "◽", color: "#6B7280" },
  { id: "romantico",   label: "Romántico",   prompt: "romantic style, soft pink and rose tones, flowers, delicate details, dreamy",         emoji: "🌸", color: "#EC4899" },
  { id: "divertido",   label: "Divertido",   prompt: "fun colorful kids style, playful illustrations, bright colors, cartoon elements",     emoji: "🎈", color: "#FFB300" },
  { id: "corporativo", label: "Corporativo", prompt: "professional corporate style, dark navy and gold, sophisticated, modern business",    emoji: "🏢", color: "#6366F1" },
];

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Evento de empresa", other: "Celebración",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

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
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "2px", background: done ? "var(--brand-primary)" : "var(--neutral-800)", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function InvitacionDigitalWizardClient({ eventId, event }: Props) {
  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [project, setProject]         = useState<VideoProject | null>(null);
  // Step 0: Foto frontal
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const fileInputRef                   = useRef<HTMLInputElement>(null);

  // Step 1: Style + message
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [dressCode, setDressCode]         = useState("");

  // Step 3: Share
  const [copied, setCopied] = useState(false);

  const typeLabel  = TYPE_LABEL[event.type] ?? "Celebración";
  const styleObj   = STYLES.find(s => s.id === selectedStyle);
  const eventDate  = event.eventDate ? new Date(event.eventDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;

  // ── Polling (same as VideoWizardClient) ──────────────────────────────────

  const isPolling = project?.status === "image_processing";

  const pollProject = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/video-projects/${project.id}`);
      if (!res.ok) return;
      const data: VideoProject = await res.json();
      setProject(data);
      if (data.status === "image_ready") setStep(3);
    } catch { /* silencioso */ }
  }, [project?.id]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(pollProject, 8000);
    return () => clearInterval(id);
  }, [isPolling, pollProject]);

  // ── Upload helper (identical to VideoWizardClient) ────────────────────────

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
    if (!uploadRes.ok) throw new Error("Error subiendo la foto");

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

  // ── Paso 0: Subir foto ──────────────────────────────────────────────────

  async function handleStep0Submit() {
    if (!imageFile) {
      toast.error("Sube la foto frontal del protagonista");
      return;
    }
    setLoading(true);
    try {
      let proj = project;
      if (!proj) {
        toast.loading("El Genio está preparando tu proyecto…", { id: "step0" });
        const res = await fetch("/api/video-projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            mode: "visual",
            protagonistName: event.celebrantName,
            language: "es",
            durationSeconds: 8,
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

      toast.loading("Subiendo foto…", { id: "step0" });
      await uploadAsset(proj!.id, "protagonist_image", imageFile);

      toast.success("¡Foto lista! Ahora elige el estilo de tu invitación.", { id: "step0" });
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "step0" });
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 1: Elegir estilo + mensaje → lanzar NanaBanana Pro vía KIE.ai ────

  async function handleStep1Submit() {
    if (!selectedStyle) { toast.error("Elige un estilo para continuar"); return; }
    if (!project) { toast.error("Error: no hay proyecto activo"); return; }

    setLoading(true);
    toast.loading("El Genio está leyendo tu descripción…", { id: "gen-image" });

    try {
      // Build scene description from style + message
      const style = STYLES.find(s => s.id === selectedStyle)!;
      const messageLines = [
        customMessage || `Invitación para la ${typeLabel} de ${event.celebrantName}`,
        event.eventDate ? `Fecha: ${eventDate}` : null,
        event.venue     ? `Lugar: ${event.venue}` : null,
        dressCode       ? `Código de vestimenta: ${dressCode}` : null,
      ].filter(Boolean).join(". ");

      // PATCH project with style + scene description
      const patchRes = await fetch(`/api/video-projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protagonistName:          event.celebrantName,
          sceneDescription:         messageLines,
          styleDescription:         style.prompt,
          protagonistDescription:   `${typeLabel} celebration, portrait of ${event.celebrantName}`,
          transformationDescription: `Create a beautiful ${style.id} digital invitation card`,
        }),
      });
      if (!patchRes.ok) {
        const e = await patchRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error guardando los datos");
      }

      // Submit NanaBanana Pro job via KIE.ai (/api/video-projects/[id]/generate-image)
      toast.loading("El Genio está preparando tu invitación mágica…", { id: "gen-image" });
      const genRes = await fetch(`/api/video-projects/${project.id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!genRes.ok) {
        const e = await genRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando la generación");
      }

      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(2);
      toast.success("¡El Genio está trabajando! La invitación estará lista en un par de minutos.", { id: "gen-image" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "gen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Regenerar ────────────────────────────────────────────────────────────

  async function handleRegenerate() {
    if (!project) return;
    setLoading(true);
    try {
      toast.loading("El Genio lo intentará de nuevo…", { id: "regen" });
      const res = await fetch(`/api/video-projects/${project.id}/regenerate-image`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error regenerando");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(2); // back to polling
      toast.success("¡El Genio lo está intentando de nuevo!", { id: "regen" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "regen" });
    } finally {
      setLoading(false);
    }
  }

  // ── Renders ───────────────────────────────────────────────────────────────

  function renderStep0() {
    return (
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "8px" }}>Sube la foto del protagonista</h2>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "28px" }}>
          Una foto frontal clara con la cara bien visible. El Genio hará la magia.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0] ?? null;
            setImageFile(file);
          }}
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "160px", aspectRatio: "3/4", borderRadius: "14px",
              border: imageFile ? "2px solid var(--brand-primary)" : "2px dashed rgba(255,255,255,0.12)",
              background: imageFile ? "rgba(0,194,209,0.08)" : "var(--surface-card)",
              cursor: "pointer", position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
              color: "var(--neutral-500)",
            }}
          >
            {imageFile ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(imageFile)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={e => { e.stopPropagation(); setImageFile(null); }}
                  style={{ position: "absolute", top: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <Upload size={24} />
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Subir foto</span>
                <span style={{ fontSize: "0.7rem" }}>Frontal · Cara visible</span>
              </>
            )}
          </button>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(0,194,209,0.07)", border: "1px solid rgba(0,194,209,0.15)", marginBottom: "24px" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--neutral-400)", lineHeight: 1.55 }}>
            <strong style={{ color: "#00C2D1" }}>Tip del Genio:</strong> La foto frontal con buena iluminación es clave para que la invitación sea perfecta. Cara centrada, mirando a cámara, fondo simple. Las fotos no se guardan una vez generada la invitación.
          </p>
        </div>

        <button
          onClick={handleStep0Submit}
          disabled={loading || !imageFile}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            background: imageFile ? "var(--gradient-brand)" : "var(--surface-card)",
            border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
            cursor: loading || !imageFile ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: loading || !imageFile ? 0.5 : 1, fontFamily: "inherit",
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
          {loading ? "Subiendo…" : "Continuar"}
        </button>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "8px" }}>Personaliza tu invitación</h2>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "24px" }}>
          Elige el estilo y escribe el mensaje. El Genio hará el resto.
        </p>

        {/* Style grid */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "var(--neutral-400)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estilo de la invitación</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                style={{
                  padding: "12px 10px", borderRadius: "12px", fontFamily: "inherit",
                  border: selectedStyle === s.id ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.06)",
                  background: selectedStyle === s.id ? `${s.color}15` : "var(--surface-card)",
                  cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{s.emoji}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: selectedStyle === s.id ? s.color : "var(--neutral-300)" }}>{s.label}</div>
                {selectedStyle === s.id && <Check size={12} style={{ color: s.color, marginTop: "4px" }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "var(--neutral-400)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mensaje de la invitación</label>
          <textarea
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            rows={3}
            placeholder={`¡Estás invitado/a a la ${typeLabel} de ${event.celebrantName}!${eventDate ? `\nFecha: ${eventDate}` : ""}${event.venue ? `\nLugar: ${event.venue}` : ""}`}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
          />
        </div>

        {/* Dress code */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "var(--neutral-400)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Código de vestimenta <span style={{ textTransform: "none", fontWeight: 400 }}>(opcional)</span></label>
          <input
            type="text"
            value={dressCode}
            onChange={e => setDressCode(e.target.value)}
            placeholder="Ej: Formal, Cocktail, Casual, Blanco y dorado…"
            style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "var(--surface-card)", color: "var(--neutral-100)", fontSize: "0.9rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setStep(0)}
            style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "var(--neutral-400)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} /> Atrás
          </button>
          <button
            onClick={handleStep1Submit}
            disabled={loading || !selectedStyle}
            style={{
              flex: 1, padding: "14px", borderRadius: "12px",
              background: selectedStyle ? "var(--gradient-brand)" : "var(--surface-card)",
              border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
              cursor: loading || !selectedStyle ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: loading || !selectedStyle ? 0.5 : 1,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={16} />}
            {loading ? "Enviando al Genio…" : "Crear invitación"}
          </button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const isFailed = project?.status === "image_failed";
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/genio/genio.png" alt="El Genio" style={{ width: "100px", objectFit: "contain", margin: "0 auto 20px", display: "block", animation: isFailed ? "none" : "genieLevitate 3s ease-in-out infinite" }} />

        {isFailed ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px", color: "#EF4444" }}>El Genio encontró un problema</h3>
            <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "24px" }}>
              Hubo un problema al procesar las fotos. Puedes intentarlo de nuevo.
            </p>
            <button
              onClick={handleRegenerate}
              disabled={loading || (project?.regenerationCount ?? 0) >= (project?.maxRegenerations ?? 3)}
              style={{ padding: "12px 24px", borderRadius: "12px", background: "var(--gradient-brand)", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <RefreshCw size={15} /> Intentar de nuevo
            </button>
          </>
        ) : (
          <>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--brand-primary)", margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "8px" }}>
              El Genio está creando tu invitación...
            </h3>
            <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "8px" }}>
              El Genio está procesando las fotos de <strong style={{ color: "var(--neutral-200)" }}>{event.celebrantName}</strong>.
            </p>
            <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>
              Esto suele tardar 1-3 minutos. Esta pantalla se actualizará sola.
            </p>
          </>
        )}
      </div>
    );
  }

  function renderStep3() {
    const invitationUrl = project?.processedImageUrl;
    const shareUrl = `https://cumplefy.com/e/`; // public event page — the image appears there

    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <CheckCircle size={48} style={{ color: "#00E5A0", margin: "0 auto 12px", display: "block" }} />
          <h2 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: "6px" }}>¡Tu invitación está lista! 🎉</h2>
          <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem" }}>
            NanaBanana Pro vía KIE.ai ha creado tu invitación digital.
          </p>
        </div>

        {/* Preview */}
        {invitationUrl && (
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invitationUrl}
              alt="Tu invitación digital"
              style={{ maxWidth: "320px", width: "100%", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            />
          </div>
        )}

        {/* Copy URL */}
        {invitationUrl && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.78rem", color: "var(--neutral-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              URL de tu invitación
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1, padding: "11px 14px", borderRadius: "10px", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.82rem", color: "var(--neutral-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {invitationUrl}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(invitationUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("¡Enlace copiado!"); }}
                style={{ padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: copied ? "rgba(0,229,160,0.15)" : "var(--surface-card)", color: copied ? "#00E5A0" : "var(--neutral-300)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {invitationUrl && (
            <a href={invitationUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "13px", borderRadius: "12px", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--neutral-200)", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <ExternalLink size={14} /> Ver invitación
            </a>
          )}
          <button
            onClick={() => {
              const url = invitationUrl ?? shareUrl;
              if (navigator.share) navigator.share({ title: `Invitación: ${event.celebrantName}`, url });
              else { navigator.clipboard.writeText(url); toast.success("¡Enlace copiado!"); }
            }}
            style={{ flex: 1, padding: "13px", borderRadius: "12px", background: "var(--gradient-brand)", border: "none", color: "white", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Share2 size={14} /> Compartir
          </button>
        </div>

        {project && project.regenerationCount < project.maxRegenerations && (
          <button
            onClick={handleRegenerate}
            disabled={loading}
            style={{ width: "100%", marginTop: "12px", padding: "11px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "var(--neutral-500)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.83rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <RefreshCw size={13} /> No me convence — regenerar ({project.maxRegenerations - project.regenerationCount} intentos restantes)
          </button>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px", marginTop: "16px" }}>
          <button
            onClick={() => setStep(4)}
            style={{
              width: "100%", padding: "11px 16px",
              borderRadius: "10px", border: "1px solid rgba(139,92,246,0.3)",
              background: "rgba(139,92,246,0.06)", color: "var(--neutral-300)",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            🎁 Continuar con regalos y RSVP →
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{`
        @keyframes genieLevitate { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <StepIndicator current={step} />

      <div style={{ padding: "32px 28px", borderRadius: "20px", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && (
          <WizardStepGifts
            eventId={eventId}
            celebrantName={event.celebrantName}
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <WizardStepRsvp
            eventId={eventId}
            onNext={() => setStep(6)}
            onSkip={() => setStep(6)}
          />
        )}
        {step === 6 && (
          <WizardStepComplete
            eventId={eventId}
            eventSlug={event.slug}
            celebrantName={event.celebrantName}
          />
        )}
      </div>
    </div>
  );
}
