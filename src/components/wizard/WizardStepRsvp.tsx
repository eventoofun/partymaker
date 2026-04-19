"use client";

import { useState } from "react";
import { Loader2, ArrowRight, ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  eventId: string;
  onNext: () => void;
  onSkip: () => void;
}

export default function WizardStepRsvp({ eventId, onNext, onSkip }: Props) {
  const [allowRsvp, setAllowRsvp]   = useState(true);
  const [deadline, setDeadline]     = useState("");
  const [message, setMessage]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowRsvp,
          rsvpDeadline: deadline ? new Date(deadline).toISOString() : null,
          rsvpMessage:  message.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Error al guardar");
      }
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "1.6rem" }}>✅</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
            Confirmación de asistencia (RSVP)
          </h2>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--neutral-500)", margin: 0 }}>
          Tus invitados podrán confirmar desde la página del evento.
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setAllowRsvp(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "16px 20px",
          background: allowRsvp ? "rgba(6,255,165,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${allowRsvp ? "rgba(6,255,165,0.25)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "var(--radius-lg)",
          cursor: "pointer", width: "100%", textAlign: "left",
        }}
      >
        {allowRsvp
          ? <ToggleRight size={28} style={{ color: "#06ffa5", flexShrink: 0 }} />
          : <ToggleLeft  size={28} style={{ color: "var(--neutral-600)", flexShrink: 0 }} />
        }
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {allowRsvp ? "RSVP activado" : "RSVP desactivado"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px" }}>
            {allowRsvp
              ? "Los invitados verán el formulario de asistencia en la página del evento"
              : "No se mostrará formulario de asistencia"}
          </div>
        </div>
      </button>

      {/* RSVP options — only shown when ON */}
      {allowRsvp && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Deadline */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
              Fecha límite para confirmar <span style={{ fontWeight: 400, color: "var(--neutral-600)" }}>(opcional)</span>
            </label>
            <input
              type="date"
              className="input"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
              Mensaje para los invitados <span style={{ fontWeight: 400, color: "var(--neutral-600)" }}>(opcional)</span>
            </label>
            <textarea
              className="input"
              placeholder="ej. Por favor confirma antes del 15 de mayo. ¡Te esperamos!"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", textAlign: "right", marginTop: "3px" }}>
              {message.length}/500
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: "#ff3366", fontSize: "0.82rem", margin: 0 }}>{error}</p>
      )}

      {/* CTA row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
        <button
          onClick={onSkip}
          style={{ background: "none", border: "none", color: "var(--neutral-500)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
        >
          Saltar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn--primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: "140px", justifyContent: "center" }}
        >
          {saving
            ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Guardando…</>
            : <>Guardar y continuar <ArrowRight size={16} /></>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
