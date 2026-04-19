"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  eventId: string;
  eventSlug: string;
  celebrantName: string;
}

export default function WizardStepComplete({ eventId, eventSlug, celebrantName }: Props) {
  const [copied, setCopied] = useState(false);

  const publicUrl = `https://cumplefy.com/e/${eventSlug}`;

  const whatsappText = encodeURIComponent(
    `🎉 ¡Estás invitado a la celebración de ${celebrantName}!\nConfirma tu asistencia y ve la lista de regalos aquí:\n${publicUrl}`
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", textAlign: "center" }}>
      {/* Celebration */}
      <div>
        <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>🎉</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "6px" }}>
          ¡Tu página está lista!
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--neutral-400)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>
          Comparte el link y tus invitados podrán ver la invitación, confirmar asistencia y ver la lista de regalos.
        </p>
      </div>

      {/* URL box */}
      <div style={{
        background: "rgba(139,92,246,0.08)",
        border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
      }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
          Link de tu evento
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, color: "#a78bfa", wordBreak: "break-all", textAlign: "left" }}>
            {publicUrl}
          </span>
          <button
            onClick={handleCopy}
            className="btn btn--ghost"
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", minWidth: "90px" }}
          >
            {copied
              ? <><Check size={13} /> Copiado</>
              : <><Copy size={13} /> Copiar</>
            }
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            padding: "14px 20px", borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #25d366, #128c7e)",
            color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>💬</span>
          Compartir por WhatsApp
        </a>

        <a
          href={`/e/${eventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "0.88rem" }}
        >
          <ExternalLink size={15} /> Ver mi página del evento
        </a>
      </div>

      {/* Dashboard link */}
      <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Link
          href={`/dashboard/eventos/${eventId}`}
          style={{ fontSize: "0.85rem", color: "var(--neutral-400)", textDecoration: "underline" }}
        >
          Ir al panel del evento →
        </Link>
      </div>
    </div>
  );
}
