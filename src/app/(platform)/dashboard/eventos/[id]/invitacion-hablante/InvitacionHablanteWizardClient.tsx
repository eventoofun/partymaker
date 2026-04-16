"use client";

/**
 * InvitacionHablanteWizardClient — InfiniteTalk lip-sync wizard
 *
 * Flujo completo (oculto al usuario, que solo ve "El Genio hace su magia"):
 *   1. POST  /api/video-projects          → crea proyecto (mode: "lipsync")
 *   2. POST  /api/video-projects/[id]/assets/presign + confirm → sube foto
 *   3. POST  /api/video-projects/[id]/assets/presign + confirm → sube audio
 *   4. POST  /api/video-projects/[id]/generate-preview         → InfiniteTalk (foto original)
 *   5. GET   /api/video-projects/[id]     → polling hasta awaiting_approval
 *   6. POST  /api/video-projects/[id]/publish-lipsync          → publicar
 *
 * NanaBanana Pro NO se usa en lipsync — InfiniteTalk trabaja mejor con la foto
 * original sin estilizar (necesita rasgos faciales nítidos para el lip-sync).
 *
 * El usuario ve:
 *   Paso 0 — Foto (sube retrato)
 *   Paso 1 — Voz (graba o sube audio, max 15 s)
 *   Paso 2 — Magia (pantalla de espera animada)
 *   Paso 3 — ¡Lista! (reproduce el vídeo y comparte)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check, ArrowLeft, ArrowRight, Loader2, Share2,
  Sparkles, Mic, Video, CheckCircle, Copy, ExternalLink,
  RefreshCw, Upload, X, Square, Play,
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
  previewVideoUrl?: string | null;
  finalVideoUrl?: string | null;
  processedImageUrl?: string | null;
  regenerationCount: number;
  maxRegenerations: number;
}

interface Props {
  eventId: string;
  event: EventInfo;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Foto",   icon: Upload     },
  { label: "Voz",    icon: Mic        },
  { label: "Magia",  icon: Sparkles   },
  { label: "¡Lista!", icon: CheckCircle },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "32px" }}>
      {STEPS.map((step, i) => {
        const Icon  = step.icon;
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

// ─── Genie tip box ────────────────────────────────────────────────────────────

function GenieTip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(0,194,209,0.07)",
      border: "1px solid rgba(0,194,209,0.18)",
      marginBottom: "24px",
    }}>
      <p style={{ fontSize: "0.82rem", color: "var(--neutral-400)", lineHeight: 1.6, margin: 0 }}>
        <strong style={{ color: "#00C2D1" }}>✨ Consejo del Genio: </strong>
        {children}
      </p>
    </div>
  );
}

// ─── Audio waveform visualizer ────────────────────────────────────────────────

function AudioWaveform({ isRecording, analyser }: { isRecording: boolean; analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext("2d")!;
    const bufLen  = analyser.frequencyBinCount;
    const dataArr = new Uint8Array(bufLen);

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      analyser!.getByteTimeDomainData(dataArr);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth   = 2;
      ctx.strokeStyle = "#00C2D1";
      ctx.beginPath();
      const sliceW = canvas.width / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = dataArr[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isRecording, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={60}
      style={{ width: "100%", height: "60px", borderRadius: "8px", background: "rgba(0,194,209,0.04)" }}
    />
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function InvitacionHablanteWizardClient({ eventId, event }: Props) {
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<VideoProject | null>(null);

  // Step 0: Photo
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const photoInputRef               = useRef<HTMLInputElement>(null);

  // Step 1: Audio
  const audioInputRef               = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile]   = useState<File | null>(null);
  const [audioBlob, setAudioBlob]   = useState<Blob | null>(null);
  const [audioMode, setAudioMode]   = useState<"idle" | "recording" | "recorded" | "uploaded">("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [analyser, setAnalyser]     = useState<AnalyserNode | null>(null);
  const mediaRecorderRef            = useRef<MediaRecorder | null>(null);
  const chunksRef                   = useRef<Blob[]>([]);
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef                   = useRef<MediaStream | null>(null);

  // Step 2: Magic — phase messages
  const [magicPhase, setMagicPhase] = useState(0);
  const MAGIC_MESSAGES = [
    "El Genio está analizando el rostro...",
    "El Genio está sincronizando tu voz con los labios...",
    "El Genio está animando la invitación...",
    "¡Casi listo! Añadiendo los últimos toques mágicos...",
  ];

  // Step 3: Share
  const [copied, setCopied] = useState(false);

  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    : null;

  // ── Phase cycling in magic step ──────────────────────────────────────────

  useEffect(() => {
    if (step !== 2) return;
    const id = setInterval(() => setMagicPhase(p => (p + 1) % MAGIC_MESSAGES.length), 4000);
    return () => clearInterval(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload helper ────────────────────────────────────────────────────────

  async function uploadAsset(
    projectId: string,
    kind: "protagonist_image" | "audio",
    file: File | Blob,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const presignRes = await fetch(`/api/video-projects/${projectId}/assets/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, filename, contentType }),
    });
    if (!presignRes.ok) {
      const e = await presignRes.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error ?? "Error generando URL de subida");
    }
    const { uploadUrl, storagePath } = await presignRes.json() as { uploadUrl: string; storagePath: string };

    const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
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

  // ── Polling logic ─────────────────────────────────────────────────────────

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((projectId: string, onComplete: (p: VideoProject) => void) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-projects/${projectId}`);
        if (!res.ok) return;
        const data: VideoProject = await res.json();
        setProject(data);
        // Include all non-processing states so the wizard doesn't spin forever
        // when the server auto-advances the pipeline (e.g. auto-triggered preview)
        const done = [
          "image_ready",
          "preview_queued", "preview_processing", "preview_ready",
          "awaiting_approval",
          "approved_for_final", "final_queued", "final_processing", "final_ready",
          "published",
          "image_failed", "preview_failed", "final_failed",
        ].includes(data.status);
        if (done) { stopPolling(); onComplete(data); }
      } catch { /* silencioso */ }
    }, 8000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Step 0: Upload photo ─────────────────────────────────────────────────

  async function handleStep0Submit() {
    if (!photoFile) { toast.error("Sube una foto para continuar"); return; }
    setLoading(true);
    try {
      toast.loading("El Genio está preparando tu proyecto…", { id: "step0" });

      // Create project
      const createRes = await fetch("/api/video-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          mode: "lipsync",
          protagonistName: event.celebrantName,
          language: "es",
          durationSeconds: 8,
          aspectRatio: "9:16",
        }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error creando el proyecto");
      }
      const proj: VideoProject = await createRes.json();
      setProject(proj);

      // Upload photo
      toast.loading("Subiendo la foto…", { id: "step0" });
      await uploadAsset(proj.id, "protagonist_image", photoFile, photoFile.name, photoFile.type);

      toast.success("¡Foto lista! Ahora graba o sube tu mensaje de voz.", { id: "step0" });
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "step0" });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Record or upload audio ────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx   = new AudioContext();
      const source     = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioMode("recorded");
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setAnalyser(null);
      };
      mr.start();
      setAudioMode("recording");
      setRecordSeconds(0);

      // Countdown timer — auto-stop at 15s
      let secs = 0;
      timerRef.current = setInterval(() => {
        secs++;
        setRecordSeconds(secs);
        if (secs >= 15) stopRecording();
      }, 1000);
    } catch {
      toast.error("No se pudo acceder al micrófono. Comprueba los permisos del navegador.");
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  function discardAudio() {
    setAudioBlob(null);
    setAudioFile(null);
    setAudioMode("idle");
    setRecordSeconds(0);
  }

  async function handleStep1Submit() {
    const hasAudio = audioBlob || audioFile;
    if (!hasAudio) { toast.error("Graba o sube tu mensaje de voz"); return; }
    if (!project) { toast.error("Error: no hay proyecto activo"); return; }

    setLoading(true);
    try {
      // Upload audio
      toast.loading("El Genio está guardando tu voz…", { id: "audio-upload" });
      const blob = audioBlob ?? audioFile!;
      const contentType = audioBlob ? "audio/webm" : (audioFile?.type ?? "audio/mpeg");
      const filename    = audioBlob ? "voice.webm"  : (audioFile?.name ?? "audio.mp3");
      await uploadAsset(project.id, "audio", blob, filename, contentType);

      // Advance to magic step immediately — fire generation in background
      setStep(2);
      setMagicPhase(0);
      toast.dismiss("audio-upload");

      // Fire full pipeline in background
      runMagicPipeline(project.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado", { id: "audio-upload" });
      setLoading(false);
    }
  }

  // ── Magic pipeline (runs after step 1 submit) ─────────────────────────────

  async function runMagicPipeline(projectId: string) {
    try {
      // Lipsync skips NanaBanana — go directly to InfiniteTalk with the original photo
      setMagicPhase(0);
      const genPreRes = await fetch(`/api/video-projects/${projectId}/generate-preview`, {
        method: "POST",
      });
      if (!genPreRes.ok) {
        const e = await genPreRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error iniciando la animación de voz");
      }
      setMagicPhase(1);

      // Poll until awaiting_approval or published
      await waitForStatus(projectId, ["awaiting_approval", "published"], ["preview_failed"]);
      setMagicPhase(2);

      // Publish
      const pubRes = await fetch(`/api/video-projects/${projectId}/publish-lipsync`, {
        method: "POST",
      });
      if (!pubRes.ok) {
        const e = await pubRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Error publicando");
      }
      const published: VideoProject = await pubRes.json();
      setProject(published);
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "El Genio encontró un problema";
      toast.error(msg, { duration: 8000 });
      // Re-fetch project to show current status
      const res = await fetch(`/api/video-projects/${projectId}`).catch(() => null);
      if (res?.ok) setProject(await res.json());
    } finally {
      setLoading(false);
    }
  }

  /** Poll /api/video-projects/[id] every 8s until any of successStatuses is reached.
   * Throws if failStatuses contains the project's status. */
  async function waitForStatus(
    projectId: string,
    successStatuses: string | string[],
    failStatuses: string[],
  ): Promise<VideoProject> {
    const successList = Array.isArray(successStatuses) ? successStatuses : [successStatuses];
    return new Promise((resolve, reject) => {
      const check = (p: VideoProject) => {
        if (successList.includes(p.status)) { resolve(p); return; }
        if (failStatuses.includes(p.status)) { reject(new Error(`El Genio encontró un error en el paso de ${p.status}`)); return; }
        // Not yet at target — keep polling
        startPolling(projectId, check);
      };
      startPolling(projectId, check);
    });
  }

  // ── Renders ───────────────────────────────────────────────────────────────

  function renderStep0() {
    const previewUrl = photoFile ? URL.createObjectURL(photoFile) : null;
    return (
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "8px" }}>
          Elige la foto del protagonista
        </h2>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "20px" }}>
          El Genio animará este retrato para que hable con tu voz.
        </p>

        <GenieTip>
          Usa una foto <strong>de frente</strong>, con buena iluminación y el rostro bien visible. Sin gafas de sol, preferiblemente con fondo simple.
          El Genio necesita ver la cara completa para sincronizar los labios a la perfección.
        </GenieTip>

        {/* Photo drop zone */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => photoInputRef.current?.click()}
          style={{
            width: "100%",
            aspectRatio: "4/3",
            borderRadius: "16px",
            border: photoFile ? "2px solid var(--brand-primary)" : "2px dashed rgba(255,255,255,0.12)",
            background: photoFile ? "rgba(0,194,209,0.06)" : "var(--surface-card)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px",
            color: "var(--neutral-500)",
            marginBottom: "20px",
          }}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={e => { e.stopPropagation(); setPhotoFile(null); }}
                style={{ position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <Upload size={32} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Elige una foto</span>
              <span style={{ fontSize: "0.75rem", color: "var(--neutral-600)" }}>JPEG, PNG o WEBP · Máx. 10 MB</span>
            </>
          )}
        </button>

        <button
          onClick={handleStep0Submit}
          disabled={loading || !photoFile}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            background: photoFile ? "var(--gradient-brand)" : "var(--surface-card)",
            border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
            cursor: loading || !photoFile ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: loading || !photoFile ? 0.5 : 1, fontFamily: "inherit",
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
          {loading ? "Subiendo…" : "Continuar"}
        </button>
      </div>
    );
  }

  function renderStep1() {
    const remainingLabel = audioMode === "recording" ? `${15 - recordSeconds}s` : null;
    return (
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "8px" }}>
          Graba tu mensaje de voz
        </h2>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "20px" }}>
          El Genio hará que la persona de la foto diga exactamente lo que tú digas.
        </p>

        <GenieTip>
          Habla entre <strong>5 y 15 segundos</strong>, despacio y con emoción. Por ejemplo:<br />
          <em style={{ color: "var(--neutral-300)" }}>
            "¡Hola! Te invito a{event.celebrantAge ? ` mis ${event.celebrantAge} añazos` : " mi celebración"}.
            {event.eventDate ? ` Será el ${eventDate}.` : ""}
            {event.venue ? ` En ${event.venue}.` : ""}
            {" "}¡Te espero con los brazos abiertos!"
          </em>
        </GenieTip>

        {/* Recording controls */}
        <div style={{ marginBottom: "20px" }}>
          {audioMode === "idle" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={startRecording}
                style={{
                  flex: 1, padding: "18px", borderRadius: "14px",
                  background: "rgba(239,68,68,0.12)",
                  border: "2px solid rgba(239,68,68,0.3)",
                  color: "#EF4444", cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 700, fontSize: "0.9rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                }}
              >
                <Mic size={28} />
                Grabar ahora
              </button>

              <button
                onClick={() => audioInputRef.current?.click()}
                style={{
                  flex: 1, padding: "18px", borderRadius: "14px",
                  background: "var(--surface-card)",
                  border: "2px solid rgba(255,255,255,0.08)",
                  color: "var(--neutral-300)", cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 700, fontSize: "0.9rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                }}
              >
                <Upload size={28} />
                Subir archivo
                <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--neutral-500)", marginTop: "-2px" }}>
                  m4a · mp3 · wav · ogg
                </span>
              </button>
            </div>
          )}

          {audioMode === "recording" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: "12px" }}>
                <AudioWaveform isRecording analyser={analyser} />
              </div>
              <p style={{ color: "#EF4444", fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>
                Grabando… {recordSeconds}s / 15s
              </p>
              {remainingLabel && (
                <p style={{ color: "var(--neutral-500)", fontSize: "0.8rem", marginBottom: "16px" }}>
                  Tiempo restante: {remainingLabel}
                </p>
              )}
              {/* Progress bar */}
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(239,68,68,0.15)", marginBottom: "16px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#EF4444", width: `${(recordSeconds / 15) * 100}%`, transition: "width 1s linear" }} />
              </div>
              <button
                onClick={stopRecording}
                style={{
                  padding: "12px 28px", borderRadius: "12px",
                  background: "#EF4444", border: "none", color: "white",
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                }}
              >
                <Square size={14} fill="white" /> Detener
              </button>
            </div>
          )}

          {(audioMode === "recorded" || audioMode === "uploaded") && (
            <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,229,160,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mic size={18} style={{ color: "#00E5A0" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#00E5A0", margin: 0 }}>
                    {audioMode === "recorded"
                      ? `Grabación lista · ${recordSeconds}s`
                      : `Archivo: ${audioFile?.name}`
                    }
                  </p>
                  <p style={{ color: "var(--neutral-500)", fontSize: "0.78rem", margin: "2px 0 0" }}>
                    El Genio usará esta voz para la invitación
                  </p>
                </div>
              </div>
              {/* Playback */}
              {audioBlob && (
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  style={{ width: "100%", height: "36px", marginBottom: "10px" }}
                />
              )}
              <button
                onClick={discardAudio}
                style={{ fontSize: "0.8rem", color: "var(--neutral-500)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", padding: 0 }}
              >
                Descartar y grabar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input for upload mode — m4a (iOS voice memos), mp3, wav, ogg, aac all accepted */}
        <input
          ref={audioInputRef}
          type="file"
          accept=".m4a,.mp3,.wav,.ogg,.aac,.mp4,audio/x-m4a,audio/mp4,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/webm"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { toast.error("El archivo de audio no puede superar 10 MB"); return; }
            setAudioFile(file);
            setAudioBlob(null);
            setAudioMode("uploaded");
            setRecordSeconds(0);
          }}
        />

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button
            onClick={() => setStep(0)}
            style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "var(--neutral-400)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} /> Atrás
          </button>
          <button
            onClick={handleStep1Submit}
            disabled={loading || (audioMode !== "recorded" && audioMode !== "uploaded")}
            style={{
              flex: 1, padding: "14px", borderRadius: "12px",
              background: (audioMode === "recorded" || audioMode === "uploaded") ? "var(--gradient-brand)" : "var(--surface-card)",
              border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
              cursor: loading || (audioMode !== "recorded" && audioMode !== "uploaded") ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: loading || (audioMode !== "recorded" && audioMode !== "uploaded") ? 0.5 : 1,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={16} />}
            {loading ? "Enviando al Genio…" : "¡Que empiece la magia!"}
          </button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const hasFailed = project && (project.status === "image_failed" || project.status === "preview_failed");
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/genio/genio.png"
          alt="El Genio está trabajando"
          style={{ width: "100px", objectFit: "contain", margin: "0 auto 20px", display: "block", animation: hasFailed ? "none" : "genieLevitate 3s ease-in-out infinite" }}
        />

        {hasFailed ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#EF4444", marginBottom: "10px" }}>
              El Genio encontró un obstáculo
            </h3>
            <p style={{ color: "var(--neutral-400)", fontSize: "0.88rem", marginBottom: "24px", lineHeight: 1.6 }}>
              Hubo un problema al procesar tu invitación. Comprueba que la foto tenga buena calidad y el audio no supere 15 segundos, luego inténtalo de nuevo.
            </p>
            <button
              onClick={() => { setStep(0); setPhotoFile(null); setAudioBlob(null); setAudioFile(null); setAudioMode("idle"); setProject(null); }}
              style={{ padding: "12px 28px", borderRadius: "12px", background: "var(--gradient-brand)", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <RefreshCw size={15} /> Empezar de nuevo
            </button>
          </>
        ) : (
          <>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--brand-primary)", margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "10px" }}>
              {MAGIC_MESSAGES[magicPhase]}
            </h3>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              El Genio está dando vida a la invitación de <strong style={{ color: "var(--neutral-200)" }}>{event.celebrantName}</strong>.
              <br />
              <span style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>Suele tardar entre 1 y 4 minutos. Esta pantalla se actualizará sola.</span>
            </p>

            {/* Animated dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "var(--brand-primary)",
                  animation: `bounceDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderStep3() {
    const videoUrl = project?.finalVideoUrl;
    const publicEventUrl = typeof window !== "undefined" ? `${window.location.origin}/e/` : "";

    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <CheckCircle size={52} style={{ color: "#00E5A0", margin: "0 auto 14px", display: "block" }} />
          <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "6px" }}>
            ¡Tu invitación hablante está lista! 🎙️
          </h2>
          <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem" }}>
            El Genio ha animado el retrato con tu propia voz. Ya aparece en la página pública del evento.
          </p>
        </div>

        {/* Video player */}
        {videoUrl && (
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "min(280px, 100%)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              background: "#000",
            }}>
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "13px", borderRadius: "12px",
                background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--neutral-200)", fontWeight: 600, fontSize: "0.88rem",
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <ExternalLink size={14} /> Ver vídeo
            </a>
          )}
          <button
            onClick={() => {
              const url = videoUrl ?? publicEventUrl;
              if (navigator.share) navigator.share({ title: `Invitación hablante de ${event.celebrantName}`, url });
              else { navigator.clipboard.writeText(url); toast.success("¡Enlace copiado!"); }
            }}
            style={{
              flex: 1, padding: "13px", borderRadius: "12px",
              background: "var(--gradient-brand)", border: "none",
              color: "white", fontWeight: 700, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <Share2 size={14} /> Compartir
          </button>
        </div>

        {/* Copy video URL */}
        {videoUrl && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1, padding: "11px 14px", borderRadius: "10px", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.78rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {videoUrl}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(videoUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("¡URL copiada!"); }}
                style={{ padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: copied ? "rgba(0,229,160,0.15)" : "var(--surface-card)", color: copied ? "#00E5A0" : "var(--neutral-300)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,194,209,0.06)", border: "1px solid rgba(0,194,209,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Video size={16} style={{ color: "#00C2D1", flexShrink: 0 }} />
            <p style={{ fontSize: "0.82rem", color: "var(--neutral-400)", margin: 0 }}>
              Tu invitación hablante ya está visible en la <strong style={{ color: "var(--neutral-200)" }}>página pública del evento</strong>. Comparte el enlace del evento con tus invitados para que la vean.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div>
      <style>{`
        @keyframes genieLevitate { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes spin          { from { transform: rotate(0deg);  } to { transform: rotate(360deg);  } }
        @keyframes bounceDot     { 0%, 80%, 100% { transform: translateY(0);    } 40% { transform: translateY(-10px); } }
      `}</style>

      <Link href={`/dashboard/eventos/${eventId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft size={14} /> {event.celebrantName}
      </Link>

      <StepIndicator current={step} />

      <div style={{ padding: "32px 28px", borderRadius: "20px", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
