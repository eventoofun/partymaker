"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Calendar, MapPin } from "lucide-react";

const schema = z.object({
  celebrantName: z.string().min(2, "Nombre requerido (mínimo 2 caracteres)"),
  celebrantAge: z.coerce.number().int().min(0).max(120).optional(),
  type: z.enum(["cumpleanos", "comunion", "bautizo", "navidad", "graduacion", "otro"]),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EVENT_TYPES = [
  { value: "cumpleanos", label: "Cumpleaños", emoji: "🎂" },
  { value: "comunion",   label: "Comunión",   emoji: "✝️" },
  { value: "bautizo",    label: "Bautizo",     emoji: "👶" },
  { value: "navidad",    label: "Navidad",     emoji: "🎄" },
  { value: "graduacion", label: "Graduación",  emoji: "🎓" },
  { value: "otro",       label: "Otro",        emoji: "🎉" },
];

// ─── Genie SVG ────────────────────────────────────────────────────────────────
function GenieWizard({ step }: { step: number }) {
  const color = step === 1 ? "#8338ec" : "#06ffa5";
  const bubble = step === 1
    ? "¡Cuéntame todo sobre la fiesta! 🎉"
    : "¡Perfecto! Ahora los detalles del evento 📅";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      {/* Speech bubble */}
      <div style={{
        background: "var(--surface-card)",
        border: `1px solid ${color}40`,
        borderRadius: "16px",
        padding: "14px 20px",
        fontSize: "0.92rem",
        color: "var(--neutral-200)",
        textAlign: "center",
        maxWidth: "260px",
        position: "relative",
        lineHeight: 1.5,
      }}>
        {bubble}
        <div style={{
          position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: `10px solid ${color}40`,
        }} />
        <div style={{
          position: "absolute", bottom: "-9px", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderTop: "9px solid var(--surface-card)",
        }} />
      </div>

      {/* Genie SVG */}
      <svg width="140" height="180" viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Smoke trail */}
        <path d="M70 175 Q55 160 60 145 Q65 130 70 120 Q75 110 70 100" stroke={`${color}60`} strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M70 175 Q85 162 80 147 Q75 132 70 120" stroke={`${color}40`} strokeWidth="12" strokeLinecap="round" fill="none" />
        {/* Vapor particles */}
        <circle cx="52" cy="148" r="5" fill={`${color}30`} />
        <circle cx="88" cy="138" r="4" fill={`${color}25`} />
        <circle cx="60" cy="162" r="3" fill={`${color}20`} />
        {/* Body */}
        <ellipse cx="70" cy="72" rx="36" ry="42" fill={color} />
        {/* Jacket collar */}
        <path d="M56 85 L70 95 L84 85 L80 105 L70 110 L60 105 Z" fill="rgba(0,0,0,0.25)" />
        {/* Head */}
        <circle cx="70" cy="32" r="26" fill={color} />
        {/* Sunglasses frame */}
        <rect x="44" y="26" width="22" height="14" rx="7" fill="rgba(0,0,0,0.7)" />
        <rect x="74" y="26" width="22" height="14" rx="7" fill="rgba(0,0,0,0.7)" />
        <line x1="66" y1="33" x2="74" y2="33" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        {/* Lens shine */}
        <ellipse cx="51" cy="30" rx="4" ry="2.5" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="81" cy="30" rx="4" ry="2.5" fill="rgba(255,255,255,0.18)" />
        {/* Pupils — star when step 2 (happy), normal otherwise */}
        {step === 2 ? (
          <>
            <text x="55" y="37" fontSize="8" textAnchor="middle" fill="white">★</text>
            <text x="85" y="37" fontSize="8" textAnchor="middle" fill="white">★</text>
          </>
        ) : (
          <>
            <circle cx="55" cy="33" r="3" fill="rgba(255,255,255,0.6)" />
            <circle cx="85" cy="33" r="3" fill="rgba(255,255,255,0.6)" />
          </>
        )}
        {/* Smile */}
        <path d="M60 46 Q70 54 80 46" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Arms */}
        <path d="M34 65 Q20 58 18 72 Q16 82 28 80" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M106 65 Q120 58 122 72 Q124 82 112 80" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      </svg>

      {/* Step indicator dots */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[1, 2].map(s => (
          <div key={s} style={{
            width: s === step ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: s === step ? color : "rgba(255,255,255,0.15)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NuevoEventoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "cumpleanos" },
  });

  const selectedType = watch("type");

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear el evento");
      const { eventId } = await res.json();
      toast.success("¡Celebración creada!");
      router.push(`/dashboard/eventos/${eventId}`);
    } catch {
      toast.error("Error al crear la celebración. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-elevated)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "var(--radius-md)",
    padding: "12px 16px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    color: "var(--neutral-400)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{
          fontSize: "var(--text-3xl)", marginBottom: "6px",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          fontFamily: "var(--font-display)",
        }}>
          Nueva celebración
        </h1>
        <p style={{ color: "var(--neutral-400)" }}>Paso {step} de 2 — {step === 1 ? "¿De qué va la fiesta?" : "¿Cuándo y dónde?"}</p>
        {/* Progress bar */}
        <div style={{ marginTop: "14px", height: "4px", background: "var(--surface-elevated)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            width: `${(step / 2) * 100}%`, height: "100%",
            background: "var(--gradient-brand)",
            transition: "width 0.4s ease", borderRadius: "999px",
          }} />
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "40px", alignItems: "start" }}>
        {/* Form column */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Event type */}
              <div>
                <label style={labelStyle}>Tipo de celebración</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue("type", t.value as FormValues["type"])}
                      style={{
                        padding: "16px 10px",
                        borderRadius: "var(--radius-md)",
                        border: selectedType === t.value
                          ? "2px solid var(--brand-primary)"
                          : "1px solid rgba(255,255,255,0.1)",
                        background: selectedType === t.value
                          ? "rgba(255,51,102,0.12)"
                          : "var(--surface-elevated)",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: selectedType === t.value ? 700 : 400,
                        transition: "all 0.2s",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{ fontSize: "1.6rem" }}>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Celebrant name */}
              <div>
                <label style={labelStyle}>Nombre del festejado/a *</label>
                <input
                  {...register("celebrantName")}
                  placeholder="ej. Lucía"
                  style={inputStyle}
                />
                {errors.celebrantName && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "5px" }}>
                    {errors.celebrantName.message}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label style={labelStyle}>Edad que cumple</label>
                <input
                  {...register("celebrantAge")}
                  type="number"
                  min={0}
                  max={120}
                  placeholder="ej. 7"
                  style={{ ...inputStyle, width: "140px" }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn--primary"
                >
                  Siguiente <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Date + Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "5px" }} />
                    Fecha del evento
                  </label>
                  <input {...register("eventDate")} type="date" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hora</label>
                  <input {...register("eventTime")} type="time" style={inputStyle} />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label style={labelStyle}>
                  <MapPin size={12} style={{ display: "inline", marginRight: "5px" }} />
                  Nombre del lugar
                </label>
                <input
                  {...register("venue")}
                  placeholder="ej. Parque de Atracciones, Casa de los abuelos..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Dirección</label>
                <input
                  {...register("venueAddress")}
                  placeholder="Calle, ciudad..."
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Notas para invitados</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Información adicional, aparcamiento, código de vestimenta..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn--ghost"
                >
                  <ArrowLeft size={18} /> Atrás
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear celebración"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Genie column */}
        <div style={{ position: "sticky", top: "24px" }}>
          <GenieWizard step={step} />
        </div>
      </div>
    </div>
  );
}
