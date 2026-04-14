"use client";

import { useState } from "react";
import { CheckCircle, XCircle, HelpCircle, Loader2 } from "lucide-react";

interface Props {
  eventId: string;
}

type Status = "attending" | "not_attending" | "maybe";

export default function PublicRsvpForm({ eventId }: Props) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [status, setStatus] = useState<Status>("attending");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: name.trim(),
          email: email.trim() || undefined,
          status: status,
          adults,
          children,
          dietaryRestrictions: dietary.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setStep("done");
    } catch {
      setError("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    const msgs: Record<Status, { icon: typeof CheckCircle; color: string; title: string; body: string }> = {
      attending: { icon: CheckCircle, color: "#06ffa5", title: "¡Nos vemos allí! 🎉", body: "Tu confirmación ha sido registrada. ¡Va a ser una fiesta increíble!" },
      not_attending: { icon: XCircle, color: "#ef4444", title: "Lo sentimos mucho", body: "Hemos registrado que no podrás asistir. ¡Gracias por avisarnos!" },
      maybe: { icon: HelpCircle, color: "#f59e0b", title: "Entendido", body: "Hemos registrado tu respuesta. ¡Esperamos confirmación pronto!" },
    };
    const m = msgs[status];
    const Icon = m.icon;
    return (
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: `${m.color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <Icon size={36} style={{ color: m.color }} />
        </div>
        <h3 style={{ fontSize: "1.4rem", marginBottom: "10px", fontFamily: "var(--font-display)" }}>{m.title}</h3>
        <p style={{ color: "var(--neutral-400)", maxWidth: "360px", margin: "0 auto" }}>{m.body}</p>
      </div>
    );
  }

  const statusOptions: { value: Status; label: string; icon: typeof CheckCircle; color: string }[] = [
    { value: "attending", label: "Sí, asistiré", icon: CheckCircle, color: "#06ffa5" },
    { value: "not_attending", label: "No podré asistir", icon: XCircle, color: "#ef4444" },
    { value: "maybe", label: "Quizás pueda", icon: HelpCircle, color: "#f59e0b" },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Attendance choice */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {statusOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 20px",
                borderRadius: "var(--radius-lg)",
                border: selected ? `2px solid ${opt.color}` : "1px solid rgba(255,255,255,0.08)",
                background: selected ? `${opt.color}12` : "var(--surface-card)",
                color: selected ? opt.color : "var(--neutral-400)",
                cursor: "pointer",
                fontWeight: selected ? 700 : 500,
                fontSize: "0.95rem",
                transition: "all 0.2s",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <Icon size={20} /> {opt.label}
            </button>
          );
        })}
      </div>

      {/* Name & Email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Nombre *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-elevated)",
              color: "white",
              fontSize: "0.95rem",
              outline: "none",
              fontFamily: "inherit",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Email (opcional)
          </label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="tu@email.com"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-elevated)",
              color: "white",
              fontSize: "0.95rem",
              outline: "none",
              fontFamily: "inherit",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Adults & Children — only if attending/maybe */}
      {status !== "not_attending" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: "Adultos", value: adults, onChange: setAdults },
            { label: "Niños", value: children, onChange: setChildren },
          ].map(({ label, value, onChange }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => onChange(Math.max(label === "Niños" ? 0 : 1, value - 1))}
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "var(--surface-elevated)",
                    color: "white", cursor: "pointer", fontSize: "1.1rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit",
                  }}
                >−</button>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", minWidth: "20px", textAlign: "center" }}>{value}</span>
                <button
                  type="button"
                  onClick={() => onChange(Math.min(20, value + 1))}
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "var(--surface-elevated)",
                    color: "white", cursor: "pointer", fontSize: "1.1rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit",
                  }}
                >+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dietary restrictions */}
      {status !== "not_attending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Alergias / intolerancias alimentarias (opcional)
          </label>
          <input
            value={dietary}
            onChange={e => setDietary(e.target.value)}
            placeholder="Ej: sin gluten, alérgico a frutos secos, vegetariano..."
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-elevated)",
              color: "white",
              fontSize: "0.95rem",
              outline: "none",
              fontFamily: "inherit",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Mensaje al organizador (opcional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¡Allí estaremos! / Llegaremos un poco tarde..."
          rows={2}
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "var(--surface-elevated)",
            color: "white",
            fontSize: "0.95rem",
            outline: "none",
            fontFamily: "inherit",
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "14px 32px",
          borderRadius: "var(--radius-lg)",
          border: "none",
          background: loading ? "rgba(255,255,255,0.1)" : "var(--gradient-brand)",
          color: "white",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontFamily: "inherit",
          transition: "opacity 0.2s",
        }}
      >
        {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
        {loading ? "Enviando..." : "Confirmar asistencia"}
      </button>
    </form>
  );
}
