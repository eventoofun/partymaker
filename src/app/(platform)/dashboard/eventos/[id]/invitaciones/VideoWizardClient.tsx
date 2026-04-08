"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  Sparkles, Play, ExternalLink, RefreshCw, Clock,
  ChevronRight, ChevronLeft, Wand2, Check, Share2,
} from "lucide-react";
import type { VideoInvitation } from "@/db/schema";
import type { InvitacionProps } from "@/remotion/InvitacionComposition";

// Remotion Player — solo cliente (no SSR)
const InvitacionPlayer = dynamic(() => import("@/components/InvitacionPlayer"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", aspectRatio: "9/16", background: "var(--surface-card)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Sparkles size={32} style={{ color: "var(--brand-primary)", opacity: 0.5 }} />
    </div>
  ),
});

// ─── PASO 1: Personajes protagonistas ────────────────────────────────────────

const PROTAGONISTS = [
  { id: "superhero",   emoji: "🦸",  label: "Superhéroe",      universe: "un universo de héroes y poderes extraordinarios" },
  { id: "astronaut",   emoji: "🚀",  label: "Astronauta",      universe: "el cosmos infinito y las estrellas más lejanas" },
  { id: "pirate",      emoji: "🏴‍☠️", label: "Pirata",          universe: "alta mar, tesoros escondidos y aventuras sin fin" },
  { id: "princess",    emoji: "👑",  label: "Princesa/Príncipe",universe: "un reino mágico lleno de encanto y nobleza" },
  { id: "dino",        emoji: "🦕",  label: "Dinosaurio",      universe: "la era prehistórica más épica del planeta" },
  { id: "footballer",  emoji: "⚽",  label: "Futbolista",      universe: "el estadio más grande del mundo con millones de fans" },
  { id: "wizard",      emoji: "🧙",  label: "Mago/Bruja",      universe: "un mundo de hechizos, pociones y magia ancestral" },
  { id: "unicorn",     emoji: "🦄",  label: "Unicornio",       universe: "un reino de colores, magia y arcoíris eternos" },
  { id: "robot",       emoji: "🤖",  label: "Robot/Científico", universe: "el laboratorio del futuro y la tecnología avanzada" },
  { id: "ninja",       emoji: "🥷",  label: "Ninja",           universe: "el Japón feudal de honor, velocidad y sigilo" },
  { id: "mermaid",     emoji: "🧜",  label: "Sirena/Tritón",   universe: "las profundidades del océano y sus maravillas" },
  { id: "cowboy",      emoji: "🤠",  label: "Vaquero/a",       universe: "el salvaje oeste y las praderas sin horizonte" },
  { id: "explorer",    emoji: "🗺️",  label: "Explorador/a",    universe: "la selva virgen y los secretos del mundo antiguo" },
  { id: "chef",        emoji: "👨‍🍳", label: "Chef",            universe: "la cocina más famosa del mundo con fans por doquier" },
  { id: "dancer",      emoji: "💃",  label: "Bailarín/a",      universe: "el escenario más grande del mundo bajo los focos" },
  { id: "custom",      emoji: "✏️",  label: "Otro…",           universe: "" },
];

// ─── PASO 2: Rasgos de personalidad ──────────────────────────────────────────

const TRAITS = [
  "Aventurero/a", "Curioso/a", "Valiente", "Gracioso/a",
  "Creativo/a", "Tierno/a", "Energético/a", "Listo/a",
  "Travieso/a", "Soñador/a", "Cariñoso/a", "Líder",
  "Divertido/a", "Sensible", "Independiente", "Generoso/a",
];

// ─── PASO 3: Universo visual ──────────────────────────────────────────────────

