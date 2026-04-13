"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Sparkles, Gift, Users, Video, Star, CheckCircle,
  ChevronDown, Menu, X, Mic, Zap, Shield, Globe, Trophy,
  Play, Heart, Bell, Calendar, Check,
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CLUSTERS = [
  {
    id: "cumpleanos", title: "Cumpleaños", emoji: "🎂",
    sub: "Infantil · 18 años · 50 años · Sorpresa",
    gradient: "linear-gradient(135deg,#FF4D6D 0%,#FFB300 100%)",
    color: "#FF4D6D", popular: true,
    desc: "Desde los primeros pasos hasta los números redondos. Cada cumpleaños merece ser legendario.",
    href: "/cumpleanos",
  },
  {
    id: "bodas", title: "Bodas", emoji: "💍",
    sub: "Civil · Religiosa · Íntima · Elopement",
    gradient: "linear-gradient(135deg,#E8C4A0 0%,#B8854A 100%)",
    color: "#C4956A", popular: false,
    desc: "El día más importante de tu vida merece la invitación más especial jamás creada.",
    href: "/bodas",
  },
  {
    id: "graduaciones", title: "Graduaciones", emoji: "🎓",
    sub: "Bachillerato · Universidad · FP · Máster",
    gradient: "linear-gradient(135deg,#00C2D1 0%,#0066FF 100%)",
    color: "#00C2D1", popular: true,
    desc: "Años de esfuerzo merecen una celebración épica. Marca el inicio de tu nueva etapa.",
    href: "/graduaciones",
  },
  {
    id: "despedidas", title: "Despedidas", emoji: "🥂",
    sub: "Soltera · Soltero · Última aventura",
    gradient: "linear-gradient(135deg,#FFD23F 0%,#FF6B35 100%)",
    color: "#FFB300", popular: false,
    desc: "La última gran noche de libertad. Hazla tan épica que nadie la olvide jamás.",
    href: "/despedidas",
  },
  {
    id: "comuniones", title: "Comuniones", emoji: "✨",
    sub: "Primera Comunión · Confirmación",
    gradient: "linear-gradient(135deg,#A78BFA 0%,#6D28D9 100%)",
    color: "#A78BFA", popular: false,
    desc: "Un momento sagrado que merece ser recordado para siempre con una invitación única.",
    href: "/comuniones",
  },
  {
    id: "bautizos", title: "Bautizos", emoji: "👶",
    sub: "Recién nacido · Celebración familiar",
    gradient: "linear-gradient(135deg,#67E8F9 0%,#2563EB 100%)",
    color: "#67E8F9", popular: false,
    desc: "La bienvenida más especial al mundo para el nuevo miembro de la familia.",
    href: "/bautizos",
  },
  {
    id: "navidad", title: "Navidad", emoji: "🎄",
    sub: "Cenas · Amigo invisible · Empresa",
    gradient: "linear-gradient(135deg,#DC2626 0%,#16A34A 100%)",
    color: "#DC2626", popular: false,
    desc: "La magia de la Navidad en una invitación que quita el aliento a tus seres queridos.",
    href: "/navidad",
  },
  {
    id: "eventos-empresa", title: "Empresa", emoji: "🏢",
    sub: "Team building · Cenas · Lanzamientos",
    gradient: "linear-gradient(135deg,#00C2D1 0%,#6366F1 100%)",
    color: "#6366F1", popular: false,
    desc: "Eventos corporativos que inspiran, conectan equipos y se recuerdan durante años.",
    href: "/eventos-empresa",
  },
];

