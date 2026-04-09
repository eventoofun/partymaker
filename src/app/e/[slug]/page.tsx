import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Gift, Calendar, MapPin, ExternalLink } from "lucide-react";
import { formatEuros, fundingPercent, absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  return {
    title: `Lista de regalos de ${event.celebrantName} | Cumplefy`,
    description: `Elige un regalo para ${event.celebrantName}. Sin duplicados, sin sorpresas.`,
    openGraph: {
      title: `Lista de regalos de ${event.celebrantName}`,
      description: `Elige un regalo para ${event.celebrantName}. Sin duplicados, sin sorpresas.`,
      url: absoluteUrl(`/e/${slug}`),
    },
  };
}

async function getEvent(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      wishList: {
        with: {
          items: {
            orderBy: (i, { asc }) => [asc(i.position)],
          },
        },
      },
    },
  });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "#06ffa5" },
  partially_funded: { label: "Parcialmente financiado", color: "#f59e0b" },
  funded: { label: "Financiado", color: "#f59e0b" },
  purchased: { label: "Comprado", color: "#94a3b8" },
  reserved: { label: "Reservado", color: "#94a3b8" },
};

const TYPE_EMOJI: Record<string, string> = {
  cumpleanos: "🎂",
  comunion: "✝️",
  bautizo: "👶",
  navidad: "🎄",
  graduacion: "🎓",
  otro: "🎉",
};

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || !event.isPublic) notFound();

  const items = event.wishList?.items ?? [];
  const availableItems = items.filter((i) => i.status === "available" || i.status === "partially_funded");

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--surface-bg)",
      fontFamily: "var(--font-body)",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1.2rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textDecoration: "none",
        }}>
          Cumplefy ✨
        </Link>
      </nav>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Event header */}
        <div style={{
          textAlign: "center",
          marginBottom: "48px",
          padding: "40px 32px",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
            {TYPE_EMOJI[event.type] ?? "🎉"}
          </div>
          <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "8px", fontFamily: "var(--font-display)" }}>
            Lista de regalos de {event.celebrantName}
          </h1>
          {event.celebrantAge && (
            <p style={{ color: "var(--neutral-400)", marginBottom: "16px" }}>
              {event.celebrantAge} años
            </p>
          )}

          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            {event.eventDate && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-400)", fontSize: "0.88rem" }}>
                <Calendar size={14} />
                {new Date(event.eventDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                {event.eventTime && ` · ${event.eventTime}`}
              </div>
            )}
            {event.venue && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-400)", fontSize: "0.88rem" }}>
                <MapPin size={14} />
                {event.venue}
              </div>
            )}
          </div>

          {event.description && (
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", marginTop: "16px", lineHeight: 1.6 }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Items */}
        <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "20px" }}>
          <Gift size={20} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
          {availableItems.length} {availableItems.length === 1 ? "regalo disponible" : "regalos disponibles"}
        </h2>

        {items.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            border: "2px dashed rgba(255,255,255,0.08)",
          }}>
            <Gift size={40} style={{ margin: "0 auto 16px", color: "var(--neutral-600)" }} />
            <p style={{ color: "var(--neutral-400)" }}>Aún no hay regalos en esta lista.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((item) => {
              const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.available;
              const pct = item.isCollective && item.targetAmount
                ? fundingPercent(item.collectedAmount ?? 0, item.targetAmount)
                : null;
              const isUnavailable = item.status === "purchased" || item.status === "reserved" || item.status === "funded";

              return (
                <div
                  key={item.id}
                  className="pm-card"
                  style={{
                    padding: "20px 24px",
                    opacity: isUnavailable ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "10px", height: "10px",
                      borderRadius: "50%",
                      background: status.color,
                      flexShrink: 0,
                      marginTop: "6px",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, fontSize: "1rem" }}>{item.title}</span>
                        {item.priority === "alta" && (
                          <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>★ Alta prioridad</span>
                        )}
                        <span style={{ fontSize: "0.72rem", color: status.color, fontWeight: 600 }}>{status.label}</span>
                      </div>

                      {item.description && (
                        <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "8px" }}>{item.description}</p>
                      )}

                      {item.price && (
                        <div style={{ fontSize: "0.9rem", color: "var(--neutral-300)", marginBottom: "8px" }}>
                          {formatEuros(item.price)}
                        </div>
                      )}

                      {pct !== null && item.targetAmount && (
                        <div style={{ marginBottom: "12px" }}>
                          <div className="funding-bar">
                            <div className="funding-bar__fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>
                            {formatEuros(item.collectedAmount ?? 0)} de {formatEuros(item.targetAmount)} · {pct}%
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--ghost"
                            style={{ fontSize: "0.8rem", padding: "6px 14px", textDecoration: "none" }}
                          >
                            <ExternalLink size={13} /> Ver producto
                          </a>
                        )}
                        {!isUnavailable && (
                          <Link
                            href={`/e/${slug}/regalo?item=${item.id}`}
                            className="btn btn--primary"
                            style={{ fontSize: "0.8rem", padding: "6px 16px", textDecoration: "none" }}
                          >
                            <Gift size={13} />
                            {item.isCollective ? "Contribuir" : "Regalar"}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: "center", color: "var(--neutral-600)", fontSize: "0.78rem", marginTop: "40px" }}>
          Lista gestionada con{" "}
          <Link href="/" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Cumplefy</Link>
        </p>
      </div>
    </div>
  );
}
