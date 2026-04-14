import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, Users, ChevronRight, Calendar, Calculator, MapPin } from "lucide-react";

// ─── Per-type visual language ────────────────────────────────────────────────
const TYPES: Record<string, {
  label: string; emoji: string; color: string; gradient: string;
}> = {
  birthday:   { label: "Cumpleaños",  emoji: "🎂", color: "#E53E3E", gradient: "linear-gradient(135deg, #FC8181 0%, #E53E3E 100%)" },
  wedding:    { label: "Boda",        emoji: "💍", color: "#B7791F", gradient: "linear-gradient(135deg, #F6D860 0%, #B7791F 100%)" },
  graduation: { label: "Graduación",  emoji: "🎓", color: "#0369A1", gradient: "linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)" },
  bachelor:   { label: "Despedida",   emoji: "🥂", color: "#C05621", gradient: "linear-gradient(135deg, #FCD34D 0%, #C05621 100%)" },
  communion:  { label: "Comunión",    emoji: "✝️", color: "#6D28D9", gradient: "linear-gradient(135deg, #C4B5FD 0%, #6D28D9 100%)" },
  baptism:    { label: "Bautizo",     emoji: "👶", color: "#0E7490", gradient: "linear-gradient(135deg, #A5F3FC 0%, #0E7490 100%)" },
  christmas:  { label: "Navidad",     emoji: "🎄", color: "#15803D", gradient: "linear-gradient(135deg, #DC2626 0%, #15803D 100%)" },
  corporate:  { label: "Empresa",     emoji: "🏢", color: "#4338CA", gradient: "linear-gradient(135deg, #818CF8 0%, #4338CA 100%)" },
  other:      { label: "Evento",      emoji: "🎉", color: "#0891B2", gradient: "linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)" },
};
const t = (type: string) => TYPES[type] ?? TYPES.other;

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const userEvents = await db.query.events.findMany({
    where: eq(events.ownerId, userId),
    with: {
      giftLists: { with: { items: true } },
      guests: true,
      videoInvitations: { limit: 1 },
      budgetItems: true,
    },
    orderBy: (e, { asc, desc }) => [asc(e.eventDate), desc(e.createdAt)],
  });

  const totalEvents = userEvents.length;
  const totalGuests = userEvents.reduce((s, e) => s + e.guests.length, 0);
  const confirmed   = userEvents.reduce((s, e) => s + e.guests.filter(g => g.status === "confirmed").length, 0);
  const totalBudget = userEvents.reduce((s, e) => s + e.budgetItems.reduce((b, i) => b + (i.estimatedCost ? parseFloat(i.estimatedCost) : 0), 0), 0);

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = userEvents.filter(e => !e.eventDate || new Date(e.eventDate + "T12:00:00") >= today);
  const past     = userEvents.filter(e =>  e.eventDate && new Date(e.eventDate + "T12:00:00") <  today);

  const nextEvent = [...upcoming]
    .filter(e => e.eventDate)
    .sort((a, b) => new Date(a.eventDate! + "T12:00:00").getTime() - new Date(b.eventDate! + "T12:00:00").getTime())[0];

  const daysToNext = nextEvent?.eventDate
    ? Math.ceil((new Date(nextEvent.eventDate + "T12:00:00").getTime() - today.getTime()) / 86_400_000)
    : null;

  const nc = nextEvent ? t(nextEvent.type) : null;

  const todayLabel = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: "16px", flexWrap: "wrap", marginBottom: "36px",
      }}>
        <div>
          <p style={{
            fontSize: "0.70rem", fontWeight: 600, letterSpacing: "0.10em",
            textTransform: "uppercase", color: "#AEAEB2", marginBottom: "6px",
          }}>
            {todayLabel}
          </p>
          <h1 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.4rem)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.08,
            color: "#1C1C1E",
            marginBottom: "6px",
          }}>
            {totalEvents === 0 ? "Bienvenido" : "Centro de mando"}
          </h1>
          {totalEvents > 0 && (
            <p style={{ color: "#8E8E93", fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 400 }}>
              {totalEvents} {totalEvents === 1 ? "celebración" : "celebraciones"}
              {" · "}{totalGuests} {totalGuests === 1 ? "invitado" : "invitados"}
              {" · "}{confirmed} confirmados
            </p>
          )}
        </div>
        <Link
          href="/dashboard/eventos/nuevo"
          className="btn btn--primary"
          style={{ textDecoration: "none", fontSize: "0.83rem", padding: "10px 22px", display: "inline-flex", alignItems: "center", gap: "7px", flexShrink: 0 }}
        >
          <Plus size={14} strokeWidth={2.5} /> Nueva celebración
        </Link>
      </div>

      {/* ══ HERO — NEXT EVENT ════════════════════════════════════════════════════ */}
      {nextEvent && nc && daysToNext !== null && (
        <Link
          href={`/dashboard/eventos/${nextEvent.id}`}
          className="hero-event-card"
          style={{
            display: "block",
            textDecoration: "none",
            borderRadius: "22px",
            overflow: "hidden",
            marginBottom: "16px",
            background: nc.gradient,
            boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
          }}
        >
          <div style={{ padding: "32px 36px", position: "relative" }}>
            {/* Grain overlay */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "180px",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", position: "relative" }}>

              {/* Frosted emoji tile */}
              <div style={{
                width: "68px", height: "68px", borderRadius: "20px", flexShrink: 0,
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem",
              }}>
                {nc.emoji}
              </div>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={{
                  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.11em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.60)",
                  marginBottom: "5px",
                }}>
                  Próxima celebración
                </div>
                <div style={{
                  fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.025em",
                  color: "white", lineHeight: 1.2, marginBottom: "10px",
                }}>
                  {nc.label} de {nextEvent.celebrantName}
                  {nextEvent.celebrantAge ? (
                    <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 400, fontSize: "1.05rem" }}>
                      {" "}· {nextEvent.celebrantAge} años
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {nextEvent.eventDate && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>
                      <Calendar size={12} />
                      {new Date(nextEvent.eventDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                      {nextEvent.eventTime && (
                        <span style={{ color: "rgba(255,255,255,0.50)" }}>· {nextEvent.eventTime.slice(0, 5)}</span>
                      )}
                    </span>
                  )}
                  {nextEvent.venue && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "rgba(255,255,255,0.60)" }}>
                      <MapPin size={12} /> {nextEvent.venue}
                    </span>
                  )}
                </div>
              </div>

              {/* Countdown pill */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                flexShrink: 0,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.28)",
                borderRadius: "18px",
                padding: "16px 22px",
                minWidth: "80px",
              }}>
                {daysToNext === 0 ? (
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>¡Hoy!</div>
                ) : (
                  <>
                    <div style={{
                      fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.06em",
                      fontFamily: "var(--font-display)", lineHeight: 1, color: "white",
                    }}>
                      {daysToNext}
                    </div>
                    <div style={{
                      fontSize: "0.65rem", color: "rgba(255,255,255,0.65)",
                      fontWeight: 600, letterSpacing: "0.07em",
                      textTransform: "uppercase", marginTop: "3px",
                    }}>
                      {daysToNext === 1 ? "día" : "días"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ══ STATS ROW ════════════════════════════════════════════════════════════ */}
      {totalEvents > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalBudget > 0 ? 4 : 3}, 1fr)`,
          gap: "10px",
          marginBottom: "40px",
        }}>
          {[
            { label: "Eventos",     value: totalEvents,  color: "#0891B2" },
            { label: "Invitados",   value: totalGuests,  color: "#6D28D9" },
            { label: "Confirmados", value: confirmed,    color: "#15803D" },
            ...(totalBudget > 0
              ? [{ label: "Presupuesto", value: `${totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`, color: "#C05621" }]
              : []),
          ].map(s => (
            <div key={s.label} style={{
              padding: "20px 20px 18px",
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)",
            }}>
              <div style={{
                fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "#AEAEB2", marginBottom: "10px",
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: "1.9rem", fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.045em", lineHeight: 1,
                color: s.color,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ EMPTY STATE ══════════════════════════════════════════════════════════ */}
      {totalEvents === 0 && (
        <div style={{
          padding: "72px 40px", textAlign: "center",
          background: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)",
          marginBottom: "32px",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "20px" }}>✨</div>
          <h2 style={{
            fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em",
            marginBottom: "10px", color: "#1C1C1E",
          }}>
            Crea tu primera celebración
          </h2>
          <p style={{
            color: "#8E8E93", fontSize: "0.9rem", lineHeight: 1.65,
            maxWidth: "360px", margin: "0 auto 28px",
          }}>
            Cumpleaños, bodas, comuniones... El Genio del S.XXI está listo para organizar la fiesta perfecta.
          </p>
          <Link href="/dashboard/eventos/nuevo" className="btn btn--primary" style={{ textDecoration: "none", fontSize: "0.88rem" }}>
            <Plus size={16} strokeWidth={2.5} /> Crear mi primera celebración
          </Link>
        </div>
      )}

      {/* ══ UPCOMING EVENTS ══════════════════════════════════════════════════════ */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "28px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "10px",
          }}>
            <span style={{
              fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.10em",
              textTransform: "uppercase", color: "#AEAEB2",
            }}>
              Próximas celebraciones
            </span>
            <Link href="/dashboard/eventos" style={{
              display: "flex", alignItems: "center", gap: "2px",
              color: "#0891B2", textDecoration: "none",
              fontSize: "0.78rem", fontWeight: 600,
            }}>
              Ver todas <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ══ PAST EVENTS ══════════════════════════════════════════════════════════ */}
      {past.length > 0 && (
        <section>
          <div style={{ marginBottom: "10px" }}>
            <span style={{
              fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.10em",
              textTransform: "uppercase", color: "#AEAEB2",
            }}>
              Celebraciones pasadas
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {past.slice(0, 3).map(e => <EventCard key={e.id} event={e} muted />)}
          </div>
          {past.length > 3 && (
            <Link href="/dashboard/eventos" style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              marginTop: "10px", fontSize: "0.78rem", color: "#AEAEB2",
              textDecoration: "none", fontWeight: 500,
            }}>
              Ver {past.length - 3} más <ChevronRight size={12} />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, muted = false }: {
  event: {
    id: string;
    type: string;
    celebrantName: string;
    celebrantAge: number | null;
    eventDate: string | null;
    eventTime: string | null;
    status: string;
    giftLists: { items: unknown[] }[];
    guests: { status: string }[];
    videoInvitations: unknown[];
    budgetItems: { estimatedCost: string | null; actualCost: string | null }[];
  };
  muted?: boolean;
}) {
  const c         = t(event.type);
  const guests    = event.guests.length;
  const confirmed = event.guests.filter(g => g.status === "confirmed").length;
  const budget    = event.budgetItems.reduce((s, b) => s + (b.estimatedCost ? parseFloat(b.estimatedCost) : 0), 0);
  const spent     = event.budgetItems.reduce((s, b) => s + (b.actualCost     ? parseFloat(b.actualCost)     : 0), 0);
  const overBudget = spent > budget && budget > 0;

  return (
    <Link
      href={`/dashboard/eventos/${event.id}`}
      className="event-card-link"
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 18px",
        background: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.05)",
        borderLeft: `3px solid ${muted ? "#E5E5EA" : c.color}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        opacity: muted ? 0.55 : 1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease",
      }}
    >
      {/* Emoji tile */}
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
        background: muted ? "#F5F5F5" : `${c.color}14`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.2rem",
      }}>
        {c.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
          <span style={{
            fontWeight: 600, fontSize: "0.875rem",
            color: muted ? "#636366" : "#1C1C1E",
            letterSpacing: "-0.01em", lineHeight: 1.3,
          }}>
            {c.label} de {event.celebrantName}
            {event.celebrantAge ? (
              <span style={{ color: "#8E8E93", fontWeight: 400 }}>{" "}· {event.celebrantAge} años</span>
            ) : null}
          </span>
          {event.status === "draft" && (
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
              borderRadius: "999px",
              background: "rgba(217,119,6,0.08)",
              color: "#C05621",
              border: "1px solid rgba(217,119,6,0.16)",
              letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
            }}>
              Borrador
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {event.eventDate && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.76rem", color: "#8E8E93" }}>
              <Calendar size={10} />
              {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              {event.eventTime && (
                <span style={{ color: "#AEAEB2" }}>· {event.eventTime.slice(0, 5)}</span>
              )}
            </span>
          )}
          {guests > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.76rem", color: "#8E8E93" }}>
              <Users size={10} />
              {confirmed}/{guests}
            </span>
          )}
          {budget > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.76rem", color: overBudget ? "#E53E3E" : "#8E8E93" }}>
              <Calculator size={10} />
              {spent > 0
                ? `${spent.toLocaleString("es-ES", { maximumFractionDigits: 0 })} / ${budget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`
                : `${budget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: "#C7C7CC", flexShrink: 0 }} />
    </Link>
  );
}
