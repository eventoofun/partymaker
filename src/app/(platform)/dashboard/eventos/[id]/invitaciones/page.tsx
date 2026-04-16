import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, videoProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import InvitacionWizardClient from "./InvitacionWizardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvitacionesPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event || event.ownerId !== userId) notFound();

  // Cargar el proyecto de invitación más reciente (modo visual, sin animación aún)
  // Excluye proyectos lipsync que pertenecen al wizard de invitación-hablante
  const [existingProject] = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.eventId, id))
    .orderBy(desc(videoProjects.createdAt))
    .limit(1);

  // Si el proyecto más reciente es lipsync, no pasarlo a este wizard
  const visualProject = existingProject?.mode === "lipsync" ? null : (existingProject ?? null);

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
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Invitación mágica</h1>
        <p style={{ color: "var(--neutral-400)" }}>
          El Genio crea una imagen única de {event.celebrantName} con inteligencia artificial — gratis
        </p>
      </div>
      <Suspense>
        <InvitacionWizardClient
          eventId={id}
          event={{
            celebrantName: event.celebrantName,
            celebrantAge: event.celebrantAge,
            type: event.type,
            eventDate: event.eventDate ?? null,
            venue: event.venue ?? null,
          }}
          existingProject={visualProject}
        />
      </Suspense>
    </div>
  );
}
