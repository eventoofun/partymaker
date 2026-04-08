import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Users, UserCheck, UserX, Clock, Mail } from "lucide-react";
import GuestsClient from "./GuestsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvitadosPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: { guests: { orderBy: (g, { desc }) => [desc(g.createdAt)] } },
  });

  if (!event || event.userId !== userId) notFound();

  const stats = {
    total: event.guests.length,
    attending: event.guests.filter((g) => g.rsvpStatus === "attending").length,
    notAttending: event.guests.filter((g) => g.rsvpStatus === "not_attending").length,
    pending: event.guests.filter((g) => g.rsvpStatus === "pending").length,
  };

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Invitados</h1>
        <p style={{ color: "var(--neutral-400)" }}>{event.celebrantName} · Gestiona tus invitados y confirmaciones</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
        {[
          { icon: Users, label: "Total", value: stats.total, color: "white" },
          { icon: UserCheck, label: "Confirmados", value: stats.attending, color: "#06ffa5" },
          { icon: UserX, label: "No asisten", value: stats.notAttending, color: "#ef4444" },
          { icon: Clock, label: "Pendientes", value: stats.pending, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="pm-card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <GuestsClient eventId={id} initialGuests={event.guests} slug={event.slug} />
    </div>
  );
}
