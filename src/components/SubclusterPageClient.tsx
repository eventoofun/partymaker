"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CheckCircle, ChevronRight,
  Video, Gift, Users, Sparkles,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SubclusterConfig {
  // Breadcrumb / parent
  clusterHref: string;       // e.g. "/cumpleanos"
  clusterTitle: string;      // e.g. "Cumpleaños"
  clusterEmoji: string;

  // This page
  title: string;             // e.g. "Cumpleaños Infantil"
  emoji: string;
  color: string;
  gradient: string;

  // SEO content
  heroTagline: string;
  heroHeadline: string;
  heroHeadlineMark?: string;
  heroParagraph: string;

  // Body sections
  features: { icon: React.ReactNode; title: string; desc: string }[];
  bullets: string[];         // Short "what you get" bullets
  faqs: { q: string; a: string }[];

  // Related subclusters in the same cluster
  related: { title: string; emoji: string; href: string }[];

  cta: { headline: string; paragraph: string };
}

// ─── ANIMATION ───────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function SubclusterPageClient({ cfg }: { cfg: SubclusterConfig }) {
  const { color, gradient } = cfg;

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 32px",
        background: "rgba(2,4,9,0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-white)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>✨</div>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Cumplefy</span>
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/sign-in" style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", color: "var(--neutral-300)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
            Entrar
          </Link>
          <Link href="/sign-up" className="btn btn--primary btn--sm">
            Crear gratis <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <div style={{ paddingTop: "80px" }}>

        {/* BREADCRUMBS */}
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 24px 0" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--neutral-500)", flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "var(--neutral-500)", textDecoration: "none" }}>Cumplefy</Link>
            <ChevronRight size={12} />
            <Link href={cfg.clusterHref} style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
              {cfg.clusterEmoji} {cfg.clusterTitle}
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "white" }}>{cfg.emoji} {cfg.title}</span>
          </nav>
        </div>

        {/* HERO */}
        <section style={{
          maxWidth: "900px", margin: "0 auto",
          padding: "48px 24px 64px",
          textAlign: "center",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 16px", borderRadius: "999px",
              background: `${color}18`, border: `1px solid ${color}40`,
              fontSize: "0.82rem", fontWeight: 700, color,
              marginBottom: "24px",
            }}>
              <Sparkles size={13} /> {cfg.heroTagline}
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.08,
              color: "white", margin: "0 0 24px",
            }}>
              {cfg.heroHeadline}{" "}
              {cfg.heroHeadlineMark && (
                <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {cfg.heroHeadlineMark}
                </span>
              )}
            </h1>
            <p style={{
              fontSize: "clamp(1.05rem, 2vw, 1.2rem)", color: "var(--neutral-300)",
              lineHeight: 1.7, maxWidth: "640px", margin: "0 auto 40px",
            }}>
              {cfg.heroParagraph}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/sign-up" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 28px", borderRadius: "var(--radius-full)",
                background: gradient, color: "white", textDecoration: "none",
                fontWeight: 700, fontSize: "0.95rem",
                boxShadow: `0 0 32px ${color}40`,
              }}>
                Crear invitación gratis <ArrowRight size={16} />
              </Link>
              <Link href={cfg.clusterHref} style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 28px", borderRadius: "var(--radius-full)",
                background: "var(--surface-card)", color: "var(--neutral-200)",
                textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
                border: "1px solid var(--border-white)",
              }}>
                <ArrowLeft size={14} /> Volver a {cfg.clusterTitle}
              </Link>
            </div>
          </motion.div>
        </section>

        {/* BULLETS — what you get */}
        <section style={{ maxWidth: "900px", margin: "0 auto 64px", padding: "0 24px" }}>
          <FadeUp>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px",
            }}>
              {cfg.bullets.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-white)",
                }}>
                  <CheckCircle size={17} style={{ color, flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--neutral-200)", lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </section>

        {/* FEATURES */}
        <section style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 24px" }}>
          <FadeUp>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "white",
              marginBottom: "40px", textAlign: "center",
            }}>
              Todo lo que el Genio hace por ti
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {cfg.features.map((f, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div style={{
                  padding: "28px",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-white)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: gradient }} />
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "10px",
                    background: `${color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color, marginBottom: "16px",
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ fontWeight: 700, color: "white", marginBottom: "8px" }}>{f.title}</div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--neutral-400)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth: "720px", margin: "0 auto 80px", padding: "0 24px" }}>
          <FadeUp>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "white",
              marginBottom: "36px", textAlign: "center",
            }}>
              Preguntas frecuentes
            </h2>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {cfg.faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div style={{
                  padding: "22px 26px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-white)",
                }}>
                  <div style={{ fontWeight: 700, color: "white", marginBottom: "8px" }}>{faq.q}</div>
                  <p style={{ color: "var(--neutral-400)", lineHeight: 1.7, fontSize: "var(--text-sm)", margin: 0 }}>{faq.a}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* RELATED SUBCLUSTERS */}
        {cfg.related.length > 0 && (
          <section style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 24px" }}>
            <FadeUp>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "1.6rem", color: "white", marginBottom: "28px", textAlign: "center",
              }}>
                También podría interesarte
              </h2>
            </FadeUp>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              {cfg.related.map((r, i) => (
                <FadeUp key={i} delay={i * 0.06}>
                  <Link href={r.href} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-white)",
                    textDecoration: "none",
                    transition: "all 0.25s ease",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = color + "50"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = ""; (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{r.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--neutral-200)" }}>{r.title}</span>
                    <ArrowRight size={13} style={{ color: "var(--neutral-500)", marginLeft: "auto" }} />
                  </Link>
                </FadeUp>
              ))}
            </div>
          </section>
        )}

        {/* CTA BANNER */}
        <section style={{ maxWidth: "900px", margin: "0 auto 80px", padding: "0 24px" }}>
          <FadeUp>
            <div style={{
              padding: "52px 40px",
              borderRadius: "var(--radius-2xl)",
              background: `radial-gradient(ellipse at 60% 40%, ${color}22 0%, transparent 65%), var(--surface-card)`,
              border: `1px solid ${color}35`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✨</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", color: "white", marginBottom: "16px",
              }}>
                {cfg.cta.headline}
              </h2>
              <p style={{ color: "var(--neutral-300)", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 32px", fontSize: "1.05rem" }}>
                {cfg.cta.paragraph}
              </p>
              <Link href="/sign-up" style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "16px 36px", borderRadius: "var(--radius-full)",
                background: gradient, color: "white", textDecoration: "none",
                fontWeight: 800, fontSize: "1.05rem",
                boxShadow: `0 0 40px ${color}50`,
              }}>
                Empezar gratis ahora <ArrowRight size={18} />
              </Link>
              <p style={{ fontSize: "0.8rem", color: "var(--neutral-500)", marginTop: "14px" }}>
                Sin tarjeta de crédito · Plan gratuito para siempre
              </p>
            </div>
          </FadeUp>
        </section>

        {/* BACK LINKS — never a dead end */}
        <nav aria-label="Navegación secundaria" style={{
          maxWidth: "900px", margin: "0 auto 60px", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "20px", flexWrap: "wrap",
        }}>
          <Link href={cfg.clusterHref} style={{ color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={13} /> {cfg.clusterEmoji} {cfg.clusterTitle}
          </Link>
          <span style={{ color: "var(--neutral-700)" }}>·</span>
          <Link href="/" style={{ color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.88rem" }}>
            Inicio
          </Link>
          <span style={{ color: "var(--neutral-700)" }}>·</span>
          <Link href="/pricing" style={{ color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.88rem" }}>
            Precios
          </Link>
          <span style={{ color: "var(--neutral-700)" }}>·</span>
          <Link href="/sign-up" style={{ color, textDecoration: "none", fontSize: "0.88rem", fontWeight: 700 }}>
            Crear cuenta gratis
          </Link>
        </nav>

        {/* FOOTER */}
        <footer style={{
          borderTop: "1px solid var(--border-white)",
          padding: "32px 24px",
          textAlign: "center",
          color: "var(--neutral-600)", fontSize: "0.82rem",
        }}>
          <p>© {new Date().getFullYear()} Cumplefy · La plataforma todo-en-uno para eventos épicos</p>
          <div style={{ marginTop: "10px", display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "var(--neutral-600)", textDecoration: "none" }}>Inicio</Link>
            <Link href={cfg.clusterHref} style={{ color: "var(--neutral-600)", textDecoration: "none" }}>{cfg.clusterTitle}</Link>
            <Link href="/pricing" style={{ color: "var(--neutral-600)", textDecoration: "none" }}>Precios</Link>
            <Link href="/sign-up" style={{ color: "var(--neutral-600)", textDecoration: "none" }}>Crear cuenta</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
