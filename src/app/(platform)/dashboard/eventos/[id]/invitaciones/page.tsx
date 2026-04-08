import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import VideoWizardClient from "./VideoWizardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvitacionesPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: { videoInvitations: { orderBy: (v, { desc }) => [desc(v.createdAt)] } },
  });

  if (!event || event.userId !== userId) notFound();

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Invitación en vídeo</h1>
        <p style={{ color: "var(--neutral-400)" }}>
          Crea una invitación personalizada con IA para {event.celebrantName}
        </p>
      </div>
      <VideoWizardClient
        eventId={id}
        event={{
          celebrantName: event.celebrantName,
          celebrantAge: event.celebrantAge,
          type: event.type,
          eventDate: event.eventDate ?? null,
          eventTime: event.eventTime ?? null,
          venue: event.venue ?? null,
        }}
        existingVideos={event.videoInvitations}
      />
    </div>
  );
}
