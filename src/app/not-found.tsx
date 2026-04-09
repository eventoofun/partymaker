export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--surface-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "20px",
      textAlign: "center",
      padding: "40px",
    }}>
      {/* Mini Genie */}
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
        <path d="M40 98 Q32 88 35 78 Q38 68 40 60 Q42 52 40 45" stroke="rgba(131,56,236,0.5)" strokeWidth="12" strokeLinecap="round" fill="none" />
        <ellipse cx="40" cy="28" rx="20" ry="24" fill="#8338ec" />
        <circle cx="40" cy="14" r="14" fill="#8338ec" />
        <rect x="25" y="10" width="12" height="8" rx="4" fill="rgba(0,0,0,0.7)" />
        <rect x="43" y="10" width="12" height="8" rx="4" fill="rgba(0,0,0,0.7)" />
        <line x1="37" y1="14" x2="43" y2="14" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
        <path d="M34 22 Q40 26 46 22" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>

      <div>
        <h1 style={{ fontSize: "5rem", fontWeight: 800, color: "var(--neutral-700)", lineHeight: 1, marginBottom: "8px" }}>404</h1>
        <p style={{ color: "var(--neutral-500)", fontSize: "1rem", marginBottom: "4px" }}>El Genio no ha encontrado esta página.</p>
        <p style={{ color: "var(--neutral-600)", fontSize: "0.85rem" }}>Quizás voló demasiado lejos del jarrón. 🏺</p>
      </div>

      <Link href="/" className="btn btn--ghost" style={{ textDecoration: "none" }}>
        Volver al inicio
      </Link>
    </div>
  );
}
