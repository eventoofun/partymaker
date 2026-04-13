import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventHosts, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, Gift, Video, ExternalLink, Share2, CheckCircle2, Circle, Edit2, MessageSquare, UtensilsCrossed, QrCode, ClipboardCheck, ListOrdered, Calculator } from "lucide-react";
import { getEventRole } from "@/lib/permissions";
import CohostPanel from "./CohostPanel";

interface Props {
  params: Promise<{ id: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Evento",
};

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", graduation: "🎓", bachelor: "🥂",
  communion: "✝️", baptism: "👶", christmas: "🎄", corporate: "🏢", other: "🎉",
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      giftLists: {
        with: { items: true },
      },
      guests: true,
      videoInvitations: true,
      budgetItems: true,
    },
  });

  if (!event) notFound();

  // Load co-hosts for the panel (owner only)
  const cohosts =
    role === "owner"
      ? await db
          .select({
            userId: eventHosts.userId,
            role: eventHosts.role,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(eventHosts)
          .innerJoin(users, eq(users.id, eventHosts.userId))
          .where(eq(eventHosts.eventId, id))
      : [];

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"}/e/${event.slug}`;
  const totalGuests = event.guests.length;
  const attending = event.guests.filter((g) => g.status === "confirmed").length;
  const allItems = event.giftLists.flatMap((gl) => gl.items);
  const totalItems = allItems.length;
  const availableItems = allItems.filter((i) => i.isAvailable).length;
  const totalBudget = event.budgetItems.reduce((s, b) => s + (b.estimatedCost ? parseFloat(b.estimatedCost) : 0), 0);
  const totalSpent  = event.budgetItems.reduce((s, b) => s + (b.actualCost ? parseFloat(b.actualCost) : 0), 0);

  const navItems = [
    { href: `/dashboard/eventos/${id}/invitados`,     icon: Users,          label: "Invitados",          sub: `${totalGuests} invitados` },
    { href: `/dashboard/eventos/${id}/rsvp`,          icon: ClipboardCheck, label: "RSVP",               sub: `${attending} confirmados` },
    { href: `/dashboard/eventos/${id}/catering`,      icon: UtensilsCrossed,label: "Catering",           sub: "Menús y restricciones alimentarias" },
    { href: `/dashboard/eventos/${id}/lista-deseos`,  icon: Gift,           label: "Lista de regalos",   sub: `${availableItems} disponibles` },
    { href: `/dashboard/eventos/${id}/invitaciones`,  icon: Video,          label: "Invitación en vídeo",sub: event.videoInvitations.length > 0 ? "Vídeo creado ✓" : "Crea tu vídeo con IA" },
    { href: `/dashboard/eventos/${id}/comunicaciones`,icon: MessageSquare,  label: "Comunicaciones",     sub: "Emails, WhatsApp y recordatorios" },
    { href: `/dashboard/eventos/${id}/operaciones`,   icon: QrCode,         label: "Operaciones",        sub: "Check-in QR y acceso offline" },
    { href: `/dashboard/eventos/${id}/programa`,      icon: ListOrdered,    label: "Programa",           sub: "Itinerario y momentos del evento" },
    { href: `/dashboard/eventos/${id}/presupuesto`,   icon: Calculator,     label: "Presupuesto",        sub: totalBudget > 0 ? `${totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} € presupuestados · ${totalSpent.toLocaleString("es-ES", { maximumFractionDigits: 0 })} € gastados` : "Control de costes y gastos del evento" },
  ];

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        marginBottom: "24px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
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
                  {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
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
          background: "rgba(0,0,0,0.03)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(0,0,0,0.07)",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Invitados confirmados", value: `${attending}/${totalGuests}`, icon: Users },
          { label: "Regalos disponibles", value: `${availableItems}/${totalItems}`, icon: Gift },
          { label: "Presupuesto", value: totalBudget > 0 ? `${totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €` : "—", icon: Calculator },
          { label: "Estado", value: event.status === "published" ? "Publicado" : event.status === "draft" ? "Borrador" : "Archivado", icon: Calendar },
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
              { done: true,           label: "Datos básicos",       sub: "Nombre, fecha y lugar",        href: `/dashboard/eventos/${id}/editar` },
              { done: totalItems > 0, label: "Lista de regalos",    sub: totalItems > 0 ? `${totalItems} ${totalItems === 1 ? "regalo" : "regalos"} añadidos` : "Añade regalos para tus invitados", href: `/dashboard/eventos/${id}/regalos` },
              { done: totalGuests > 0,label: "Invitados",           sub: totalGuests > 0 ? `${totalGuests} ${totalGuests === 1 ? "invitado" : "invitados"}` : "Añade o invita a tus invitados",     href: `/dashboard/eventos/${id}/invitados` },
              { done: event.videoInvitations.length > 0, label: "Invitación en vídeo", sub: event.videoInvitations.length > 0 ? "Invitación creada ✓" : "Crea una invitación personalizada con IA", href: `/dashboard/eventos/${id}/invitaciones` },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: item.done ? "rgba(21,128,61,0.06)" : "#FAFAFA",
                border: `1px solid ${item.done ? "rgba(21,128,61,0.18)" : "rgba(0,0,0,0.07)"}`,
                opacity: 1,
              }}>
                {item.done
                  ? <CheckCircle2 size={18} style={{ color: "#15803D", flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: "var(--neutral-600)", flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.87rem", color: "#1C1C1E" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "1px" }}>{item.sub}</div>
                </div>
                {item.href && (
                  <Link href={item.href} style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: item.done ? "var(--neutral-500)" : "var(--brand-primary)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    padding: "4px 12px",
                    border: `1px solid ${item.done ? "rgba(0,0,0,0.08)" : "rgba(0,194,209,0.35)"}`,
                    borderRadius: "var(--radius-sm)",
                  }}>
                    {item.done ? "Editar" : "Configurar →"}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav sections — 7 modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        {navItems.map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "18px 20px",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            className="pm-card"
          >
            <div style={{
              width: "40px", height: "40px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,51,102,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <nav.icon size={19} style={{ color: "var(--brand-primary)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{nav.label}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--neutral-500)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nav.sub}
              </div>
            </div>
            <div style={{ color: "var(--neutral-600)", fontSize: "1.1rem", flexShrink: 0 }}>›</div>
          </Link>
        ))}
      </div>

      {/* Co-hosts panel — owner only */}
      {role === "owner" && (
        <CohostPanel
          eventId={id}
          initialHosts={cohosts.filter(
            (h): h is typeof h & { role: "cohost" | "operator" | "viewer" } =>
              h.role === "cohost" || h.role === "operator" || h.role === "viewer",
          )}
        />
      )}
    </div>
  );
}
