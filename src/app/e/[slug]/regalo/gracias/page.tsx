import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GraciasPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--surface-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "24px",
      textAlign: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        background: "rgba(6,255,165,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <CheckCircle size={40} style={{ color: "#06ffa5" }} />
      </div>

      <div>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "12px" }}>¡Gracias por tu regalo!</h1>
        <p style={{ color: "var(--neutral-400)", maxWidth: "360px" }}>
          Tu aportación ha sido procesada correctamente. Recibirás una confirmación por email.
        </p>
      </div>

      <Link
        href={`/e/${slug}`}
        className="btn btn--ghost"
        style={{ textDecoration: "none" }}
      >
        Ver la lista de regalos
      </Link>

      <p style={{ color: "var(--neutral-600)", fontSize: "0.78rem" }}>
        Gestionado con{" "}
        <Link href="/" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Cumplefy</Link>
      </p>
    </div>
  );
}
