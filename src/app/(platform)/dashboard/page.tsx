import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, wishItems, contributions } from "@/db/schema";
import { eq, count, sum } from "drizzle-orm";
import Link from "next/link";
import { Plus, Gift, Users, TrendingUp, ArrowRight } from "lucide-react";
import { formatEuros } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // Load user's events
  const userEvents = await db.query.events.findMany({
    where: eq(events.userId, userId),
    with: {
      wishList: {
        with: {
          items: true,
        },
      },
      guests: true,
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit: 5,
  });

  const totalEvents = userEvents.length;
  const totalGuests = userEvents.reduce((acc, e) => acc + e.guests.length, 0);

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "8px" }}>
          ¡Bienvenido! 🎉
        </h1>
        <p style={{ color: "var(--neutral-400)" }}>
          Gestiona tus eventos y listas de regalos desde aquí.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        {[
          { label: "Eventos activos", value: totalEvents, icon: <Gift size={20} />, color: "var(--brand-primary)" },
          { label: "Invitados totales", value: totalGuests, icon: <Users size={20} />, color: "var(--brand-secondary)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--surface-card)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{
                width: "40px", height: "40px",
                borderRadius: "var(--radius-sm)",
                background: `${stat.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <span style={{ color: "var(--neutral-400)", fontSize: "0.85rem" }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent events */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "var(--text-xl)" }}>Eventos recientes</h2>
          <Link href="/dashboard/eventos" style={{ color: "var(--brand-primary)", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {userEvents.length === 0 ? (
          <div style={{
            background: "var(--surface-card)",
            border: "2px dashed rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-xl)",
            padding: "60px 40px",
            textAlign: "center",
          }}>
            <Gift size={40} style={{ margin: "0 auto 16px", color: "var(--neutral-600)" }} />
            <h3 style={{ marginBottom: "8px", color: "var(--neutral-300)" }}>Crea tu primer evento</h3>
            <p style={{ color: "var(--neutral-500)", marginBottom: "24px", fontSize: "0.9rem" }}>
              Configura un cumpleaños, comunión o cualquier celebración en menos de 2 minutos.
            </p>
            <Link href="/dashboard/eventos/nuevo" className="btn btn--primary">
              <Plus size={18} /> Crear evento
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {userEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/eventos/${event.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="pm-card"
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      🎂 {event.celebrantName}
                    </div>
                    <div style={{ color: "var(--neutral-500)", fontSize: "0.85rem" }}>
                      {event.eventDate ?? "Sin fecha"} · {event.guests.length} invitados ·{" "}
                      {event.wishList?.items.length ?? 0} regalos
                    </div>
                  </div>
                  <div style={{
                    background: event.status === "active" ? "rgba(6,255,165,0.15)" : "rgba(255,255,255,0.06)",
                    color: event.status === "active" ? "var(--color-success)" : "var(--neutral-400)",
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}>
                    {event.status === "active" ? "Activo" : "Pasado"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
