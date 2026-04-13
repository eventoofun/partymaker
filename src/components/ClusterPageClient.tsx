"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, CheckCircle, Star, Sparkles, Mic,
  Video, Gift, Users, Play, ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("@/components/HeroCanvas"), { ssr: false });

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SubCluster {
  title: string;
  emoji: string;
  desc: string;
  href?: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface ClusterConfig {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  color: string;
  heroTagline: string;
  heroHeadline: string;     // Can include <mark> for gradient word
  heroHeadlineMark?: string;
  heroParagraph: string;
  subClusters: SubCluster[];
  features: { icon: React.ReactNode; title: string; desc: string }[];
  testimonial: { name: string; role: string; text: string; avatar: string };
  faqs: FAQ[];
  ctaHeadline: string;
  ctaParagraph: string;
}

// ─── MOTION ──────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SubClusterCard({ s, color, i }: { s: SubCluster; color: string; i: number }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={s.href ?? "#"}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "24px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-white)",
          textDecoration: "none",
          transition: "all 0.3s var(--ease-spring)",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(-5px)";
          el.style.borderColor = color + "50";
          el.style.boxShadow = `0 16px 50px ${color}20`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "";
          el.style.borderColor = "";
          el.style.boxShadow = "";
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color, opacity: 0.7 }} />
        <div style={{ fontSize: "2.2rem", lineHeight: 1 }}>{s.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "white" }}>{s.title}</div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--neutral-400)", lineHeight: 1.6 }}>{s.desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "var(--text-xs)", fontWeight: 700, color }}>
          Crear <ArrowRight size={12} />
        </div>
      </Link>
    </motion.div>
  );
}

function FAQItem({ faq, i }: { faq: FAQ; i: number }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "24px 28px",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-white)",
      }}
    >
      <div style={{ fontWeight: 700, color: "white", marginBottom: "10px", fontSize: "var(--text-base)" }}>
        {faq.q}
      </div>
      <p style={{ color: "var(--neutral-400)", lineHeight: 1.7, fontSize: "var(--text-sm)" }}>{faq.a}</p>
    </motion.div>
  );
}

// ─── RELATED CLUSTERS ────────────────────────────────────────────────────────

