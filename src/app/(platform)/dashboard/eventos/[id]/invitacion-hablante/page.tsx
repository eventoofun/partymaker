import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getEventRole } from "@/lib/permissions";
import InvitacionHablanteWizardClient from "./InvitacionHablanteWizardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvitacionHablantePage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getEventRole(id, userId);
  if (!role) notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });
  if (!event) notFound();

  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: "6px" }}>
          🎙️ Invitación hablante
        </h1>
        <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Sube una foto y graba tu voz. El Genio animará el retrato para que hable con tu propia voz y lo enviará a tus invitados.
        </p>
      </div>

      <InvitacionHablanteWizardClient
        eventId={id}
        event={{
          celebrantName: event.celebrantName,
          celebrantAge: event.celebrantAge ?? null,
          type: event.type,
          eventDate: event.eventDate ?? null,
          venue: event.venue ?? null,
        }}
      />
    </div>
  );
}
