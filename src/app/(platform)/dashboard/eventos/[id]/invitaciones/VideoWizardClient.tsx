"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Play, ExternalLink, RefreshCw, Clock } from "lucide-react";
import type { VideoInvitation } from "@/db/schema";

const TEMPLATES = [
  { id: "confetti_kids", label: "Confeti Mágico", emoji: "🎊", description: "Colores vibrantes y confeti para los más pequeños" },
  { id: "royal_party", label: "Fiesta Real", emoji: "👑", description: "Elegante y festivo, perfecto para comuniones" },
  { id: "adventure_park", label: "Gran Aventura", emoji: "🚀", description: "Acción y movimiento para cumpleaños activos" },
  { id: "fairy_tale", label: "Cuento de Hadas", emoji: "🧚", description: "Mágico y encantador para las más pequeñas" },
  { id: "sports_party", label: "Fiesta Deportiva", emoji: "⚽", description: "Para los amantes del deporte y la acción" },
  { id: "minimal_chic", label: "Minimalista", emoji: "✨", description: "Elegante y moderno para todas las edades" },
];

interface Props {
  eventId: string;
  event: { celebrantName: string | null; celebrantAge: number | null; type: string };
  existingVideos: VideoInvitation[];
}

export default function VideoWizardClient({ eventId, event, existingVideos }: Props) {
  const [videos, setVideos] = useState<VideoInvitation[]>(existingVideos);
  const [step, setStep] = useState<"select" | "customize" | "generating" | "done">(
    existingVideos.length > 0 ? "done" : "select"
  );
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [wizardData, setWizardData] = useState({
    message: `¡Estás invitado a la fiesta de ${event.celebrantName ?? ""}!`,
    date: "",
    venue: "",
    style: "fun",
  });
  const [creating, setCreating] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/video-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, template: selectedTemplate, wizardData }),
      });
      if (!res.ok) throw new Error();
      const { video } = await res.json();
      setVideos((prev) => [video, ...prev]);
      setStep("generating");
      setPollingId(video.id);
      pollStatus(video.id);
    } catch {
      toast.error("Error al crear la invitación");
    } finally {
      setCreating(false);
    }
  }

  async function pollStatus(videoId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-invitations/${videoId}/status`);
        const data = await res.json();
        if (data.status === "ready") {
          setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, ...data } : v));
          setStep("done");
          setPollingId(null);
          clearInterval(interval);
          toast.success("¡Tu invitación está lista!");
        } else if (data.status === "failed") {
          setStep("select");
          setPollingId(null);
          clearInterval(interval);
          toast.error("Error al generar el vídeo. Inténtalo de nuevo.");
        }
      } catch {
        // Keep polling
      }
    }, 5000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-bg)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  // Existing videos
  if (step === "done" && videos.length > 0) {
    const latestReady = videos.find((v) => v.status === "ready");
    return (
      <div>
        {latestReady ? (
          <div style={{ marginBottom: "24px" }}>
            {latestReady.thumbnailUrl && (
              <div style={{ position: "relative", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: "16px", aspectRatio: "16/9", background: "var(--surface-card)" }}>
                <img src={latestReady.thumbnailUrl} alt="Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                  <a href={latestReady.generatedUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                    style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <Play size={24} style={{ color: "white", marginLeft: "3px" }} />
                  </a>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              {latestReady.shareUrl && (
                <button
                  onClick={() => { navigator.clipboard.writeText(latestReady.shareUrl!); toast.success("Enlace copiado"); }}
                  className="btn btn--primary"
                >
                  Compartir invitación
                </button>
              )}
              {latestReady.generatedUrl && (
                <a href={latestReady.generatedUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textDecoration: "none" }}>
                  <ExternalLink size={14} /> Ver vídeo
                </a>
              )}
              <button className="btn btn--ghost" onClick={() => { setStep("select"); setSelectedTemplate(""); }}>
                <RefreshCw size={14} /> Nueva versión
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", marginBottom: "24px" }}>
            <Clock size={32} style={{ margin: "0 auto 12px", color: "var(--neutral-500)" }} />
            <p style={{ color: "var(--neutral-400)" }}>Tu invitación se está generando... Esto puede tardar unos minutos.</p>
          </div>
        )}
      </div>
    );
  }

  // Generating state
  if (step === "generating") {
    return (
      <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,51,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Sparkles size={28} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 style={{ marginBottom: "12px" }}>Generando tu invitación...</h3>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "8px" }}>
          Nuestra IA está creando un vídeo personalizado para {event.celebrantName}.
        </p>
        <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>Esto puede tardar entre 1 y 3 minutos.</p>
      </div>
    );
  }

  // Template selection
  if (step === "select") {
    return (
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Elige un estilo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              style={{
                background: selectedTemplate === t.id ? "rgba(255,51,102,0.12)" : "var(--surface-card)",
                border: selectedTemplate === t.id ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{t.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "white", marginBottom: "4px" }}>{t.label}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)" }}>{t.description}</div>
            </button>
          ))}
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setStep("customize")}
          disabled={!selectedTemplate}
        >
          Continuar
        </button>
      </div>
    );
  }

  // Customization step
  return (
    <div>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Personaliza tu invitación</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Mensaje principal
          </label>
          <textarea
            value={wizardData.message}
            onChange={(e) => setWizardData((w) => ({ ...w, message: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fecha del evento
            </label>
            <input value={wizardData.date} onChange={(e) => setWizardData((w) => ({ ...w, date: e.target.value }))} type="date" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Lugar
            </label>
            <input value={wizardData.venue} onChange={(e) => setWizardData((w) => ({ ...w, venue: e.target.value }))} placeholder="Salón de eventos..." style={inputStyle} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn--primary" onClick={handleGenerate} disabled={creating}>
          <Sparkles size={16} />
          {creating ? "Enviando a IA..." : "Generar con IA"}
        </button>
        <button className="btn btn--ghost" onClick={() => setStep("select")}>Atrás</button>
      </div>
    </div>
  );
}
