"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Calendar, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "birthday" | "wedding" | "graduation" | "bachelor"
  | "communion" | "baptism" | "christmas" | "corporate" | "other";

interface FormState {
  type: EventType;
  celebrantName: string;
  celebrantAge: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string; emoji: string; hint: string }[] = [
  { value: "birthday",   label: "Cumpleaños",  emoji: "🎂", hint: "De 1 a 100+" },
  { value: "wedding",    label: "Boda",         emoji: "💍", hint: "Celebra el sí" },
  { value: "graduation", label: "Graduación",   emoji: "🎓", hint: "Un logro enorme" },
  { value: "bachelor",   label: "Despedida",    emoji: "🥂", hint: "Última noche libre" },
  { value: "communion",  label: "Comunión",     emoji: "✝️", hint: "Primer sacramento" },
  { value: "baptism",    label: "Bautizo",      emoji: "👶", hint: "Bienvenida al mundo" },
  { value: "christmas",  label: "Navidad",      emoji: "🎄", hint: "Celebración familiar" },
  { value: "corporate",  label: "Empresa",      emoji: "🏢", hint: "Evento corporativo" },
  { value: "other",      label: "Otro evento",  emoji: "🎉", hint: "Lo que imagines" },
];

const TYPE_LABEL: Record<EventType, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Evento",
};

const STEPS = ["Celebración", "Protagonista", "Cuándo y dónde", "Detalles"];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "12px",
  padding: "14px 18px",
  color: "#1C1C1E",
  fontSize: "1rem",
  outline: "none",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
  fontSize: "0.78rem",
  color: "var(--neutral-400)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// ─── Component ────────────────────────────────────────────────────────────────

const WIZARD_ROUTES: Record<string, string> = {
  video:    "invitaciones",
  avatar:   "invitacion-hablante",
  estrella: "invitaciones",
};

