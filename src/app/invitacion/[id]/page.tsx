import { db } from "@/db";
import { videoInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { InvitacionProps } from "@/components/InvitacionPlayer";
import InvitacionPlayerWrapper from "./InvitacionPlayerWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicInvitacionPage({ params }: Props) {
  const { id } = await params;

  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, id),
    with: { event: { columns: { celebrantName: true, type: true } } },
  });

  if (!invitation || invitation.status !== "ready") notFound();

  const inputProps: InvitacionProps = {
    celebrantName: invitation.event.celebrantName ?? "Protagonista",
    protagonistLabel: invitation.theme,
    mood: "fun",
  };

  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <InvitacionPlayerWrapper inputProps={inputProps} />
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, id),
    with: { event: { columns: { celebrantName: true } } },
  });

  const name = invitation?.event.celebrantName ?? "Invitación";

  return {
    title: `¡Estás invitado/a a la fiesta de ${name}! 🎉`,
    description: "Abre para ver tu invitación animada",
    openGraph: { title: `Fiesta de ${name}`, description: "¡Te esperamos!" },
  };
}
