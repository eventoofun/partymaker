import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, rsvpResponses, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Users } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RsvpPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      guests: {
        with: { rsvpResponse: true },
      },
    },
  });

  if (!event || event.ownerId !== userId) notFound();

  const total      = event.guests.length;
  const confirmed  = event.guests.filter((g) => g.status === "confirmed").length;
  const declined   = event.guests.filter((g) => g.status === "declined").length;
  const pending    = event.guests.filter((g) => g.status === "pending" || g.status === "invited").length;
  const checkedIn  = event.guests.filter((g) => g.status === "checked_in").length;

  const stats = [
    { label: "Confirmados",  value: confirmed, icon: CheckCircle2, color: "#06ffa5" },
    { label: "Declinados",   value: declined,  icon: XCircle,      color: "#ff3366" },
    { label: "Pendientes",   value: pending,   icon: Clock,        color: "#f59e0b" },
    { label: "Check-in",     value: checkedIn, icon: Users,        color: "#8338ec" },
  ];

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px" }}>RSVP</h1>
      <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem", marginBottom: "32px" }}>
        {total} invitados · {confirmed} confirmados
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
        {stats.map((s) => (
          <div key={s.label} className="pm-card" style={{ padding: "20px", textAlign: "center" }}>
            <s.icon size={20} style={{ color: s.color, marginBottom: "8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Guest list */}
      <div className="pm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Respuestas de invitados</h2>
        </div>
        {event.guests.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--neutral-500)" }}>
            Aún no hay invitados. Añádelos desde el módulo <strong style={{ color: "#1C1C1E" }}>Invitados</strong>.
          </div>
        ) : (
          <div>
            {event.guests.map((guest) => {
              const statusMap: Record<string, { label: string; color: string }> = {
                confirmed:  { label: "Confirmado",  color: "#06ffa5" },
                declined:   { label: "Declinado",   color: "#ff3366" },
                pending:    { label: "Pendiente",   color: "#f59e0b" },
                invited:    { label: "Invitado",    color: "#8338ec" },
                checked_in: { label: "Check-in ✓", color: "#06ffa5" },
                waitlist:   { label: "Lista esp.",  color: "#6b7280" },
              };
              const s = statusMap[guest.status] ?? { label: guest.status, color: "var(--neutral-500)" };

              return (
                <div
                  key={guest.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 24px",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "var(--surface-elevated)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", fontWeight: 700, color: "var(--neutral-400)",
                    flexShrink: 0,
                  }}>
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{guest.name}</div>
                    {guest.email && (
                      <div style={{ fontSize: "0.76rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {guest.email}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: s.color,
                    background: `${s.color}15`,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${s.color}30`,
                    whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
