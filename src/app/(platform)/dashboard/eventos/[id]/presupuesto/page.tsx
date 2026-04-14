import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import BudgetClient from "./BudgetClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PresupuestoPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.ownerId, userId)),
    with: {
      budgetItems: {
        orderBy: (b, { asc }) => [asc(b.sortOrder), asc(b.createdAt)],
      },
    },
  });

  if (!event) notFound();

  const totalEstimated = event.budgetItems.reduce((s, i) => s + (i.estimatedCost ? parseFloat(i.estimatedCost) : 0), 0);
  const totalActual    = event.budgetItems.reduce((s, i) => s + (i.actualCost ? parseFloat(i.actualCost) : 0), 0);

  const items = event.budgetItems.map((b) => ({
    id:            b.id,
    category:      b.category,
    name:          b.name,
    vendor:        b.vendor,
    estimatedCost: b.estimatedCost,
    actualCost:    b.actualCost,
    notes:         b.notes,
    isPaid:        b.isPaid,
    sortOrder:     b.sortOrder,
  }));

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Presupuesto del evento</h1>
        <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
          {items.length === 0
            ? "Planifica y controla los gastos de tu celebración"
            : `${items.length} ${items.length === 1 ? "partida" : "partidas"} · Presup. ${totalEstimated.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € · Gastado ${totalActual.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
          }
        </p>
      </div>

      <BudgetClient eventId={id} initialItems={items} />
    </div>
  );
}
