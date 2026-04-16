import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, checkIns, guests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { QrCode, UserCheck, Clock, Download, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OperacionesPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      guests: true,
      checkIns: { orderBy: [desc(checkIns.checkedInAt)] },
    },
  });

  if (!event || event.ownerId !== userId) notFound();

  const totalGuests  = event.guests.length;
  const checkedIn    = event.checkIns.length;
  const remaining    = event.guests.filter((g) => g.status === "confirmed").length - checkedIn;
  const qrUrl        = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/checkin/${event.slug}`;

  return (
    <div style={{ maxWidth: "760px" }}>
      <Link href={`/dashboard/eventos/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft size={14} /> {event.celebrantName}
      </Link>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Operaciones del evento</h1>
        <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
          Check-in QR, acceso offline y control en tiempo real
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
        {[
          { label: "Check-ins",   value: checkedIn,   color: "#06ffa5", icon: UserCheck },
          { label: "Por llegar",  value: remaining > 0 ? remaining : 0,    color: "#f59e0b", icon: Clock },
          { label: "Total",       value: totalGuests, color: "#8338ec", icon: QrCode },
        ].map((s) => (
          <div key={s.label} className="pm-card" style={{ padding: "20px", textAlign: "center" }}>
            <s.icon size={20} style={{ color: s.color, marginBottom: "8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* QR Check-in */}
      <div className="pm-card" style={{ padding: "28px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
          {/* QR placeholder */}
          <div style={{
            width: "120px", height: "120px",
            borderRadius: "var(--radius-md)",
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <QrCode size={80} style={{ color: "#0a0a1a" }} />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "8px" }}>Código QR de acceso</h2>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.84rem", marginBottom: "16px", lineHeight: 1.6 }}>
              El personal del evento escanea este QR para hacer check-in instantáneo.
              Funciona offline: los datos se sincronizan al recuperar conexión.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <a
                href={`/checkin/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
              >
                <UserCheck size={15} /> Abrir panel check-in
              </a>
              <button
                className="btn btn--ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
              >
                <Download size={15} /> Descargar QR
              </button>
            </div>
          </div>
        </div>
        <div style={{
          marginTop: "20px", padding: "10px 14px",
          background: "rgba(0,0,0,0.03)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.75rem", color: "var(--neutral-500)",
          fontFamily: "monospace",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {qrUrl}
        </div>
      </div>

      {/* Recent check-ins */}
      <h2 style={{ fontSize: "1rem", marginBottom: "14px", color: "var(--neutral-400)" }}>Últimas entradas</h2>
      {event.checkIns.length === 0 ? (
        <div className="pm-card" style={{ padding: "40px", textAlign: "center" }}>
          <UserCheck size={32} style={{ color: "var(--neutral-600)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem" }}>
            El check-in comenzará el día del evento
          </p>
        </div>
      ) : (
        <div className="pm-card" style={{ padding: 0, overflow: "hidden" }}>
          {event.checkIns.slice(0, 20).map((ci) => {
            const guest = event.guests.find((g) => g.id === ci.guestId);
            return (
              <div key={ci.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "12px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
              }}>
                <UserCheck size={16} style={{ color: "#06ffa5", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                    {guest?.name ?? "Invitado"}
                  </div>
                  {ci.checkedInAt && (
                    <div style={{ fontSize: "0.74rem", color: "var(--neutral-500)" }}>
                      {new Date(ci.checkedInAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                {ci.method && (
                  <span style={{
                    fontSize: "0.72rem", textTransform: "uppercase",
                    color: "var(--neutral-500)", letterSpacing: "0.05em",
                  }}>
                    {ci.method}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