const STEPS = [
  {
    n: "01", icon: <Mic size={22} />,
    title: "Cuéntaselo al Genio",
    desc: "Escribe los detalles de tu celebración — fecha, lugar, estilo, invitados — en menos de 2 minutos. El Genio lo entiende todo.",
    color: "#00C2D1",
    visual: (
      <div style={{ padding: "24px", background: "var(--surface-elevated)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-default)" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>El Genio</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {["¿Para quién es la fiesta?", "¿Cuántos invitados?", "¿Fecha y lugar?"].map((q, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(0,194,209,0.08)", border: "1px solid rgba(0,194,209,0.15)", fontSize: "0.82rem", color: "var(--neutral-300)" }}>
              {q}
            </div>
          ))}
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.2)", fontSize: "0.82rem", color: "#FFD23F" }}>
            &ldquo;El cumpleaños de Sofía, 8 años, 30 niños el 15 de mayo&rdquo; ✓
          </div>
        </div>
      </div>
    ),
  },
  {
    n: "02", icon: <Video size={22} />,
    title: "El Genio crea la magia",
    desc: "Videoinvitación cinematográfica, página del evento épica, lista de regalos inteligente y RSVP automático. Todo generado al instante.",
    color: "#FFB300",
    visual: (
      <div style={{ padding: "20px", background: "var(--surface-elevated)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-gold)" }}>
        {[
          { icon: <Video size={14} />, label: "Videoinvitación lista", color: "#00C2D1" },
          { icon: <Users size={14} />, label: "Página RSVP activa", color: "#FFB300" },
          { icon: <Gift size={14} />, label: "Lista de regalos creada", color: "#A78BFA" },
        ].map(({ icon, label, color }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px", borderRadius: "var(--radius-md)",
            marginBottom: i < 2 ? "8px" : 0,
          }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
              {icon}
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--neutral-200)" }}>{label}</span>
            <Check size={14} style={{ color: "#00E5A0", marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    n: "03", icon: <Heart size={22} />,
    title: "Comparte y celebra",
    desc: "Un enlace que lo tiene todo. Tus invitados confirman asistencia, eligen regalos y reciben recordatorios. Tú, a disfrutar.",
    color: "#FF4D6D",
    visual: (
      <div style={{ padding: "20px", background: "var(--surface-elevated)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(255,77,109,0.2)" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confirmaciones en tiempo real</div>
        {[
          { name: "Ana García", status: "Asistirá ✓", color: "#00E5A0" },
          { name: "Carlos López", status: "Asistirá ✓", color: "#00E5A0" },
          { name: "María Ruiz", status: "Pendiente...", color: "#FFB300" },
        ].map(({ name, status, color }, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--border-white)" : "none" }}>
            <span style={{ fontSize: "0.83rem", color: "var(--neutral-300)" }}>{name}</span>
            <span style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>{status}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const FEATURES = [
  {
    icon: <Video size={20} />,
    title: "Videoinvitaciones cinematográficas",
    desc: "Powered by IA generativa. No son plantillas — son producciones personalizadas que dejan a tus invitados boquiabiertos cuando las reciben.",
    tag: "IA Generativa",
    color: "#00C2D1",
    items: [
      "Estilo cinematográfico profesional",
      "Personalizada con tus fotos y datos",
      "Lista en minutos, no días",
      "Comparte por WhatsApp, email o redes",
    ],
  },
  {
    icon: <Gift size={20} />,
    title: "Lista de regalos inteligente",
    desc: "Amazon, El Corte Inglés, experiencias, viajes... Todo en un mismo lugar. Los invitados contribuyen directamente desde la invitación.",
    tag: "Afiliados & Experiencias",
    color: "#FFB300",
    items: [
      "Amazon y El Corte Inglés integrados",
      "Experiencias Smartbox y Civitatis",
      "Regalos por unidades, sin complicaciones",
      "Cobras directamente en tu cuenta",
    ],
  },
  {
    icon: <Users size={20} />,
    title: "RSVP que tus invitados amarán",
    desc: "Un clic para confirmar. Sin registros, sin formularios largos. Tú ves en tiempo real quién viene, cuántos adultos, niños, alergias — todo organizado.",
    tag: "Sin fricción",
    color: "#FF4D6D",
    items: [
      "Confirmación en 1 clic",
      "Recordatorios automáticos por WhatsApp",
      "Panel de asistentes en tiempo real",
      "Exporta la lista al instante",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "María García", role: "Mamá de Sofía, 8 años", avatar: "MG",
    text: "La videoinvitación del cumpleaños de mi hija fue un WOW total. Los padres del colegio me preguntaban cómo lo había hecho. Nunca había organizado algo tan bonito con tan poco esfuerzo.",
    stars: 5,
  },
  {
    name: "Carlos & Lucía", role: "Boda en Sevilla", avatar: "CL",
    text: "Nuestra lista de bodas la gestionamos completamente con Cumplefy. Los invitados podían regalar directamente desde la invitación. Recibimos los fondos sin complicaciones. 100% recomendado.",
    stars: 5,
  },
  {
    name: "Alejandro Ruiz", role: "Graduado en Bachillerato", avatar: "AR",
    text: "La fiesta de graduación fue épica. El Genio nos ayudó a organizar todo — videoinvitación, RSVP, itinerario... Mis amigos todavía hablan de la invitación que recibieron.",
    stars: 5,
  },
];

const PRICING = [
  {
    plan: "Gratis", price: "0€", period: "",
    desc: "Para empezar a crear magia sin riesgo.",
    color: "#00C2D1",
    features: [
      "1 evento activo",
      "Hasta 50 invitados",
      "Lista de regalos básica",
      "RSVP ilimitado",
      "Página del evento",
      "Google Maps integrado",
    ],
    cta: "Empezar gratis",
    href: "/sign-up",
    highlighted: false,
  },
  {
    plan: "Pro", price: "9€", period: "/mes",
    desc: "Para celebraciones que merecen ser legendarias.",
    color: "#FFB300",
    features: [
      "Eventos ilimitados",
      "Invitados ilimitados",
      "Videoinvitaciones con IA",
      "Lista de regalos con afiliados",
      "Chatbot Genio con voz",
      "Analytics avanzados",
      "Dominio personalizado",
      "Soporte prioritario",
    ],
    cta: "Empezar 14 días gratis",
    href: "/sign-up?plan=pro",
    highlighted: true,
    badge: "Más popular",
  },
];

// ─── ANIMATION VARIANTS ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ─── HERO PRODUCT MOCK ────────────────────────────────────────────────────────

function HeroMock() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
      {/* Glow behind */}
      <div style={{
        position: "absolute", inset: "-40px",
        background: "radial-gradient(ellipse at 60% 40%, rgba(0,194,209,0.18) 0%, rgba(255,179,0,0.08) 50%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Main card — video invitation mock */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{
          borderRadius: "24px",
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,209,0.1)",
          position: "relative", zIndex: 2,
        }}
      >
        {/* Video frame */}
        <div style={{
          height: "220px",
          background: "linear-gradient(135deg, #0a1628 0%, #061020 100%)",
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {/* Cinematic bars */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "16px", background: "#000" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "16px", background: "#000" }} />
          {/* Gradient bg inside frame */}
          <div style={{
            position: "absolute", inset: "16px 0",
            background: "linear-gradient(135deg, rgba(0,194,209,0.25) 0%, rgba(255,179,0,0.15) 50%, rgba(255,77,109,0.1) 100%)",
          }} />
          {/* Particles */}
          {[
            { x: "20%", y: "30%", s: 3, c: "#00C2D1", delay: "0s" },
            { x: "75%", y: "20%", s: 2, c: "#FFB300", delay: "0.8s" },
            { x: "50%", y: "70%", s: 4, c: "#FF4D6D", delay: "1.4s" },
            { x: "85%", y: "60%", s: 2, c: "#00C2D1", delay: "0.4s" },
            { x: "15%", y: "65%", s: 3, c: "#FFB300", delay: "1.1s" },
          ].map((p, i) => (
            <div key={i} style={{
              position: "absolute", left: p.x, top: p.y,
              width: `${p.s}px`, height: `${p.s}px`,
              borderRadius: "50%", background: p.c,
              boxShadow: `0 0 ${p.s * 3}px ${p.c}`,
              animation: `particle-rise 3s ease-in-out infinite`,
              animationDelay: p.delay,
            }} />
          ))}
          {/* Play button */}
          <div style={{
            position: "relative", zIndex: 1,
            width: "56px", height: "56px", borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(0,194,209,0.4)",
          }}>
            <Play size={20} style={{ color: "white", marginLeft: "3px" }} />
          </div>
          {/* Title overlay */}
          <div style={{
            position: "absolute", bottom: "24px", left: 0, right: 0,
            textAlign: "center",
            fontSize: "1rem", fontWeight: 700,
            color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            letterSpacing: "0.04em",
          }}>
            🎂 Cumpleaños de Sofía
          </div>
        </div>

        {/* Card content */}
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>¡Estás invitado/a!</div>
              <div style={{ fontSize: "0.78rem", color: "var(--neutral-400)", marginTop: "2px" }}>Sábado 15 de Mayo · 17:00h</div>
            </div>
            <span style={{
              background: "rgba(0,229,160,0.15)", color: "#00E5A0",
              fontSize: "0.7rem", fontWeight: 700,
              padding: "4px 10px", borderRadius: "999px",
              border: "1px solid rgba(0,229,160,0.3)",
            }}>RSVP abierto</span>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              { icon: <Users size={12} />, label: "24 confirmados", color: "#00C2D1" },
              { icon: <Gift size={12} />, label: "8 regalos", color: "#FFB300" },
              { icon: <Heart size={12} />, label: "100% épico", color: "#FF4D6D" },
            ].map(({ icon, label, color }, i) => (
              <div key={i} style={{
                padding: "8px", borderRadius: "var(--radius-md)",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-white)",
                textAlign: "center",
              }}>
                <div style={{ color, marginBottom: "3px" }}>{icon}</div>
                <div style={{ fontSize: "0.62rem", color: "var(--neutral-400)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating notification: RSVP */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        style={{
          position: "absolute", top: "20px", right: "-24px", zIndex: 3,
          background: "var(--surface-card)",
          border: "1px solid rgba(0,229,160,0.3)",
          borderRadius: "14px",
          padding: "10px 14px",
          backdropFilter: "blur(12px)",
          animation: "float 7s ease-in-out infinite",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          minWidth: "160px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bell size={12} style={{ color: "#00E5A0" }} />
          <div style={{ fontSize: "0.7rem", color: "var(--neutral-400)" }}>Nueva confirmación</div>
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "white", marginTop: "4px" }}>
          Ana G. asistirá 🎉
        </div>
      </motion.div>

      {/* Floating notification: Gift */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.1 }}
        style={{
          position: "absolute", bottom: "30px", left: "-28px", zIndex: 3,
          background: "var(--surface-card)",
          border: "1px solid rgba(255,179,0,0.3)",
          borderRadius: "14px",
          padding: "10px 14px",
          backdropFilter: "blur(12px)",
          animation: "float 9s ease-in-out infinite 2s",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          minWidth: "160px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Gift size={12} style={{ color: "#FFB300" }} />
          <div style={{ fontSize: "0.7rem", color: "var(--neutral-400)" }}>Regalo reservado</div>
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "white", marginTop: "4px" }}>
          LEGO City 60375 ✓
        </div>
      </motion.div>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <Sparkles size={11} />
      {children}
    </div>
  );
}

function ClusterCard({ c, index }: { c: typeof CLUSTERS[0]; index: number }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={c.href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", flexDirection: "column", gap: "12px",
          padding: "24px",
          borderRadius: "var(--radius-xl)",
          background: hovered
            ? `linear-gradient(160deg, var(--surface-card) 60%, ${c.color}10 100%)`
            : "var(--surface-card)",
          border: `1px solid ${hovered ? c.color + "50" : "var(--border-white)"}`,
          textDecoration: "none",
          transition: "all 0.3s var(--ease-spring)",
          position: "relative", overflow: "hidden",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered ? `0 20px 50px ${c.color}18` : "none",
          minHeight: "240px",
        }}
      >
        {/* Top gradient line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: c.gradient, opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.3s",
        }} />

        {/* Glow orb */}
        <div style={{
          position: "absolute", bottom: "-30px", right: "-30px",
          width: "140px", height: "140px", borderRadius: "50%",
          background: `radial-gradient(circle, ${c.color}12 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0.4, transition: "opacity 0.4s",
          pointerEvents: "none",
        }} />

        {c.popular && (
          <span style={{
            position: "absolute", top: "12px", right: "12px",
            fontSize: "0.6rem", fontWeight: 700,
            background: c.gradient, color: "white",
            padding: "2px 8px", borderRadius: "999px",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Popular
          </span>
        )}

        <div style={{ fontSize: "2.4rem", lineHeight: 1 }}>{c.emoji}</div>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", color: "white", marginBottom: "3px" }}>
            {c.title}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--neutral-500)" }}>{c.sub}</div>
        </div>

        <p style={{ fontSize: "var(--text-xs)", color: "var(--neutral-400)", lineHeight: 1.6, flexGrow: 1 }}>
          {c.desc}
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "var(--text-xs)", fontWeight: 700, color: c.color,
          transition: "gap 0.2s",
        }}>
          Crear celebración <ArrowRight size={13} />
        </div>
      </Link>
    </motion.div>
  );
}

function FeatureBlock({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-80px" });
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}
      className="feature-block"
    >
      {/* Text */}
      <div style={{ order: isEven ? 0 : 1 }}>
        <span className={`badge badge--${f.color === "#00C2D1" ? "teal" : f.color === "#FFB300" ? "gold" : "coral"}`} style={{ marginBottom: "20px", display: "inline-flex" }}>
          {f.icon} {f.tag}
        </span>
        <h3 style={{ marginBottom: "14px", color: "white" }}>{f.title}</h3>
        <p style={{ color: "var(--neutral-400)", lineHeight: 1.75, marginBottom: "24px" }}>{f.desc}</p>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
          {f.items.map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--neutral-300)", fontSize: "var(--text-sm)" }}>
              <CheckCircle size={15} style={{ color: f.color, flexShrink: 0 }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual */}
      <div style={{ order: isEven ? 1 : 0 }}>
        <div style={{
          borderRadius: "var(--radius-xl)",
          border: `1px solid ${f.color}25`,
          background: `linear-gradient(135deg, ${f.color}07 0%, transparent 60%)`,
          padding: "32px",
          minHeight: "280px",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "160px", height: "160px", borderRadius: "50%",
            background: `radial-gradient(circle, ${f.color}20 0%, transparent 70%)`,
            animation: "glow-breathe 4s ease-in-out infinite",
          }} />
          <div style={{
            width: "80px", height: "80px", borderRadius: "var(--radius-xl)",
            background: `linear-gradient(135deg, ${f.color}25, ${f.color}08)`,
            border: `1px solid ${f.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: f.color, position: "relative", zIndex: 1,
            boxShadow: `0 0 30px ${f.color}20`,
          }}>
            <div style={{ transform: "scale(2)" }}>{f.icon}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "28px",
        borderRadius: "var(--radius-xl)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-white)",
        display: "flex", flexDirection: "column", gap: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "3px" }}>
        {Array.from({ length: t.stars }).map((_, s) => (
          <Star key={s} size={13} style={{ color: "#FFB300", fill: "#FFB300" }} />
        ))}
      </div>
      <p style={{ color: "var(--neutral-200)", lineHeight: 1.7, fontSize: "var(--text-sm)", flex: 1 }}>
        &ldquo;{t.text}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%",
          background: "var(--gradient-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.78rem", color: "#020409", flexShrink: 0,
        }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "white" }}>{t.name}</div>
          <div style={{ fontSize: "0.73rem", color: "var(--neutral-400)" }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

function PricingCard({ p }: { p: typeof PRICING[0] }) {
  const ref  = useRef(null);
  const inVw = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "36px",
        borderRadius: "var(--radius-xl)",
        background: p.highlighted ? "var(--surface-card)" : "var(--surface-elevated)",
        border: p.highlighted ? `1px solid ${p.color}35` : "1px solid var(--border-white)",
        boxShadow: p.highlighted ? `0 0 60px ${p.color}18` : "none",
        position: "relative",
        display: "flex", flexDirection: "column", gap: "22px",
      }}
    >
      {p.badge && (
        <div style={{
          position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
          background: "var(--gradient-gold)", color: "#020409",
          fontWeight: 800, fontSize: "0.68rem",
          padding: "4px 16px", borderRadius: "999px",
          letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
        }}>
          {p.badge}
        </div>
      )}

      <div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: p.color, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {p.plan}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "clamp(2.2rem,4vw,3rem)", fontWeight: 800, fontFamily: "var(--font-display)", color: "white" }}>
            {p.price}
          </span>
          {p.period && <span style={{ color: "var(--neutral-400)", fontSize: "var(--text-sm)" }}>{p.period}</span>}
        </div>
        <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-sm)", marginTop: "8px" }}>{p.desc}</p>
      </div>

      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
        {p.features.map((feat) => (
          <li key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "var(--text-sm)", color: "var(--neutral-200)" }}>
            <CheckCircle size={14} style={{ color: p.color, flexShrink: 0 }} />
            {feat}
          </li>
        ))}
      </ul>

      <Link href={p.href} className={`btn ${p.highlighted ? "btn--brand" : "btn--ghost"}`} style={{ justifyContent: "center", width: "100%" }}>
        {p.cta} <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
}

