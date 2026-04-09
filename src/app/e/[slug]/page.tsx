import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Gift, Calendar, MapPin, ExternalLink, Video, Users } from "lucide-react";
import { formatEuros, fundingPercent, absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import PublicRsvpForm from "./PublicRsvpForm";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function getEvent(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      wishList: {
        with: {
          items: { orderBy: (i, { asc }) => [asc(i.position)] },
        },
      },
      videoInvitations: {
        orderBy: (v, { desc }) => [desc(v.createdAt)],
        limit: 1,
      },
    },
  });
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  return {
    title: `${TYPE_LABEL[event.type] ?? "Fiesta"} de ${event.celebrantName} | Cumplefy`,
    description: `Estás invitado/a a la celebración de ${event.celebrantName}. Confirma tu asistencia, elige un regalo y mucho más.`,
    openGraph: {
      title: `¡Estás invitado/a! ${TYPE_LABEL[event.type] ?? "Fiesta"} de ${event.celebrantName}`,
      description: `Confirma tu asistencia y elige un regalo para ${event.celebrantName}.`,
      url: absoluteUrl(`/e/${slug}`),
    },
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  cumpleanos: "Cumpleaños", comunion: "Comunión", bautizo: "Bautizo",
  navidad: "Navidad", graduacion: "Graduación", otro: "Fiesta",
};
const TYPE_EMOJI: Record<string, string> = {
  cumpleanos: "🎂", comunion: "✝️", bautizo: "👶",
  navidad: "🎄", graduacion: "🎓", otro: "🎉",
};
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "#06ffa5" },
  partially_funded: { label: "Parcialmente financiado", color: "#f59e0b" },
  funded: { label: "Completado", color: "#f59e0b" },
  purchased: { label: "Comprado", color: "#94a3b8" },
  reserved: { label: "Reservado", color: "#94a3b8" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || !event.isPublic) notFound();

  const items = event.wishList?.items ?? [];
  const availableItems = items.filter(i => i.status === "available" || i.status === "partially_funded");
  const latestVideo = event.videoInvitations?.[0];
  const hasMap = !!(event.venueAddress || event.venue);
  const mapQuery = encodeURIComponent(event.venueAddress ?? event.venue ?? "");

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", fontFamily: "var(--font-body)" }}>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(131,56,236,0.4); } 50% { box-shadow: 0 0 0 14px rgba(131,56,236,0); } }
        .section-enter { animation: fadeUp 0.6s ease both; }
        .video-play-btn { animation: pulse-ring 2.5s ease infinite; }
        input:focus, textarea:focus { border-color: rgba(131,56,236,0.6) !important; box-shadow: 0 0 0 3px rgba(131,56,236,0.12); }
        @media (max-width:640px) {
          .gifts-grid { grid-template-columns: 1fr !important; }
          .hero-meta { flex-direction: column; gap: 10px !important; }
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,10,26,0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          textDecoration: "none",
        }}>
          Cumplefy ✨
        </Link>
        {items.length > 0 && (
          <a href="#regalos" style={{
            fontSize: "0.82rem", color: "var(--neutral-400)",
            textDecoration: "none", padding: "6px 14px",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px",
            transition: "all 0.2s",
          }}>
            Ver regalos
          </a>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: "64px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Gradient orbs */}
        <div style={{
          position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "300px",
          background: "radial-gradient(ellipse, rgba(131,56,236,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="section-enter" style={{ position: "relative", zIndex: 1, maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px", lineHeight: 1 }}>
            {TYPE_EMOJI[event.type] ?? "🎉"}
          </div>

          <div style={{
            display: "inline-block",
            padding: "4px 16px",
            borderRadius: "999px",
            background: "rgba(131,56,236,0.15)",
            border: "1px solid rgba(131,56,236,0.3)",
            fontSize: "0.82rem",
            color: "#c084fc",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            {TYPE_LABEL[event.type] ?? "Celebración"}
            {event.celebrantAge ? ` · ${event.celebrantAge} años` : ""}
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "24px",
          }}>
            ¡Estás invitado/a a la{" "}
            <span style={{
              background: "var(--gradient-brand)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              fiesta de {event.celebrantName}
            </span>
            !
          </h1>

          <div className="hero-meta" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "24px", flexWrap: "wrap", color: "var(--neutral-400)", fontSize: "0.9rem",
          }}>
            {event.eventDate && (
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <Calendar size={16} style={{ color: "#ff3366" }} />
                {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                {event.eventTime && ` · ${event.eventTime}`}
              </div>
            )}
            {event.venue && (
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <MapPin size={16} style={{ color: "#8338ec" }} />
                {event.venue}
              </div>
            )}
          </div>

          {event.description && (
            <p style={{
              color: "var(--neutral-500)", fontSize: "0.95rem", marginTop: "20px",
              lineHeight: 1.7, maxWidth: "480px", margin: "20px auto 0",
            }}>
              {event.description}
            </p>
          )}

          {/* Quick links */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "32px", flexWrap: "wrap" }}>
            {latestVideo && (
              <a href="#videoinvitacion" style={{
                padding: "12px 24px", borderRadius: "999px",
                background: "var(--gradient-brand)", color: "white",
                textDecoration: "none", fontWeight: 700, fontSize: "0.9rem",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Video size={16} /> Ver videoinvitación
              </a>
            )}
            {event.allowRsvp && (
              <a href="#rsvp" style={{
                padding: "12px 24px", borderRadius: "999px",
                border: "2px solid rgba(131,56,236,0.5)", color: "#c084fc",
                textDecoration: "none", fontWeight: 700, fontSize: "0.9rem",
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(131,56,236,0.08)",
              }}>
                <Users size={16} /> Confirmar asistencia
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px 80px", display: "flex", flexDirection: "column", gap: "48px" }}>

        {/* ── VIDEO INVITATION ── */}
        {latestVideo && (
          <section id="videoinvitacion">
            <SectionHeader icon={<Video size={20} />} title="Videoinvitación" />
            <div style={{
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid rgba(131,56,236,0.25)",
              background: "var(--surface-card)",
              position: "relative",
            }}>
              {/* Video thumbnail / preview */}
              <div style={{
                aspectRatio: "16/9",
                background: "linear-gradient(135deg, #0d0d28 0%, #1a0a2e 50%, #0d0d28 100%)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "20px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Decorative orb */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at 50% 50%, rgba(131,56,236,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{ fontSize: "4rem" }}>🎬</div>
                <p style={{ color: "var(--neutral-400)", fontSize: "1rem", textAlign: "center", zIndex: 1 }}>
                  Videoinvitación animada de {event.celebrantName}
                </p>
                <Link
                  href={`/invitacion/${latestVideo.id}`}
                  className="video-play-btn"
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 32px",
                    borderRadius: "999px",
                    background: "var(--gradient-brand)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    zIndex: 1,
                  }}
                >
                  <Video size={20} /> Ver videoinvitación
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── GIFTS ── */}
        {items.length > 0 && event.allowGifts && (
          <section id="regalos">
            <SectionHeader
              icon={<Gift size={20} />}
              title="Lista de regalos"
              subtitle={`${availableItems.length} ${availableItems.length === 1 ? "regalo disponible" : "regalos disponibles"}`}
            />

            <div className="gifts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {items.map((item) => {
                const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.available;
                const pct = item.isCollective && item.targetAmount
                  ? fundingPercent(item.collectedAmount ?? 0, item.targetAmount)
                  : null;
                const isUnavailable = item.status === "purchased" || item.status === "reserved" || item.status === "funded";

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-card)",
                      border: `1px solid ${isUnavailable ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
                      opacity: isUnavailable ? 0.55 : 1,
                      transition: "all 0.2s",
                      display: "flex", flexDirection: "column", gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.title}</span>
                          {item.priority === "alta" && (
                            <span style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: "999px" }}>
                              ★ Alta prioridad
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem", lineHeight: 1.5 }}>{item.description}</p>
                        )}
                      </div>
                      <span style={{
                        flexShrink: 0, fontSize: "0.7rem", fontWeight: 700,
                        color: status.color,
                        background: `${status.color}15`,
                        padding: "3px 10px", borderRadius: "999px",
                        border: `1px solid ${status.color}40`,
                        whiteSpace: "nowrap",
                      }}>
                        {status.label}
                      </span>
                    </div>

                    {item.price && (
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--neutral-200)" }}>
                        {formatEuros(item.price)}
                      </div>
                    )}

                    {pct !== null && item.targetAmount && (
                      <div>
                        <div style={{
                          height: "6px", borderRadius: "999px",
                          background: "rgba(255,255,255,0.06)", overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: "999px",
                            background: "var(--gradient-brand)",
                            width: `${pct}%`,
                            transition: "width 0.8s ease",
                          }} />
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginTop: "4px" }}>
                          {formatEuros(item.collectedAmount ?? 0)} de {formatEuros(item.targetAmount)} · {pct}%
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.78rem", padding: "6px 12px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--neutral-400)",
                            textDecoration: "none",
                            display: "flex", alignItems: "center", gap: "5px",
                            transition: "all 0.2s",
                          }}
                        >
                          <ExternalLink size={11} /> Ver producto
                        </a>
                      )}
                      {!isUnavailable && (
                        <Link
                          href={`/e/${slug}/regalo?item=${item.id}`}
                          style={{
                            fontSize: "0.78rem", padding: "6px 14px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--gradient-brand)",
                            color: "white",
                            textDecoration: "none",
                            display: "flex", alignItems: "center", gap: "5px",
                            fontWeight: 600,
                          }}
                        >
                          <Gift size={11} />
                          {item.isCollective ? "Contribuir" : "Regalar"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── RSVP ── */}
        {event.allowRsvp && (
          <section id="rsvp">
            <SectionHeader
              icon={<Users size={20} />}
              title="¿Vendrás a la fiesta?"
              subtitle="Confirma tu asistencia en segundos"
            />
            <div style={{
              padding: "32px",
              borderRadius: "var(--radius-xl)",
              background: "var(--surface-card)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <PublicRsvpForm eventId={event.id} />
            </div>
          </section>
        )}

        {/* ── MAP ── */}
        {hasMap && (
          <section id="lugar">
            <SectionHeader
              icon={<MapPin size={20} />}
              title="¿Dónde es la fiesta?"
              subtitle={event.venueAddress ?? event.venue ?? ""}
            />
            <div style={{
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              aspectRatio: "16/7",
              minHeight: "260px",
            }}>
              <iframe
                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=15`}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación: ${event.venue ?? ""}`}
              />
            </div>
            {event.venueAddress && (
              <a
                href={`https://maps.google.com/?q=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  marginTop: "12px", color: "var(--neutral-400)", fontSize: "0.85rem",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={13} /> Abrir en Google Maps
              </a>
            )}
          </section>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px",
        textAlign: "center",
        color: "var(--neutral-600)",
        fontSize: "0.78rem",
      }}>
        Celebración gestionada con{" "}
        <Link href="/" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Cumplefy</Link>
        {" "}✨
      </footer>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon, title, subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{
        display: "flex", alignItems: "center", gap: "10px",
        fontSize: "1.3rem", fontFamily: "var(--font-display)", fontWeight: 700,
        marginBottom: subtitle ? "6px" : 0,
      }}>
        <span style={{ color: "#ff3366" }}>{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", paddingLeft: "30px" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