const PALETTES = [
  { id: "fire",     label: "Fuego",    colors: ["#FF4500", "#FF8C00", "#FFD700"], primary: "#FF4500", secondary: "#FFD700", desc: "Rojo, naranja y dorado — energía máxima" },
  { id: "ocean",    label: "Océano",   colors: ["#00CED1", "#1E90FF", "#4169E1"], primary: "#00CED1", secondary: "#4169E1", desc: "Turquesa y azul profundo — misterio y calma" },
  { id: "forest",   label: "Bosque",   colors: ["#228B22", "#32CD32", "#90EE90"], primary: "#32CD32", secondary: "#228B22", desc: "Verdes naturales — aventura y vida" },
  { id: "galaxy",   label: "Galaxia",  colors: ["#4B0082", "#8A2BE2", "#DA70D6"], primary: "#8A2BE2", secondary: "#DA70D6", desc: "Púrpuras y malvas — magia cósmica" },
  { id: "rainbow",  label: "Arcoíris", colors: ["#FF3366", "#FFD700", "#00CED1"], primary: "#FF3366", secondary: "#FFD700", desc: "Todos los colores — alegría pura" },
  { id: "golden",   label: "Dorado",   colors: ["#FFD700", "#FFC125", "#DAA520"], primary: "#FFD700", secondary: "#DAA520", desc: "Dorado y crema — lujo y celebración" },
];

