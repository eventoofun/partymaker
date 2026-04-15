"use client";

/**
 * VideoWizardClient — IA-powered video invitation wizard.
 *
 * Flow:
 *   Step 0: Upload protagonist photo (+ audio if lipsync)
 *   Step 1: Describe scene & style
 *   Step 2: NanaBanana Pro processes the image (polling) → user approves
 *   Step 3: Seedance 2 generates preview video (polling) → user approves
 *   Step 4: Kling 3.0 renders final video
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload, Sparkles, RefreshCw, Check, Play, ArrowLeft, ArrowRight,
  Loader2, Image as ImageIcon, Mic, Video, Share2, AlertCircle, Wand2,
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
}

interface Props {
  eventId: string;
  event: EventInfo;
  existingProject?: VideoProject | null;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Foto",    icon: ImageIcon },
  { label: "Escena",  icon: Sparkles  },
  { label: "Imagen",  icon: Wand2     },
  { label: "Preview", icon: Play      },
  { label: "Final",   icon: Video     },
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

// ─── Upload dropzone ──────────────────────────────────────────────────────────

function Dropzone({
  label, accept, onFile, preview, icon: Icon,
}: {
  label: string; accept: string; onFile: (f: File) => void;
  preview?: string | null; icon: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
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
        cursor: "pointer", transition: "border-color 0.2s",
        background: dragging ? "rgba(139,92,246,0.05)" : "var(--surface-card)",
        position: "relative", overflow: "hidden",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {preview ? (
        accept.startsWith("image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" style={{ maxHeight: "160px", maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--brand-primary)" }}>
            <Icon size={32} />
            <span style={{ fontSize: "0.85rem" }}>Audio cargado ✓</span>
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--neutral-500)" }}>
          <Icon size={32} />
          <span style={{ fontSize: "0.85rem" }}>{label}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--neutral-600)" }}>Arrastra o haz clic</span>
        </div>
      )}
    </div>
  );
}

// ─── Processing spinner ───────────────────────────────────────────────────────

function ProcessingState({ status }: { status: string }) {
  const messages: Record<string, { title: string; subtitle: string }> = {
    image_processing:   { title: "NanaBanana Pro procesando tu foto…", subtitle: "Estamos transformando la imagen del protagonista con IA. Suele tardar 1–3 minutos." },
    preview_queued:     { title: "En cola — Kie.ai generará el vídeo en breve…", subtitle: "La cola de generación puede tardar unos minutos." },
    preview_processing: { title: "Generando preview con Seedance 2…", subtitle: "El modelo está animando la imagen. Suele tardar 2–5 minutos." },
    final_queued:       { title: "En cola para render final…", subtitle: "Kling 3.0 empezará en breve." },
    final_processing:   { title: "Render final con Kling 3.0 en curso…", subtitle: "Alta calidad — puede tardar 5–10 minutos." },
  };

  const msg = messages[status] ?? { title: "Procesando…", subtitle: "Espera unos instantes." };

  return (
    <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <Loader2 size={48} style={{ color: "var(--brand-primary)", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "var(--neutral-100)", fontSize: "1rem", fontWeight: 600 }}>{msg.title}</p>
      <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem", maxWidth: "320px" }}>{msg.subtitle}</p>
      <p style={{ color: "var(--neutral-600)", fontSize: "0.78rem" }}>
        Puedes cerrar esta ventana — te notificaremos cuando esté listo.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Determine initial wizard step from project status ────────────────────────

function getInitialStep(status: string): number {
  if (["final_ready", "published"].includes(status)) return 4;
  if (["awaiting_approval", "approved_for_final", "final_queued", "final_processing", "final_failed"].includes(status)) return 4;
  if (["preview_queued", "preview_processing", "preview_ready", "preview_failed"].includes(status)) return 3;
  if (["image_processing", "image_ready", "image_failed"].includes(status)) return 2;
  if (["assets_uploaded", "prompt_compiled"].includes(status)) return 1;
  return 0;
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function VideoWizardClient({ eventId, event, existingProject }: Props) {
  const [step, setStep] = useState(() =>
    existingProject ? getInitialStep(existingProject.status) : 0,
  );
  const [project, setProject] = useState<VideoProject | null>(existingProject ?? null);
  const [loading, setLoading] = useState(false);

  // Step 0 state
  const [mode, setMode] = useState<"visual" | "lipsync">("visual");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  // Step 1 state
  const [protagonistName, setProtagonistName] = useState(existingProject?.protagonistName || event.celebrantName);
  const [protagonistDescription, setProtagonistDescription] = useState(existingProject?.protagonistDescription ?? "");
  const [transformationDescription, setTransformationDescription] = useState(existingProject?.transformationDescription ?? "");
  const [sceneDescription, setSceneDescription] = useState(existingProject?.sceneDescription ?? "");
  const [styleDescription, setStyleDescription] = useState(existingProject?.styleDescription ?? "");
  const [durationSeconds, setDurationSeconds] = useState(existingProject?.durationSeconds ?? 8);

  // ── Polling when Kie.ai is processing ──
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

      // Auto-advance wizard step on status change
      if (data.status === "image_ready")      setStep(2);
      if (data.status === "awaiting_approval") setStep(3);
      if (["final_ready", "published"].includes(data.status)) setStep(4);
    } catch { /* silent */ }
  }, [project?.id]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(pollProject, 8000);
    return () => clearInterval(id);
  }, [isPolling, pollProject]);

  // ── Upload helper ──

  async function uploadAsset(projectId: string, kind: "protagonist_image" | "audio", file: File) {
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
    if (!uploadRes.ok) throw new Error("Error subiendo archivo al almacenamiento");

    const confirmRes = await fetch(`/api/video-projects/${projectId}/assets/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, storagePath }),
    });
    if (!confirmRes.ok) {
      const e = await confirmRes.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error ?? "Error confirmando la subida");
    }
  }

  // ── Step 0: Upload photo ──

  async function handleStep0Submit() {
    if (!imageFile) { toast.error("Sube una foto del protagonista"); return; }
    if (mode === "lipsync" && !audioFile) { toast.error("Sube el audio para el modo lipsync"); return; }

    setLoading(true);
    try {
      let proj = project;
      if (!proj) {
        toast.loading("Creando proyecto…", { id: "step0" });
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

      toast.loading("Subiendo foto…", { id: "step0" });
      await uploadAsset(proj!.id, "protagonist_image", imageFile);

      if (mode === "lipsync" && audioFile) {
        toast.loading("Subiendo audio…", { id: "step0" });
        await uploadAsset(proj!.id, "audio", audioFile);
      }

      toast.success("¡Foto subida! Describe ahora la escena.", { id: "step0" });
      setStep(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg, { id: "step0", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Save scene → submit NanaBanana Pro ──

  async function handleStep1Submit() {
    toast.loading("Guardando escena…", { id: "gen-image" });

    if (!project) {
      toast.error("Error: no hay proyecto activo. Vuelve al paso anterior.", { id: "gen-image" });
      return;
    }
    setLoading(true);
    try {
      // Save scene inputs
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

      // Submit NanaBanana Pro image processing
      toast.loading("Enviando foto a NanaBanana Pro…", { id: "gen-image" });
      const genRes = await fetch(`/api/video-projects/${project.id}/generate-image`, {
        method: "POST",
      });
      if (!genRes.ok) {
        const e = await genRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el procesado de imagen");
      }

      // Refresh and advance to image step
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(2);
      toast.success("¡Imagen enviada a NanaBanana Pro! Procesando…", { id: "gen-image" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg, { id: "gen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Approve processed image → submit Seedance preview ──

  async function handleApproveImage() {
    if (!project) return;
    setLoading(true);
    try {
      toast.loading("Iniciando generación de preview…", { id: "gen-preview" });
      const res = await fetch(`/api/video-projects/${project.id}/generate-preview`, {
        method: "POST",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando el preview");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      setStep(3);
      toast.success("¡Preview en proceso! Seedance 2 está generando el vídeo.", { id: "gen-preview" });
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
      toast.loading("Regenerando imagen con NanaBanana Pro…", { id: "regen-image" });
      const res = await fetch(`/api/video-projects/${project.id}/regenerate-image`, {
        method: "POST",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error regenerando la imagen");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`)
        .then(r => r.ok ? r.json() as Promise<VideoProject> : project);
      setProject(updated);
      toast.success("¡Nueva imagen en proceso!", { id: "regen-image" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "regen-image", duration: 8000 });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Approve preview → Kling final render ──

  async function handleApprovePreview() {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/video-projects/${project.id}/approve`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error aprobando");
      }
      const updated = await fetch(`/api/video-projects/${project.id}`).then(r => r.json() as Promise<VideoProject>);
      setProject(updated);
      setStep(4);
      toast.success("¡Render final iniciado con Kling 3.0!");
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
      // Resets to image_ready so user can re-run Seedance with same image
      const res = await fetch(`/api/video-projects/${project.id}/regenerate`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error regenerando");
      }
      const updated = await res.json() as VideoProject;
      setProject(updated);
      setStep(2);
      toast.success("Vuelve a la imagen IA y genera un nuevo preview");
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

      {/* ── STEP 0: Upload ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Mode selector */}
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

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "8px" }}>
              Foto del protagonista *
            </label>
            <Dropzone
              label="Sube una foto clara del protagonista"
              accept="image/jpeg,image/png,image/webp"
              onFile={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}
              preview={imagePreview}
              icon={ImageIcon}
            />
          </div>

          {mode === "lipsync" && (
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "8px" }}>
                Audio del mensaje *
              </label>
              <Dropzone
                label="Sube el archivo de audio (mp3, wav, m4a)"
                accept="audio/mpeg,audio/wav,audio/mp4,audio/m4a"
                onFile={(f) => { setAudioFile(f); setAudioPreview(URL.createObjectURL(f)); }}
                preview={audioPreview}
                icon={Mic}
              />
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

      {/* ── STEP 1: Scene description ────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", display: "block", marginBottom: "6px" }}>
              Nombre del protagonista *
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
              Duración: {durationSeconds}s
            </label>
            <input
              type="range" min={4} max={15} step={1}
              value={durationSeconds}
              onChange={e => setDurationSeconds(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          {project && project.regenerationCount > 0 && (
            <div style={{ fontSize: "0.8rem", color: "var(--neutral-500)" }}>
              Regeneraciones usadas: {project.regenerationCount} / {project.maxRegenerations}
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
                background: "var(--brand-primary)", color: "#fff", fontWeight: 600,
                cursor: loading || !protagonistName ? "not-allowed" : "pointer",
                opacity: loading || !protagonistName ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
              }}
            >
              {loading
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : <Wand2 size={18} />}
              Crear imagen IA
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Image processing / approval ──────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project?.status === "image_processing" ? (
            <ProcessingState status="image_processing" />
          ) : project?.status === "image_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={40} style={{ color: "#ef4444" }} />
              <p style={{ color: "var(--neutral-300)" }}>El procesado de imagen falló.</p>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem" }}>NanaBanana Pro no pudo transformar la foto. Inténtalo de nuevo.</p>
              <button
                onClick={handleRegenerateImage}
                disabled={loading}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
                {" "}Reintentar
              </button>
            </div>
          ) : project?.processedImageUrl ? (
            <>
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--neutral-400)", marginBottom: "12px", textAlign: "center" }}>
                  NanaBanana Pro ha transformado la foto del protagonista:
                </p>
                <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "400px", margin: "0 auto" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.processedImageUrl}
                    alt="Imagen procesada por IA"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>

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
                  {regenLeft <= 0 ? "Sin regeneraciones" : `Nueva imagen (${regenLeft} restantes)`}
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
                  Generar preview
                </button>
              </div>
            </>
          ) : (
            <ProcessingState status="image_processing" />
          )}
        </div>
      )}

      {/* ── STEP 3: Preview video ─────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project && ["preview_queued", "preview_processing"].includes(project.status) ? (
            <ProcessingState status={project.status} />
          ) : project?.status === "preview_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={40} style={{ color: "#ef4444" }} />
              <p style={{ color: "var(--neutral-300)" }}>La generación del preview falló.</p>
              <button
                onClick={handleRegeneratePreview}
                disabled={loading}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                <RefreshCw size={16} style={{ marginRight: "8px" }} />
                Reintentar
              </button>
            </div>
          ) : project?.previewVideoUrl ? (
            <>
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
                  {regenLeft <= 0 ? "Sin regeneraciones" : `Regenerar (${regenLeft} restantes)`}
                </button>
                <button
                  onClick={handleApprovePreview}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "10px", border: "none",
                    background: "#22c55e", color: "#fff", fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                  Aprobar y generar final
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── STEP 4: Final render ──────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {project && ["final_queued", "final_processing"].includes(project.status) ? (
            <ProcessingState status={project.status} />
          ) : project?.finalVideoUrl ? (
            <>
              <div style={{ borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "9/16", maxHeight: "480px", margin: "0 auto" }}>
                <video src={project.finalVideoUrl} controls autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ color: "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Check size={18} /> ¡Invitación lista!
                </p>
                <p style={{ color: "var(--neutral-400)", fontSize: "0.85rem" }}>
                  Tu invitación aparecerá automáticamente en la página pública del evento.
                </p>
                <a
                  href={project.finalVideoUrl}
                  download
                  style={{ padding: "12px 24px", borderRadius: "10px", border: "1px solid var(--neutral-700)", color: "var(--neutral-300)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center", marginTop: "8px" }}
                >
                  <Share2 size={16} /> Descargar vídeo
                </a>
              </div>
            </>
          ) : project?.status === "final_failed" ? (
            <div style={{ textAlign: "center", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={40} style={{ color: "#ef4444" }} />
              <p style={{ color: "var(--neutral-300)" }}>El render final falló. Vuelve a intentarlo.</p>
              <button
                onClick={handleApprovePreview}
                disabled={loading}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Reintentar render final
              </button>
            </div>
          ) : null}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
