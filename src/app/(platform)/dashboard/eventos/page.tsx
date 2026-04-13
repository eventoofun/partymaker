import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventHosts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, Gift, Users, Video, ArrowRight, ExternalLink } from "lucide-react";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", graduation: "🎓", bachelor: "🥂",
  communion: "✝️", baptism: "👶", christmas: "🎄", corporate: "🏢", other: "🎉",
};

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Evento",
};

const ROLE_BADGE: Record<string, string> = {
  cohost: "Co-organizador",
  operator: "Operador",
  viewer: "Espectador",
};

export default async function EventosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Own events (full data for stats)
  const ownedEvents = await db.query.events.findMany({
    where: eq(events.ownerId, userId),
    with: {
      giftLists: { with: { items: true } },
      guests: true,
      videoInvitations: { limit: 1 },
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  // Events shared with this user (co-host, operator, viewer)
  const sharedRows = await db
    .select({
      role: eventHosts.role,
      id: events.id,
      type: events.type,
      celebrantName: events.celebrantName,
      celebrantAge: events.celebrantAge,
      eventDate: events.eventDate,
      slug: events.slug,
      status: events.status,
    })
    .from(eventHosts)
    .innerJoin(events, eq(events.id, eventHosts.eventId))
    .where(eq(eventHosts.userId, userId))
    .orderBy(desc(events.createdAt));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = ownedEvents.filter(
    (e) => !e.eventDate || new Date(e.eventDate + "T12:00:00") >= today,
  );
  const past = ownedEvents.filter(
    (e) => e.eventDate && new Date(e.eventDate + "T12:00:00") < today,
  );

  const totalCount = ownedEvents.length + sharedRows.length;

  return (
    <div style={{ maxWidth: "760px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Mis celebraciones</h1>
          <p style={{ color: "var(--neutral-400)", fontSize: "0.88rem" }}>
            {totalCount === 0
              ? "Aún no tienes ninguna celebración"
              : `${totalCount} ${totalCount === 1 ? "celebración" : "celebraciones"} en total`}
          </p>
        </div>
        <Link
          href="/dashboard/eventos/nuevo"
          className="btn btn--primary"
          style={{ textDecoration: "none", fontSize: "0.88rem" }}
        >
          <Plus size={16} /> Nueva celebración
        </Link>
      </div>

      {totalCount === 0 ? (
        <div
          style={{
            background: "var(--surface-card)",
            border: "2px dashed rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-xl)",
            padding: "64px 40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
          <h3 style={{ marginBottom: "10px", fontFamily: "var(--font-display)" }}>
            Crea tu primera celebración
          </h3>
          <p style={{ color: "var(--neutral-500)", marginBottom: "24px", fontSize: "0.9rem" }}>
            El Genio del S.XXI está listo para organizarlo todo.
          </p>
          <Link
            href="/dashboard/eventos/nuevo"
            className="btn btn--primary"
            style={{ textDecoration: "none" }}
          >
            <Plus size={18} /> Crear celebración
          </Link>
        </div>
      ) : (
        <>
          {/* Owned events */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--neutral-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "12px",
                }}
              >
                Próximas
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--neutral-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "12px",
                }}
              >
                Pasadas
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", opacity: 0.65 }}>
                {past.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}

          {/* Shared events */}
          {sharedRows.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--neutral-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "12px",
                }}
              >
                Compartidos conmigo
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sharedRows.map((e) => (
                  <SharedEventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ─── EventRow (owned) ─────────────────────────────────────────────────────────

function EventRow({
  event,
}: {
  event: {
    id: string;
    type: string;
    celebrantName: string;
    celebrantAge: number | null;
    eventDate: string | null;
    slug: string;
    status: string;
    giftLists: { items: { id: string }[] }[];
    guests: { status: string }[];
    videoInvitations: { id: string }[];
  };
}) {
  const items = event.giftLists.reduce((acc, gl) => acc + gl.items.length, 0);
  const guestsTotal = event.guests.length;
  const confirmedCount = event.guests.filter((g) => g.status === "confirmed").length;
  const hasVideo = event.videoInvitations.length > 0;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;

  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{TYPE_EMOJI[event.type] ?? "🎉"}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "5px",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {event.celebrantName}
            {event.celebrantAge ? ` (${event.celebrantAge} años)` : ""}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--neutral-600)",
              background: "rgba(0,0,0,0.05)",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {TYPE_LABEL[event.type] ?? "Evento"}
          </span>
          {hasVideo && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "#8338ec",
                background: "rgba(131,56,236,0.1)",
                padding: "2px 8px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Video size={10} /> Video
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          {event.eventDate && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.75rem",
                color: "var(--neutral-500)",
              }}
            >
              <Calendar size={11} />
              {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: "var(--neutral-500)",
            }}
          >
            <Gift size={11} /> {items}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: "var(--neutral-500)",
            }}
          >
            <Users size={11} /> {confirmedCount}/{guestsTotal}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver página pública"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(0,0,0,0.08)",
            color: "var(--neutral-500)",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={13} />
        </a>
        <Link
          href={`/dashboard/eventos/${event.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 13px",
            borderRadius: "var(--radius-md)",
            background: "rgba(0,0,0,0.05)",
            color: "#1C1C1E",
            textDecoration: "none",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          Gestionar <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── SharedEventRow ───────────────────────────────────────────────────────────

function SharedEventRow({
  event,
}: {
  event: {
    id: string;
    type: string;
    celebrantName: string;
    celebrantAge: number | null;
    eventDate: string | null;
    slug: string;
    status: string;
    role: string;
  };
}) {
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;

  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{TYPE_EMOJI[event.type] ?? "🎉"}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "5px",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {event.celebrantName}
            {event.celebrantAge ? ` (${event.celebrantAge} años)` : ""}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--neutral-600)",
              background: "rgba(0,0,0,0.05)",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {TYPE_LABEL[event.type] ?? "Evento"}
          </span>
          {/* Role badge */}
          <span
            style={{
              fontSize: "0.72rem",
              color: "#7c3aed",
              background: "rgba(124,58,237,0.1)",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            {ROLE_BADGE[event.role] ?? event.role}
          </span>
        </div>
        {event.eventDate && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: "var(--neutral-500)",
            }}
          >
            <Calendar size={11} />
            {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver página pública"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(0,0,0,0.08)",
            color: "var(--neutral-500)",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={13} />
        </a>
        <Link
          href={`/dashboard/eventos/${event.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 13px",
            borderRadius: "var(--radius-md)",
            background: "rgba(0,0,0,0.05)",
            color: "#1C1C1E",
            textDecoration: "none",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          Ver evento <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