const ALL_CLUSTERS = [
  { id: "cumpleanos",     title: "Cumpleaños",  emoji: "🎂", href: "/cumpleanos" },
  { id: "bodas",          title: "Bodas",        emoji: "💍", href: "/bodas" },
  { id: "graduaciones",   title: "Graduaciones", emoji: "🎓", href: "/graduaciones" },
  { id: "despedidas",     title: "Despedidas",   emoji: "🥂", href: "/despedidas" },
  { id: "comuniones",     title: "Comuniones",   emoji: "✨", href: "/comuniones" },
  { id: "bautizos",       title: "Bautizos",     emoji: "👶", href: "/bautizos" },
  { id: "navidad",        title: "Navidad",      emoji: "🎄", href: "/navidad" },
  { id: "eventos-empresa",title: "Empresa",      emoji: "🏢", href: "/eventos-empresa" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ClusterPageClient({ cfg }: { cfg: ClusterConfig }) {
  const relatedClusters = ALL_CLUSTERS.filter((c) => c.id !== cfg.id).slice(0, 5);

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh", overflowX: "hidden" }}>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
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

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "85dvh",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
        paddingTop: "80px",
      }}>
        <HeroCanvas />

        {/* Cluster-colored radial glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${cfg.color}18 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "250px",
          background: "linear-gradient(to top, var(--surface-bg), transparent)",
          pointerEvents: "none",
        }} />

        <div className="container" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          padding: "80px 24px",
        }}>
          {/* Left: Copy */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            style={{ display: "flex", flexDirection: "column", gap: "28px" }}
          >
            <motion.div variants={fadeUp}>
              <span className="badge" style={{
                background: `${cfg.color}18`,
                border: `1px solid ${cfg.color}35`,
                color: cfg.color,
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "var(--radius-full)",
                fontSize: "0.8rem", fontWeight: 600,
              }}>
                <Sparkles size={12} /> {cfg.heroTagline}
              </span>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h1 style={{ fontSize: "clamp(2.8rem,5.5vw,4.8rem)", lineHeight: 1.04, letterSpacing: "-0.045em", color: "white" }}>
                {cfg.heroHeadline}{" "}
                {cfg.heroHeadlineMark && (
                  <span style={{
                    background: cfg.gradient,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    {cfg.heroHeadlineMark}
                  </span>
                )}
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} style={{
              fontSize: "var(--text-lg)", color: "var(--neutral-300)",
              lineHeight: 1.75, maxWidth: "480px",
            }}>
              {cfg.heroParagraph}
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link href="/sign-up" className="btn btn--primary btn--lg">
                <Mic size={18} /> Hablar con el Genio
              </Link>
              <Link href="#como-funciona" className="btn btn--ghost btn--lg">
                <Play size={16} /> Ver cómo funciona
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {["Sin tarjeta de crédito", "Gratis para siempre", "Lista en 2 minutos"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-400)", fontSize: "0.82rem" }}>
                  <CheckCircle size={13} style={{ color: "#00E5A0" }} /> {t}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Genio + emoji */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: "460px" }}
          >
            {/* Glow ring */}
            <div style={{
              position: "absolute", width: "380px", height: "380px",
              borderRadius: "50%", border: `1px solid ${cfg.color}20`,
              animation: "spin-slow 20s linear infinite",
            }} />
            <div style={{
              position: "absolute", width: "280px", height: "280px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${cfg.color}18 0%, transparent 70%)`,
              animation: "glow-breathe 4s ease-in-out infinite",
            }} />

            {/* Emoji big */}
            <div style={{
              position: "absolute", top: "20px", right: "20px",
              fontSize: "5rem", animation: "float 8s ease-in-out infinite",
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.15))",
            }}>
              {cfg.emoji}
            </div>

            {/* Genio */}
            <div style={{
              position: "relative", zIndex: 2,
              animation: "float-slow 6s ease-in-out infinite",
              filter: `drop-shadow(0 0 40px ${cfg.color}50) drop-shadow(0 0 80px rgba(255,179,0,0.2))`,
            }}>
              <Image
                src="/genio.png"
                alt="Genio — asistente de fiestas"
                width={300}
                height={300}
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          </motion.div>
        </div>

        <div style={{
          position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: "var(--neutral-500)", fontSize: "0.72rem",
          animation: "float 3s ease-in-out infinite",
        }}>
          <span>Explorar</span>
          <ChevronDown size={14} />
        </div>
      </section>

      {/* ══ SUB-CLUSTERS ═════════════════════════════════════════════════════ */}
      <section className="section" id="tipos">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div className="section-label"><Sparkles size={12} /> Tipos de {cfg.title.toLowerCase()}</div>
            <h2 style={{ marginBottom: "12px" }}>
              Cada {cfg.title.toLowerCase()} es{" "}
              <span style={{ background: cfg.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                único
              </span>
            </h2>
            <p style={{ color: "var(--neutral-400)", maxWidth: "520px", margin: "0 auto", fontSize: "var(--text-lg)" }}>
              El Genio se adapta a cada estilo y formato. Elige el que más encaje con tu celebración.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}>
            {cfg.subClusters.map((s, i) => (
              <SubClusterCard key={s.title} s={s} color={cfg.color} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="section" id="como-funciona" style={{
        background: "linear-gradient(180deg, var(--surface-bg) 0%, var(--surface-elevated) 50%, var(--surface-bg) 100%)",
      }}>
        <div className="container container--narrow">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div className="section-label"><Sparkles size={12} /> Cómo funciona</div>
            <h2>
              Tu {cfg.title.toLowerCase()} perfecta{" "}
              <span style={{ background: cfg.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                en 3 pasos
              </span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }} className="steps-grid">
            {[
              { n: "01", icon: <Mic size={24} />, title: "Cuéntaselo al Genio", desc: "Por voz o texto, el Genio recoge todos los detalles de tu celebración en menos de 2 minutos.", color: "#00C2D1" },
              { n: "02", icon: <Video size={24} />, title: "Magia instantánea", desc: "Videoinvitación cinematográfica, página del evento, lista de regalos y RSVP. Todo generado automáticamente.", color: cfg.color },
              { n: "03", icon: <Users size={24} />, title: "Comparte y celebra", desc: "Un enlace. Tus invitados confirman, eligen regalos y reciben recordatorios. Tú solo disfrutas.", color: "#FF4D6D" },
            ].map((step, i) => {
              return <HowItWorksStep key={step.n} step={step} i={i} />;
            })}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section className="section" id="funcionalidades">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="section-label"><Sparkles size={12} /> Lo que incluye</div>
            <h2>
              Todo lo que necesitas para{" "}
              <span style={{ background: cfg.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {cfg.title.toLowerCase()}
              </span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }} className="features-grid">
            {cfg.features.map((feat, i) => (
              <FeatureCard key={feat.title} feat={feat} color={cfg.color} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIAL ══════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 0",
        background: "var(--surface-elevated)",
        borderTop: "1px solid var(--border-white)",
        borderBottom: "1px solid var(--border-white)",
      }}>
        <div className="container" style={{ maxWidth: "680px" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="section-label"><Sparkles size={12} /> Caso real</div>
          </div>
          <TestimonialBlock t={cfg.testimonial} color={cfg.color} />
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section className="section" id="faq">
        <div className="container container--narrow">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div className="section-label"><Sparkles size={12} /> Preguntas frecuentes</div>
            <h2>Todo lo que quieres saber</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cfg.faqs.map((faq, i) => (
              <FAQItem key={faq.q} faq={faq} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ RELATED CLUSTERS ═════════════════════════════════════════════════ */}
      <section style={{
        padding: "60px 0",
        background: "var(--surface-elevated)",
        borderTop: "1px solid var(--border-white)",
      }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="section-label"><Sparkles size={12} /> Otras celebraciones</div>
            <h3 style={{ color: "white" }}>¿Celebras algo diferente?</h3>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            {relatedClusters.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-white)",
                  textDecoration: "none",
                  color: "var(--neutral-300)",
                  fontSize: "0.88rem", fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00C2D140"; e.currentTarget.style.color = "#00C2D1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = "var(--neutral-300)"; }}
              >
                <span>{c.emoji}</span> {c.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="section" style={{ position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${cfg.color}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            filter: `drop-shadow(0 0 60px ${cfg.color}50) drop-shadow(0 0 120px rgba(255,179,0,0.2))`,
            animation: "float-slow 7s ease-in-out infinite",
            marginBottom: "36px", display: "inline-block",
          }}>
            <Image src="/genio.png" alt="Genio" width={180} height={180} style={{ objectFit: "contain" }} />
          </div>

          <h2 style={{ fontSize: "clamp(2.2rem,4.5vw,4rem)", lineHeight: 1.06, letterSpacing: "-0.04em", marginBottom: "20px" }}>
            {cfg.ctaHeadline}
          </h2>
          <p style={{ color: "var(--neutral-300)", fontSize: "var(--text-xl)", lineHeight: 1.6, maxWidth: "500px", margin: "0 auto 36px" }}>
            {cfg.ctaParagraph}
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn btn--primary btn--xl">
              Crear mi {cfg.title.toLowerCase()} gratis <ArrowRight size={20} />
            </Link>
            <Link href="/" className="btn btn--ghost btn--xl">
              Ver todas las celebraciones
            </Link>
          </div>
          <div style={{ marginTop: "36px", display: "flex", justifyContent: "center", gap: "28px", flexWrap: "wrap", color: "var(--neutral-500)", fontSize: "0.8rem" }}>
            <span>✓ Gratis para siempre</span>
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ RGPD compliant</span>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid var(--border-white)",
        padding: "40px 0",
        background: "var(--surface-elevated)",
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textDecoration: "none" }}>
            Cumplefy
          </Link>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {["Inicio", "Precios", "Privacidad", "Términos"].map((item) => (
              <Link key={item} href={item === "Inicio" ? "/" : `/${item.toLowerCase()}`}
                style={{ color: "var(--neutral-500)", fontSize: "0.82rem", textDecoration: "none" }}>
                {item}
              </Link>
            ))}
          </div>
          <div style={{ color: "var(--neutral-600)", fontSize: "0.78rem" }}>
            © {new Date().getFullYear()} Cumplefy. Hecho con ✨ en España.
          </div>
        </div>
      </footer>

      {/* ══ RESPONSIVE STYLES ════════════════════════════════════════════════ */}
      <style>{`
        @media (max-width: 768px) {
          .container { padding-left: 20px !important; padding-right: 20px !important; }
          section > .container[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── HELPER SUB-COMPONENTS (need hooks, so extracted) ─────────────────────────

function HowItWorksStep({ step, i }: {
  step: { n: string; icon: React.ReactNode; title: string; desc: string; color: string };
  i: number;
}) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex", flexDirection: "column", gap: "16px",
        padding: "32px", borderRadius: "var(--radius-xl)",
        background: "var(--surface-card)", border: "1px solid var(--border-white)",
        textAlign: "center", alignItems: "center",
      }}
    >
      <div style={{
        width: "64px", height: "64px", borderRadius: "var(--radius-lg)",
        background: `linear-gradient(135deg, ${step.color}25, ${step.color}08)`,
        border: `1px solid ${step.color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: step.color,
      }}>
        {step.icon}
      </div>
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: step.color, letterSpacing: "0.1em" }}>
        PASO {step.n}
      </div>
      <h4 style={{ color: "white", marginBottom: "4px" }}>{step.title}</h4>
      <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-sm)", lineHeight: 1.7 }}>{step.desc}</p>
    </motion.div>
  );
}

function FeatureCard({ feat, color, i }: {
  feat: { icon: React.ReactNode; title: string; desc: string };
  color: string;
  i: number;
}) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "28px", borderRadius: "var(--radius-xl)",
        background: "var(--surface-card)", border: "1px solid var(--border-white)",
        display: "flex", flexDirection: "column", gap: "14px",
      }}
    >
      <div style={{
        width: "48px", height: "48px", borderRadius: "var(--radius-lg)",
        background: `linear-gradient(135deg, ${color}25, ${color}08)`,
        border: `1px solid ${color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {feat.icon}
      </div>
      <h4 style={{ color: "white" }}>{feat.title}</h4>
      <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-sm)", lineHeight: 1.7 }}>{feat.desc}</p>
    </motion.div>
  );
}

function TestimonialBlock({ t, color }: {
  t: { name: string; role: string; text: string; avatar: string };
  color: string;
}) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "36px", borderRadius: "var(--radius-xl)",
        background: "var(--surface-card)", border: `1px solid ${color}25`,
        boxShadow: `0 0 40px ${color}12`,
      }}
    >
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {Array.from({ length: 5 }).map((_, s) => (
          <Star key={s} size={16} style={{ color: "#FFB300", fill: "#FFB300" }} />
        ))}
      </div>
      <p style={{ color: "var(--neutral-200)", lineHeight: 1.75, fontSize: "var(--text-lg)", marginBottom: "24px" }}>
        &ldquo;{t.text}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}, #FFB300)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "0.9rem", color: "#020409",
        }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "white" }}>{t.name}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--neutral-400)" }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}
