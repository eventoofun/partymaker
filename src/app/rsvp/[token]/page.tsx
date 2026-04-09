"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";

type RsvpStatus = "attending" | "not_attending" | "maybe";

interface GuestInfo {
  name: string;
  eventName: string;
  eventDate?: string;
  venue?: string;
  slug: string;
  currentStatus: string;
}

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [chosen, setChosen] = useState<RsvpStatus | null>(null);

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then((r) => r.json())
      .then((d) => setGuest(d.guest ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRsvp(status: RsvpStatus) {
    setSubmitting(true);
    setChosen(status);
    try {
      await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setDone(true);
    } catch {
      setSubmitting(false);
      setChosen(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--neutral-500)" }}>Cargando...</div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", textAlign: "center", padding: "40px" }}>
        <XCircle size={48} style={{ color: "#ef4444" }} />
        <h2>Enlace no válido</h2>
        <p style={{ color: "var(--neutral-400)" }}>Este enlace de confirmación no existe o ha caducado.</p>
        <Link href="/" className="btn btn--ghost" style={{ textDecoration: "none" }}>Ir a Cumplefy</Link>
      </div>
    );
  }

  if (done && chosen) {
    const messages: Record<RsvpStatus, { icon: typeof CheckCircle; color: string; title: string; body: string }> = {
      attending: { icon: CheckCircle, color: "#06ffa5", title: "¡Nos vemos allí!", body: `Has confirmado tu asistencia. ¡${guest.eventName} va a ser increíble!` },
      not_attending: { icon: XCircle, color: "#ef4444", title: "Lo sentimos mucho", body: "Hemos registrado que no podrás asistir. ¡Gracias por avisarnos!" },
      maybe: { icon: HelpCircle, color: "#f59e0b", title: "Entendido", body: "Hemos registrado tu respuesta. ¡Esperamos verte allí!" },
    };
    const m = messages[chosen];
    const Icon = m.icon;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px", textAlign: "center", padding: "40px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={40} style={{ color: m.color }} />
        </div>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "10px" }}>{m.title}</h1>
          <p style={{ color: "var(--neutral-400)", maxWidth: "360px" }}>{m.body}</p>
        </div>
        <Link href={`/e/${guest.slug}`} className="btn btn--ghost" style={{ textDecoration: "none" }}>
          Ver lista de regalos
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "440px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎉</div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px" }}>
          ¡Hola, {guest.name}!
        </h1>
        <p style={{ color: "var(--neutral-400)", marginBottom: "8px" }}>
          Te han invitado a <strong style={{ color: "white" }}>{guest.eventName}</strong>
        </p>
        {guest.eventDate && (
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", marginBottom: "32px" }}>
            {new Date(guest.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            {guest.venue && ` · ${guest.venue}`}
          </p>
        )}

        <p style={{ fontWeight: 700, marginBottom: "20px" }}>¿Podrás asistir?</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => handleRsvp("attending")}
            disabled={submitting}
            style={{
              padding: "16px 24px",
              borderRadius: "var(--radius-lg)",
              border: "2px solid #06ffa5",
              background: "rgba(6,255,165,0.08)",
              color: "#06ffa5",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            <CheckCircle size={20} /> Sí, asistiré
          </button>

          <button
            onClick={() => handleRsvp("not_attending")}
            disabled={submitting}
            style={{
              padding: "16px 24px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-card)",
              color: "var(--neutral-400)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            <XCircle size={18} /> No podré asistir
          </button>

          <button
            onClick={() => handleRsvp("maybe")}
            disabled={submitting}
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "transparent",
              color: "var(--neutral-600)",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "color 0.2s",
              fontFamily: "inherit",
            }}
          >
            Quizás pueda
          </button>
        </div>
      </div>
    </div>
  );
}
