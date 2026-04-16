"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import HeroCinematic from "./HeroCinematic";
import {
  ArrowRight, Sparkles, Gift, Users, Video, CheckCircle,
  Play, Heart, Bell, Check, Zap, Film, Mic, Crown, Clock,
  Package, BarChart3, QrCode, ShoppingBag, Share2,
  ChevronDown, Star, MessageSquare, Calendar, MapPin,
} from "lucide-react";

// ─── ANIMATION VARIANTS ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CLUSTERS = [
  { id: "cumpleanos", emoji: "🎂", title: "Cumpleaños", sub: "Infantil · 18 · 30 · 50 · Sorpresa", color: "#FF4D6D", gradient: "135deg,#FF4D6D,#FFB300", popular: true, desc: "El día más especial merece la invitación más épica que hayan visto. Desde el primero hasta el centenario.", href: "/cumpleanos" },
  { id: "bodas", emoji: "💍", title: "Bodas", sub: "Civil · Religiosa · Íntima · Elopement", color: "#C4956A", gradient: "135deg,#E8C4A0,#B8854A", popular: false, desc: "Cuando el Genio gestiona tu boda, tú solo tienes que enamorarte. Todo lo demás: resuelto.", href: "/bodas" },
  { id: "graduaciones", emoji: "🎓", title: "Graduaciones", sub: "Bachillerato · Universidad · FP · Máster", color: "#00C2D1", gradient: "135deg,#00C2D1,#0066FF", popular: true, desc: "Años de esfuerzo merecen una celebración que esté a la altura. Hazlo legendario.", href: "/graduaciones" },
  { id: "despedidas", emoji: "🥂", title: "Despedidas", sub: "Soltera · Soltero · Última aventura", color: "#FFB300", gradient: "135deg,#FFD23F,#FF6B35", popular: false, desc: "La última gran noche de libertad. El Genio se asegura de que nadie la olvide jamás.", href: "/despedidas" },
  { id: "comuniones", emoji: "✨", title: "Comuniones", sub: "Primera Comunión · Confirmación", color: "#A78BFA", gradient: "135deg,#A78BFA,#6D28D9", popular: false, desc: "Un momento sagrado e irrepetible que merece quedar grabado en la memoria de todos.", href: "/comuniones" },
  { id: "bautizos", emoji: "👶", title: "Bautizos y Baby Shower", sub: "Nacimiento · Baby Shower · Celebración", color: "#67E8F9", gradient: "135deg,#67E8F9,#2563EB", popular: false, desc: "La primera gran celebración de una nueva vida. El Genio la convierte en un momento mágico.", href: "/bautizos" },
  { id: "navidad", emoji: "🎄", title: "Navidad", sub: "Cenas · Amigo invisible · Empresa", color: "#DC2626", gradient: "135deg,#DC2626,#16A34A", popular: false, desc: "La magia de la Navidad necesita la invitación más mágica. El Genio sabe exactamente cómo hacerlo.", href: "/navidad" },
  { id: "empresa", emoji: "🏢", title: "Empresas", sub: "Team building · Lanzamientos · Cenas", color: "#6366F1", gradient: "135deg,#00C2D1,#6366F1", popular: false, desc: "Eventos corporativos que inspiran equipos, crean recuerdos y elevan tu marca al siguiente nivel.", href: "/eventos-empresa" },
];

const PAIN_POINTS = [
  { emoji: "🎁", stat: "3 de 4", statLabel: "cumpleaños con regalos repetidos", title: "El niño hiperregalado", desc: "Tres LEGO iguales, cuatro peluches del mismo personaje y una consola que ya tenía. Nadie quería esto. El Genio lo resuelve.", color: "#FFB300" },
  { emoji: "📱", stat: "4 horas", statLabel: "de media para confirmar asistencias", title: "El caos del WhatsApp", desc: "\"¿Vienes o no vienes?\" x 40 personas. El calendario de AlleRGias. El Excel de turnos. Acabamos.", color: "#00C2D1" },
  { emoji: "😴", stat: "92%", statLabel: "de las invitaciones se ignoran", title: "Invitaciones que nadie recuerda", desc: "La plantilla de Canva que todo el mundo usa. El PDF que nadie abre. La fecha que todos olvidan. Hasta hoy.", color: "#FF4D6D" },
];

const MODULES = [
  { icon: <Video size={16} />, label: "Videoinvitación IA", color: "#00C2D1" },
  { icon: <Users size={16} />, label: "RSVP automático", color: "#FFB300" },
  { icon: <Gift size={16} />, label: "Lista de regalos", color: "#A78BFA" },
  { icon: <Calendar size={16} />, label: "Programa del evento", color: "#FF4D6D" },
  { icon: <MapPin size={16} />, label: "Ubicación interactiva", color: "#00E5A0" },
  { icon: <ShoppingBag size={16} />, label: "Tienda del evento", color: "#FFB300" },
  { icon: <BarChart3 size={16} />, label: "Analytics en tiempo real", color: "#6366F1" },
  { icon: <QrCode size={16} />, label: "Check-in con QR", color: "#00C2D1" },
  { icon: <MessageSquare size={16} />, label: "Comunicaciones", color: "#FF4D6D" },
  { icon: <Package size={16} />, label: "Merch del evento", color: "#FFB300" },
  { icon: <Crown size={16} />, label: "Momentos épicos", color: "#A78BFA" },
  { icon: <Share2 size={16} />, label: "Compartir con 1 link", color: "#00E5A0" },
];

// Party planner subscription plans
const PRICING = [
  {
    id: "basico",
    genieName: "El Genio trabaja contigo",
    plan: "Básico",
    price: "29€",
    period: "/mes",
    tagline: "Perfecto para empezar a ofrecer eventos mágicos a tus clientes.",
    color: "#00C2D1",
    badge: null as string | null,
    cta: "Empezar con Básico",
    href: "/sign-up?plan=basico",
    highlighted: false,
    features: [
      "Hasta 10 eventos activos/mes",
      "Invitaciones digitales ilimitadas",
      "Gestor de deseos (lista regalos)",
      "RSVP automático sin límites",
      "Página del evento pública",
      "Analytics básicos",
      "Marca Cumplefy",
    ],
    locked: ["Videoinvitaciones IA", "Talking avatars", "White label"],
  },
  {
    id: "pro",
    genieName: "El Genio a pleno rendimiento",
    plan: "Pro",
    price: "69€",
    period: "/mes",
    tagline: "Todo el arsenal del Genio para diferenciarte de la competencia.",
    color: "#FFB300",
    badge: "Más popular" as string | null,
    cta: "14 días gratis",
    href: "/sign-up?plan=pro",
    highlighted: true,
    features: [
      "Eventos ilimitados",
      "Invitados ilimitados",
      "Videoinvitaciones cinematográficas IA ✨",
      "Talking avatars del protagonista ✨",
      "Lista de regalos con afiliados",
      "Tienda de merch del evento",
      "Analytics avanzados por cliente",
      "Sin marca de agua",
      "Soporte prioritario",
    ],
    locked: [],
  },
  {
    id: "premium",
    genieName: "El Genio Supremo",
    plan: "Premium",
    price: "149€",
    period: "/mes",
    tagline: "Para agencias y organizadores que gestionan los eventos más épicos del mundo.",
    color: "#A78BFA",
    badge: null as string | null,
    cta: "Hablar con el Genio",
    href: "/contact?plan=premium",
    highlighted: false,
    features: [
      "Todo lo de Pro, más:",
      "White label (tu marca, sin Cumplefy)",
      "Dominio personalizado",
      "API access completo",
      "Gestor de cartera de clientes",
      "Múltiples usuarios del equipo",
      "Soporte dedicado 24/7",
      "Onboarding y formación incluidos",
    ],
    locked: [],
  },
];

