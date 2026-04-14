"use client";

// Stub — Remotion player replaced with KIE.ai video pipeline
export interface InvitacionProps {
  celebrantName: string;
  celebrantAge?: number;
  protagonistEmoji?: string;
  protagonistLabel?: string;
  parentMessage?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mood?: "epic" | "magical" | "fun" | "elegant";
}

interface Props {
  inputProps: InvitacionProps;
  variant?: "compact" | "full";
}

export default function InvitacionPlayer({ variant }: Props) {
  const height = variant === "full" ? "100dvh" : "100%";

  return (
    <div style={{
      width: "100%",
      height: variant === "full" ? height : undefined,
      aspectRatio: variant === "full" ? undefined : "9/16",
      background: "var(--surface-card, #1a1a2e)",
      borderRadius: variant === "full" ? 0 : "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--neutral-500, #6b7280)",
      fontSize: "0.85rem",
    }}>
      Vista previa no disponible
    </div>
  );
}
