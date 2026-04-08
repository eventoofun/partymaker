export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--surface-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "var(--neutral-400)" }}>404</h1>
      <p style={{ color: "var(--neutral-400)" }}>Página no encontrada.</p>
      <Link href="/" className="btn btn--ghost" style={{ textDecoration: "none" }}>
        Volver al inicio
      </Link>
    </div>
  );
}
