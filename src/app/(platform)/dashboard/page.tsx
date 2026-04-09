import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, Gift, Users, ArrowRight, Calendar, Sparkles, Video, ExternalLink } from "lucide-react";

const TYPE_EMOJI: Record<string, string> = {
  cumpleanos: "🎂", comunion: "✝️", bautizo: "👶",
  navidad: "🎄", graduacion: "🎓", otro: "🎉",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const userEvents = await db.query.events.findMany({
    where: eq(events.userId, userId),
    with: {
      wishList: { with: { items: true } },
      guests: true,
      videoInvitations: { limit: 1 },
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  const totalEvents = userEvents.length;
  const totalGuests = userEvents.reduce((acc, e) => acc + e.guests.length, 0);
  const attending = userEvents.reduce(
    (acc, e) => acc + e.guests.filter(g => g.rsvpStatus === "attending").length, 0
  );
  const totalGifts = userEvents.reduce(
    (acc, e) => acc + (e.wishList?.items.length ?? 0), 0
  );

  const upcoming = userEvents.filter(e => e.eventDate && new Date(e.eventDate) >= new Date());
  const past = userEvents.filter(e => !e.eventDate || new Date(e.eventDate) < new Date());

  return (
    <div>
      {/* ── WELCOME ── */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{
          fontSize: "var(--text-3xl)", marginBottom: "8px",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          fontFamily: "var(--font-display)",
        }}>
          ¡Bienvenido! ✨
        </h1>
        <p style={{ color: "var(--neutral-400)" }}>
          {totalEvents === 0
            ? "Crea tu primera celebración y deja que el Genio haga su magia."
            : `Tienes ${totalEvents} ${totalEvents === 1 ? "celebración" : "celebraciones"} activas.`}
        </p>
      </div>

      {/* ── STATS ── */}
      {totalEvents > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "36px",
        }}>
          {[
            { label: "Eventos", value: totalEvents, icon: <Sparkles size={18}/>, color: "#8338ec" },
            { label: "Invitados", value: totalGuests, icon: <Users size={18}/>, color: "#ff3366" },
            { label: "Confirmados", value: attending, icon: <Calendar size={18}/>, color: "#06ffa5" },
            { label: "Regalos", value: totalGifts, icon: <Gift size={18}/>, color: "#f59e0b" },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "20px",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "10px", color: stat.color,
              }}>
                {stat.icon}
                <span style={{ fontSize: "0.78rem", color: "var(--neutral-500)", fontWeight: 600 }}>
                  {stat.label}
                </span>
              </div>
              <div style={{
                fontSize: "2rem", fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: stat.color,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NO EVENTS ── */}
      {totalEvents === 0 && (
        <div style={{
          background: "var(--surface-card)",
          border: "2px dashed rgba(255,255,255,0.1)",
          borderRadius: "var(--radius-xl)",
          padding: "64px 40px",
          textAlign: "center",
          marginBottom: "32px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
            width: "400px", height: "200px",
            background: "radial-gradient(ellipse, rgba(131,56,236,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
          <h3 style={{ marginBottom: "10px", fontSize: "1.3rem", fontFamily: "var(--font-display)" }}>
            Crea tu primera celebración
          </h3>
          <p style={{ color: "var(--neutral-500)", marginBottom: "28px", fontSize: "0.92rem", maxWidth: "400px", margin: "0 auto 28px" }}>
            Cumpleaños, comuniones, bautizos... El Genio del S.XXI está listo para organizar la fiesta perfecta.
          </p>
          <Link href="/dashboard/eventos/nuevo" className="btn btn--primary" style={{ textDecoration: "none", fontSize: "0.95rem" }}>
            <Plus size={18} /> Crear mi primera celebración
          </Link>
        </div>
      )}

      {/* ── UPCOMING EVENTS ── */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-display)" }}>
              Próximas celebraciones
            </h2>
            <Link href="/dashboard/eventos" style={{
              color: "var(--brand-primary)", textDecoration: "none",
              fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px",
            }}>
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {upcoming.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      {/* ── PAST EVENTS ── */}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "var(--text-base)", color: "var(--neutral-500)", marginBottom: "12px", fontWeight: 600 }}>
            Celebraciones pasadas
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {past.slice(0, 3).map(event => <EventCard key={event.id} event={event} muted />)}
          </div>
        </section>
      )}

      {/* ── QUICK ACTION ── */}
      {totalEvents > 0 && (
        <div style={{ marginTop: "36px" }}>
          <Link
            href="/dashboard/eventos/nuevo"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 22px", borderRadius: "var(--radius-lg)",
              background: "var(--gradient-brand)", color: "white",
              textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
            }}
          >
            <Plus size={17} /> Nueva celebración
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, muted = false }: {
  event: {
    id: string; type: string; celebrantName: string; celebrantAge: number | null;
    eventDate: string | null; eventTime: string | null; venue: string | null;
    slug: string; status: string;
    wishList: { items: { id: string }[] } | null;
    guests: { rsvpStatus: string }[];
    videoInvitations: { id: string }[];
  };
  muted?: boolean;
}) {
  const items = event.wishList?.items.length ?? 0;
  const guestsTotal = event.guests.length;
  const attending = event.guests.filter(g => g.rsvpStatus === "attending").length;
  const hasVideo = event.videoInvitations.length > 0;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;

  return (
    <div style={{
      background: "var(--surface-card)",
      borderRadius: "var(--radius-lg)",
      border: `1px solid ${muted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
      padding: "18px 22px",
      opacity: muted ? 0.65 : 1,
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.4rem" }}>{TYPE_EMOJI[event.type] ?? "🎉"}</span>
            <Link href={`/dashboard/eventos/${event.id}`} style={{
              fontWeight: 700, fontSize: "1rem", color: "white",
              textDecoration: "none",
            }}>
              {event.celebrantName}
              {event.celebrantAge ? ` (${event.celebrantAge} años)` : ""}
            </Link>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {event.eventDate && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "var(--neutral-500)" }}>
                <Calendar size={12} />
                {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                {event.eventTime && ` · ${event.eventTime}`}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "var(--neutral-500)" }}>
              <Gift size={12} /> {items} {items === 1 ? "regalo" : "regalos"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "var(--neutral-500)" }}>
              <Users size={12} /> {attending}/{guestsTotal} confirmados
            </span>
            {hasVideo && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "#8338ec" }}>
                <Video size={12} /> Video ✓
              </span>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver página pública"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "34px", height: "34px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--neutral-500)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <ExternalLink size={14} />
          </a>
          <Link
            href={`/dashboard/eventos/${event.id}`}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--neutral-300)",
              textDecoration: "none",
              fontSize: "0.8rem", fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Gestionar <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