const MOODS = [
  { id: "epic",     emoji: "⚡", label: "Épica",    desc: "Música potente, efectos explosivos, cámara en movimiento constante" },
  { id: "magical",  emoji: "✨", label: "Mágica",   desc: "Destellos, transiciones suaves, atmósfera de cuento de hadas" },
  { id: "fun",      emoji: "🎊", label: "Divertida", desc: "Colores vivos, confeti, ritmo alegre y desenfadado" },
  { id: "elegant",  emoji: "🌟", label: "Elegante", desc: "Composición limpia, tipografía premium, sofisticada y refinada" },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function buildRemotionProps(data: WizardData, celebrantName: string, celebrantAge: number | null): InvitacionProps {
  const protagonist = PROTAGONISTS.find(p => p.id === data.protagonistId);
  const palette = PALETTES.find(p => p.id === data.paletteId);
  return {
    celebrantName,
    celebrantAge: celebrantAge ?? undefined,
    protagonistEmoji: data.protagonistId === "custom" ? "✨" : (protagonist?.emoji ?? "🎉"),
    protagonistLabel: data.protagonistId === "custom" ? data.protagonistCustom : (protagonist?.label ?? ""),
    parentMessage: data.parentMessage,
    eventDate: data.eventDate,
    eventTime: data.eventTime || undefined,
    venue: data.venue,
    primaryColor: palette?.primary ?? "#FF3366",
    secondaryColor: palette?.secondary ?? "#8338EC",
    mood: (data.moodId as InvitacionProps["mood"]) ?? "fun",
  };
}

function generatePrompt(data: WizardData, eventName: string, celebrantAge: number | null): string {
  const protagonist = PROTAGONISTS.find(p => p.id === data.protagonistId);
  const protagonistLabel = data.protagonistId === "custom" ? data.protagonistCustom : protagonist?.label ?? "";
  const universe = data.protagonistId === "custom" ? `el mundo de ${data.protagonistCustom}` : protagonist?.universe ?? "";
  const palette = PALETTES.find(p => p.id === data.paletteId);
  const mood = MOODS.find(m => m.id === data.moodId);
  const ageStr = celebrantAge ? `${celebrantAge} años` : "";

  return `Crea una videoinvitación animada cinematográfica de 35-45 segundos para la fiesta de cumpleaños de ${eventName}${ageStr ? ` (${ageStr})` : ""}.

CONCEPTO PROTAGONISTA:
${eventName} siempre ha soñado con ser ${protagonistLabel}. En esta invitación, ${eventName} ES ese personaje — viviendo en ${universe}.

PERSONALIDAD DEL PROTAGONISTA:
${data.traits.length > 0 ? `${eventName} es ${data.traits.join(", ")}.` : ""}
${data.favoriteThings ? `Su pasión más grande: ${data.favoriteThings}.` : ""}
${data.catchphrase ? `Su frase legendaria: "${data.catchphrase}"` : ""}

UNIVERSO VISUAL:
Paleta de color: ${palette?.label ?? ""} — ${palette?.desc ?? ""}
Tono general: ${mood?.label ?? ""} — ${mood?.desc ?? ""}
Estilo de animación: Cinematográfico, dinámico, con elementos propios del universo de ${protagonistLabel} en cada transición.

TEXTO DE LA INVITACIÓN:
"${data.parentMessage}"
📅 ${data.eventDate}${data.eventTime ? ` a las ${data.eventTime}` : ""}
📍 ${data.venue}

DIRECCIÓN:
Abre con ${eventName} como ${protagonistLabel} en plena acción dentro de ${universe}. Construye emoción progresivamente hasta el clímax donde ${eventName} mira directamente a cámara y con entusiasmo invita al espectador a su fiesta. Cierra con los datos de la celebración presentados con tipografía animada en estilo ${mood?.label?.toLowerCase() ?? "festivo"}. Optimizado para compartir por WhatsApp (formato 9:16 vertical) y redes sociales. Sin voz en off — solo texto animado y música de fondo ${mood?.id === "epic" ? "épica" : mood?.id === "magical" ? "mágica con instrumentos de cuerda" : mood?.id === "elegant" ? "orquestal sofisticada" : "alegre y festiva"}.`;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WizardData {
  protagonistId: string;
  protagonistCustom: string;
  traits: string[];
  favoriteThings: string;
  catchphrase: string;
  paletteId: string;
  moodId: string;
  parentMessage: string;
  eventDate: string;
  eventTime: string;
  venue: string;
}

interface Props {
  eventId: string;
  event: {
    celebrantName: string | null;
    celebrantAge: number | null;
    type: string;
    eventDate: string | null;
    eventTime: string | null;
    venue: string | null;
  };
  existingVideos: VideoInvitation[];
}

// ─── Estilos comunes ──────────────────────────────────────────────────────────

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

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--neutral-400)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function VideoWizardClient({ eventId, event, existingVideos }: Props) {
  const name = event.celebrantName ?? "el/la protagonista";

  const [videos, setVideos] = useState<VideoInvitation[]>(existingVideos);
  const [mode, setMode] = useState<"wizard" | "generating" | "done">(
    existingVideos.length > 0 ? "done" : "wizard"
  );
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  const [data, setData] = useState<WizardData>({
    protagonistId: "",
    protagonistCustom: "",
    traits: [],
    favoriteThings: "",
    catchphrase: "",
    paletteId: "",
    moodId: "",
    parentMessage: `¡Estás invitado/a a la fiesta de ${name}!`,
    eventDate: event.eventDate ?? "",
    eventTime: event.eventTime ?? "",
    venue: event.venue ?? "",
  });

  const [creating, setCreating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  // ── Validación por paso ────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 1) {
      if (!data.protagonistId) return false;
      if (data.protagonistId === "custom" && !data.protagonistCustom.trim()) return false;
      return true;
    }
    if (step === 2) return data.traits.length > 0 && data.favoriteThings.trim().length > 0;
    if (step === 3) return !!data.paletteId && !!data.moodId;
    if (step === 4) return !!data.parentMessage.trim() && !!data.eventDate && !!data.venue.trim();
    return true;
  }

  // ── Toggle trait ───────────────────────────────────────────────────────────

  function toggleTrait(t: string) {
    setData(prev => ({
      ...prev,
      traits: prev.traits.includes(t)
        ? prev.traits.filter(x => x !== t)
        : prev.traits.length < 3
          ? [...prev.traits, t]
          : prev.traits,
    }));
  }

  // ── Generar ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setCreating(true);

    const remotionProps = buildRemotionProps(data, name, event.celebrantAge);
    const prompt = generatePrompt(data, name, event.celebrantAge);
    const protagonist = PROTAGONISTS.find(p => p.id === data.protagonistId);
    const template = data.protagonistId === "custom" ? "custom" : (protagonist?.id ?? "custom");

    try {
      const res = await fetch("/api/video-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          template,
          wizardData: { ...data, generatedPrompt: prompt },
          remotionProps,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar la invitación");
      const { video } = await res.json();
      setVideos(prev => [video, ...prev]);
      setMode("done");
      toast.success("¡Invitación creada! Comparte el enlace con tus invitados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la invitación.");
    } finally {
      setCreating(false);
    }
  }

  // ── Polling Lambda (con progreso) ──────────────────────────────────────────

  function pollStatusLambda(videoId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/render-invitation?videoId=${videoId}`);
        const d = await res.json();
        setRenderProgress(d.progress ?? 0);

        if (d.status === "ready") {
          setVideos(prev => prev.map(v => v.id === videoId
            ? { ...v, status: "ready", generatedUrl: d.url, shareUrl: d.url } : v));
          setMode("done");
          clearInterval(interval);
          toast.success("¡Tu invitación está lista!");
        } else if (d.status === "failed") {
          setMode("wizard"); setStep(5);
          clearInterval(interval);
          toast.error("Error al renderizar el vídeo.");
        }
      } catch { /* keep polling */ }
    }, 4000);
  }

  // ── Polling legacy (Dijen.ai / fallback) ──────────────────────────────────

  function pollStatusLegacy(videoId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-invitations/${videoId}/status`);
        const d = await res.json();
        if (d.status === "ready") {
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...d } : v));
          setMode("done");
          clearInterval(interval);
          toast.success("¡Tu invitación está lista!");
        } else if (d.status === "failed") {
          setMode("wizard"); setStep(5);
          clearInterval(interval);
          toast.error("Error al generar el vídeo.");
        }
      } catch { /* keep polling */ }
    }, 5000);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ESTADO: Generando
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === "generating") {
    return (
      <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(255,51,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pulse 2s infinite" }}>
          <Sparkles size={32} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h3 style={{ marginBottom: "12px" }}>Creando la invitación de {name}…</h3>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", marginBottom: "8px" }}>
          Nuestra IA está animando el mundo de {PROTAGONISTS.find(p => p.id === data.protagonistId)?.label ?? data.protagonistCustom}.
        </p>
        <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>Esto puede tardar entre 1 y 3 minutos.</p>

        {/* Barra de progreso Lambda */}
        {renderProgress > 0 && (
          <div style={{ marginTop: "28px", width: "100%", maxWidth: "360px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)" }}>Renderizando frames…</span>
              <span style={{ fontSize: "0.75rem", color: "var(--brand-primary)", fontWeight: 700 }}>{renderProgress}%</span>
            </div>
            <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${renderProgress}%`, background: "var(--gradient-brand)", borderRadius: "999px", transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}

        {renderProgress === 0 && (
          <div style={{ marginTop: "32px", display: "flex", gap: "8px", justifyContent: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "var(--brand-primary)", opacity: 0.6,
              }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ESTADO: Vídeo listo
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === "done" && videos.length > 0) {
    const ready = videos.find(v => v.status === "ready");
    if (!ready) {
      return (
        <div style={{ textAlign: "center", padding: "40px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)" }}>
          <Clock size={32} style={{ margin: "0 auto 12px", color: "var(--neutral-500)" }} />
          <p style={{ color: "var(--neutral-400)" }}>Tu invitación se está generando…</p>
        </div>
      );
    }

    // Reconstruir props desde wizardData para el Player
    let savedProps: InvitacionProps | null = null;
    try {
      const parsed = JSON.parse(ready.wizardData ?? "{}");
      savedProps = parsed.remotionProps as InvitacionProps ?? null;
    } catch { /* ignore */ }

    const shareLink = ready.shareUrl ?? "";

    return (
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "start" }}>
        {/* Preview */}
        <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {savedProps
            ? <InvitacionPlayer inputProps={savedProps} variant="compact" />
            : <div style={{ aspectRatio: "9/16", background: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={24} style={{ color: "var(--brand-primary)" }} /></div>
          }
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Enlace para compartir
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: "10px", padding: "10px 14px", fontSize: "0.8rem", color: "var(--neutral-400)", wordBreak: "break-all", marginBottom: "8px" }}>
              {shareLink || "—"}
            </div>
          </div>

          <button
            onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("¡Enlace copiado! Compártelo por WhatsApp"); }}
            className="btn btn--primary"
            style={{ width: "100%" }}
          >
            <Share2 size={16} /> Copiar enlace
          </button>

          {shareLink && (
            <a href={shareLink} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}>
              <ExternalLink size={14} /> Ver como invitado
            </a>
          )}

          <button
            className="btn btn--ghost"
            style={{ width: "100%" }}
            onClick={() => { setMode("wizard"); setStep(1); }}
          >
            <RefreshCw size={14} /> Crear otra invitación
          </button>

          <p style={{ fontSize: "0.75rem", color: "var(--neutral-600)", lineHeight: 1.5, marginTop: "4px" }}>
            Los invitados abren el enlace y ven la animación directamente en su móvil. No necesitan descargar nada.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD
  // ─────────────────────────────────────────────────────────────────────────

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div>
      {/* ── Barra de progreso ── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 600 }}>
            Paso {step} de {TOTAL_STEPS}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--brand-primary)", fontWeight: 700 }}>
            {Math.round(progressPct)}%
          </span>
        </div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--gradient-brand)", borderRadius: "999px", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* ─── PASO 1: El protagonista ─── */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            ¿En qué quiere convertirse {name}?
          </h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Elige el universo que mejor define su gran sueño.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
            {PROTAGONISTS.map(p => {
              const selected = data.protagonistId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setData(d => ({ ...d, protagonistId: p.id }))}
                  style={{
                    background: selected ? "rgba(255,51,102,0.14)" : "var(--surface-card)",
                    border: selected ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                    padding: "16px 8px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.18s",
                    position: "relative",
                  }}
                >
                  {selected && (
                    <div style={{ position: "absolute", top: "6px", right: "6px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="white" />
                    </div>
                  )}
                  <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{p.emoji}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: selected ? "white" : "var(--neutral-400)", lineHeight: 1.3 }}>{p.label}</div>
                </button>
              );
            })}
          </div>
          {data.protagonistId === "custom" && (
            <input
              placeholder={`¿En qué quiere convertirse ${name}?`}
              value={data.protagonistCustom}
              onChange={e => setData(d => ({ ...d, protagonistCustom: e.target.value }))}
              style={{ ...inputStyle, marginBottom: "16px" }}
            />
          )}
        </div>
      )}

      {/* ─── PASO 2: Personalidad ─── */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            ¿Cómo es {name}?
          </h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Elige hasta 3 rasgos que lo/la definen.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {TRAITS.map(t => {
              const sel = data.traits.includes(t);
              const maxed = data.traits.length >= 3 && !sel;
              return (
                <button
                  key={t}
                  onClick={() => toggleTrait(t)}
                  disabled={maxed}
                  style={{
                    background: sel ? "var(--brand-primary)" : "var(--surface-card)",
                    border: sel ? "none" : "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "999px",
                    padding: "7px 16px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: sel ? "white" : maxed ? "var(--neutral-700)" : "var(--neutral-400)",
                    cursor: maxed ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>¿Qué es lo que más le gusta en el mundo? *</label>
              <input
                value={data.favoriteThings}
                onChange={e => setData(d => ({ ...d, favoriteThings: e.target.value }))}
                placeholder={`p.ej. los dinosaurios, el fútbol, los trenes…`}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Su frase legendaria (opcional)</label>
              <input
                value={data.catchphrase}
                onChange={e => setData(d => ({ ...d, catchphrase: e.target.value }))}
                placeholder={`Algo que siempre dice ${name}…`}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── PASO 3: Universo visual ─── */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>
            El universo visual de la invitación
          </h2>

          <label style={labelStyle}>Paleta de colores</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
            {PALETTES.map(p => {
              const sel = data.paletteId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setData(d => ({ ...d, paletteId: p.id }))}
                  style={{
                    background: sel ? "rgba(255,51,102,0.12)" : "var(--surface-card)",
                    border: sel ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                    padding: "14px 10px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.18s",
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                    {p.colors.map(c => (
                      <div key={c} style={{ width: "18px", height: "18px", borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: sel ? "white" : "var(--neutral-300)", marginBottom: "2px" }}>{p.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--neutral-600)", lineHeight: 1.3 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>Tono de la invitación</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {MOODS.map(m => {
              const sel = data.moodId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setData(d => ({ ...d, moodId: m.id }))}
                  style={{
                    background: sel ? "rgba(255,51,102,0.12)" : "var(--surface-card)",
                    border: sel ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.18s",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{m.emoji}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: sel ? "white" : "var(--neutral-300)", marginBottom: "3px" }}>{m.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--neutral-600)", lineHeight: 1.35 }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── PASO 4: Detalles de la fiesta ─── */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            Los detalles de la fiesta
          </h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Esta información aparecerá animada al final del vídeo.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Mensaje de los padres a los invitados *</label>
              <textarea
                value={data.parentMessage}
                onChange={e => setData(d => ({ ...d, parentMessage: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder={`¡Estáis invitados a la fiesta de ${name}!`}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Fecha del evento *</label>
                <input type="date" value={data.eventDate} onChange={e => setData(d => ({ ...d, eventDate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hora</label>
                <input type="time" value={data.eventTime} onChange={e => setData(d => ({ ...d, eventTime: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Lugar de la fiesta *</label>
              <input
                value={data.venue}
                onChange={e => setData(d => ({ ...d, venue: e.target.value }))}
                placeholder="Salón de eventos, parque, casa…"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── PASO 5: Preview en vivo ─── */}
      {step === 5 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            Vista previa de tu invitación
          </h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Así verán la invitación tus invitados en el móvil. Pulsa guardar para obtener el enlace de compartir.
          </p>

          {/* Layout: player + resumen lado a lado */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
            {/* Player (miniatura vertical 9:16) */}
            <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <InvitacionPlayer inputProps={buildRemotionProps(data, name, event.celebrantAge)} variant="compact" />
            </div>

            {/* Resumen */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Protagonista", value: data.protagonistId === "custom" ? data.protagonistCustom : PROTAGONISTS.find(p => p.id === data.protagonistId)?.label },
                { label: "Rasgos", value: data.traits.join(", ") || "—" },
                { label: "Pasión", value: data.favoriteThings || "—" },
                { label: "Paleta", value: PALETTES.find(p => p.id === data.paletteId)?.label },
                { label: "Tono", value: MOODS.find(m => m.id === data.moodId)?.label },
                { label: "Fecha", value: data.eventDate || "—" },
                { label: "Lugar", value: data.venue || "—" },
              ].map(item => (
                <div key={item.label} style={{ background: "var(--surface-card)", borderRadius: "8px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--neutral-600)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--neutral-300)", fontWeight: 600, textAlign: "right" }}>{item.value}</span>
                </div>
              ))}

              {/* Prompt colapsado */}
              <details style={{ marginTop: "4px" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.75rem", color: "var(--brand-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", listStyle: "none" }}>
                  <Wand2 size={12} /> Ver prompt cinematográfico
                </summary>
                <div style={{
                  marginTop: "8px",
                  background: "rgba(255,51,102,0.05)",
                  border: "1px solid rgba(255,51,102,0.15)",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "0.72rem",
                  color: "var(--neutral-500)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}>
                  {generatePrompt(data, name, event.celebrantAge)}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* ── Navegación entre pasos ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          className="btn btn--ghost"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          style={{ opacity: step === 1 ? 0.3 : 1 }}
        >
          <ChevronLeft size={16} /> Atrás
        </button>

        {step < TOTAL_STEPS ? (
          <button
            className="btn btn--primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn--primary"
            onClick={handleGenerate}
            disabled={creating}
            style={{ minWidth: "200px" }}
          >
            <Sparkles size={16} />
            {creating ? "Enviando a IA…" : "Generar invitación mágica"}
          </button>
        )}
      </div>
    </div>
  );
}