export default function NuevoEventoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wizardParam = searchParams.get("wizard") ?? "";
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    type: "birthday",
    celebrantName: "",
    celebrantAge: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    venueAddress: "",
    description: "",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 0) return true; // type always selected
    if (step === 1) return form.celebrantName.trim().length >= 2;
    if (step === 2) return true; // date/venue optional
    return true;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleCreate() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        celebrantName: form.celebrantName.trim(),
      };
      if (form.celebrantAge) payload.celebrantAge = parseInt(form.celebrantAge, 10);
      if (form.eventDate)    payload.eventDate    = form.eventDate;
      if (form.eventTime)    payload.eventTime    = form.eventTime;
      if (form.venue)        payload.venue        = form.venue.trim();
      if (form.venueAddress) payload.venueAddress = form.venueAddress.trim();
      if (form.description)  payload.description  = form.description.trim();

      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al crear el evento");
      }

      const { eventId } = await res.json();
      toast.success("¡Celebración creada! 🎉");
      const wizardSection = WIZARD_ROUTES[wizardParam];
      const dest = wizardSection
        ? `/dashboard/eventos/${eventId}/${wizardSection}`
        : `/dashboard/eventos/${eventId}?nuevo=1`;
      router.push(dest);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear el evento");
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedType = EVENT_TYPES.find((t) => t.value === form.type)!;

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", flexShrink: 0,
            borderRadius: "10px",
            border: "1px solid rgba(0,0,0,0.10)",
            color: "var(--neutral-400)", textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "2px" }}>Nueva celebración</h1>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem" }}>Paso {step + 1} de {STEPS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: "3px", borderRadius: "99px",
        background: "rgba(0,0,0,0.08)",
        marginBottom: "36px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${((step + 1) / STEPS.length) * 100}%`,
          background: "var(--gradient-brand)",
          borderRadius: "99px",
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            flex: 1, textAlign: "center",
            fontSize: "0.7rem", fontWeight: 600,
            color: i === step ? "#1C1C1E" : i < step ? "#15803D" : "var(--neutral-600)",
            transition: "color 0.3s",
          }}>
            {i < step ? "✓ " : ""}{s}
          </div>
        ))}
      </div>

      {/* ── Step 0: Tipo de celebración ── */}
      {step === 0 && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}>¿Qué vais a celebrar?</div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>Elige el tipo de celebración para personalizar tu experiencia.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                style={{
                  padding: "18px 10px",
                  borderRadius: "14px",
                  border: form.type === t.value
                    ? "2px solid var(--brand-primary)"
                    : "1px solid rgba(0,0,0,0.09)",
                  background: form.type === t.value
                    ? "rgba(0,194,209,0.08)"
                    : "#FFFFFF",
                  color: "#1C1C1E",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: "1.8rem" }}>{t.emoji}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: form.type === t.value ? 700 : 500 }}>{t.label}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--neutral-500)" }}>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Protagonista ── */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}>
              {selectedType.emoji} ¿Quién es el protagonista?
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>
              El nombre aparecerá en la página pública y en las invitaciones.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                autoFocus
                value={form.celebrantName}
                onChange={(e) => set("celebrantName", e.target.value)}
                placeholder={
                  form.type === "wedding" ? "Los novios, ej. Ana y Carlos" :
                  form.type === "corporate" ? "Nombre del evento o empresa" :
                  "ej. Lucía, Carlos..."
                }
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && canAdvance() && setStep(2)}
              />
              {form.celebrantName.trim().length > 0 && form.celebrantName.trim().length < 2 && (
                <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "6px" }}>Mínimo 2 caracteres</p>
              )}
            </div>

            {form.type !== "wedding" && form.type !== "corporate" && (
              <div>
                <label style={labelStyle}>Edad <span style={{ color: "var(--neutral-600)", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={form.celebrantAge}
                  onChange={(e) => set("celebrantAge", e.target.value)}
                  placeholder="ej. 30"
                  style={{ ...inputStyle, maxWidth: "160px" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Cuándo y dónde ── */}
      {step === 2 && (
        <div>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}>
              ¿Cuándo y dónde?
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>
              Toda esta información es opcional — puedes añadirla más tarde.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>
                  <Calendar size={10} style={{ display: "inline", marginRight: "4px" }} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Hora</label>
                <input
                  type="time"
                  value={form.eventTime}
                  onChange={(e) => set("eventTime", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <MapPin size={10} style={{ display: "inline", marginRight: "4px" }} />
                Nombre del lugar
              </label>
              <input
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
                placeholder="ej. Finca La Rosaleda, Casa de los abuelos..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Dirección</label>
              <input
                value={form.venueAddress}
                onChange={(e) => set("venueAddress", e.target.value)}
                placeholder="Calle, número, ciudad..."
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Detalles + resumen ── */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}>
              Últimos detalles
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>
              Un mensaje para tus invitados — horario, dress code, aparcamiento...
            </p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Notas para invitados <span style={{ color: "var(--neutral-600)", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <textarea
              autoFocus
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Ej: El acceso es por la puerta trasera. Parking gratuito en la calle Mayor. Dress code: elegante casual..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--neutral-600)", marginTop: "4px" }}>
              {form.description.length}/2000
            </div>
          </div>

          {/* Resumen previo al envío */}
          <div style={{
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: "14px",
            padding: "20px",
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
              Resumen de tu celebración
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Tipo", value: `${selectedType.emoji} ${TYPE_LABEL[form.type]}` },
                { label: "Protagonista", value: form.celebrantName + (form.celebrantAge ? ` · ${form.celebrantAge} años` : "") },
                ...(form.eventDate ? [{ label: "Fecha", value: new Date(form.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) + (form.eventTime ? ` · ${form.eventTime}h` : "") }] : []),
                ...(form.venue ? [{ label: "Lugar", value: form.venue + (form.venueAddress ? ` — ${form.venueAddress}` : "") }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                  <span style={{ width: "90px", flexShrink: 0, fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: "0.88rem", color: "#1C1C1E" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{
        display: "flex",
        justifyContent: step > 0 ? "space-between" : "flex-end",
        alignItems: "center",
        marginTop: "36px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn btn--ghost"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={16} /> Atrás
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="btn btn--primary"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              opacity: canAdvance() ? 1 : 0.4,
              cursor: canAdvance() ? "pointer" : "not-allowed",
            }}
          >
            Siguiente <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="btn btn--primary btn--lg"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? (
              <>Creando...</>
            ) : (
              <>
                <Sparkles size={18} /> Crear celebración
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
