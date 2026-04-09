"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Users, Star, CheckCircle, Heart, Clock, AlertTriangle, Sparkles, MapPin, Video, ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CUMPLEFY — Landing Page Cinematográfica
// ─────────────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

function GenieIllustration({ mood = "cool", size = 220 }: { mood?: "cool" | "annoyed" | "angry"; size?: number }) {
  const bodyColor = mood === "cool" ? "#8338ec" : mood === "annoyed" ? "#f59e0b" : "#ff3366";
  const expression = mood === "cool" ? "😎" : mood === "annoyed" ? "😤" : "🤬";
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="110" cy="120" r="90" fill={bodyColor} opacity="0.12"/>
        <circle cx="110" cy="120" r="70" fill={bodyColor} opacity="0.08"/>
        <path d="M110 210 Q80 180 90 150 Q100 120 110 130 Q120 140 130 120 Q140 100 110 90" stroke={bodyColor} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.4"/>
        <path d="M110 210 Q80 180 90 150 Q100 120 110 130 Q120 140 130 120 Q140 100 110 90" stroke={bodyColor} strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7"/>
        <ellipse cx="110" cy="105" rx="36" ry="44" fill="#1a1a2e"/>
        <ellipse cx="110" cy="105" rx="28" ry="36" fill="#111128"/>
        <path d="M95 85 L105 100 L95 115" stroke="#2a2a4e" strokeWidth="2" fill="none"/>
        <path d="M125 85 L115 100 L125 115" stroke="#2a2a4e" strokeWidth="2" fill="none"/>
        <line x1="110" y1="88" x2="110" y2="130" stroke="#3a3a6e" strokeWidth="1.5"/>
        <path d="M82 90 Q88 100 84 115" stroke={bodyColor} strokeWidth="1" opacity="0.4" fill="none"/>
        <ellipse cx="76" cy="110" rx="10" ry="22" fill="#1a1a2e" transform="rotate(-15 76 110)"/>
        <ellipse cx="144" cy="110" rx="10" ry="22" fill="#1a1a2e" transform="rotate(15 144 110)"/>
        <circle cx="110" cy="72" r="34" fill="#f4c08a"/>
        <path d="M78 60 Q85 35 110 38 Q135 35 142 60" fill="#1a1a1a"/>
        <path d="M78 58 Q88 42 110 40 Q132 42 140 58" fill="#2a2a2a"/>
        <path d="M90 45 Q100 40 112 43" stroke="#4a4a4a" strokeWidth="1.5" fill="none"/>
        <rect x="78" y="66" width="26" height="16" rx="8" fill="#0a0a1a"/>
        <rect x="116" y="66" width="26" height="16" rx="8" fill="#0a0a1a"/>
        <line x1="104" y1="74" x2="116" y2="74" stroke="#2a2a3e" strokeWidth="2.5"/>
        <line x1="78" y1="74" x2="70" y2="72" stroke="#2a2a3e" strokeWidth="2"/>
        <line x1="142" y1="74" x2="150" y2="72" stroke="#2a2a3e" strokeWidth="2"/>
        <circle cx="85" cy="70" r="3" fill={bodyColor} opacity="0.6"/>
        <circle cx="123" cy="70" r="3" fill={bodyColor} opacity="0.6"/>
        <path d="M106 80 Q110 86 114 80" stroke="#c8946a" strokeWidth="1.5" fill="none"/>
        {mood === "cool" && <path d="M100 90 Q110 96 120 90" stroke="#c8946a" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {mood === "annoyed" && <path d="M100 92 Q110 88 120 92" stroke="#c8946a" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {mood === "angry" && <>
          <path d="M100 94 Q110 88 120 94" stroke="#c8946a" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M98 86 L104 90" stroke="#c8946a" strokeWidth="1.5"/>
          <path d="M122 86 L116 90" stroke="#c8946a" strokeWidth="1.5"/>
        </>}
        <ellipse cx="76" cy="72" rx="6" ry="9" fill="#f4c08a"/>
        <ellipse cx="144" cy="72" rx="6" ry="9" fill="#f4c08a"/>
        <circle cx="55" cy="50" r="3" fill={bodyColor} opacity="0.8"/>
        <circle cx="165" cy="55" r="2" fill="#ffbe0b" opacity="0.9"/>
        <circle cx="48" cy="85" r="2" fill="#06ffa5" opacity="0.7"/>
        <circle cx="172" cy="80" r="3" fill={bodyColor} opacity="0.6"/>
        <text x="44" y="42" fontSize="10" opacity="0.8">✦</text>
        <text x="162" y="45" fontSize="8" opacity="0.7">✦</text>
      </svg>
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: "28px", animation: "float 3s ease-in-out infinite" }}>{expression}</div>
    </div>
  );
}

function PainCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "var(--radius-lg)", padding: "32px",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `all 0.6s ease ${delay}ms`,
    }}>
      <div style={{ marginBottom: "16px", color: "var(--brand-primary)" }}>{icon}</div>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "10px", color: "white" }}>{title}</h3>
      <p style={{ color: "var(--neutral-400)", lineHeight: 1.65, fontSize: "var(--text-sm)" }}>{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, delay }: { icon: React.ReactNode; title: string; desc: string; color: string; delay: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      background: "var(--surface-elevated)", border: `1px solid ${color}22`,
      borderRadius: "var(--radius-xl)", padding: "36px 32px", position: "relative", overflow: "hidden",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `all 0.65s ease ${delay}ms`,
    }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: color, opacity: 0.08, filter: "blur(30px)" }}/>
      <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: `${color}18`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", color }}>{icon}</div>
      <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "12px", color: "white" }}>{title}</h3>
      <p style={{ color: "var(--neutral-400)", lineHeight: 1.7, fontSize: "var(--text-sm)" }}>{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc, delay }: { number: string; title: string; desc: string; delay: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      display: "flex", gap: "24px", alignItems: "flex-start",
      opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-24px)",
      transition: `all 0.6s ease ${delay}ms`,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", color: "white", boxShadow: "var(--glow-brand)" }}>{number}</div>
      <div>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "8px", color: "white" }}>{title}</h3>
        <p style={{ color: "var(--neutral-400)", lineHeight: 1.65, fontSize: "var(--text-sm)" }}>{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [genieGifts, setGenieGifts] = useState(3);

  useEffect(() => {
    const orb1 = document.getElementById("orb1");
    const orb2 = document.getElementById("orb2");
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      if (orb1) orb1.style.transform = `translate(${x * 50}px, ${y * 40}px)`;
      if (orb2) orb2.style.transform = `translate(${-x * 40}px, ${-y * 30}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const genieMood = genieGifts <= 4 ? "cool" : genieGifts <= 6 ? "annoyed" : "angry";
  const genieMsg =
    genieGifts <= 3 ? "Perfecto. 3 regalos. Los niños aprenden a valorar. Mis respetos." :
    genieGifts <= 4 ? "Bien... está en el límite. Pero sé lo que haces." :
    genieGifts <= 5 ? "¿En serio? Empieza a parecerse a Amazon Prime Day." :
    genieGifts <= 6 ? "Oye oye oye... ¿en qué mundo vives tú?" :
    "¡POR TODOS MIS ANCESTROS! 3.000 años viendo niños y nunca esto. 🤬";

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .btn-glow:hover { box-shadow: var(--glow-brand), 0 8px 32px rgba(255,51,102,0.3) !important; transform: translateY(-2px) !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,26,0.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.6rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.5px" }}>
          Cumplefy ✨
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link href="/pricing" style={{ color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>Precios</Link>
          <Link href="/sign-in" style={{ color: "white", textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>Entrar</Link>
          <Link href="/sign-up" style={{ background: "var(--gradient-brand)", color: "white", textDecoration: "none", padding: "10px 24px", borderRadius: "var(--radius-full)", fontSize: "0.88rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(255,51,102,0.3)", transition: "all 0.2s ease" }} className="btn-glow">
            Empieza gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "140px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(131,56,236,0.25) 0%, transparent 70%)" }}/>
        <div id="orb1" style={{ position: "absolute", top: "10%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,51,102,0.2) 0%, transparent 70%)", filter: "blur(40px)", transition: "transform 0.3s ease" }}/>
        <div id="orb2" style={{ position: "absolute", bottom: "15%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(131,56,236,0.2) 0%, transparent 70%)", filter: "blur(40px)", transition: "transform 0.3s ease" }}/>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(131,56,236,0.15)", border: "1px solid rgba(131,56,236,0.4)", borderRadius: "var(--radius-full)", padding: "8px 20px", marginBottom: "32px", fontSize: "0.82rem", color: "var(--neutral-300)", animation: "pulse-glow 3s ease-in-out infinite" }}>
          <Sparkles size={14} color="#8338ec"/> La plataforma #1 de fiestas infantiles en España
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 1.0, letterSpacing: "-3px", marginBottom: "28px", maxWidth: "900px", color: "white" }}>
          El cumpleaños<br/>
          <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>perfecto</span>{" "}sin el<br/>
          caos habitual
        </h1>

        <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", color: "var(--neutral-400)", maxWidth: "620px", lineHeight: 1.7, marginBottom: "48px" }}>
          Invitaciones en vídeo, listas de regalos inteligentes, gestión de invitados y proveedores.{" "}
          <strong style={{ color: "var(--neutral-300)" }}>Todo en un solo lugar.</strong> En 10 minutos.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "64px" }}>
          <Link href="/sign-up" style={{ background: "var(--gradient-brand)", color: "white", textDecoration: "none", padding: "18px 40px", borderRadius: "var(--radius-full)", fontSize: "1.05rem", fontWeight: 700, boxShadow: "var(--glow-brand)", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.25s ease" }} className="btn-glow">
            Crea tu fiesta gratis <ArrowRight size={18}/>
          </Link>
          <Link href="#como-funciona" style={{ color: "white", textDecoration: "none", padding: "18px 40px", borderRadius: "var(--radius-full)", fontSize: "1rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Ver cómo funciona
          </Link>
        </div>

        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", justifyContent: "center" }}>
          {[{ n: "+5.000", label: "fiestas creadas" }, { n: "10 min", label: "de media para configurar" }, { n: "0€", label: "para empezar" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.n}</div>
              <div style={{ color: "var(--neutral-500)", fontSize: "0.85rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", animation: "float 2s ease-in-out infinite" }}>
          <ChevronDown size={24} color="var(--neutral-500)"/>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 0", overflow: "hidden", background: "var(--surface-elevated)" }}>
        <div style={{ display: "flex", animation: "marquee 20s linear infinite", width: "max-content" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "56px", paddingRight: "56px", alignItems: "center" }}>
              {["🎂 Sin duplicados en los regalos", "🎬 Videoinvitaciones IA", "✅ RSVP automático", "🧞 Genio personal incluido", "📦 Proveedores verificados", "💌 Compartir por WhatsApp", "🗺️ Google Maps integrado"].map((item, j) => (
                <span key={j} style={{ color: "var(--neutral-400)", fontSize: "0.88rem", whiteSpace: "nowrap", fontWeight: 500 }}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PAIN POINTS */}
      <section style={{ padding: "var(--section-lg) 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <div style={{ display: "inline-block", background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", borderRadius: "var(--radius-full)", padding: "6px 18px", color: "var(--brand-primary)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>El problema real</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.15, color: "white", marginBottom: "20px" }}>
                Organizar una fiesta<br/>no debería ser un trabajo a tiempo completo
              </h2>
              <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>Los padres de hoy lo tienen todo. Menos tiempo.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <PainCard delay={0} icon={<Clock size={28}/>} title="Sin tiempo para nada" desc="Entre el trabajo, el cole, las extraescolares y los compromisos... organizar una fiesta desde cero es añadir 20 horas más a la semana. Horas que no tienes."/>
            <PainCard delay={100} icon={<AlertTriangle size={28}/>} title="El caos de los regalos duplicados" desc="Tu hijo recibe 3 coches de la misma marca, 2 muñecas iguales y cuatro puzzles del mismo nivel. Los invitados no saben qué regalar y tú acabas devolviendo la mitad."/>
            <PainCard delay={200} icon={<Heart size={28}/>} title="¿Niños que valoran lo que tienen?" desc="Cuando hay 30 regalos sobre la mesa, ninguno importa. Queremos que la experiencia sea especial, no un derroche que enseña a los niños que más siempre es mejor."/>
            <PainCard delay={300} icon={<Users size={28}/>} title="Gestionar invitados es una pesadilla" desc="¿Quién viene? ¿Quién tiene alergia al gluten? ¿Cuántos menús vegetarianos? ¿Quién confirmó y quién no? El grupo de WhatsApp no para y tú pierdes el hilo."/>
            <PainCard delay={400} icon={<MapPin size={28}/>} title="Encontrar el local ideal" desc="Visitar salones de fiesta, comparar precios, preguntar disponibilidad, negociar menús... es otro proyecto en sí mismo que te quita días de vida."/>
            <PainCard delay={500} icon={<Video size={28}/>} title="Las invitaciones de siempre aburren" desc="Un PDF con globos o un mensaje en WhatsApp. Tus hijos merecen algo mágico, algo que haga que los invitados lleguen con ganas desde el primer momento."/>
          </div>
        </div>
      </section>

      {/* SOLUTION + GENIE */}
      <section style={{ padding: "var(--section-lg) 24px", background: "var(--surface-elevated)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(131,56,236,0.12) 0%, transparent 70%)" }}/>
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <FadeIn>
              <div>
                <div style={{ display: "inline-block", background: "rgba(131,56,236,0.12)", border: "1px solid rgba(131,56,236,0.3)", borderRadius: "var(--radius-full)", padding: "6px 18px", color: "#8338ec", fontSize: "0.8rem", fontWeight: 600, marginBottom: "24px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>La solución</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.15, color: "white", marginBottom: "24px" }}>
                  Tu genio personal.<br/>Sin lámpara de frotar.
                </h2>
                <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", lineHeight: 1.75, marginBottom: "32px" }}>
                  Cumplefy viene con un <strong style={{ color: "white" }}>Genio del siglo XXI</strong> — gafas de sol, chupa de cuero, vaqueros y 3.000 años de experiencia organizando fiestas. Está un poco harto de ver niños hiperregalados, pero contigo será el mejor aliado que hayas tenido.
                </p>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                  {["Te guía paso a paso con un wizard mágico", "Recomienda 3-5 regalos (ni uno más, te lo advertimos)", "Busca los mejores proveedores por cada regalo", "Gestiona menús e intolerancias de los invitados", "Crea tu videoinvitación cinematográfica"].map((item, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--neutral-300)", fontSize: "var(--text-sm)" }}>
                      <CheckCircle size={18} color="#06ffa5" style={{ flexShrink: 0 }}/>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div style={{ background: "var(--surface-card)", border: "1px solid rgba(131,56,236,0.3)", borderRadius: "var(--radius-xl)", padding: "40px", textAlign: "center", boxShadow: "var(--glow-violet)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                  <GenieIllustration mood={genieMood} size={200}/>
                </div>
                <div style={{ background: "var(--surface-elevated)", borderRadius: "var(--radius-lg)", padding: "16px 20px", fontSize: "var(--text-sm)", color: "var(--neutral-300)", fontStyle: "italic", lineHeight: 1.6, marginBottom: "24px", borderLeft: "3px solid #8338ec" }}>
                  "{genieMsg}"
                </div>
                <p style={{ color: "var(--neutral-500)", fontSize: "0.78rem", marginBottom: "12px" }}>¿Cuántos regalos pondrías? (pruébalo)</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
                  <button onClick={() => setGenieGifts(Math.max(1, genieGifts - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-hover)", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>−</button>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", color: genieMood === "cool" ? "#06ffa5" : genieMood === "annoyed" ? "#f59e0b" : "#ff3366", minWidth: "48px", textAlign: "center" as const, transition: "color 0.3s ease" }}>{genieGifts}</span>
                  <button onClick={() => setGenieGifts(Math.min(12, genieGifts + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-hover)", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>+</button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                  {(["cool", "annoyed", "angry"] as const).map((m) => (
                    <div key={m} style={{ width: 10, height: 10, borderRadius: "50%", background: genieMood === m ? (m === "cool" ? "#06ffa5" : m === "annoyed" ? "#f59e0b" : "#ff3366") : "var(--neutral-600)", transition: "all 0.3s ease" }}/>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="como-funciona" style={{ padding: "var(--section-lg) 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <div style={{ display: "inline-block", background: "rgba(6,255,165,0.1)", border: "1px solid rgba(6,255,165,0.3)", borderRadius: "var(--radius-full)", padding: "6px 18px", color: "var(--color-success)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Todo incluido</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.15, color: "white", marginBottom: "20px" }}>
                Un wizard mágico.<br/>Cuatro módulos. Un resultado.
              </h2>
              <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "580px", margin: "0 auto", lineHeight: 1.7 }}>Completa el wizard en 10 minutos y recibe una página pública lista para compartir por WhatsApp.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <FeatureCard delay={0} color="#ff3366" icon={<Gift size={24}/>} title="Lista de Regalos Inteligente" desc="El Genio recomienda 3-5 regalos perfectos. Para cada uno, el sistema busca los mejores proveedores — Amazon, El Corte Inglés, experiencias — y tú eliges. Los invitados aportan lo que pueden, sin duplicados."/>
            <FeatureCard delay={100} color="#8338ec" icon={<Users size={24}/>} title="Gestión de Invitados" desc="Controla quién viene, intolerancias alimentarias, preferencias de menú y confirmaciones de asistencia. El Genio prepara un briefing completo para tu proveedor."/>
            <FeatureCard delay={200} color="#ffbe0b" icon={<Video size={24}/>} title="Videoinvitación Cinematográfica" desc="¿Tu hijo quiere ser una princesa guerrera del espacio? ¿Un superhéroe pirata? Descríbelo y la IA genera una animación profesional con Remotion. Compartible por WhatsApp en segundos."/>
            <FeatureCard delay={300} color="#06ffa5" icon={<MapPin size={24}/>} title="Gestión del Proveedor" desc="Si celebras en un local, Cumplefy centraliza toda la comunicación: menús, número de comensales, intolerancias, horarios. Tu proveedor recibe todo organizado. Tú descansas."/>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "var(--section-lg) 24px", background: "var(--surface-elevated)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 20% 50%, rgba(255,51,102,0.08) 0%, transparent 70%)" }}/>
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.15, color: "white" }}>
                Del caos a la magia<br/>en 5 pasos
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            <StepCard delay={0} number="1" title="Datos del evento" desc="Nombre del protagonista, edad, fecha, hora y lugar. El Genio ya tiene toda la información que necesita para trabajar."/>
            <StepCard delay={100} number="2" title="Lista de regalos (con el Genio)" desc="El Genio propone los mejores regalos para la edad y gustos de tu hijo. Añades descripción y link, y el sistema encuentra 3 opciones de proveedores por regalo. Tú eliges la mejor."/>
            <StepCard delay={200} number="3" title="Gestión de invitados" desc="¿Cuántos vienen? ¿Hay alergias? ¿Menús especiales? Configura todo de una vez y olvídate. El Genio prepara un resumen completo para tu proveedor."/>
            <StepCard delay={300} number="4" title="Videoinvitación mágica" desc="Describe el personaje que quiere ser tu hijo — sin límites. La IA genera un prompt cinematográfico y Remotion crea la animación. Lista en segundos."/>
            <StepCard delay={400} number="5" title="Página pública compartible" desc="Un link único con la videoinvitación, la lista de regalos, el RSVP y el mapa del lugar. Lo compartes por WhatsApp y tus invitados tienen todo lo que necesitan."/>
          </div>
        </div>
      </section>

      {/* PUBLIC PAGE MODULES */}
      <section style={{ padding: "var(--section-lg) 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.15, color: "white", marginBottom: "20px" }}>
                La invitación que deja<br/>a todos con la boca abierta
              </h2>
              <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", maxWidth: "580px", margin: "0 auto", lineHeight: 1.7 }}>Una sola URL. Todo incluido. Sin apps que descargar.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { n: "①", title: "Videoinvitación IA", desc: "Protagonista de película. Animación cinematográfica generada por IA, optimizada para móvil y WhatsApp.", color: "#8338ec" },
              { n: "②", title: "Lista de Regalos", desc: "Los invitados ven qué falta por regalar y aportan online. Sin duplicados. Sin efectivo. Sin incomodidad.", color: "#ff3366" },
              { n: "③", title: "RSVP inteligente", desc: "Confirmación de asistencia con intolerancias, preferencias de menú y número de acompañantes.", color: "#ffbe0b" },
              { n: "④", title: "Mapa interactivo", desc: "Google Maps integrado con la dirección exacta. Los invitados llegan sin perderse.", color: "#06ffa5" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ background: "var(--surface-card)", border: `1px solid ${item.color}22`, borderRadius: "var(--radius-lg)", padding: "28px 24px", height: "100%" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{item.n}</div>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "white", marginBottom: "10px" }}>{item.title}</h3>
                  <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "var(--section-lg) 24px", background: "var(--surface-elevated)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "16px" }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#ffbe0b" color="#ffbe0b"/>)}
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "white" }}>
                Padres que recuperaron<br/>su fin de semana
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {[
              { name: "Sara M.", loc: "Madrid", text: "Tardé 12 minutos en configurar la fiesta de cumpleaños de mi hija. La videoinvitación dejó a todos flipando. Los regalos estaban perfectamente organizados y nadie repitió. Es magia pura." },
              { name: "Carlos R.", loc: "Barcelona", text: "El genio me dijo que 3 regalos son suficientes. Tenía razón. Mi hijo valoró cada uno. La lista colectiva funcionó perfectamente y recaudamos exactamente lo que necesitábamos." },
              { name: "Ana G.", loc: "Valencia", text: "Organicé la comunión de mi niña para 80 invitados en una tarde. Menús, intolerancias, RSVP, videoinvitación... El proveedor del local me dijo que nunca había recibido un briefing tan completo." },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div style={{ background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-lg)", padding: "32px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#ffbe0b" color="#ffbe0b"/>)}
                  </div>
                  <p style={{ color: "var(--neutral-300)", lineHeight: 1.7, fontSize: "var(--text-sm)", marginBottom: "20px", fontStyle: "italic" }}>"{t.text}"</p>
                  <div>
                    <div style={{ fontWeight: 700, color: "white", fontSize: "var(--text-sm)" }}>{t.name}</div>
                    <div style={{ color: "var(--neutral-500)", fontSize: "0.8rem" }}>{t.loc}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "var(--section-lg) 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(131,56,236,0.18) 0%, transparent 70%)" }}/>
        <div style={{ position: "relative", maxWidth: "700px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ fontSize: "4rem", marginBottom: "24px", animation: "float 3s ease-in-out infinite" }}>🧞</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.05, color: "white", marginBottom: "24px" }}>
              Tu genio espera.<br/>
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>¿A qué esperas tú?</span>
            </h2>
            <p style={{ color: "var(--neutral-400)", fontSize: "var(--text-lg)", lineHeight: 1.7, marginBottom: "40px" }}>
              La fiesta perfecta está a 10 minutos de distancia.<br/>Sin caos. Sin duplicados. Sin agobios.
            </p>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "var(--gradient-brand)", color: "white", textDecoration: "none", padding: "20px 48px", borderRadius: "var(--radius-full)", fontSize: "1.15rem", fontWeight: 800, boxShadow: "var(--glow-brand)", transition: "all 0.25s ease" }} className="btn-glow">
              <Sparkles size={20}/> Invocar al Genio gratis <ArrowRight size={20}/>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px 32px", background: "var(--surface-elevated)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.4rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "12px" }}>Cumplefy ✨</div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", maxWidth: "260px", lineHeight: 1.6 }}>La plataforma de fiestas infantiles para padres que quieren lo mejor sin el caos.</p>
          </div>
          <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "var(--neutral-400)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "16px" }}>Producto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[["Precios", "/pricing"], ["Entrar", "/sign-in"], ["Registro", "/sign-up"]].map(([label, href]) => (
                  <Link key={href} href={href} style={{ color: "var(--neutral-500)", textDecoration: "none", fontSize: "0.88rem" }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--neutral-400)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "16px" }}>Legal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[["Privacidad", "#"], ["Términos", "#"], ["Cookies", "#"]].map(([label, href]) => (
                  <Link key={label} href={href} style={{ color: "var(--neutral-500)", textDecoration: "none", fontSize: "0.88rem" }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: "1100px", margin: "32px auto 0", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>© 2026 Cumplefy. Todos los derechos reservados.</p>
          <p style={{ color: "var(--neutral-600)", fontSize: "0.8rem" }}>Hecho con ❤️ para padres que se merecen un descanso</p>
        </div>
      </footer>
    </div>
  );
}
