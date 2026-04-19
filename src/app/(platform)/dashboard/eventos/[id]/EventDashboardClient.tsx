"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Gift, Video, ExternalLink, Share2, CheckCircle2, Circle,
  Edit2, MessageSquare, UtensilsCrossed, QrCode, ClipboardCheck,
  ListOrdered, Calculator, ShoppingBag, Camera, Mic2, Sparkles,
  Calendar, MapPin, Home, Star, Lock,
} from "lucide-react";
import CohostPanel from "./CohostPanel";
import { toast } from "sonner";

// ─── Theme map ────────────────────────────────────────────────────────────────
const THEMES: Record<string, {
  accent: string;
  glow: string;
  gradient: string;
  emoji: string;
  label: string;
  tagline: string;
}> = {
  birthday:   { accent: "#FF6B35", glow: "rgba(255,107,53,0.18)",   gradient: "linear-gradient(135deg,#FF6B35 0%,#FF9F1C 100%)", emoji: "🎂", label: "Cumpleaños",  tagline: "Que la magia empiece aquí" },
  wedding:    { accent: "#C8992A", glow: "rgba(200,153,42,0.18)",   gradient: "linear-gradient(135deg,#C8992A 0%,#F5C842 100%)", emoji: "💍", label: "Boda",        tagline: "El día más especial de tu vida" },
  graduation: { accent: "#3B82F6", glow: "rgba(59,130,246,0.18)",   gradient: "linear-gradient(135deg,#3B82F6 0%,#6366F1 100%)", emoji: "🎓", label: "Graduación",  tagline: "El futuro empieza hoy" },
  bachelor:   { accent: "#EC4899", glow: "rgba(236,72,153,0.18)",   gradient: "linear-gradient(135deg,#EC4899 0%,#A855F7 100%)", emoji: "🥂", label: "Despedida",   tagline: "La última noche de libertad" },
  communion:  { accent: "#22C55E", glow: "rgba(34,197,94,0.18)",    gradient: "linear-gradient(135deg,#22C55E 0%,#10B981 100%)", emoji: "✝️", label: "Comunión",    tagline: "Un momento sagrado y especial" },
  baptism:    { accent: "#60A5FA", glow: "rgba(96,165,250,0.18)",   gradient: "linear-gradient(135deg,#60A5FA 0%,#93C5FD 100%)", emoji: "👶", label: "Bautizo",     tagline: "Bienvenido al mundo" },
  christmas:  { accent: "#EF4444", glow: "rgba(239,68,68,0.18)",    gradient: "linear-gradient(135deg,#EF4444 0%,#16A34A 100%)", emoji: "🎄", label: "Navidad",     tagline: "La magia de la Navidad" },
  corporate:  { accent: "#00C2D1", glow: "rgba(0,194,209,0.18)",    gradient: "linear-gradient(135deg,#00C2D1 0%,#0891B2 100%)", emoji: "🏢", label: "Empresa",     tagline: "Profesionalismo y estilo" },
  other:      { accent: "#A78BFA", glow: "rgba(167,139,250,0.18)",  gradient: "linear-gradient(135deg,#A78BFA 0%,#EC4899 100%)", emoji: "🎉", label: "Evento",      tagline: "Momentos únicos e irrepetibles" },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "inicio",        label: "Inicio",        icon: Home },
  { id: "invitados",     label: "Invitados",     icon: Users },
  { id: "invitaciones",  label: "Invitaciones",  icon: Video },
  { id: "regalos",       label: "Regalos",       icon: Gift },
  { id: "gestion",       label: "Gestión",       icon: ClipboardCheck },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Stats {
  totalGuests: number;
  attending: number;
  totalItems: number;
  availableItems: number;
  totalBudget: number;
  totalSpent: number;
  videoCount: number;
}

interface EventData {
  id: string;
  type: string;
  celebrantName: string;
  celebrantAge?: number | null;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  description?: string | null;
  status: string;
  slug: string;
}