// ─── SCROLL PROGRESS HOOK ─────────────────────────────────────────────────────

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el  = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setProgress(isNaN(pct) ? 0 : pct);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingClient() {
  const scrollProgress = useScrollProgress();
  const [navOpen, setNavOpen]     = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh", overflowX: "hidden" }}>

      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: navScrolled ? "12px 32px" : "20px 32px",
        background: navScrolled ? "rgba(2,4,9,0.96)" : "transparent",
        backdropFilter: navScrolled ? "blur(24px)" : "none",
        borderBottom: navScrolled ? "1px solid var(--border-white)" : "none",
        transition: "all 0.35s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "24px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "9px",
            background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
          }}>✨</div>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Cumplefy
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="nav-links">
          {[
            ["Cumpleaños", "/cumpleanos"],
            ["Bodas", "/bodas"],
            ["Graduaciones", "/graduaciones"],
            ["Precios", "/pricing"],
          ].map(([label, href]) => (
            <Link key={label} href={href} style={{
              padding: "7px 14px", borderRadius: "var(--radius-full)",
              color: "var(--neutral-300)", textDecoration: "none",
              fontSize: "0.88rem", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,194,209,0.08)"; e.currentTarget.style.color = "#00C2D1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--neutral-300)"; }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/sign-in" style={{
            padding: "8px 16px", borderRadius: "var(--radius-full)",
            color: "var(--neutral-300)", fontSize: "0.86rem", fontWeight: 500,
            textDecoration: "none",
          }} className="nav-signin">
            Entrar
          </Link>
          <Link href="/sign-up" className="btn btn--primary btn--sm">
            Crear gratis <ArrowRight size={13} />
          </Link>
          {/* Mobile burger */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "4px", display: "none" }}
            className="nav-burger"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {navOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "rgba(2,4,9,0.98)",
          backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column",
          padding: "100px 24px 40px", gap: "8px",
        }}>
          {CLUSTERS.map((c) => (
            <Link key={c.id} href={c.href} onClick={() => setNavOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 18px", borderRadius: "var(--radius-lg)",
                background: "var(--surface-card)", border: "1px solid var(--border-white)",
                textDecoration: "none", color: "white",
                fontSize: "1rem", fontWeight: 600,
              }}
            >
              <span style={{ fontSize: "1.6rem" }}>{c.emoji}</span>
              {c.title}
            </Link>
          ))}
          <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
            <Link href="/sign-in" className="btn btn--ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setNavOpen(false)}>Entrar</Link>
            <Link href="/sign-up" className="btn btn--primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setNavOpen(false)}>Crear gratis</Link>
          </div>
        </div>
      )}

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100dvh",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden", paddingTop: "80px",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 65% 40%, rgba(0,194,209,0.1) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "240px",
          background: "linear-gradient(to top, var(--surface-bg), transparent)",
          pointerEvents: "none",
        }} />

        <div className="container" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "60px", alignItems: "center",
          padding: "80px 24px 100px",
          position: "relative", zIndex: 1,
        }}>
          {/* Left copy */}
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
            <motion.div variants={fadeUp}>
              <span className="badge badge--teal">
                <Sparkles size={11} /> Nuevo: Videoinvitaciones con IA Generativa
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{
              fontSize: "clamp(2.8rem,5.5vw,5rem)",
              lineHeight: 1.04, letterSpacing: "-0.05em", color: "white",
            }}>
              Tu celebración,{" "}
              <span className="gradient-text">épica.</span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontSize: "var(--text-lg)", color: "var(--neutral-300)",
              lineHeight: 1.7, maxWidth: "460px",
            }}>
              El Genio crea videoinvitaciones cinematográficas con IA, gestiona tu lista de regalos y automatiza el RSVP.{" "}
              <strong style={{ color: "white" }}>Tú solo disfrutas.</strong>
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sign-up" className="btn btn--primary btn--lg">
                Crear mi fiesta gratis <ArrowRight size={17} />
              </Link>
              <Link href="#como-funciona" className="btn btn--ghost btn--lg">
                <Play size={15} /> Ver cómo funciona
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", paddingTop: "4px" }}>
              {["Sin tarjeta de crédito", "Gratis para siempre", "Listo en 2 minutos"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-400)", fontSize: "0.83rem" }}>
                  <CheckCircle size={13} style={{ color: "#00E5A0" }} />
                  {t}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: product mockup */}
          <div className="hero-mock-wrapper">
            <HeroMock />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: "var(--neutral-600)", fontSize: "0.73rem",
          animation: "float 3s ease-in-out infinite",
        }}>
          <span>Desplázate</span>
          <ChevronDown size={15} />
        </div>
      </section>

      {/* ══ TRUST BAR ════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: "1px solid var(--border-white)",
        borderBottom: "1px solid var(--border-white)",
        background: "var(--surface-elevated)", padding: "20px 0", overflow: "hidden",
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "36px", flexWrap: "wrap" }}>
            {[
              { icon: <Trophy size={14} />, label: "+10.000 fiestas creadas", color: "#FFB300" },
              { icon: <Star size={14} />,   label: "4.9 / 5 estrellas", color: "#FFB300" },
              { icon: <Globe size={14} />,  label: "100% en español", color: "#00C2D1" },
              { icon: <Shield size={14} />, label: "RGPD garantizado", color: "#00E5A0" },
              { icon: <Zap size={14} />,    label: "Lista en 2 minutos", color: "#FF4D6D" },
            ].map(({ icon, label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px", color: "var(--neutral-400)", fontSize: "0.86rem", fontWeight: 500 }}>
                <span style={{ color }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CLUSTER HUB ══════════════════════════════════════════════════════ */}
      <section className="section" id="celebraciones">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <SectionLabel>Todas las celebraciones</SectionLabel>
            <h2 style={{ marginBottom: "14px" }}>
              ¿Qué celebramos{" "}
              <span className="gradient-text">hoy?</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", maxWidth: "520px", margin: "0 auto", fontSize: "var(--text-lg)" }}>
              Desde cumpleaños de princesa hasta despedidas épicas. El Genio domina todos los tipos de celebración.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }} className="cluster-grid">
            {CLUSTERS.map((c, i) => (
              <ClusterCard key={c.id} c={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="section" id="como-funciona" style={{
        background: "linear-gradient(180deg, var(--surface-bg) 0%, var(--surface-elevated) 50%, var(--surface-bg) 100%)",
      }}>
        <div className="container container--narrow">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <SectionLabel>Cómo funciona</SectionLabel>
            <h2 style={{ marginBottom: "14px" }}>
              3 pasos para la{" "}
              <span className="gradient-text-genie">fiesta perfecta</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "440px", margin: "0 auto" }}>
              Sin complicaciones, sin aprender nada nuevo. El Genio hace el trabajo pesado.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {STEPS.map((step, i) => {
              const ref  = useRef(null);
              const inVw = useInView(ref, { once: true, margin: "-60px" });
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={step.n}
                  ref={ref}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  animate={inVw ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 280px",
                    gap: "48px", alignItems: "center", padding: "52px 0",
                    borderBottom: i < STEPS.length - 1 ? "1px solid var(--border-white)" : "none",
                  }}
                  className="step-row"
                >
                  <div style={{ order: isEven ? 0 : 1 }}>
                    <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px", justifyContent: isEven ? "flex-start" : "flex-end" }}>
                      <span className="section-label" style={{ color: step.color }}>PASO {step.n}</span>
                      <div style={{ color: step.color }}>{step.icon}</div>
                    </div>
                    <h3 style={{ marginBottom: "14px", color: "white", textAlign: isEven ? "left" : "right" }}>{step.title}</h3>
                    <p style={{
                      color: "var(--neutral-400)", lineHeight: 1.75,
                      maxWidth: "400px", fontSize: "var(--text-base)",
                      marginLeft: isEven ? 0 : "auto",
                      textAlign: isEven ? "left" : "right",
                    }}>
                      {step.desc}
                    </p>
                  </div>
                  <div style={{ order: isEven ? 1 : 0 }}>{step.visual}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section className="section" id="funcionalidades">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <SectionLabel>Funcionalidades</SectionLabel>
            <h2 style={{ marginBottom: "14px" }}>
              Todo lo que necesitas.{" "}
              <span className="gradient-text">Nada de lo que no.</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "500px", margin: "0 auto" }}>
              Cada herramienta diseñada para que tus invitados digan "WOW" y tú no muevas ni un dedo.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
            {FEATURES.map((f, i) => (
              <FeatureBlock key={f.title} f={f} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ GENIO CTA BANNER ═════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "72px 0",
        background: "var(--surface-elevated)",
        borderTop: "1px solid var(--border-white)",
        borderBottom: "1px solid var(--border-white)",
      }}>
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,194,209,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "60px" }} >
          <div style={{ flex: 1 }}>
            <SectionLabel>El Genio te espera</SectionLabel>
            <h2 style={{ marginBottom: "18px", color: "white" }}>
              Habla con el Genio y crea tu{" "}
              <span className="gradient-text-genie">videoinvitación cinematográfica</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "480px" }}>
              El Genio recoge toda la información de tu celebración por voz o texto y genera automáticamente una videoinvitación de nivel profesional. El resultado deja sin palabras.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sign-up" className="btn btn--brand btn--lg">
                <Mic size={17} /> Hablar con el Genio
              </Link>
              <Link href="/sign-up" className="btn btn--ghost btn--lg">
                Ver ejemplo
              </Link>
            </div>
          </div>
          <div style={{
            flexShrink: 0, width: "180px", height: "180px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,194,209,0.18) 0%, rgba(255,179,0,0.08) 60%, transparent 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 80px rgba(0,194,209,0.22)",
            animation: "glow-breathe 4s ease-in-out infinite",
            border: "1px solid rgba(0,194,209,0.18)",
          }} className="genio-orb">
            <Mic size={56} style={{ color: "#00C2D1", opacity: 0.85, filter: "drop-shadow(0 0 14px #00C2D1)" }} />
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <SectionLabel>Testimonios</SectionLabel>
            <h2>
              Lo que dicen nuestras{" "}
              <span className="gradient-text">familias</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }} className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section className="section" id="precios" style={{
        background: "linear-gradient(180deg, var(--surface-bg) 0%, var(--surface-elevated) 100%)",
      }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <SectionLabel>Precios</SectionLabel>
            <h2 style={{ marginBottom: "14px" }}>
              Celebra a lo grande{" "}
              <span className="gradient-text">desde 0€</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "440px", margin: "0 auto" }}>
              Sin sorpresas, sin letra pequeña. Empieza gratis, sube cuando quieras más magia.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "22px", maxWidth: "740px", margin: "0 auto" }}>
            {PRICING.map((p) => (
              <PricingCard key={p.plan} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="section" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,194,209,0.08) 0%, rgba(255,179,0,0.04) 50%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            marginBottom: "36px", display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            width: "110px", height: "110px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,194,209,0.18) 0%, rgba(255,179,0,0.08) 60%, transparent 100%)",
            boxShadow: "0 0 80px rgba(0,194,209,0.25), 0 0 160px rgba(255,179,0,0.12)",
            animation: "glow-breathe 4s ease-in-out infinite",
          }}>
            <Sparkles size={46} style={{ color: "#00C2D1", filter: "drop-shadow(0 0 14px #00C2D1)" }} />
          </div>

          <h2 style={{
            fontSize: "clamp(2.2rem,5vw,4rem)",
            lineHeight: 1.06, letterSpacing: "-0.04em", marginBottom: "20px",
          }}>
            ¿Listo para la{" "}
            <span className="gradient-text">fiesta del año</span>?
          </h2>

          <p style={{
            color: "var(--neutral-300)", fontSize: "var(--text-xl)",
            lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 36px",
          }}>
            Crea tu primera celebración gratis en menos de 2 minutos. Sin tarjeta de crédito. Sin compromisos.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn btn--primary btn--xl">
              Crear mi celebración gratis <ArrowRight size={19} />
            </Link>
            <Link href="/sign-in" className="btn btn--ghost btn--xl">
              Ya tengo cuenta
            </Link>
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", gap: "28px", flexWrap: "wrap", color: "var(--neutral-500)", fontSize: "0.8rem" }}>
            {["Gratis para siempre", "Sin tarjeta de crédito", "RGPD compliant", "Soporte en español"].map(t => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--border-white)", background: "var(--surface-elevated)", padding: "56px 0 36px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "44px", marginBottom: "44px" }} className="footer-grid">
            {/* Brand */}
            <div>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", textDecoration: "none" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>✨</div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Cumplefy</span>
              </Link>
              <p style={{ color: "var(--neutral-500)", fontSize: "0.86rem", lineHeight: 1.7, maxWidth: "260px" }}>
                El asistente mágico que convierte cualquier celebración en algo legendario. Hecho con ❤️ en España.
              </p>
            </div>

            {/* Celebraciones */}
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "white", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Celebraciones</div>
              {["Cumpleaños", "Bodas", "Graduaciones", "Despedidas", "Comuniones", "Bautizos"].map((item) => (
                <Link key={item} href={`/${item.toLowerCase()}`} style={{ display: "block", color: "var(--neutral-500)", fontSize: "0.86rem", marginBottom: "8px", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00C2D1"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--neutral-500)"}
                >{item}</Link>
              ))}
            </div>

            {/* Producto */}
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "white", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Producto</div>
              {[["Videoinvitaciones", "/sign-up"], ["Lista de regalos", "/sign-up"], ["RSVP", "/sign-up"], ["Precios", "/pricing"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                <Link key={label} href={href} style={{ display: "block", color: "var(--neutral-500)", fontSize: "0.86rem", marginBottom: "8px", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00C2D1"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--neutral-500)"}
                >{label}</Link>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "white", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Legal</div>
              {[["Privacidad", "/privacidad"], ["Términos", "/terminos"], ["Cookies", "/cookies"], ["RGPD", "/rgpd"]].map(([label, href]) => (
                <Link key={label} href={href} style={{ display: "block", color: "var(--neutral-500)", fontSize: "0.86rem", marginBottom: "8px", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00C2D1"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--neutral-500)"}
                >{label}</Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-white)", paddingTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ color: "var(--neutral-600)", fontSize: "0.82rem" }}>
              © 2025 Cumplefy. Hecho con ❤️ en España.
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              {["Twitter/X", "Instagram", "TikTok"].map((s) => (
                <Link key={s} href="#" style={{ color: "var(--neutral-600)", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00C2D1"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--neutral-600)"}
                >{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
