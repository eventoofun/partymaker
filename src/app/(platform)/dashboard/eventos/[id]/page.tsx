import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, Gift, Video, ExternalLink, Share2, CheckCircle2, Circle, Edit2, Store } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  cumpleanos: "Cumpleaños",
  comunion: "Comunión",
  bautizo: "Bautizo",
  navidad: "Navidad",
  graduacion: "Graduación",
  otro: "Evento",
};

const TYPE_EMOJI: Record<string, string> = {
  cumpleanos: "🎂",
  comunion: "✝️",
  bautizo: "👶",
  navidad: "🎄",
  graduacion: "🎓",
  otro: "🎉",
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      wishList: {
        with: { items: true },
      },
      guests: true,
      videoInvitations: true,
    },
  });

  if (!event || event.userId !== userId) notFound();

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;
  const totalGuests = event.guests.length;
  const attending = event.guests.filter((g) => g.rsvpStatus === "attending").length;
  const totalItems = event.wishList?.items.length ?? 0;
  const availableItems = event.wishList?.items.filter((i) => i.status === "available" || i.status === "partially_funded").length ?? 0;

  const navItems = [
    { href: `/dashboard/eventos/${id}/lista-deseos`, icon: Gift, label: "Lista de regalos", count: totalItems },
    { href: `/dashboard/eventos/${id}/invitados`, icon: Users, label: "Invitados", count: totalGuests },
    { href: `/dashboard/eventos/${id}/invitaciones`, icon: Video, label: "Invitación vídeo", count: event.videoInvitations.length },
    { href: `/dashboard/eventos/${id}/proveedores`, icon: Store, label: "Proveedores", count: 0 },
  ];

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        marginBottom: "24px",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>
          {TYPE_EMOJI[event.type] ?? "🎉"}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>
              {TYPE_LABEL[event.type] ?? "Evento"} de {event.celebrantName}
              {event.celebrantAge ? ` (${event.celebrantAge} años)` : ""}
            </h1>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
              {event.eventDate && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", color: "var(--neutral-400)" }}>
                  <Calendar size={13} />
                  {new Date(event.eventDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  {event.eventTime && ` · ${event.eventTime}`}
                </span>
              )}
              {event.venue && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", color: "var(--neutral-400)" }}>
                  <MapPin size={13} />
                  {event.venue}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <Link
              href={`/dashboard/eventos/${id}/editar`}
              className="btn btn--ghost"
              style={{ textDecoration: "none", fontSize: "0.82rem", padding: "8px 14px" }}
            >
              <Edit2 size={14} /> Editar
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
              style={{ textDecoration: "none", fontSize: "0.82rem", padding: "8px 14px" }}
            >
              <ExternalLink size={14} /> Ver pública
            </a>
          </div>
        </div>

        {event.description && (
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", marginTop: "16px", lineHeight: 1.6 }}>
            {event.description}
          </p>
        )}

        {/* Share URL */}
        <div style={{
          marginTop: "20px",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}>
          <Share2 size={14} style={{ color: "var(--neutral-500)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.8rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {publicUrl}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Invitados confirmados", value: `${attending}/${totalGuests}`, icon: Users },
          { label: "Regalos disponibles", value: `${availableItems}/${totalItems}`, icon: Gift },
          { label: "Estado", value: event.status === "active" ? "Activo" : event.status, icon: Calendar },
        ].map((stat) => (
          <div key={stat.label} className="pm-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Setup checklist */}
      {(totalItems === 0 || totalGuests === 0 || event.videoInvitations.length === 0) && (
        <div style={{
          background: "linear-gradient(135deg, rgba(131,56,236,0.08) 0%, rgba(255,51,102,0.06) 100%)",
          border: "1px solid rgba(131,56,236,0.2)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.4rem" }}>🧞</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Completa tu celebración</div>
              <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)" }}>El Genio te guía paso a paso</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { done: true,           label: "Datos básicos",       sub: "Nombre, fecha y lugar",        href: null },
              { done: totalItems > 0, label: "Lista de regalos",    sub: totalItems > 0 ? `${totalItems} ${totalItems === 1 ? "regalo" : "regalos"} añadidos` : "Añade regalos para tus invitados", href: `/dashboard/eventos/${id}/lista-deseos` },
              { done: totalGuests > 0,label: "Invitados",           sub: totalGuests > 0 ? `${totalGuests} ${totalGuests === 1 ? "invitado" : "invitados"}` : "Añade o invita a tus invitados",     href: `/dashboard/eventos/${id}/invitados` },
              { done: event.videoInvitations.length > 0, label: "Invitación en vídeo", sub: event.videoInvitations.length > 0 ? "Invitación creada ✓" : "Crea una invitación personalizada con IA", href: `/dashboard/eventos/${id}/invitaciones` },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: item.done ? "rgba(6,255,165,0.06)" : "var(--surface-card)",
                border: `1px solid ${item.done ? "rgba(6,255,165,0.15)" : "rgba(255,255,255,0.06)"}`,
                opacity: item.done && !item.href ? 0.7 : 1,
              }}>
                {item.done
                  ? <CheckCircle2 size={18} style={{ color: "#06ffa5", flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: "var(--neutral-600)", flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.87rem", color: item.done ? "var(--neutral-300)" : "white" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "1px" }}>{item.sub}</div>
                </div>
                {!item.done && item.href && (
                  <Link href={item.href} style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: "var(--brand-primary)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    padding: "4px 12px",
                    border: "1px solid rgba(255,51,102,0.3)",
                    borderRadius: "var(--radius-sm)",
                  }}>
                    Configurar →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {navItems.map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px 24px",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            className="pm-card"
          >
            <div style={{
              width: "42px", height: "42px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,51,102,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <nav.icon size={20} style={{ color: "var(--brand-primary)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{nav.label}</div>
              {nav.count > 0 ? (
                <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                  {nav.count} {nav.count === 1 ? "elemento" : "elementos"}
                </div>
              ) : nav.label === "Proveedores" ? (
                <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                  Catering, animación, decoración...
                </div>
              ) : null}
            </div>
            <div style={{ color: "var(--neutral-600)", fontSize: "1.2rem" }}>›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
