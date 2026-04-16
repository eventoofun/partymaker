"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users, Gift, Video, ExternalLink, Share2, CheckCircle2, Circle,
  Edit2, MessageSquare, UtensilsCrossed, QrCode, ClipboardCheck,
  ListOrdered, Calculator, ShoppingBag, Camera, Mic2, Sparkles,
  Calendar, MapPin, Home, Star, Lock,
} from "lucide-react";
import CohostPanel from "./CohostPanel";

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
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  href, icon: Icon, label, sub, badge, locked, accent,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sub: string;
  badge?: string;
  locked?: boolean;
  accent: string;
}) {
  return (
    <Link
      href={locked ? "#" : href}
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
export default function EventDashboardClient({ eventId, event, stats, role, cohosts, publicUrl }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");

  const theme = THEMES[event.type] ?? THEMES.other;
  const { accent, glow, gradient, emoji } = theme;

  const canEdit = role === "owner" || role === "cohost";

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
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitaciones`} icon={Video} label="Invitación" sub="Crea con IA" accent={accent} />
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
        <SectionTitle accent={accent}>Invitaciones digitales</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitaciones`} icon={Video} label="Videoinvitación IA" sub="Genera un vídeo personalizado con IA" badge="HOT" accent={accent} />
          <ModuleCard href={`/dashboard/eventos/${eventId}/invitacion-hablante`} icon={Mic2} label="Avatar hablante" sub="Anima un retrato con tu voz · InfiniteTalk" accent={accent} />
        </div>

        <SectionTitle accent={accent}>Upsells premium</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ModuleCard href="#" icon={Star} label="Resolución 720p" sub="Vídeo en alta definición · desde 2,99 €" badge="PRO" locked accent={accent} />
          <ModuleCard href="#" icon={Sparkles} label="Resolución 1080p" sub="Calidad cinematográfica · desde 4,99 €" badge="PRO" locked accent={accent} />
        </div>
      </div>
    );
  }

  function tabRegalos() {
    return (
      <div>
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

      <style>{`
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
