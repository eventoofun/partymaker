"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Users, Shield, Zap, Star, CheckCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE — eventoo.es
// Dark, cinematic, ultra-premium
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);

  // Parallax orbs on mouse move
  useEffect(() => {
    const orb1 = document.getElementById("orb1");
    const orb2 = document.getElementById("orb2");

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      if (orb1) {
        orb1.style.transform = `translate(${x * 40}px, ${y * 30}px)`;
      }
      if (orb2) {
        orb2.style.transform = `translate(${-x * 30}px, ${-y * 20}px)`;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh" }}>
      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,10,26,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "1.5rem",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          eventoo
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/pricing" style={{ color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.9rem" }}>
            Precios
          </Link>
          <Link href="/sign-in" style={{ color: "white", textDecoration: "none", fontSize: "0.9rem" }}>
            Entrar
          </Link>
          <Link href="/sign-up" className="btn btn--primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
            Empieza gratis
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
          background: "var(--gradient-radial)",
        }}
      >
        {/* Decorative orbs */}
        <div
          id="orb1"
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,51,102,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          id="orb2"
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(131,56,236,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            transition: "transform 0.3s ease-out",
          }}
        />

        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,51,102,0.15)",
              border: "1px solid rgba(255,51,102,0.4)",
              borderRadius: "999px",
              padding: "6px 16px",
              fontSize: "0.8rem",
              color: "#ff8099",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            <Star size={12} fill="currentColor" /> Fin al síndrome del niño hiperregalado
          </div>

          <h1
            style={{
              fontSize: "var(--text-hero)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: "24px",
              color: "white",
            }}
          >
            La lista de deseos
            <br />
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              que todos necesitaban
            </span>
          </h1>

          <p
            style={{
              fontSize: "var(--text-xl)",
              color: "var(--neutral-400)",
              maxWidth: "620px",
              margin: "0 auto 48px",
              lineHeight: 1.6,
            }}
          >
            Crea la lista de regalos perfecta para el cumpleaños de tu hijo.
            Evita duplicados, organiza regalos colectivos y compártelo en segundos.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn btn--primary" style={{ fontSize: "1rem", padding: "16px 40px" }}>
              Crear mi primera lista <ArrowRight size={18} />
            </Link>
            <Link href="/e/demo" className="btn btn--ghost" style={{ fontSize: "1rem", padding: "16px 40px" }}>
              Ver ejemplo
            </Link>
          </div>

          {/* Social proof */}
          <div
            style={{
              marginTop: "64px",
              display: "flex",
              gap: "32px",
              justifyContent: "center",
              flexWrap: "wrap",
              color: "var(--neutral-500)",
              fontSize: "0.85rem",
            }}
          >
            {["100% gratuito para empezar", "Sin tarjeta de crédito", "Listo en 2 minutos"].map((t) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle size={14} color="var(--color-success)" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "var(--section-lg) 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ color: "var(--brand-primary)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "12px" }}>
            Cómo funciona
          </p>
          <h2>Tres pasos. Sin complicaciones.</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            {
              step: "01",
              icon: <Gift size={28} />,
              title: "Crea tu lista",
              desc: "Añade los regalos que quieres: pega el enlace de Amazon, El Corte Inglés o cualquier tienda. Nosotros importamos imagen y precio.",
            },
            {
              step: "02",
              icon: <Users size={28} />,
              title: "Comparte con invitados",
              desc: "Comparte por WhatsApp, email o QR. Los invitados ven qué está disponible y pueden aportar a regalos colectivos desde el móvil.",
            },
            {
              step: "03",
              icon: <Shield size={28} />,
              title: "Cero duplicados",
              desc: "Cuando alguien reserva o aporta a un regalo, desaparece de la lista pública. El niño recibe lo que quería, sin repetidos.",
            },
          ].map((item) => (
            <div key={item.step} className="pm-card" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255,51,102,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-primary)",
                  marginBottom: "20px",
                }}
              >
                {item.icon}
              </div>
              <div style={{ color: "var(--neutral-600)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", marginBottom: "8px" }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "12px" }}>{item.title}</h3>
              <p style={{ color: "var(--neutral-400)", lineHeight: 1.65, fontSize: "0.95rem" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING CTA ── */}
      <section
        style={{
          margin: "0 24px 80px",
          borderRadius: "var(--radius-xl)",
          background: "var(--gradient-brand)",
          padding: "80px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <Zap size={40} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ marginBottom: "16px", letterSpacing: "-0.03em" }}>
            Gratis para siempre. Pro para más.
          </h2>
          <p style={{ opacity: 0.85, fontSize: "var(--text-lg)", marginBottom: "40px" }}>
            El plan gratuito cubre lo esencial. Pro desbloquea invitaciones en vídeo con IA,
            eventos ilimitados y mucho más.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "white", color: "#ff3366", textDecoration: "none",
              padding: "14px 36px", borderRadius: "999px", fontWeight: 700,
            }}>
              Empieza gratis <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.2)", color: "white", textDecoration: "none",
              padding: "14px 36px", borderRadius: "999px", fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.4)",
            }}>
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        color: "var(--neutral-500)",
        fontSize: "0.85rem",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          eventoo
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="/privacidad" style={{ color: "inherit", textDecoration: "none" }}>Privacidad</Link>
          <Link href="/terminos" style={{ color: "inherit", textDecoration: "none" }}>Términos</Link>
          <Link href="/contacto" style={{ color: "inherit", textDecoration: "none" }}>Contacto</Link>
        </div>
        <span>© {new Date().getFullYear()} eventoo.es — Hecho con ❤️ en España</span>
      </footer>
    </div>
  );
}