interface Cohost {
  userId: string;
  role: "cohost" | "operator" | "viewer";
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Props {
  eventId: string;
  event: EventData;
  stats: Stats;
  role: "owner" | "cohost" | "operator" | "viewer";
  cohosts: Cohost[];
  publicUrl: string;
  userPlan: "free" | "pro";
  eventPaid: boolean;
  isNew?: boolean;
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  href, icon: Icon, label, sub, badge, locked, accent, onLockedClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sub: string;
  badge?: string;
  locked?: boolean;
  accent: string;
  onLockedClick?: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (locked && onLockedClick) {
      e.preventDefault();
      onLockedClick();
    }
  };

  return (
    <Link
      href={locked ? "#" : href}
      onClick={handleClick}
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "16px 18px",
        background: "var(--surface-card)",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.18s ease",
        opacity: locked ? 0.55 : 1,
        cursor: locked ? "not-allowed" : "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        width: "42px", height: "42px",
        borderRadius: "12px",
        background: `${accent}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={19} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
          {label}
          {badge && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 700,
              background: accent, color: "#fff",
              padding: "2px 7px", borderRadius: "20px",
            }}>{badge}</span>
          )}
          {locked && <Lock size={12} style={{ color: "var(--neutral-500)" }} />}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </div>
      </div>
      <div style={{ color: "var(--neutral-400)", flexShrink: 0 }}>›</div>
    </Link>
  );
}

// ─── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: accent,
      marginTop: "24px", marginBottom: "8px",
    }}>
      <div style={{ width: "20px", height: "2px", background: accent, borderRadius: "2px" }} />
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
// ─── Genio upsell messages per event type ────────────────────────────────────
const GENIO_UPSELL: Record<string, string> = {
  birthday:   "Por lo que cuesta un café, tu hijo va a ser el héroe de la fiesta con una videoinvitación que fliparán todos. ☕🎂",
  wedding:    "Por menos de un cóctel, tus invitados recibirán la invitación de boda más épica que han visto. 💍✨",
  graduation: "¿De verdad vas a graduarte sin una invitación que lo celebre a lo grande? Solo €4,99. 🎓🚀",
  bachelor:   "La última noche de libertad merece la invitación más épica. ¿O no? 🥂😏",
  communion:  "Los invitados se van a emocionar con una videoinvitación así de especial. Y tú también. ✝️🌟",
  baptism:    "Dale la bienvenida al mundo como se merece. Una invitación que nadie va a olvidar. 👶💫",
  christmas:  "¿En serio vas a mandar un mensaje de texto por Navidad? Con esto lo petarás. 🎄🎅",
  corporate:  "Tus invitados merecen algo más que un email genérico. Impacta de verdad. 🏢💼",
  other:      "Por €4,99 conviertes tu evento en algo que nadie va a olvidar. ¿A qué esperas? 🎉✨",
};

export default function EventDashboardClient({ eventId, event, stats, role, cohosts, publicUrl, userPlan, eventPaid, isNew }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [unlocking, setUnlocking] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const theme = THEMES[event.type] ?? THEMES.other;
  const { accent, glow, gradient, emoji } = theme;

  const isUnlocked = userPlan === "pro" || eventPaid;
  const canEdit = role === "owner" || role === "cohost";

  // Show Genio upsell bubble after 12s if not unlocked
  useEffect(() => {
    if (isUnlocked) return;
    const t = setTimeout(() => setShowUpsell(true), 12000);
    return () => clearTimeout(t);
  }, [isUnlocked]);

  async function handleUnlock() {
    if (unlocking) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/stripe/checkout-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      const msg = data.error ?? `Error del servidor (${res.status}). Inténtalo de nuevo.`;
      setUnlockError(msg);
      toast.error(msg);
    } catch (err) {
      const msg = "Error de conexión. Comprueba tu red e inténtalo de nuevo.";
      setUnlockError(msg);
      toast.error(err instanceof Error ? err.message : msg);
    } finally {
      setUnlocking(false);
    }
  }

  // ── Progress for setup guide ──
  const setupSteps = [
    stats.totalGuests > 0,
    stats.totalItems > 0,
    stats.videoCount > 0,
    !!event.venue,
  ];
  const setupDone = setupSteps.filter(Boolean).length;
  const setupPct = Math.round((setupDone / setupSteps.length) * 100);

  // ── Tab content builders ──
  function tabInicio() {
    return (
      <div>
        {/* Onboarding wizard banner — shown on first visit */}
        {isNew && (
          <div style={{
            background: "linear-gradient(135deg, rgba(131,56,236,0.12) 0%, rgba(255,51,102,0.08) 100%)",
            border: "1px solid rgba(131,56,236,0.3)",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "1.5rem" }}>🧞</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>¡Bienvenido! El Genio te guía</div>
                <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)" }}>3 pasos para dejar tu evento listo</div>
              </div>
            </div>
            {[
              { step: 1, emoji: "✨", label: "Crea tu invitación mágica", sub: "Sube una foto y el Genio la transforma con IA · gratis", href: `/dashboard/eventos/${eventId}/invitaciones` },
              { step: 2, emoji: "🎁", label: "Añade tu lista de deseos", sub: "La lámpara mágica busca regalos con IA y los añade a tu página pública", href: `/dashboard/eventos/${eventId}/lista-deseos` },
              { step: 3, emoji: "👥", label: "Invita a tus amigos", sub: "Gestiona confirmaciones y RSVP en tiempo real", href: `/dashboard/eventos/${eventId}/invitados` },
            ].map((item) => (
              <Link key={item.step} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 14px", marginBottom: "6px",
                background: "var(--surface-card)",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.06)",
                textDecoration: "none", color: "inherit",
                transition: "box-shadow 0.15s",
              }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{item.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginTop: "1px" }}>{item.sub}</div>
                </div>
                <span style={{ color: "var(--neutral-400)", fontSize: "1rem" }}>›</span>
              </Link>
            ))}
          </div>
        )}

        {/* Unlock error message */}
        {unlockError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "10px 14px", marginBottom: "14px",
            fontSize: "0.82rem", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{unlockError}</span>
            <button onClick={() => setUnlockError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1rem", lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Stats 2×2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Confirmados", value: `${stats.attending}/${stats.totalGuests}`, icon: Users },
            { label: "Regalos", value: `${stats.availableItems}/${stats.totalItems}`, icon: Gift },
            { label: "Presupuesto", value: stats.totalBudget > 0 ? `${stats.totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €` : "—", icon: Calculator },
            { label: "Estado", value: event.status === "published" ? "Publicado" : event.status === "draft" ? "Borrador" : "Archivado", icon: Calendar },
          ].map((s) => (
            <div key={s.label} style={{
              background: "var(--surface-card)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: accent }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Setup guide */}
        {setupPct < 100 && (
          <div style={{
            background: `linear-gradient(135deg, ${glow.replace("0.18", "0.12")} 0%, rgba(0,0,0,0.02) 100%)`,
            border: `1px solid ${accent}33`,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>🧞</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Configura tu evento</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)" }}>{setupDone} de {setupSteps.length} pasos</div>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: accent }}>{setupPct}%</span>
            </div>
            <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${setupPct}%`, height: "100%", background: gradient, borderRadius: "99px", transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
              {[
                { done: stats.totalGuests > 0, label: "Añade invitados", href: `/dashboard/eventos/${eventId}/invitados` },
                { done: stats.totalItems > 0,  label: "Crea lista de regalos", href: `/dashboard/eventos/${eventId}/lista-deseos` },
                { done: stats.videoCount > 0,  label: "Crea una invitación", href: `/dashboard/eventos/${eventId}/invitaciones` },
                { done: !!event.venue,         label: "Añade el lugar del evento", href: `/dashboard/eventos/${eventId}/editar` },
              ].map((step) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {step.done
                    ? <CheckCircle2 size={16} style={{ color: "#16A34A", flexShrink: 0 }} />
                    : <Circle size={16} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
                  }
                  <span style={{ flex: 1, fontSize: "0.82rem", color: step.done ? "var(--neutral-400)" : "#1C1C1E", textDecoration: step.done ? "line-through" : "none" }}>
                    {step.label}
                  </span>
                  {!step.done && (
                    <Link href={step.href} style={{ fontSize: "0.72rem", fontWeight: 700, color: accent, textDecoration: "none" }}>
                      Configurar →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <SectionTitle accent={accent}>Acciones rápidas</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitados`} icon={Users} label="Invitados" sub={`${stats.totalGuests} añadidos`} accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitaciones`} icon={Sparkles} label="Invitación mágica" sub="Imagen IA del protagonista · gratis" accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/lista-deseos`} icon={Gift} label="Regalos" sub={`${stats.availableItems} disponibles`} accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/presupuesto`} icon={Calculator} label="Presupuesto" sub={stats.totalBudget > 0 ? `${stats.totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €` : "Control de costes"} accent={accent} />
        </div>
      </div>
    );
  }

  function tabInvitados() {
    return (
      <div>
        <SectionTitle accent={accent}>Gestión de personas</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitados`} icon={Users} label="Invitados" sub={`${stats.totalGuests} invitados · gestiona tu lista`} accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/rsvp`} icon={ClipboardCheck} label="RSVP" sub={`${stats.attending} confirmados · respuestas en tiempo real`} accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/catering`} icon={UtensilsCrossed} label="Catering" sub="Menús, alergias y restricciones" accent={accent} />
        </div>

        <SectionTitle accent={accent}>Comunicación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/comunicaciones`} icon={MessageSquare} label="Comunicaciones" sub="Emails, WhatsApp y recordatorios" accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/operaciones`} icon={QrCode} label="Check-in QR" sub="Acceso rápido y control de entrada" accent={accent} />
        </div>
      </div>
    );
  }

  function tabInvitaciones() {
    return (
      <div>
        {/* FREE: magic image invitation */}
        <SectionTitle accent={accent}>Invitación mágica · gratis ✨</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard
            href={`/dashboard/eventos/${eventId}/invitaciones`}
            icon={Sparkles}
            label="Imagen mágica del Genio"
            sub="Sube una foto y el Genio la transforma con IA · siempre gratis"
            badge="GRATIS"
            accent={accent}
          />
        </div>

        {/* LOCKED: Video & Avatar upgrades */}
        <SectionTitle accent={accent}>Actualiza a Vídeo IA · €4,99 🔒</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard
            href={`/dashboard/eventos/${eventId}/invitaciones`}
            icon={Video}
            label="Videoinvitación IA"
            sub={isUnlocked ? "Genera un vídeo personalizado con IA" : "Anima la imagen con IA · desbloquea por €4,99"}
            badge="HOT"
            locked={!isUnlocked}
            onLockedClick={handleUnlock}
            accent={accent}
          />
          <ModuleCard
            href={`/dashboard/eventos/${eventId}/invitacion-hablante`}
            icon={Mic2}
            label="Avatar hablante"
            sub={isUnlocked ? "Anima un retrato con tu voz · InfiniteTalk" : "Retrato que habla con tu voz · desbloquea por €4,99"}
            locked={!isUnlocked}
            onLockedClick={handleUnlock}
            accent={accent}
          />
        </div>

        {/* Unlock error */}
        {unlockError && (
          <div style={{
            marginTop: "10px", padding: "10px 14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", fontSize: "0.82rem", color: "#ef4444",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{unlockError}</span>
            <button onClick={() => setUnlockError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1rem", lineHeight: 1 }}>×</button>
          </div>
        )}

        {!isUnlocked && (
          <div
            onClick={handleUnlock}
            style={{
              marginTop: "16px",
              padding: "16px 18px",
              background: `linear-gradient(135deg, ${accent}22 0%, ${accent}0a 100%)`,
              border: `1px solid ${accent}44`,
              borderRadius: "14px",
              cursor: unlocking ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ fontSize: "1.8rem" }}>🧞</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                Desbloquea las funciones IA · €4,99
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                Videoinvitación + Avatar hablante para este evento · pago único
              </div>
            </div>
            <div style={{
              background: accent,
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "0.8rem",
              fontWeight: 700,
              flexShrink: 0,
              opacity: unlocking ? 0.6 : 1,
            }}>
              {unlocking ? "Cargando…" : "Desbloquear →"}
            </div>
          </div>
        )}

        {isUnlocked && (
          <>
            <SectionTitle accent={accent}>Calidad de exportación</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <ModuleCard href="#" icon={Star} label="Resolución 720p" sub="Vídeo en alta definición · desde 2,99 €" badge="PRO" locked accent={accent} />
              <ModuleCard href="#" icon={Sparkles} label="Resolución 1080p" sub="Calidad cinematográfica · desde 4,99 €" badge="PRO" locked accent={accent} />
            </div>
          </>
        )}
      </div>
    );
  }

  function tabRegalos() {
    return (
      <div>
        {/* Genio magic lamp tip */}
        <Link href={`/dashboard/eventos/${eventId}/lista-deseos`} style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "14px 16px", marginBottom: "16px",
          background: "linear-gradient(135deg, rgba(255,179,0,0.12) 0%, rgba(0,194,209,0.08) 100%)",
          border: "1px solid rgba(255,179,0,0.3)",
          borderRadius: "14px",
          textDecoration: "none", color: "inherit",
        }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🧞</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "3px" }}>La Lámpara Mágica</div>
            <div style={{ fontSize: "0.76rem", color: "var(--neutral-500)", lineHeight: 1.45 }}>
              El Genio busca regalos con IA y los añade directamente a tu página pública.
              ¡Tus invitados verán exactamente qué regalar!
            </div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#FFB300", marginTop: "6px" }}>
              Abrir el buscador mágico →
            </div>
          </div>
        </Link>

        <SectionTitle accent={accent}>Lista de deseos</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/lista-deseos`} icon={Gift} label="Lista de regalos" sub={`${stats.availableItems} de ${stats.totalItems} disponibles`} accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/regalos`} icon={Gift} label="Regalos recibidos" sub="Lleva el control de lo que ya tienes" accent={accent} />
        </div>

        <SectionTitle accent={accent}>Tienda</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/tienda`} icon={ShoppingBag} label="Tienda del evento" sub="Vende merch y artículos personalizados" accent={accent} />
        </div>
      </div>
    );
  }

  function tabGestion() {
    return (
      <div>
        <SectionTitle accent={accent}>Planificación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/programa`} icon={ListOrdered} label="Programa" sub="Itinerario y momentos del evento" accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/presupuesto`} icon={Calculator} label="Presupuesto" sub={stats.totalBudget > 0 ? `${stats.totalBudget.toLocaleString("es-ES", { maximumFractionDigits: 0 })} € presupuestados · ${stats.totalSpent.toLocaleString("es-ES", { maximumFractionDigits: 0 })} € gastados` : "Control de costes"} accent={accent} />
        </div>

        <SectionTitle accent={accent}>Durante el evento</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/operaciones`} icon={QrCode} label="Check-in" sub="Control de entrada con QR" accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/momentos`} icon={Camera} label="Momentos épicos" sub="Fotos de invitados · Galería compartida" accent={accent} />
        </div>

        {role === "owner" && (
          <>
            <SectionTitle accent={accent}>Equipo</SectionTitle>
            <CohostPanel eventId={eventId} initialHosts={cohosts} />
          </>
        )}
      </div>
    );
  }

  const tabContent: Record<TabId, () => React.ReactNode> = {
    inicio:       tabInicio,
    invitados:    tabInvitados,
    invitaciones: tabInvitaciones,
    regalos:      tabRegalos,
    gestion:      tabGestion,
  };

  return (
    <div style={{ maxWidth: "760px", position: "relative" }}>

      {/* Ambient glow blob */}
      <div style={{
        position: "fixed", top: "60px", right: "-80px",
        width: "320px", height: "320px",
        borderRadius: "50%",
        background: glow,
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Header card ── */}
      <div style={{
        background: "var(--surface-card)",
        borderRadius: "20px",
        padding: "28px 28px 24px",
        marginBottom: "16px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: `0 2px 20px ${glow}`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Gradient strip at top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: gradient }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "52px", height: "52px",
              borderRadius: "14px",
              background: gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.6rem",
              flexShrink: 0,
              boxShadow: `0 4px 16px ${glow}`,
            }}>
              {emoji}
            </div>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {theme.label} de {event.celebrantName}
                {event.celebrantAge ? ` · ${event.celebrantAge} años` : ""}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}>
                {event.eventDate && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--neutral-500)" }}>
                    <Calendar size={12} />
                    {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    {event.eventTime && ` · ${event.eventTime}`}
                  </span>
                )}
                {event.venue && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--neutral-500)" }}>
                    <MapPin size={12} />
                    {event.venue}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {canEdit && (
              <Link href={`/dashboard/eventos/${eventId}/editar`} className="btn btn--ghost" style={{ textDecoration: "none", fontSize: "0.78rem", padding: "7px 12px" }}>
                <Edit2 size={13} /> Editar
              </Link>
            )}
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textDecoration: "none", fontSize: "0.78rem", padding: "7px 12px" }}>
              <ExternalLink size={13} /> Ver pública
            </a>
          </div>
        </div>

        {/* Share URL strip */}
        <div style={{
          marginTop: "16px",
          padding: "9px 14px",
          background: "rgba(0,0,0,0.03)",
          borderRadius: "10px",
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex", gap: "8px", alignItems: "center",
        }}>
          <Share2 size={13} style={{ color: "var(--neutral-500)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.76rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {publicUrl}
          </span>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: "flex",
        gap: "4px",
        padding: "5px",
        background: "var(--surface-card)",
        borderRadius: "16px",
        border: "1px solid rgba(0,0,0,0.06)",
        marginBottom: "16px",
        overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: "1 1 0",
                minWidth: "80px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "10px 8px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                background: isActive ? gradient : "transparent",
                color: isActive ? "#fff" : "var(--neutral-500)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.72rem",
                transition: "all 0.2s ease",
                boxShadow: isActive ? `0 2px 12px ${glow}` : "none",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div
        key={activeTab}
        style={{
          animation: "fadeInTab 0.2s ease",
        }}
      >
        {tabContent[activeTab]()}
      </div>

      {/* ── Genio upsell bubble ── */}
      {showUpsell && !isUnlocked && (
        <div
          style={{
            position: "fixed",
            bottom: 112,
            right: 28,
            maxWidth: "300px",
            background: "#0D1117",
            border: "1px solid rgba(0,194,209,0.3)",
            borderRadius: "16px",
            padding: "14px 16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,194,209,0.1)",
            zIndex: 9997,
            animation: "fadeInUpsell 0.3s ease",
          }}
        >
          <button
            onClick={() => setShowUpsell(false)}
            style={{ position: "absolute", top: "8px", right: "10px", background: "none", border: "none", cursor: "pointer", color: "#4a5568", fontSize: "16px", lineHeight: 1 }}
          >×</button>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🧞</span>
            <div>
              <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.5, marginBottom: "10px" }}>
                {GENIO_UPSELL[event.type] ?? GENIO_UPSELL.other}
              </div>
              <button
                onClick={() => { setShowUpsell(false); handleUnlock(); }}
                style={{
                  background: "linear-gradient(135deg,#00C2D1,#FFB300)",
                  color: "#020409",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Desbloquear por €4,99 →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUpsell {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
