import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, eventStores, products, orders } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getEventRole } from "@/lib/permissions";
import TiendaClient from "./TiendaClient";

interface Props { params: Promise<{ id: string }> }

export default async function TiendaPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { id: true, celebrantName: true, slug: true },
  });
  if (!event) notFound();

  const store = await db.query.eventStores.findFirst({
    where: eq(eventStores.eventId, id),
    with: {
      products: {
        with: {
          assets:   { orderBy: (a, { asc }) => [asc(a.sortOrder)] },
          variants: true,
        },
        orderBy: (p, { asc }) => [asc(p.sortOrder)],
      },
    },
  });

  // Order counts (only if store exists)
  let orderCount = 0;
  let revenueTotal = 0;
  if (store) {
    const rows = await db
      .select({ totalCents: orders.totalCents, status: orders.status })
      .from(orders)
      .where(and(eq(orders.storeId, store.id)));
    orderCount = rows.length;
    revenueTotal = rows
      .filter((r) => r.status === "paid" || r.status === "in_production" || r.status === "shipped" || r.status === "delivered")
      .reduce((acc, r) => acc + r.totalCents, 0);
  }

  return (
    <TiendaClient
      eventId={id}
      eventSlug={event.slug}
      celebrantName={event.celebrantName}
      store={store ? {
        id:          store.id,
        isActive:    store.isActive,
        title:       store.title,
        description: store.description,
        visibility:  store.visibility,
        products:    store.products.map((p) => ({
          id:           p.id,
          name:         p.name,
          description:  p.description ?? null,
          type:         p.type,
          status:       p.status,
          requiresQuote: p.requiresQuote,
          sortOrder:    p.sortOrder,
          assets:       p.assets.map((a) => ({ id: a.id, type: a.type, url: a.url })),
          variants:     p.variants.map((v) => ({
            id:          v.id,
            name:        v.name,
            priceCents:  v.priceCents,
            isAvailable: v.isAvailable,
            attributes:  v.attributes as Record<string, string>,
          })),
        })),
      } : null}
      orderCount={orderCount}
      revenueTotal={revenueTotal}
    />
  );
}
