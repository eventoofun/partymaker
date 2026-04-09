import Link from "next/link";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "1 evento activo",
  "Lista de regalos ilimitada",
  "Regalos colectivos con Stripe",
  "Página pública del evento",
  "Gestión de invitados (hasta 50)",
  "Confirmaciones RSVP",
  "Notificaciones por email",
];

const PRO_FEATURES = [
  "Eventos ilimitados",
  "Lista de regalos ilimitada",
  "Regalos colectivos con Stripe",
  "Página pública personalizada",
  "Invitados ilimitados",
  "Confirmaciones RSVP",
  "Notificaciones por email",
  "Invitación en vídeo con IA",
  "Estadísticas avanzadas",
  "Soporte prioritario",
  "Sin marca de agua Cumplefy",
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-bg)" }}>
      {/* Nav */}
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textDecoration: "none" }}>
          Cumplefy ✨
        </Link>
        <Link href="/sign-in" className="btn btn--ghost" style={{ textDecoration: "none", fontSize: "0.85rem" }}>
          Iniciar sesión
        </Link>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h1 style={{ fontSize: "var(--text-5xl)", fontFamily: "var(--font-display)", marginBottom: "16px" }}>
            Planes simples y{" "}
            <span className="gradient-text">transparentes</span>
          </h1>
          <p style={{ color: "var(--neutral-400)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
            Sin sorpresas. Sin comisiones ocultas. Solo pagas la suscripción, los regalos van directamente al organizador.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "700px", margin: "0 auto" }}>
          {/* Free */}
          <div className="pm-card" style={{ padding: "36px 28px" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Gratuito</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "3rem", fontWeight: 900 }}>€0</span>
                <span style={{ color: "var(--neutral-500)" }}>/mes</span>
              </div>
              <p style={{ color: "var(--neutral-400)", fontSize: "0.85rem", marginTop: "8px" }}>Para empezar sin compromisos</p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {FREE_FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem", color: "var(--neutral-300)" }}>
                  <Check size={15} style={{ color: "#06ffa5", flexShrink: 0, marginTop: "2px" }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/sign-up" className="btn btn--ghost" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}>
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div style={{
            padding: "36px 28px",
            background: "linear-gradient(145deg, rgba(255,51,102,0.08) 0%, rgba(131,56,236,0.08) 100%)",
            borderRadius: "var(--radius-xl)",
            border: "2px solid rgba(255,51,102,0.3)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Popular badge */}
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "var(--gradient-brand)",
              borderRadius: "999px",
              padding: "3px 12px",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "white",
              letterSpacing: "0.05em",
            }}>
              RECOMENDADO
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Pro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "3rem", fontWeight: 900 }}>€9</span>
                <span style={{ color: "var(--neutral-500)" }}>/mes</span>
              </div>
              <p style={{ color: "var(--neutral-400)", fontSize: "0.85rem", marginTop: "8px" }}>Para organizadores habituales</p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {PRO_FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem", color: "var(--neutral-300)" }}>
                  <Check size={15} style={{ color: "var(--brand-primary)", flexShrink: 0, marginTop: "2px" }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/sign-up" className="btn btn--primary" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}>
              Empezar con Pro
            </Link>
          </div>
        </div>

        {/* FAQ-style note */}
        <div style={{ textAlign: "center", marginTop: "64px" }}>
          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "40px" }}>Preguntas frecuentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "580px", margin: "0 auto", textAlign: "left" }}>
            {[
              {
                q: "¿Cobráis comisión por los regalos?",
                a: "Sí, Cumplefy aplica una comisión del 3% (mínimo €0,30) sobre los regalos colectivos. Los regalos físicos comprados en tiendas externas no tienen comisión.",
              },
              {
                q: "¿Necesito tarjeta de crédito para el plan gratuito?",
                a: "No. El plan gratuito es completamente gratis y no requiere datos de pago. Solo necesitarás añadir tu IBAN si quieres recibir regalos colectivos en efectivo.",
              },
              {
                q: "¿Cómo me llegan los regalos en efectivo?",
                a: "A través de Stripe Connect. Al activar los regalos colectivos, te guiamos para conectar tu cuenta bancaria española. Los fondos se transfieren automáticamente.",
              },
              {
                q: "¿Puedo cancelar cuando quiera?",
                a: "Sí. Sin permanencias ni penalizaciones. Al cancelar, mantienes el acceso hasta el fin del período pagado.",
              },
            ].map((faq) => (
              <div key={faq.q} style={{ padding: "20px 24px", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "8px" }}>{faq.q}</div>
                <div style={{ color: "var(--neutral-400)", fontSize: "0.88rem", lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
