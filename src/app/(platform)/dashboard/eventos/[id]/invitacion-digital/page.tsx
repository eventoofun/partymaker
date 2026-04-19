import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InvitacionDigitalWizardClient from "./InvitacionDigitalWizardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvitacionDigitalPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event || event.ownerId !== userId) notFound();

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href={`/dashboard/eventos/${id}`} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--neutral-500)", textDecoration: "none",
          fontSize: "0.82rem", marginBottom: "16px",
        }}>
          <ArrowLeft size={14} /> {event.celebrantName}
        </Link>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Invitación Digital</h1>
        <p style={{ color: "var(--neutral-400)" }}>
          Crea una invitación digital personalizada para {event.celebrantName}
        </p>
      </div>
      <InvitacionDigitalWizardClient
        eventId={id}
        event={{
          celebrantName: event.celebrantName,
          celebrantAge: event.celebrantAge,
          type: event.type,
          eventDate: event.eventDate ?? null,
          venue: event.venue ?? null,
          venueAddress: event.venueAddress ?? null,
          slug: event.slug,
        }}
      />
    </div>
  );
}
