import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events, videoProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import VideoWizardClient from "../invitaciones/VideoWizardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VideoInvitacionPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event || event.ownerId !== userId) notFound();

  // Cargar el proyecto visual más reciente (creado en el wizard de invitación)
  const [existingProject] = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.eventId, id))
    .orderBy(desc(videoProjects.createdAt))
    .limit(1);

  const visualProject = existingProject?.mode !== "lipsync" ? (existingProject ?? null) : null;

  // Si no existe proyecto visual, redirigir al wizard de invitación para crearlo
  if (!visualProject) {
    redirect(`/dashboard/eventos/${id}/invitaciones`);
  }

  // Si existe pero no está pagado, redirigir al wizard de invitación para el upsell
  if (!visualProject.animationPaid) {
    redirect(`/dashboard/eventos/${id}/invitaciones`);
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href={`/dashboard/eventos/${id}/invitaciones`} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--neutral-500)", textDecoration: "none",
          fontSize: "0.82rem", marginBottom: "16px",
        }}>
          <ArrowLeft size={14} /> Invitación mágica
        </Link>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "6px" }}>Videoinvitación animada</h1>
        <p style={{ color: "var(--neutral-400)" }}>
          El Genio anima tu imagen y crea una videoinvitación épica para {event.celebrantName}
        </p>
      </div>
      <Suspense>
        <VideoWizardClient
          eventId={id}
          event={{
            celebrantName: event.celebrantName,
            celebrantAge: event.celebrantAge,
            type: event.type,
            eventDate: event.eventDate ?? null,
            venue: event.venue ?? null,
            slug: event.slug,
          }}
          existingProject={visualProject}
        />
      </Suspense>
    </div>
  );
}
