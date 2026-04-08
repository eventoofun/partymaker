import { db } from "@/db";
import { videoInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { InvitacionProps } from "@/remotion/InvitacionComposition";
import InvitacionPlayerWrapper from "./InvitacionPlayerWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicInvitacionPage({ params }: Props) {
  const { id } = await params;

  const invitation = await db.query.videoInvitations.findFirst({
    where: eq(videoInvitations.id, id),
  });

  if (!invitation || !invitation.wizardData) notFound();

  let inputProps: InvitacionProps;
  try {
    const parsed = JSON.parse(invitation.wizardData);
    inputProps = parsed.remotionProps as InvitacionProps;
    if (!inputProps?.celebrantName) throw new Error("Missing props");
  } catch {
    notFound();
  }

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
    columns: { wizardData: true },
  });

  let name = "Invitación";
  try {
    const p = JSON.parse(invitation?.wizardData ?? "{}");
    name = p.remotionProps?.celebrantName ?? "Invitación";
  } catch { /* ignore */ }

  return {
    title: `¡Estás invitado/a a la fiesta de ${name}! 🎉`,
    description: "Abre para ver tu invitación animada",
    openGraph: { title: `Fiesta de ${name}`, description: "¡Te esperamos!" },
  };
}
