import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Search, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Vendor categories ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    emoji: "🍽️",
    name: "Catering",
    description: "Banquetes, buffets, menús infantiles y servicio de camareros.",
    searchTerms: "catering fiesta infantil",
    color: "#f59e0b",
    platforms: [
      { name: "Bodas.net", url: "https://www.bodas.net/catering/" },
      { name: "Zafiro", url: "https://www.zafiro.com/catering/" },
    ],
  },
  {
    emoji: "📸",
    name: "Fotografía",
    description: "Fotógrafos profesionales para inmortalizar cada momento.",
    searchTerms: "fotógrafo fiesta cumpleaños",
    color: "#8338ec",
    platforms: [
      { name: "Bodas.net", url: "https://www.bodas.net/fotografos/" },
      { name: "Zankyou", url: "https://www.zankyou.es/f/fotografos" },
    ],
  },
  {
    emoji: "🎭",
    name: "Animación",
    description: "Animadores, payasos, magos, princesas y superhéroes.",
    searchTerms: "animación infantil fiesta cumpleaños",
    color: "#ff3366",
    platforms: [
      { name: "Milanuncios", url: "https://www.milanuncios.com/animacion-infantil/" },
      { name: "Thumbtack", url: "https://www.thumbtack.com" },
    ],
  },
  {
    emoji: "🎂",
    name: "Tartas",
    description: "Tartas personalizadas, cupcakes y candy bars temáticos.",
    searchTerms: "tarta personalizada cumpleaños",
    color: "#06ffa5",
    platforms: [
      { name: "Domestika", url: "https://www.domestika.org" },
      { name: "Instagram", url: "https://www.instagram.com/explore/tags/tartaspersonalizadas/" },
    ],
  },
  {
    emoji: "🎵",
    name: "Música / DJ",
    description: "DJs, grupos de música en directo y ambientación sonora.",
    searchTerms: "DJ fiesta cumpleaños",
    color: "#3b82f6",
    platforms: [
      { name: "GigSalad", url: "https://www.gigsalad.com" },
      { name: "Bodas.net", url: "https://www.bodas.net/musicos-grupos/" },
    ],
  },
  {
    emoji: "🎪",
    name: "Sala / Venue",
    description: "Salones de eventos, parques de bolas y espacios temáticos.",
    searchTerms: "salón de eventos fiesta infantil",
    color: "#ec4899",
    platforms: [
      { name: "Peerspace", url: "https://www.peerspace.com" },
      { name: "Eventbrite", url: "https://www.eventbrite.es" },
    ],
  },
  {
    emoji: "🎈",
    name: "Decoración",
    description: "Globos, centros de mesa, photocall y ambientación temática.",
    searchTerms: "decoración fiesta cumpleaños",
    color: "#f97316",
    platforms: [
      { name: "Amazon", url: "https://www.amazon.es/s?k=decoracion+cumpleanos" },
      { name: "Party Fiesta", url: "https://www.partyfiesta.com" },
    ],
  },
  {
    emoji: "🎁",
    name: "Detalles / Regalos",
    description: "Regalos de bienvenida, bolsas sorpresa y recuerdos personalizados.",
    searchTerms: "detalles regalos fiesta cumpleaños",
    color: "#84cc16",
    platforms: [
      { name: "Amazon", url: "https://www.amazon.es/s?k=detalles+fiesta" },
      { name: "Zazzle", url: "https://www.zazzle.es" },
    ],
  },
];

export default async function ProveedoresPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true, userId: true, celebrantName: true, venue: true, venueAddress: true },
  });

  if (!event || event.userId !== userId) notFound();

  const city = event.venueAddress
    ? event.venueAddress.split(",").pop()?.trim() ?? ""
    : "";

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href={`/dashboard/eventos/${id}`} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--neutral-500)", textDecoration: "none",
          fontSize: "0.82rem", marginBottom: "16px",
        }}>
          <ArrowLeft size={14} /> {event.celebrantName}
        </Link>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Proveedores</h1>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem" }}>
          Encuentra los mejores proveedores para la fiesta de {event.celebrantName}.
          {city && ` Búsquedas personalizadas para ${city}.`}
        </p>
      </div>

      {/* Search shortcut */}
      <div style={{
        background: "linear-gradient(135deg, rgba(131,56,236,0.1) 0%, rgba(255,51,102,0.08) 100%)",
        border: "1px solid rgba(131,56,236,0.2)",
        borderRadius: "var(--radius-xl)",
        padding: "20px 24px",
        marginBottom: "28px",
        display: "flex", alignItems: "center", gap: "16px",
      }}>
        <span style={{ fontSize: "2rem" }}>🧞</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "3px" }}>Consejo del Genio</div>
          <p style={{ color: "var(--neutral-400)", fontSize: "0.83rem", lineHeight: 1.5 }}>
            Reserva catering y animación con al menos 4–6 semanas de antelación. ¡Los mejores proveedores se llenan rápido!
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
        {CATEGORIES.map((cat) => {
          const query = encodeURIComponent(
            city ? `${cat.searchTerms} ${city}` : cat.searchTerms
          );
          const googleUrl = `https://www.google.com/search?q=${query}`;

          return (
            <div key={cat.name} style={{
              background: "var(--surface-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "20px",
              transition: "border-color 0.2s",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <div style={{
                  width: "46px", height: "46px", flexShrink: 0,
                  borderRadius: "var(--radius-md)",
                  background: `${cat.color}15`,
                  border: `1px solid ${cat.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "3px" }}>{cat.name}</div>
                  <p style={{ color: "var(--neutral-500)", fontSize: "0.78rem", lineHeight: 1.4 }}>{cat.description}</p>
                </div>
              </div>

              {/* Platforms */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {cat.platforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "var(--surface-elevated)",
                      color: "var(--neutral-400)",
                      textDecoration: "none",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    <ExternalLink size={10} /> {p.name}
                  </a>
                ))}
              </div>

              {/* Google search CTA */}
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${cat.color}30`,
                  background: `${cat.color}08`,
                  color: cat.color,
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  transition: "all 0.2s",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Search size={13} /> Buscar {cat.name.toLowerCase()}{city ? ` en ${city}` : ""}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
