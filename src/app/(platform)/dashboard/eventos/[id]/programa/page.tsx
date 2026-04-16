import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ItineraryClient from "./ItineraryClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProgramaPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    with: {
      itinerary: {
        orderBy: (it, { asc }) => [asc(it.sortOrder), asc(it.time)],
      },
    },
  });

  if (!event) notFound();

  const itineraryItems = event.itinerary.map((it) => ({
    id:          it.id,
    time:        it.time,
    title:       it.title,
    description: it.description ?? null,
    type:        it.type as "ceremony"|"reception"|"dinner"|"dance"|"speech"|"cake"|"games"|"photo"|"transport"|"other",
    icon:        it.icon ?? null,
    sortOrder:   it.sortOrder,
  }));

  return (
    <div style={{ maxWidth: "760px" }}>
      <Link href={`/dashboard/eventos/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft size={14} /> {event.celebrantName}
      </Link>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Programa del evento</h1>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
            {itineraryItems.length === 0
              ? "Define los momentos de tu celebración"
              : `${itineraryItems.length} ${itineraryItems.length === 1 ? "momento" : "momentos"} en el programa`}
          </p>
        </div>
        <Link
          href={`/e/${event.slug}#programa`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
        >
          <ExternalLink size={14} /> Ver pública
        </Link>
      </div>

      <ItineraryClient eventId={id} initialItems={itineraryItems} />
    </div>
  );
}
