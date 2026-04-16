"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, Bell, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

type Action = "invite" | "rsvp_reminder" | "event_details";

interface NotifRow {
  id: string;
  type: string;
  channel: string;
  status: string;
  subject: string | null;
  sentAt: Date | null;
  guestName: string | null;
  guestEmail: string | null;
}

interface Props {
  eventId: string;
  celebrantName: string;
  totalGuests: number;
  withEmail: number;
  pendingCount: number;
  confirmedCount: number;
  notifications: NotifRow[];
}

const CHANNEL_COLOR: Record<string, string> = {
  email: "#8338ec",
  whatsapp: "#25d366",
  push: "#f59e0b",
};

const TYPE_LABEL: Record<string, string> = {
  invite: "Invitación enviada",
  rsvp_reminder: "Recordatorio RSVP",
  rsvp_confirm: "Detalles del evento",
};

export default function ComunicacionesClient({
  eventId,
  celebrantName,
  totalGuests,
  withEmail,
  pendingCount,
  confirmedCount,
  notifications: initialNotifs,
}: Props) {
  const [sending, setSending] = useState<Action | null>(null);
  const [sent, setSent] = useState<Record<Action, boolean>>({
    invite: false,
    rsvp_reminder: false,
    event_details: false,
  });
  const [notifs, setNotifs] = useState<NotifRow[]>(initialNotifs);
  const [result, setResult] = useState<{ action: Action; count: number } | null>(null);

  async function handleSend(action: Action) {
    setSending(action);
    setResult(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/comunicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");

      setSent((prev) => ({ ...prev, [action]: true }));
      setResult({ action, count: data.sent });

      // Optimistically prepend a synthetic notification row
      if (data.sent > 0) {
        const syntheticType =
          action === "rsvp_reminder" ? "rsvp_reminder" : action === "event_details" ? "rsvp_confirm" : "invite";
        const newNotif: NotifRow = {
          id: `optimistic-${Date.now()}`,
          type: syntheticType,
          channel: "email",
          status: "sent",
          subject:
            action === "invite"
              ? `Invitación al evento de ${celebrantName}`
              : action === "rsvp_reminder"
              ? `Recordatorio de RSVP para ${celebrantName}`
              : `Detalles del evento de ${celebrantName}`,
          sentAt: new Date(),
          guestName: null,
          guestEmail: null,
        };
        setNotifs((prev) => [newNotif, ...prev]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al enviar";
      alert(`Error: ${message}`);
    } finally {
      setSending(null);
    }
  }

  const actions: {
    key: Action;
    icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
    title: string;
    desc: string;
    color: string;
    target: string;
    targetCount: number;
    disabledReason?: string;
  }[] = [
    {
      key: "invite",
      icon: Mail,
      title: "Enviar invitaciones",
      desc: "Manda el enlace personal de RSVP a todos los invitados pendientes",
      color: "#ff3366",
      target: `${pendingCount} pendientes`,
      targetCount: pendingCount,
      disabledReason: pendingCount === 0 ? "Sin invitados pendientes" : undefined,
    },
    {
      key: "rsvp_reminder",
      icon: Bell,
      title: "Recordatorio de RSVP",
      desc: "Recuerda a los que aún no han confirmado ni declinado",
      color: "#8338ec",
      target: `${pendingCount} pendientes`,
      targetCount: pendingCount,
      disabledReason: pendingCount === 0 ? "Sin invitados pendientes" : undefined,
    },
    {
      key: "event_details",
      icon: Send,
      title: "Detalles del evento",
      desc: "Comparte dirección, hora y código de vestimenta con los confirmados",
      color: "#06ffa5",
      target: `${confirmedCount} confirmados`,
      targetCount: confirmedCount,
      disabledReason: confirmedCount === 0 ? "Sin confirmados todavía" : undefined,
    },
  ];

  return (
    <div style={{ maxWidth: "760px" }}>
      <Link href={`/dashboard/eventos/${eventId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft size={14} /> {celebrantName}
      </Link>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Comunicaciones</h1>
        <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
          {totalGuests} invitados · {withEmail} con email
        </p>
      </div>

      {/* Warning: no email guests */}
      {withEmail === 0 && totalGuests > 0 && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          marginBottom: "24px",
        }}>
          <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f59e0b" }}>
              Ningún invitado tiene email
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--neutral-500)", marginTop: "3px" }}>
              Añade emails en la sección de invitados para poder enviar comunicaciones.
            </div>
          </div>
        </div>
      )}

      {/* Success banner */}
      {result && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(6,255,165,0.08)",
          border: "1px solid rgba(6,255,165,0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 18px",
          marginBottom: "24px",
        }}>
          <CheckCircle2 size={18} style={{ color: "#06ffa5" }} />
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#06ffa5" }}>
            {result.count === 0
              ? "No había destinatarios nuevos"
              : `${result.count} ${result.count === 1 ? "email enviado" : "emails enviados"} correctamente`}
          </span>
        </div>
      )}

      {/* Quick actions */}
      <h2 style={{ fontSize: "1rem", marginBottom: "14px", color: "var(--neutral-400)" }}>
        Acciones rápidas
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "36px" }}>
        {actions.map((action) => {
          const isSending = sending === action.key;
          const isDone = sent[action.key];
          const isDisabled = !!action.disabledReason || withEmail === 0 || isSending || !!sending;

          return (
            <div
              key={action.key}
              className="pm-card"
              style={{
                padding: "18px 20px",
                display: "flex", alignItems: "center", gap: "16px",
                opacity: isDisabled && !isSending ? 0.55 : 1,
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "var(--radius-md)",
                background: `${action.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{action.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                  {action.desc}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  color: action.color,
                  background: `${action.color}15`,
                  padding: "3px 10px", borderRadius: "999px",
                  border: `1px solid ${action.color}30`,
                  whiteSpace: "nowrap",
                }}>
                  {action.target}
                </span>

                <button
                  onClick={() => handleSend(action.key)}
                  disabled={isDisabled}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: isDone ? "rgba(6,255,165,0.1)" : `${action.color}20`,
                    color: isDone ? "#06ffa5" : action.color,
                    fontSize: "0.8rem", fontWeight: 700,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSending ? (
                    <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Enviando…</>
                  ) : isDone ? (
                    <><CheckCircle2 size={14} /> Enviado</>
                  ) : (
                    "Enviar"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification history */}
      <h2 style={{ fontSize: "1rem", marginBottom: "14px", color: "var(--neutral-400)" }}>
        Historial de envíos
      </h2>
      {notifs.length === 0 ? (
        <div className="pm-card" style={{ padding: "40px", textAlign: "center" }}>
          <Bell size={32} style={{ color: "var(--neutral-600)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>
            Ninguna comunicación enviada todavía
          </p>
        </div>
      ) : (
        <div className="pm-card" style={{ padding: 0, overflow: "hidden" }}>
          {notifs.map((notif) => {
            const color = CHANNEL_COLOR[notif.channel] ?? "var(--neutral-500)";
            const label = TYPE_LABEL[notif.type] ?? notif.type.replace(/_/g, " ");
            return (
              <div key={notif.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
              }}>
                <Mail size={18} style={{ color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{label}</div>
                  {(notif.guestName || notif.guestEmail) && (
                    <div style={{ fontSize: "0.78rem", color: "var(--neutral-400)", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontWeight: 600 }}>{notif.guestName ?? notif.guestEmail}</span>
                      {notif.guestName && notif.guestEmail && (
                        <span style={{ color: "var(--neutral-600)", fontWeight: 400 }}>· {notif.guestEmail}</span>
                      )}
                    </div>
                  )}
                  {notif.sentAt && (
                    <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", marginTop: "2px" }}>
                      {new Date(notif.sentAt).toLocaleString("es-ES", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700,
                  color: notif.status === "sent" ? "#06ffa5" : "var(--neutral-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}>
                  {notif.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