const TESTIMONIALS = [
  { name: "María García", role: "Mamá de Sofía, 8 años", avatar: "MG", color: "#FF4D6D", stars: 5, text: "La videoinvitación del cumpleaños de mi hija fue un WOW total. Los padres del colegio no paraban de preguntarme cómo lo había hecho. Y lo más increíble: tardé 10 minutos." },
  { name: "Carlos & Lucía", role: "Boda en Sevilla", avatar: "CL", color: "#FFB300", stars: 5, text: "Los invitados podían regalar directamente desde la invitación. Sin WhatsApp, sin repetidos, sin drama. Recibimos los fondos sin complicaciones. El Genio fue nuestro wedding planner." },
  { name: "Ana Martínez", role: "Organizadora de eventos", avatar: "AM", color: "#A78BFA", stars: 5, text: "Uso Cumplefy para todos mis clientes. La diferencia en el impacto de las videoinvitaciones es brutal. Y el módulo de regalos me ahorra horas cada semana." },
  { name: "Roberto Jiménez", role: "Fiesta de graduación", avatar: "RJ", color: "#00C2D1", stars: 5, text: "Mis amigos todavía hablan de la invitación que recibieron. Me vieron convertido en protagonista de una peli de acción. El Genio superó todas mis expectativas." },
];

// ─── HELPER COMPONENTS ─────────────────────────────────────────────────────────

function SectionTag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", background: `${color}15`, border: `1px solid ${color}30`, fontSize: "0.75rem", fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "20px" }}>
      <Sparkles size={11} />
      {children}
    </div>
  );
}

function ScrollReveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className={className} variants={fadeUp} initial="hidden" animate={inVw ? "show" : "hidden"} transition={{ delay }}>
      {children}
    </motion.div>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 32px",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(2,4,9,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.4s ease",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cumplefy-logo-white.svg"
          alt="Cumplefy"
          style={{ height: "36px", width: "auto", filter: "drop-shadow(0 1px 6px rgba(2,4,9,0.6))" }}
        />
      </Link>

      {/* Desktop links */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="nav-desktop">
        {[
          { label: "Características", href: "#features" },
          { label: "Tipos de evento", href: "#clusters" },
          { label: "Precios", href: "#pricing" },
        ].map((l) => (
          <a key={l.href} href={l.href} style={{ padding: "8px 14px", borderRadius: "8px", color: "var(--neutral-300)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--neutral-300)")}>
            {l.label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/sign-in" style={{ padding: "8px 16px", borderRadius: "8px", color: "var(--neutral-300)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
          Iniciar sesión
        </Link>
        <Link href="/sign-up" style={{ padding: "10px 20px", borderRadius: "10px", background: "var(--gradient-brand)", color: "white", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,194,209,0.3)" }}>
          Empezar gratis
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

function ServicesSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="servicios" ref={ref} style={{ padding: "100px 32px", background: "linear-gradient(180deg, rgba(2,4,9,0) 0%, rgba(255,107,53,0.04) 50%, rgba(2,4,9,0) 100%)", position: "relative", overflow: "hidden" }}>
      {/* Subtle grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "16px" }}>
          <motion.div variants={fadeUp}><SectionTag color="#00C2D1">Elige tu magia</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "16px" }}>
            Tres formas de crear{" "}
            <span style={{ background: "linear-gradient(135deg, #00C2D1, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>momentos épicos</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto 12px" }}>
            La invitación, el gestor de deseos y el RSVP son siempre gratis. Añade videoinvitación o talking avatar solo si los quieres — pago único, sin suscripción.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: "rgba(0,194,209,0.1)", border: "1px solid rgba(0,194,209,0.2)", fontSize: "0.8rem", color: "#00C2D1", fontWeight: 700 }}>
            <span>⏱</span> Precios de lanzamiento · Sin permanencia · Pago único
          </motion.div>
        </motion.div>

        {/* Social proof bar */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", marginBottom: "56px", marginTop: "28px", padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {[
              { value: "3.847", label: "eventos creados esta semana" },
              { value: "4.9/5", label: "valoración media de invitaciones" },
              { value: "94%", label: "de invitados abren la invitación" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Packs grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>
          {PAY_PER_EVENT_PACKS.map((pack, i) => (
            <ScrollReveal key={pack.id} delay={i * 0.1}>
              <div style={{
                padding: "32px 28px",
                borderRadius: "24px",
                background: pack.id === "invitacion"
                  ? "linear-gradient(145deg, rgba(0,229,160,0.1), rgba(0,194,209,0.05))"
                  : pack.id === "video"
                  ? "linear-gradient(145deg, rgba(0,194,209,0.12), rgba(0,102,255,0.06))"
                  : "var(--surface-card)",
                border: pack.id === "invitacion"
                  ? "2px solid rgba(0,229,160,0.35)"
                  : pack.id === "video"
                  ? "2px solid rgba(0,194,209,0.4)"
                  : "2px solid rgba(167,139,250,0.3)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease",
                boxShadow: pack.id === "video" ? "0 20px 60px rgba(0,194,209,0.1)" : "none",
              }}>
                {/* Badge */}
                {pack.badge && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: pack.id === "invitacion"
                      ? "linear-gradient(135deg, #00E5A0, #00C2D1)"
                      : pack.id === "video"
                      ? "linear-gradient(135deg, #00C2D1, #0066FF)"
                      : "linear-gradient(135deg, #A78BFA, #6D28D9)",
                    borderRadius: "999px", padding: "4px 12px",
                    fontSize: "0.7rem", fontWeight: 800, color: "white", letterSpacing: "0.04em",
                  }}>
                    {pack.badge}
                  </div>
                )}

                {/* Emoji + label */}
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{pack.emoji}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: pack.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  {pack.label}
                </div>

                {/* Price with anchor */}
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--neutral-600)", textDecoration: "line-through", marginRight: "8px" }}>{pack.priceOld}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{pack.price}</span>
                  <span style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginLeft: "4px" }}>{pack.unit}</span>
                </div>

                {/* Savings pill */}
                {pack.priceOld && (
                  <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", background: `${pack.color}20`, border: `1px solid ${pack.color}40`, fontSize: "0.72rem", fontWeight: 700, color: pack.color, marginBottom: "12px" }}>
                    Ahorras {Math.round((1 - parseFloat(pack.price) / parseFloat(pack.priceOld)) * 100)}%
                  </div>
                )}

                <p style={{ color: "var(--neutral-400)", fontSize: "0.84rem", lineHeight: 1.55, marginBottom: "20px", fontStyle: "italic" }}>
                  &ldquo;{pack.tagline}&rdquo;
                </p>

                {/* Urgency line */}
                {pack.urgency && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "20px" }}>
                    <span style={{ fontSize: "0.85rem" }}>⚡</span>
                    <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 700 }}>{pack.urgency}</span>
                  </div>
                )}

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pack.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.83rem", color: "var(--neutral-300)" }}>
                      <Check size={13} style={{ color: pack.color, flexShrink: 0, marginTop: "2px" }} />
                      {f}
                    </li>
                  ))}
                  {pack.upsells.length > 0 && (
                    <>
                      {pack.upsellLabel && (
                        <li style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "6px", listStyle: "none" }}>
                          {pack.upsellLabel}
                        </li>
                      )}
                      {pack.upsells.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.8rem", color: "var(--neutral-500)" }}>
                          <Zap size={11} style={{ color: pack.color, opacity: 0.6, flexShrink: 0, marginTop: "2px" }} />
                          {f}
                        </li>
                      ))}
                    </>
                  )}
                </ul>

                {/* CTA */}
                <Link
                  href={pack.href}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "15px", borderRadius: "14px",
                    background: pack.id === "invitacion"
                      ? "linear-gradient(135deg, #00E5A0, #00C2D1)"
                      : pack.id === "video"
                      ? "linear-gradient(135deg, #00C2D1, #0066FF)"
                      : "linear-gradient(135deg, #A78BFA, #6D28D9)",
                    border: "none",
                    color: "white", fontWeight: 800, fontSize: "0.9rem",
                    textDecoration: "none", marginTop: "20px",
                    letterSpacing: "-0.01em",
                    boxShadow: pack.id === "video" ? "0 6px 24px rgba(0,102,255,0.3)" : "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {pack.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom guarantee strip */}
        <ScrollReveal delay={0.3}>
          <div style={{ marginTop: "48px", padding: "24px 32px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
            {[
              { emoji: "🔒", text: "Pago 100% seguro con Stripe" },
              { emoji: "↩️", text: "Reembolso si no quedas satisfecho" },
              { emoji: "⚡", text: "Tu evento listo en menos de 5 minutos" },
              { emoji: "🎁", text: "Los regalos van directamente a ti" },
            ].map((g) => (
              <div key={g.emoji} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--neutral-400)" }}>
                <span>{g.emoji}</span> {g.text}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Party planner hook */}
        <ScrollReveal delay={0.4}>
          <p style={{ textAlign: "center", color: "var(--neutral-600)", fontSize: "0.82rem", marginTop: "24px" }}>
            ¿Eres Party Planner y organizas eventos para clientes?{" "}
            <a href="#pricing-pro" style={{ color: "var(--neutral-400)", textDecoration: "underline", cursor: "pointer" }}>
              Mira los planes de suscripción profesional →
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── PAIN POINTS ───────────────────────────────────────────────────────────────

function PainPointsSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ padding: "100px 32px", background: "var(--surface-bg)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "64px" }}>
          <motion.div variants={fadeUp}>
            <SectionTag color="#FF4D6D">Los problemas de siempre</SectionTag>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            Organizar una celebración no debería ser{" "}
            <span style={{ color: "#FF4D6D" }}>un trabajo a tiempo completo</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto" }}>
            El Genio lo entiende. Por eso lo resuelve todo.
          </motion.p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {PAIN_POINTS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.1}>
              <div style={{ padding: "32px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 900, color: p.color }}>{p.stat}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--neutral-500)", maxWidth: "140px", lineHeight: 1.3 }}>{p.statLabel}</span>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px", color: "var(--neutral-100)" }}>{p.emoji} {p.title}</h3>
                <p style={{ fontSize: "0.88rem", color: "var(--neutral-400)", lineHeight: 1.65, marginBottom: "16px" }}>{p.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: `${p.color}12`, border: `1px solid ${p.color}25` }}>
                  <Zap size={13} style={{ color: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: p.color, fontWeight: 600 }}>El Genio lo resuelve al instante</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── VIDEO INVITATIONS (STAR FEATURE) ─────────────────────────────────────────

function VideoInvitationsSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });


  return (
    <section id="video-feature" ref={ref} style={{ padding: "120px 32px", background: "var(--surface-deep)", position: "relative", overflow: "hidden" }}>
      {/* Background glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "600px", background: "radial-gradient(ellipse, rgba(0,194,209,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }} className="feature-block">
          {/* Text */}
          <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"}>
            <motion.div variants={fadeUp}>
              <SectionTag color="#00C2D1">El servicio estrella ✨</SectionTag>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px" }}>
              Tu protagonista,{" "}
              <span style={{ background: "linear-gradient(135deg, #00C2D1, #0066FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>estrella de Hollywood</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "28px" }}>
              No son plantillas. Son producciones cinematográficas personalizadas donde el protagonista — con su propia cara — es la estrella de la película. IA generativa que convierte una foto en una obra maestra audiovisual.
            </motion.p>
            <motion.ul variants={stagger} style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {[
                "El protagonista transformado en el personaje de sus sueños",
                "Escenas cinematográficas generadas al 100% por IA",
                "Listo en minutos — no días, no semanas",
                "Calidad 720p · Compartible por WhatsApp, email y redes",
                "Talking avatars: el protagonista invita en persona",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--neutral-300)" }}>
                  <CheckCircle size={16} style={{ color: "#00C2D1", flexShrink: 0, marginTop: "2px" }} />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <motion.div variants={fadeUp}>
              <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 26px", borderRadius: "12px", background: "linear-gradient(135deg, #00C2D1, #0066FF)", color: "white", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>
                Crear mi videoinvitación <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Cinematic video invitation mockup */}
          <ScrollReveal delay={0.2}>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              {/* Outer glow */}
              <div style={{ position: "absolute", inset: "-40px", background: "radial-gradient(ellipse, rgba(0,102,255,0.2) 0%, rgba(0,194,209,0.1) 40%, transparent 70%)", pointerEvents: "none" }} />

              {/* Phone frame */}
              <div style={{
                width: "260px",
                aspectRatio: "9/16",
                borderRadius: "36px",
                border: "2px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(160deg, #050a1a 0%, #0a0520 40%, #080214 100%)",
                overflow: "hidden",
                boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,194,209,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Notch */}
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "80px", height: "20px", background: "#000", borderRadius: "0 0 14px 14px", zIndex: 10 }} />

                {/* Ambient light top */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "180px", background: "radial-gradient(ellipse at 50% 0%, rgba(0,194,209,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

                {/* Stars/particles */}
                {[
                  { left: "15%", top: "12%", size: 2 }, { left: "82%", top: "8%", size: 1.5 },
                  { left: "65%", top: "18%", size: 2 }, { left: "30%", top: "22%", size: 1.5 },
                  { left: "90%", top: "30%", size: 2 }, { left: "10%", top: "35%", size: 1.5 },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, borderRadius: "50%", background: "white", opacity: 0.6, animation: `particle-float ${5 + i}s ease-in-out infinite`, animationDelay: `${i * 0.7}s` }} />
                ))}

                {/* Content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "36px 20px 24px", position: "relative", zIndex: 2 }}>

                  {/* Top label */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(0,194,209,0.12)", border: "1px solid rgba(0,194,209,0.25)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: "#00C2D1", textTransform: "uppercase" }}>
                    <Sparkles size={9} />
                    Una producción Cumplefy
                  </div>

                  {/* Avatar with cinematic glow */}
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    {/* Rim light halo */}
                    <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", width: "100px", height: "100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.4) 0%, transparent 70%)", filter: "blur(16px)", animation: "smoke-pulse 3s ease-in-out infinite" }} />
                    {/* Avatar circle */}
                    <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg, #1a0a3a, #0d1f4a)", border: "2px solid rgba(0,194,209,0.5)", boxShadow: "0 0 0 4px rgba(0,102,255,0.15), 0 8px 30px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", position: "relative" }}>
                      🦸‍♀️
                      {/* Shine */}
                      <div style={{ position: "absolute", top: "6px", left: "10px", width: "20px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.25)", transform: "rotate(-20deg)" }} />
                    </div>
                    {/* Film strip accent */}
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[...Array(5)].map((_, i) => <div key={i} style={{ width: "12px", height: "8px", borderRadius: "2px", background: i === 2 ? "rgba(0,194,209,0.6)" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }} />)}
                    </div>
                  </div>

                  {/* Title block */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "6px" }}>protagonista</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, background: "linear-gradient(135deg, #fff 0%, #00C2D1 60%, #0066FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "6px" }}>
                      SOFÍA
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--neutral-400)", fontWeight: 500, letterSpacing: "0.05em" }}>
                      cumple <span style={{ color: "white", fontWeight: 800 }}>8 años</span>
                    </div>
                  </div>

                  {/* Event details pill */}
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", color: "var(--neutral-300)" }}>
                      <span style={{ fontSize: "0.85rem" }}>📅</span>
                      <span>Sábado 15 de Marzo · 17:00h</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", color: "var(--neutral-300)" }}>
                      <span style={{ fontSize: "0.85rem" }}>📍</span>
                      <span>Salón Mágico, Madrid</span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button style={{ width: "100%", padding: "11px", borderRadius: "12px", background: "linear-gradient(135deg, #00C2D1, #0066FF)", border: "none", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", boxShadow: "0 4px 20px rgba(0,102,255,0.4)" }}>
                    <Play size={13} style={{ marginLeft: "2px" }} />
                    Ver videoinvitación
                  </button>

                  {/* RSVP row */}
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <button style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.25)", color: "#00E5A0", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}>✓ Asistiré</button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--neutral-400)", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>No puedo ir</button>
                  </div>
                </div>

                {/* Bottom cinematic bar */}
                <div style={{ height: "18px", background: "linear-gradient(to right, #000, #0a0520, #000)", borderTop: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }} />
              </div>

              {/* Floating badge: IA */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} style={{ position: "absolute", top: "28px", right: "-4px", background: "var(--surface-card)", border: "1px solid rgba(0,194,209,0.3)", borderRadius: "12px", padding: "10px 14px", backdropFilter: "blur(12px)", boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "float 6s ease-in-out infinite" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--neutral-500)", marginBottom: "2px" }}>Generado con IA</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00C2D1" }}>⚡ 8 minutos</div>
              </motion.div>

              {/* Floating badge: views */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 }} style={{ position: "absolute", bottom: "50px", left: "-8px", background: "var(--surface-card)", border: "1px solid rgba(255,179,0,0.3)", borderRadius: "12px", padding: "10px 14px", backdropFilter: "blur(12px)", boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "float 8s ease-in-out infinite 2s" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--neutral-500)", marginBottom: "2px" }}>Ya la vieron</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFB300" }}>1.247 veces 🔥</div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── TALKING AVATARS ───────────────────────────────────────────────────────────

function TalkingAvatarsSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ padding: "100px 32px", background: "var(--surface-bg)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }} className="feature-block">
          {/* Visual first (reverse order) */}
          <ScrollReveal>
            <div style={{ position: "relative" }}>
              <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(99,102,241,0.08))", border: "1px solid rgba(167,139,250,0.2)", padding: "32px", minHeight: "320px", display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
                {/* Avatar talking UI mock */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>👶</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>Avatar de Sofía</div>
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ width: "3px", height: `${6 + Math.random() * 10}px`, background: "#A78BFA", borderRadius: "2px", animation: `sound-wave 0.8s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />)}
                      <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginLeft: "8px" }}>Hablando...</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "14px 16px", background: "rgba(167,139,250,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--neutral-300)", lineHeight: 1.6, fontStyle: "italic" }}>
                    &ldquo;¡Hola! Soy Sofía y el sábado cumplo 8 años. ¡Te invito a mi fiesta! Va a ser la más épica del mundo…&rdquo;
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[{ label: "🇪🇸 Español", active: true }, { label: "🇬🇧 English", active: false }, { label: "🇫🇷 Français", active: false }].map(lang => (
                    <div key={lang.label} style={{ padding: "6px 12px", borderRadius: "999px", background: lang.active ? "rgba(167,139,250,0.2)" : "var(--surface-card)", border: `1px solid ${lang.active ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`, fontSize: "0.72rem", color: lang.active ? "#A78BFA" : "var(--neutral-500)", fontWeight: lang.active ? 700 : 400 }}>
                      {lang.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Text */}
          <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"}>
            <motion.div variants={fadeUp}>
              <SectionTag color="#A78BFA">Talking Avatars</SectionTag>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px" }}>
              El protagonista invita{" "}
              <span style={{ background: "linear-gradient(135deg, #A78BFA, #6D28D9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>en persona</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "28px" }}>
              Imagina que es el propio cumpleañero, la novia o el graduado quien te invita — con su voz, su cara, su personalidad. En cualquier idioma. A cualquier hora. Sin estar presente. Esto es un talking avatar.
            </motion.p>
            <motion.ul variants={stagger} style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {[
                "Avatar ultra-realista generado a partir de una foto",
                "Voz clonada o generada según el perfil",
                "Disponible en +20 idiomas",
                "Integrado en la videoinvitación final",
                "Los invitados sienten que les habla directamente",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--neutral-300)" }}>
                  <CheckCircle size={16} style={{ color: "#A78BFA", flexShrink: 0, marginTop: "2px" }} />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", fontSize: "0.82rem", color: "#A78BFA", fontWeight: 600 }}>
              <Crown size={14} /> Incluido en el plan Pro
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── GIFT REGISTRY (MOST IMPORTANT FEATURE) ───────────────────────────────────

function GiftRegistrySection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ padding: "120px 32px", background: "var(--surface-deep)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", right: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,179,0,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ maxWidth: "700px", marginBottom: "64px" }}>
          <motion.div variants={fadeUp}>
            <SectionTag color="#FFB300">El mayor diferenciador</SectionTag>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
            Adiós al{" "}
            <span style={{ background: "linear-gradient(135deg, #FFB300, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>niño hiperregalado</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.1rem", lineHeight: 1.75 }}>
            El Genio entiende que hoy lo más valioso no son los regalos — es el tiempo. Por eso ha creado el sistema de deseos más inteligente del mundo: cada regalo tiene un propósito, nadie se repite, y el dinero llega directamente al organizador con un solo clic.
          </motion.p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }} className="feature-block">
          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { icon: <Gift size={18} />, color: "#FFB300", title: "Lista de deseos inteligente", desc: "Crea la lista perfecta desde Amazon, El Corte Inglés, Smartbox, Civitatis, o cualquier tienda online. El Genio sugiere basándose en la edad, tipo de evento y presupuesto." },
              { icon: <Users size={18} />, color: "#00C2D1", title: "Regalos colectivos sin WhatsApp", desc: "Varios invitados contribuyen a un mismo regalo caro sin coordinación. El organizador ve en tiempo real quién aporta y cuánto. Sin grupos. Sin vergüenzas." },
              { icon: <Zap size={18} />, color: "#00E5A0", title: "1 clic para reservar", desc: "El invitado entra al enlace de la invitación, ve la lista de deseos, reserva en 1 clic y el regalo queda marcado para todos. Sin registro. Sin fricción." },
              { icon: <Clock size={18} />, color: "#FF4D6D", title: "El Genio te regala tiempo", desc: "Menos tiempo coordinando regalos. Más tiempo disfrutando. Esta es la filosofía del Genio: la tecnología al servicio de los momentos que importan." },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div style={{ display: "flex", gap: "16px", padding: "24px", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "6px", color: "white" }}>{item.title}</div>
                    <div style={{ fontSize: "0.84rem", color: "var(--neutral-400)", lineHeight: 1.65 }}>{item.desc}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Gift list UI mock */}
          <ScrollReveal delay={0.3}>
            <div style={{ borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid rgba(255,179,0,0.15)", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "white" }}>Lista de regalos de Sofía 🎁</div>
                <div style={{ fontSize: "0.72rem", background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", padding: "3px 10px", borderRadius: "999px", color: "#00E5A0" }}>8 disponibles</div>
              </div>
              {[
                { emoji: "🎮", name: "Nintendo Switch OLED", price: "349€", reserved: false, tag: "Amazon", progress: 0 },
                { emoji: "📚", name: "Pack Harry Potter completo", price: "89€", reserved: false, tag: "El Corte Inglés", progress: 55 },
                { emoji: "🎨", name: "Taller de pintura creativa", price: "45€", reserved: true, tag: "Smartbox", progress: 100 },
                { emoji: "🎡", name: "Entradas Port Aventura", price: "120€", reserved: false, tag: "Civitatis", progress: 30 },
              ].map((item) => (
                <div key={item.name} style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: item.reserved ? 0.55 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "1.5rem", width: "40px", textAlign: "center" }}>{item.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: item.reserved ? "var(--neutral-500)" : "white" }}>{item.name}</div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: item.reserved ? "var(--neutral-500)" : "#FFB300" }}>{item.price}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--neutral-600)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "999px" }}>{item.tag}</span>
                        {item.progress > 0 && item.progress < 100 && (
                          <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${item.progress}%`, height: "100%", background: "var(--gradient-brand)", borderRadius: "2px" }} />
                          </div>
                        )}
                        {item.reserved && <span style={{ fontSize: "0.7rem", color: "#00E5A0", fontWeight: 700 }}>✓ Reservado</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "16px 24px" }}>
                <button style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "var(--gradient-brand)", border: "none", color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                  🎁 Regalar algo especial
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── ALL MODULES ───────────────────────────────────────────────────────────────

function AllModulesSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ padding: "100px 32px", background: "var(--surface-bg)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"}>
          <motion.div variants={fadeUp}>
            <SectionTag color="#00E5A0">Todo en un enlace</SectionTag>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            Una página de evento que{" "}
            <span style={{ color: "#00E5A0" }}>lo tiene todo</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto 60px" }}>
            Comparte un único enlace. Tus invitados encuentran todo: la videoinvitación, dónde confirmarse, cómo regalar, dónde aparcar y mucho más.
          </motion.p>
        </motion.div>

        {/* Modules grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", maxWidth: "900px", margin: "0 auto" }}>
          {MODULES.map((mod, i) => (
            <ScrollReveal key={mod.label} delay={i * 0.04}>
              <div style={{ padding: "20px 16px", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center", transition: "all 0.25s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${mod.color}40`; (e.currentTarget as HTMLDivElement).style.background = `${mod.color}08`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.background = "var(--surface-card)"; }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${mod.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: mod.color }}>
                  {mod.icon}
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--neutral-300)", lineHeight: 1.3 }}>{mod.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div style={{ marginTop: "48px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)", fontSize: "0.85rem", color: "#00E5A0", fontWeight: 600 }}>
              <ShoppingBag size={14} /> Merch POD 2D y 3D personalizado del evento
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: "0.85rem", color: "#A78BFA", fontWeight: 600 }}>
              <Star size={14} /> Guías de regalos con puntuación de expertos
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ──────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });
  const steps = [
    { n: "01", icon: <Mic size={22} />, color: "#00C2D1", title: "Cuéntaselo al Genio", desc: "Escribe los detalles del evento — protagonista, fecha, lugar, estilo. El Genio lo entiende en segundos.", genieImg: "/genio/genio.png" },
    { n: "02", icon: <Film size={22} />, color: "#FFB300", title: "El Genio crea la magia", desc: "Videoinvitación cinematográfica, página del evento épica, lista de regalos y RSVP. Todo generado al instante.", genieImg: "/genio/genio_dj.png" },
    { n: "03", icon: <Heart size={22} />, color: "#FF4D6D", title: "Comparte y disfruta", desc: "Un enlace lo tiene todo. Tú solo tienes que celebrar mientras el Genio gestiona el resto.", genieImg: "/genio/genio_bodas.png" },
  ];

  return (
    <section ref={ref} style={{ padding: "120px 32px", background: "var(--surface-deep)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,194,209,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "72px" }}>
          <motion.div variants={fadeUp}><SectionTag color="#00C2D1">Así de simple</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            3 pasos hacia{" "}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>la fiesta perfecta</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
            Del primer pensamiento a la primera confirmación: menos de 10 minutos.
          </motion.p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", position: "relative" }}>
          {/* Connector line */}
          <div style={{ position: "absolute", top: "80px", left: "20%", right: "20%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,194,209,0.3), rgba(255,179,0,0.3), transparent)", pointerEvents: "none" }} className="hide-mobile" />

          {steps.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.15}>
              <div style={{ padding: "32px 28px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "1px", background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
                {/* Genio image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.genieImg} alt="El Genio" style={{ width: "80px", height: "80px", objectFit: "contain", margin: "0 auto 16px", display: "block", animation: "float 5s ease-in-out infinite", animationDelay: `${i * 1.5}s` }} />
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 900, color: `${s.color}20`, lineHeight: 1, marginBottom: "12px", letterSpacing: "-0.04em" }}>{s.n}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", color: "white" }}>{s.title}</h3>
                <p style={{ fontSize: "0.87rem", color: "var(--neutral-400)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CLUSTERS ─────────────────────────────────────────────────────────────────

function ClustersSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="clusters" ref={ref} style={{ padding: "100px 32px", background: "var(--surface-bg)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "56px" }}>
          <motion.div variants={fadeUp}><SectionTag color="#FF4D6D">Para cada celebración</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            Cumplefy es para{" "}
            <span style={{ color: "#FF4D6D" }}>todos los momentos épicos</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            No solo cumpleaños. El Genio domina cada tipo de celebración con la misma maestría.
          </motion.p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {CLUSTERS.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 0.06}>
              <Link href={c.href} style={{ textDecoration: "none" }}>
                <div style={{ padding: "28px 24px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", transition: "all 0.3s var(--ease-spring)", cursor: "pointer", minHeight: "220px", display: "flex", flexDirection: "column", gap: "12px" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-6px)"; el.style.borderColor = `${c.color}40`; el.style.boxShadow = `0 20px 50px ${c.color}15`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(${c.gradient})` }} />
                  {c.popular && <div style={{ position: "absolute", top: "12px", right: "12px", fontSize: "0.6rem", fontWeight: 800, background: `linear-gradient(${c.gradient})`, color: "white", padding: "2px 8px", borderRadius: "999px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Popular</div>}
                  <div style={{ fontSize: "2.2rem", lineHeight: 1 }}>{c.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "white", marginBottom: "3px" }}>{c.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)" }}>{c.sub}</div>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--neutral-500)", lineHeight: 1.6, flexGrow: 1 }}>{c.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", fontWeight: 700, color: c.color }}>
                    Empezar <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PARTY PLANNER PRICING ────────────────────────────────────────────────────

function PricingSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="pricing-pro" ref={ref} style={{ padding: "120px 32px", background: "var(--surface-deep)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: "700px", height: "500px", background: "radial-gradient(ellipse, rgba(167,139,250,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "72px" }}>
          <motion.div variants={fadeUp}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/genio/genio.png" alt="El Genio" style={{ width: "80px", height: "80px", objectFit: "contain", margin: "0 auto 16px", display: "block", animation: "float 4s ease-in-out infinite" }} />
          </motion.div>
          <motion.div variants={fadeUp}><SectionTag color="#A78BFA">Para Party Planners</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            El Genio trabaja{" "}
            <span style={{ background: "linear-gradient(135deg, #A78BFA, #6D28D9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>para tu negocio</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "540px", margin: "0 auto" }}>
            ¿Organizas eventos para tus clientes? Nuestra suscripción te da acceso ilimitado a todas las herramientas del Genio para ofrecer experiencias que nadie más puede dar.
          </motion.p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "20px", alignItems: "start" }}>
          {PRICING.map((plan, i) => (
            <ScrollReveal key={plan.id} delay={i * 0.1}>
              <div style={{
                padding: "36px 28px",
                borderRadius: "var(--radius-xl)",
                background: plan.highlighted
                  ? "linear-gradient(145deg, rgba(255,179,0,0.12), rgba(255,107,53,0.06))"
                  : "var(--surface-card)",
                border: plan.highlighted
                  ? "2px solid rgba(255,179,0,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden",
                boxShadow: plan.highlighted ? "0 20px 60px rgba(255,179,0,0.1)" : "none",
              }}>
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />

                {plan.badge && (
                  <div style={{ position: "absolute", top: "16px", right: "16px", background: "var(--gradient-brand)", borderRadius: "999px", padding: "3px 12px", fontSize: "0.68rem", fontWeight: 800, color: "white", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{plan.plan}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--neutral-500)", marginBottom: "16px", fontStyle: "italic" }}>"{plan.genieName}"</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 900, color: "white" }}>{plan.price}</span>
                    <span style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>{plan.period}</span>
                  </div>
                  <p style={{ color: "var(--neutral-400)", fontSize: "0.84rem", marginTop: "8px", lineHeight: 1.5 }}>{plan.tagline}</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "9px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", color: "var(--neutral-300)" }}>
                      <Check size={14} style={{ color: plan.color, flexShrink: 0, marginTop: "2px" }} />
                      {f}
                    </li>
                  ))}
                  {plan.locked?.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.83rem", color: "var(--neutral-700)" }}>
                      <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1px solid var(--neutral-800)", flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ textDecoration: "line-through" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "14px", borderRadius: "12px",
                    background: plan.highlighted
                      ? "linear-gradient(135deg, #FFB300, #FF6B35)"
                      : plan.id === "premium"
                      ? "linear-gradient(135deg, #A78BFA, #6D28D9)"
                      : "rgba(255,255,255,0.07)",
                    border: plan.highlighted || plan.id === "premium" ? "none" : "1px solid rgba(255,255,255,0.12)",
                    color: "white", fontWeight: 700, fontSize: "0.9rem",
                    textDecoration: "none", transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {plan.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <p style={{ color: "var(--neutral-600)", fontSize: "0.82rem", marginBottom: "8px" }}>
              Sin permanencias · Cancela cuando quieras · Soporte incluido
            </p>
            <p style={{ color: "var(--neutral-600)", fontSize: "0.82rem" }}>
              ¿Solo organizas un evento al año?{" "}
              <a href="#pago-evento" style={{ color: "var(--neutral-400)", textDecoration: "underline", cursor: "pointer" }}>
                Paga solo por ese evento →
              </a>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── PAY PER EVENT ────────────────────────────────────────────────────────────

const PAY_PER_EVENT_PACKS = [
  {
    id: "invitacion",
    emoji: "🎉",
    label: "Invitación + Gestión",
    badge: "GRATIS",
    priceOld: null as string | null,
    price: "0€",
    unit: "por evento",
    tagline: "Crea tu evento, gestiona deseos y recoge RSVPs. Sin pagar nada.",
    color: "#00E5A0",
    urgency: null as string | null,
    features: [
      "Invitación digital personalizada con IA",
      "Gestor de deseos (lista de regalos sin duplicados)",
      "RSVP automático — invitados ilimitados",
      "Página del evento pública",
      "Programa del evento con horarios",
      "Ubicación interactiva en el mapa",
      "Notificaciones automáticas a invitados",
    ],
    upsells: [
      "Videoinvitación cinematográfica (+19.99€)",
      "Talking avatar del protagonista (+14.99€)",
      "Tienda de merch del evento (+9.99€)",
      "Analytics avanzados (+4.99€)",
    ],
    upsellLabel: "Añadir extras opcionales:",
    cta: "Crear mi evento gratis",
    href: "/sign-up?pack=gratis",
  },
  {
    id: "video",
    emoji: "🎬",
    label: "Videoinvitación",
    badge: "🔥 Más elegido",
    priceOld: "34.99€",
    price: "19.99€",
    unit: "por evento",
    tagline: "El protagonista convertido en estrella de cine. Una producción cinematográfica con IA en minutos.",
    color: "#00C2D1",
    urgency: "Precio de lanzamiento · Sube a 34.99€ pronto",
    features: [
      "Todo del plan Invitación Gratis, más:",
      "Videoinvitación cinematográfica con IA ✨",
      "El protagonista como personaje de película",
      "Calidad 720p — compartible por WhatsApp",
      "6 estilos cinematográficos a elegir",
      "Sin marca de agua",
    ],
    upsells: [
      "Talking avatar del protagonista (+14.99€)",
      "Tienda de merch del evento (+9.99€)",
    ],
    upsellLabel: "Completa tu experiencia:",
    cta: "Crear mi videoinvitación",
    href: "/sign-up?pack=video",
  },
  {
    id: "estrella",
    emoji: "⭐",
    label: "Pack Estrella",
    badge: "✨ Todo incluido",
    priceOld: "79.99€",
    price: "39.99€",
    unit: "por evento",
    tagline: "La experiencia definitiva. Videoinvitación + Talking Avatar + Tienda. Un evento que nadie olvidará.",
    color: "#A78BFA",
    urgency: "Precio de lanzamiento — sube a 79.99€ en 48h",
    features: [
      "Todo del pack Videoinvitación, más:",
      "Talking avatar del protagonista ✨",
      "Tienda del evento (merchandising POD)",
      "Check-in con QR el día del evento",
      "Álbum de momentos colaborativo",
      "Comunicaciones masivas a invitados",
      "Exportar lista de asistentes",
      "Soporte prioritario por WhatsApp",
    ],
    upsells: [],
    upsellLabel: null as string | null,
    cta: "Conseguir el Pack Estrella",
    href: "/sign-up?pack=estrella",
  },
];

function PayPerEventSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="pago-evento" ref={ref} style={{ padding: "100px 32px", background: "linear-gradient(180deg, rgba(2,4,9,0) 0%, rgba(255,107,53,0.04) 50%, rgba(2,4,9,0) 100%)", position: "relative", overflow: "hidden" }}>
      {/* Subtle grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "16px" }}>
          <motion.div variants={fadeUp}><SectionTag color="#FF6B35">Pago por evento</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "16px", lineHeight: 1.1 }}>
            Empieza gratis.{" "}
            <span style={{ background: "linear-gradient(135deg, #FF6B35, #FFB300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Desbloquea cuando quieras.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "var(--neutral-400)", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto 12px" }}>
            La invitación, el gestor de deseos y el RSVP son siempre gratis. Añade videoinvitación o talking avatar solo si los quieres — pago único, sin suscripción.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)", fontSize: "0.8rem", color: "#FF6B35", fontWeight: 700 }}>
            <span>⏱</span> Precios de lanzamiento · Sin permanencia · Pago único
          </motion.div>
        </motion.div>

        {/* Social proof bar */}
        <ScrollReveal delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", marginBottom: "56px", marginTop: "28px", padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {[
              { value: "3.847", label: "eventos creados esta semana" },
              { value: "4.9/5", label: "valoración media de invitaciones" },
              { value: "94%", label: "de invitados abren la invitación" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Packs grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>
          {PAY_PER_EVENT_PACKS.map((pack, i) => (
            <ScrollReveal key={pack.id} delay={i * 0.1}>
              <div style={{
                padding: "32px 28px",
                borderRadius: "24px",
                background: pack.id === "invitacion"
                  ? "linear-gradient(145deg, rgba(0,229,160,0.1), rgba(0,194,209,0.05))"
                  : pack.id === "video"
                  ? "linear-gradient(145deg, rgba(0,194,209,0.12), rgba(0,102,255,0.06))"
                  : "var(--surface-card)",
                border: pack.id === "invitacion"
                  ? "2px solid rgba(0,229,160,0.35)"
                  : pack.id === "video"
                  ? "2px solid rgba(0,194,209,0.4)"
                  : "2px solid rgba(167,139,250,0.3)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease",
                boxShadow: pack.id === "video" ? "0 20px 60px rgba(0,194,209,0.1)" : "none",
              }}>
                {/* Badge */}
                {pack.badge && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: pack.id === "invitacion"
                      ? "linear-gradient(135deg, #00E5A0, #00C2D1)"
                      : pack.id === "video"
                      ? "linear-gradient(135deg, #00C2D1, #0066FF)"
                      : "linear-gradient(135deg, #A78BFA, #6D28D9)",
                    borderRadius: "999px", padding: "4px 12px",
                    fontSize: "0.7rem", fontWeight: 800, color: "white", letterSpacing: "0.04em",
                  }}>
                    {pack.badge}
                  </div>
                )}

                {/* Emoji + label */}
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{pack.emoji}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: pack.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  {pack.label}
                </div>

                {/* Price with anchor */}
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--neutral-600)", textDecoration: "line-through", marginRight: "8px" }}>{pack.priceOld}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{pack.price}</span>
                  <span style={{ color: "var(--neutral-500)", fontSize: "0.85rem", marginLeft: "4px" }}>{pack.unit}</span>
                </div>

                {/* Savings pill */}
                {pack.priceOld && (
                  <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", background: `${pack.color}20`, border: `1px solid ${pack.color}40`, fontSize: "0.72rem", fontWeight: 700, color: pack.color, marginBottom: "12px" }}>
                    Ahorras {Math.round((1 - parseFloat(pack.price) / parseFloat(pack.priceOld)) * 100)}%
                  </div>
                )}

                <p style={{ color: "var(--neutral-400)", fontSize: "0.84rem", lineHeight: 1.55, marginBottom: "20px", fontStyle: "italic" }}>
                  &ldquo;{pack.tagline}&rdquo;
                </p>

                {/* Urgency line */}
                {pack.urgency && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "20px" }}>
                    <span style={{ fontSize: "0.85rem" }}>⚡</span>
                    <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 700 }}>{pack.urgency}</span>
                  </div>
                )}

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pack.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.83rem", color: "var(--neutral-300)" }}>
                      <Check size={13} style={{ color: pack.color, flexShrink: 0, marginTop: "2px" }} />
                      {f}
                    </li>
                  ))}
                  {pack.upsells.length > 0 && (
                    <>
                      {pack.upsellLabel && (
                        <li style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "6px", listStyle: "none" }}>
                          {pack.upsellLabel}
                        </li>
                      )}
                      {pack.upsells.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.8rem", color: "var(--neutral-500)" }}>
                          <Zap size={11} style={{ color: pack.color, opacity: 0.6, flexShrink: 0, marginTop: "2px" }} />
                          {f}
                        </li>
                      ))}
                    </>
                  )}
                </ul>

                {/* CTA */}
                <Link
                  href={pack.href}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "15px", borderRadius: "14px",
                    background: pack.id === "invitacion"
                      ? "linear-gradient(135deg, #00E5A0, #00C2D1)"
                      : pack.id === "video"
                      ? "linear-gradient(135deg, #00C2D1, #0066FF)"
                      : "linear-gradient(135deg, #A78BFA, #6D28D9)",
                    border: "none",
                    color: "white", fontWeight: 800, fontSize: "0.9rem",
                    textDecoration: "none", marginTop: "20px",
                    letterSpacing: "-0.01em",
                    boxShadow: pack.id === "video" ? "0 6px 24px rgba(0,102,255,0.3)" : "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {pack.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom guarantee strip */}
        <ScrollReveal delay={0.3}>
          <div style={{ marginTop: "48px", padding: "24px 32px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
            {[
              { emoji: "🔒", text: "Pago 100% seguro con Stripe" },
              { emoji: "↩️", text: "Reembolso si no quedas satisfecho" },
              { emoji: "⚡", text: "Tu evento listo en menos de 5 minutos" },
              { emoji: "🎁", text: "Los regalos van directamente a ti" },
            ].map((g) => (
              <div key={g.emoji} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--neutral-400)" }}>
                <span>{g.emoji}</span> {g.text}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Comparison hook */}
        <ScrollReveal delay={0.4}>
          <p style={{ textAlign: "center", color: "var(--neutral-600)", fontSize: "0.82rem", marginTop: "24px" }}>
            ¿Eres Party Planner y organizas eventos para clientes?{" "}
            <a href="#pricing-pro" style={{ color: "var(--neutral-400)", textDecoration: "underline", cursor: "pointer" }}>
              Mira los planes de suscripción profesional →
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ padding: "100px 32px", background: "var(--surface-bg)", overflow: "hidden" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate={inVw ? "show" : "hidden"} style={{ textAlign: "center", marginBottom: "56px" }}>
          <motion.div variants={fadeUp}><SectionTag color="#00E5A0">Historias reales</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            El Genio ya ha{" "}
            <span style={{ color: "#00E5A0" }}>cambiado muchas fiestas</span>
          </motion.h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.1}>
              <div style={{ padding: "28px 24px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={13} style={{ color: "#FFB300", fill: "#FFB300" }} />)}
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--neutral-300)", lineHeight: 1.7, fontStyle: "italic", flexGrow: 1 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: `${t.color}30`, border: `1px solid ${t.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "white" }}>{t.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ─────────────────────────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section style={{ padding: "120px 32px", background: "var(--surface-deep)", position: "relative", overflow: "hidden" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,194,209,0.1) 0%, rgba(255,179,0,0.06) 40%, transparent 70%)", pointerEvents: "none" }} />
      {/* Particles */}
      {[
        { left: "10%", top: "20%", color: "#00C2D1", size: 3, delay: "0s" },
        { left: "90%", top: "30%", color: "#FFB300", size: 2, delay: "1s" },
        { left: "20%", top: "80%", color: "#FF4D6D", size: 4, delay: "2s" },
        { left: "80%", top: "70%", color: "#A78BFA", size: 2, delay: "0.5s" },
        { left: "50%", top: "10%", color: "#00E5A0", size: 3, delay: "1.5s" },
      ].map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: p.color, boxShadow: `0 0 ${p.size * 5}px ${p.color}`, animation: `particle-float 6s ease-in-out infinite`, animationDelay: p.delay, pointerEvents: "none" }} />
      ))}

      <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <ScrollReveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/genio/genio.png" alt="El Genio" style={{ width: "100px", height: "100px", objectFit: "contain", margin: "0 auto 24px", display: "block", filter: "drop-shadow(0 0 30px rgba(0,194,209,0.5))", animation: "float 4s ease-in-out infinite" }} />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "20px", color: "white" }}>
            El Genio está listo.{" "}
            <span style={{ display: "block", background: "linear-gradient(135deg, #00C2D1 0%, #FFB300 50%, #FF4D6D 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              ¿Y tú?
            </span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p style={{ color: "var(--neutral-400)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "40px", maxWidth: "520px", margin: "0 auto 40px" }}>
            Crea tu primer evento gratis en menos de 5 minutos. Sin tarjeta de crédito. Sin compromisos. Solo magia.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "18px 36px", borderRadius: "16px", background: "var(--gradient-brand)", color: "white", fontSize: "1.05rem", fontWeight: 800, textDecoration: "none", boxShadow: "0 12px 50px rgba(0,194,209,0.4)", letterSpacing: "-0.01em" }}>
              Empezar gratis — es magia <Sparkles size={18} />
            </Link>
          </div>
          <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem", marginTop: "16px" }}>
            Más de 12.000 eventos creados · Sin tarjeta de crédito
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: "#020409", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "64px 32px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }} className="footer-grid">
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-flex", textDecoration: "none", marginBottom: "16px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cumplefy-logo-white.svg" alt="Cumplefy" style={{ height: "30px", width: "auto", opacity: 0.9 }} />
            </Link>
            <p style={{ fontSize: "0.85rem", color: "var(--neutral-500)", lineHeight: 1.65, maxWidth: "260px" }}>
              La primera plataforma todo-en-uno para organizar celebraciones épicas. Videoinvitaciones con IA, regalos inteligentes y RSVP sin caos.
            </p>
          </div>

          {[
            {
              title: "Plataforma", links: [
                { label: "Videoinvitaciones", href: "#video-feature" },
                { label: "Lista de regalos", href: "#" },
                { label: "RSVP automático", href: "#" },
                { label: "Tienda del evento", href: "#" },
              ]
            },
            {
              title: "Celebraciones", links: [
                { label: "Cumpleaños", href: "/cumpleanos" },
                { label: "Bodas", href: "/bodas" },
                { label: "Graduaciones", href: "/graduaciones" },
                { label: "Todos los eventos", href: "#clusters" },
              ]
            },
            {
              title: "Empresa", links: [
                { label: "Precios", href: "/pricing" },
                { label: "Iniciar sesión", href: "/sign-in" },
                { label: "Crear cuenta", href: "/sign-up" },
                { label: "Contacto", href: "/contact" },
              ]
            }
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ fontSize: "0.85rem", color: "var(--neutral-400)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--neutral-400)")}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--neutral-600)" }}>© 2025 Cumplefy. Todos los derechos reservados. Hecho con ✨ por El Genio.</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacidad", "Términos", "Cookies"].map((l) => (
              <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: "0.78rem", color: "var(--neutral-600)", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function LandingClient() {
  return (
    <>
      <NavBar />
      <main>
        <HeroCinematic />
        <ServicesSection />
        <PainPointsSection />
        <VideoInvitationsSection />
        <TalkingAvatarsSection />
        <GiftRegistrySection />
        <AllModulesSection />
        <HowItWorksSection />
        <ClustersSection />
        <PricingSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>
      <Footer />

      <style>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 1; }
        }
        @keyframes sound-wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .nav-desktop { display: flex; }
        .feature-block { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
        .hide-mobile { display: block; }
        @media (max-width: 768px) {
          .feature-block { grid-template-columns: 1fr; gap: 40px; }
          .nav-desktop { display: none; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .hide-mobile { display: none; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
