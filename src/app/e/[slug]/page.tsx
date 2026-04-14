import { db } from "@/db";
import { events, contributions, eventStores, products, videoProjects } from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import EpicEventClient from "./EpicEventClient";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getEvent(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      owner: {
        columns: { name: true, avatarUrl: true },
      },
      giftLists: {
        with: {
          items: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
        },
        limit: 1,
      },
      videoInvitations: {
        orderBy: (v, { desc }) => [desc(v.createdAt)],
        limit: 1,
      },
      itinerary: {
        orderBy: (it, { asc }) => [asc(it.sortOrder), asc(it.time)],
      },
    },
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Fiesta",
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};

  const typeLabel = TYPE_LABEL[event.type] ?? "Fiesta";
  const title = `${typeLabel} de ${event.celebrantName} | Cumplefy`;
  const description = `Estás invitado/a a la celebración de ${event.celebrantName}. Confirma tu asistencia, elige un regalo y mucho más.`;

  return {
    title,
    description,
    openGraph: {
      title: `¡Estás invitado/a! ${typeLabel} de ${event.celebrantName}`,
      description: `Confirma tu asistencia y elige un regalo para ${event.celebrantName}.`,
      url: absoluteUrl(`/e/${slug}`),
      siteName: "Cumplefy",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `¡Estás invitado/a! ${typeLabel} de ${event.celebrantName}`,
      description,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || !event.isPublic) notFound();

  const giftList = event.giftLists?.[0] ?? null;
  const items = giftList?.items ?? [];
  const latestVideo = event.videoInvitations?.[0] ?? null;
  const itinerary = event.itinerary ?? [];

  // Load the latest published IA video project (new system)
  const [latestVideoProject] = await db
    .select({ finalVideoUrl: videoProjects.finalVideoUrl, thumbnailUrl: videoProjects.thumbnailUrl })
    .from(videoProjects)
    .where(and(eq(videoProjects.eventId, event.id), eq(videoProjects.status, "published")))
    .orderBy(desc(videoProjects.createdAt))
    .limit(1);

  // Fetch active event store + active products
  const storeRaw = await db.query.eventStores.findFirst({
    where: and(
      eq(eventStores.eventId, event.id),
      eq(eventStores.isActive, true),
    ),
    with: {
      products: {
        where: eq(products.status, "active"),
        with: {
          assets:   { orderBy: (a, { asc }) => [asc(a.sortOrder)] },
          variants: { where: (v, { eq: veq }) => veq(v.isAvailable, true) },
        },
        orderBy: (p, { asc }) => [asc(p.sortOrder)],
      },
    },
  });

  // Aggregate paid contributions per item
  let collectedMap: Record<string, { total: number; count: number }> = {};
  if (items.length > 0) {
    const ids = items.map((i) => i.id);
    const rows = await db
      .select({
        giftItemId: contributions.giftItemId,
        total: sql<number>`coalesce(sum(${contributions.amount}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(contributions)
      .where(
        and(
          inArray(contributions.giftItemId, ids),
          eq(contributions.paymentStatus, "paid"),
        ),
      )
      .groupBy(contributions.giftItemId);
    for (const r of rows) {
      if (r.giftItemId) collectedMap[r.giftItemId] = { total: r.total, count: r.count };
    }
  }

  const eventData = {
    id: event.id,
    slug: event.slug,
    type: event.type,
    celebrantName: event.celebrantName,
    celebrantAge: event.celebrantAge ?? null,
    description: event.description ?? null,
    eventDate: event.eventDate ?? null,
    eventTime: event.eventTime ?? null,
    endDate: event.endDate ?? null,
    endTime: event.endTime ?? null,
    venue: event.venue ?? null,
    venueAddress: event.venueAddress ?? null,
    dressCode: event.dressCode ?? null,
    coverUrl: event.coverUrl ?? null,
    brandingColor: (event.branding as { primaryColor?: string } | null)?.primaryColor ?? null,
    allowRsvp: event.allowRsvp,
    allowGifts: event.allowGifts,
    rsvpDeadline: event.rsvpDeadline ? event.rsvpDeadline.toISOString() : null,
    ownerName: event.owner?.name ?? null,
    ownerAvatarUrl: event.owner?.avatarUrl ?? null,
  };

  const itemsData = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    price: i.price ?? null,
    url: i.url ?? null,
    imageUrl: i.imageUrl ?? null,
    isAvailable: i.isAvailable,
    quantityWanted: i.quantityWanted,
    quantityTaken: i.quantityTaken,
    collectedAmount: collectedMap[i.id]?.total ?? 0,
    contributorCount: collectedMap[i.id]?.count ?? 0,
  }));

  // Prefer the new IA-generated video over the legacy Remotion video
  const videoData = latestVideoProject?.finalVideoUrl
    ? {
        id: "ia",
        status: "ready" as const,
        videoUrlHorizontal: latestVideoProject.finalVideoUrl,
        thumbnailUrl: latestVideoProject.thumbnailUrl ?? null,
      }
    : latestVideo
    ? {
        id: latestVideo.id,
        status: latestVideo.status,
        videoUrlHorizontal: latestVideo.videoUrlHorizontal ?? null,
        thumbnailUrl: latestVideo.thumbnailUrl ?? null,
      }
    : null;

  const itineraryData = itinerary.map((it) => ({
    id: it.id,
    time: it.time,
    title: it.title,
    description: it.description ?? null,
    type: it.type,
    icon: it.icon ?? null,
  }));

  const storeData = storeRaw ? {
    id:          storeRaw.id,
    title:       storeRaw.title,
    description: storeRaw.description,
    products:    storeRaw.products.map((p) => ({
      id:           p.id,
      name:         p.name,
      description:  p.description ?? null,
      type:         p.type,
      requiresQuote: p.requiresQuote,
      assets:       p.assets.map((a) => ({ id: a.id, type: a.type, url: a.url })),
      variants:     p.variants.map((v) => ({
        id:         v.id,
        name:       v.name,
        priceCents: v.priceCents,
        attributes: v.attributes as Record<string, string>,
      })),
    })),
  } : null;

  return (
    <EpicEventClient
      event={eventData}
      items={itemsData}
      latestVideo={videoData}
      itinerary={itineraryData}
      store={storeData}
    />
  );
}
