"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, Gift, Video,
  ExternalLink, Clock, Users, Utensils,
  Music, Camera, Car, Cake, Gamepad2, Mic2, Star,
  CheckCircle, XCircle, HelpCircle, Loader2,
  Share2, Check, ListOrdered, ShoppingBag, X, Zap,
  Image as ImageIcon, Heart, Upload,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import ElAnimador from "@/components/ElAnimador";

const HeroCanvas = dynamic(() => import("@/components/HeroCanvas"), { ssr: false });

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface EventData {
  id: string;
  slug: string;
  type: string;
  celebrantName: string;
  celebrantAge: number | null;
  description: string | null;
  eventDate: string | null;
  eventTime: string | null;
  endDate: string | null;
  endTime: string | null;
  venue: string | null;
  venueAddress: string | null;
  dressCode: string | null;
  coverUrl: string | null;
  brandingColor: string | null;
  allowRsvp: boolean;
  allowGifts: boolean;
  rsvpDeadline: string | null;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
}

export interface WishItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  quantityWanted: number;
  quantityTaken: number;
  collectedAmount: number;
  contributorCount: number;
}

export interface VideoData {
  id: string;
  status: string;
  videoUrlHorizontal: string | null;
  thumbnailUrl: string | null;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string | null;
  type: string;
  icon: string | null;
}

export interface StoreVariant {
  id: string;
  name: string;
  priceCents: number;
  attributes: Record<string, string>;
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  type: string;
  requiresQuote: boolean;
  assets: Array<{ id: string; type: string; url: string }>;
  variants: StoreVariant[];
}

export interface StoreData {
  id: string;
  title: string | null;
  description: string | null;
  products: StoreProduct[];
}

interface Props {
  event: EventData;
  items: WishItem[];
  latestVideo: VideoData | null;
  itinerary: ItineraryItem[];
  store: StoreData | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
  bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
  christmas: "Navidad", corporate: "Empresa", other: "Fiesta",
};

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", graduation: "🎓", bachelor: "🥂",
  communion: "✝️", baptism: "👶", christmas: "🎄", corporate: "🏢", other: "🎉",
};

const TYPE_COLOR: Record<string, string> = {
  birthday: "#FF4D6D", wedding: "#C4956A", graduation: "#00C2D1",
  bachelor: "#FFB300", communion: "#A78BFA", baptism: "#67E8F9",
  christmas: "#DC2626", corporate: "#6B7280", other: "#FF4D6D",
};

const ITINERARY_ICONS: Record<string, React.ElementType> = {
  ceremony:  Star,
  reception: Users,
  dinner:    Utensils,
  dance:     Music,
  speech:    Mic2,
  cake:      Cake,
  games:     Gamepad2,
  photo:     Camera,
  transport: Car,
  other:     Star,
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ─── SHARE BUTTON ─────────────────────────────────────────────────────────────

function ShareButton({ url, title, color }: { url: string; title: string; color: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "10px 18px", borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: state === "copied" ? "#06ffa5" : "var(--neutral-300)",
        fontSize: "0.85rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {state === "copied" ? <Check size={14} /> : <Share2 size={14} />}
      {state === "copied" ? "¡Copiado!" : "Compartir"}
    </button>
  );
}

// ─── ADD TO CALENDAR ──────────────────────────────────────────────────────────

function buildGoogleCalUrl(event: EventData, typeLabel: string) {
  if (!event.eventDate) return null;
  const d = event.eventDate.replace(/-/g, "");
  const tStart = event.eventTime ? event.eventTime.replace(":", "") + "00" : "120000";
  const endD = (event.endDate ?? event.eventDate).replace(/-/g, "");
  const tEnd = event.endTime ? event.endTime.replace(":", "") + "00" : "180000";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${typeLabel} de ${event.celebrantName}`,
    dates: `${d}T${tStart}/${endD}T${tEnd}`,
    details: event.description ?? "",
    location: event.venueAddress ?? event.venue ?? "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function AddToCalendarButton({ event, typeLabel, color }: { event: EventData; typeLabel: string; color: string }) {
  const [open, setOpen] = useState(false);
  const url = buildGoogleCalUrl(event, typeLabel);
  if (!url || !event.eventDate) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "10px 18px", borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "var(--neutral-300)", fontSize: "0.85rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        <Calendar size={14} /> Añadir al calendario
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
          background: "rgba(18,18,32,0.97)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
          padding: "6px",
          minWidth: "200px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}>
          {[
            { label: "Google Calendar", href: url },
            {
              label: "Apple / iCal (.ics)", href: `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(typeLabel + " de " + event.celebrantName)}%0ADTSTART:${event.eventDate.replace(/-/g,"") + "T" + (event.eventTime?.replace(":","") ?? "12") + "0000Z"}%0ADTEND:${(event.endDate ?? event.eventDate).replace(/-/g,"") + "T" + (event.endTime?.replace(":","") ?? "18") + "0000Z"}%0ALOCATION:${encodeURIComponent(event.venueAddress ?? event.venue ?? "")}%0ADESCRIPTION:${encodeURIComponent(event.description ?? "")}%0AEND:VEVENT%0AEND:VCALENDAR`,
              download: "evento.ics",
            },
            { label: "Outlook (online)", href: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(typeLabel + " de " + event.celebrantName)}&startdt=${event.eventDate}&enddt=${event.endDate ?? event.eventDate}&location=${encodeURIComponent(event.venueAddress ?? event.venue ?? "")}&body=${encodeURIComponent(event.description ?? "")}` },
          ].map(({ label, href, download }: { label: string; href: string; download?: string }) => (
            <a key={label} href={href} target={download ? undefined : "_blank"} rel="noopener noreferrer"
              download={download}
              onClick={() => setOpen(false)}
              style={{
                display: "block", padding: "9px 14px",
                borderRadius: "8px", color: "var(--neutral-300)",
                fontSize: "0.83rem", fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${color}18`)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────

function Countdown({ date, color }: { date: string; color: string }) {
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });

  useEffect(() => {
    const target = new Date(date + "T12:00:00").getTime();
    const tick = () => {
      const delta = target - Date.now();
      if (delta <= 0) { setDiff({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      setDiff({
        d: Math.floor(delta / 86400000),
        h: Math.floor((delta % 86400000) / 3600000),
        m: Math.floor((delta % 3600000) / 60000),
        s: Math.floor((delta % 60000) / 1000),
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);

  if (diff.past) return null;

  return (
    <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
      {[{ v: diff.d, l: "días" }, { v: diff.h, l: "horas" }, { v: diff.m, l: "min" }, { v: diff.s, l: "seg" }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div
            className="countdown-box"
            style={{
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800,
              color: "white", fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(v).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.66rem", color: "var(--neutral-500)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WISH CARD ────────────────────────────────────────────────────────────────

const GENIE_MSGS = [
  "¡Este deseo acaba de nacer! Sé el primero en hacer la magia ✨",
  "El deseo ha empezado a brillar… ¡cada aportación cuenta! 🌟",
  "¡El genio siente la energía! Estamos a casi un cuarto del camino 🔥",
  "¡Vamos a mitad! La magia está funcionando de verdad 💫",
  "¡Más de la mitad conseguido! El deseo ya puede verse 🧞",
  "¡Estamos cerca! Un último empujón y lo conseguimos 🎯",
  "¡CASI! El genio está preparando el último conjuro… ¡Anímate! ⚡",
  "¡DESEO CONCEDIDO! La magia ha funcionado. ¡Gracias a todos! 🎉✨",
];

function genieMessage(pct: number, isGranted: boolean) {
  if (isGranted) return GENIE_MSGS[7];
  const idx = Math.min(Math.floor(pct / 15), 6);
  return GENIE_MSGS[idx];
}

function WishCard({ item, slug, color }: { item: WishItem; slug: string; color: string }) {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true });

  const hasGoal = item.price !== null && item.price > 0;
  const pct = hasGoal
    ? Math.min(Math.round((item.collectedAmount / item.price!) * 100), 100)
    : item.contributorCount > 0 ? 50 : 0;
  const remaining = hasGoal ? Math.max(0, item.price! - item.collectedAmount) : null;
  const isGranted = hasGoal && item.collectedAmount >= item.price!;
  const unavailable = !item.isAvailable || isGranted;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={!unavailable ? { y: -5, transition: { duration: 0.25 } } : {}}
      style={{
        borderRadius: "22px",
        background: "rgba(255,255,255,0.03)",
        border: isGranted
          ? "1px solid rgba(6,255,165,0.4)"
          : !item.isAvailable
            ? "1px solid rgba(255,255,255,0.05)"
            : `1px solid ${color}30`,
        overflow: "hidden",
        opacity: !item.isAvailable ? 0.5 : 1,
        display: "flex", flexDirection: "column",
        boxShadow: !unavailable ? `0 0 50px ${color}08` : "none",
        position: "relative",
      }}
    >
      {/* Top glow line */}
      {!unavailable && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px", zIndex: 2,
          background: `linear-gradient(90deg, transparent 0%, ${color} 30%, #FFB300 70%, transparent 100%)`,
        }} />
      )}

      {/* Image */}
      {item.imageUrl ? (
        <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", position: "relative", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(8,8,24,0.92) 0%, rgba(8,8,24,0.3) 45%, transparent 100%)",
          }} />
          {/* DESEO badge */}
          {!isGranted && (
            <div style={{
              position: "absolute", top: "12px", left: "12px",
              padding: "4px 12px", borderRadius: "999px",
              background: "rgba(8,8,24,0.7)", backdropFilter: "blur(10px)",
              border: `1px solid ${color}60`,
              fontSize: "0.65rem", fontWeight: 800, color,
              display: "flex", alignItems: "center", gap: "5px",
              letterSpacing: "0.1em",
            }}>
              ✨ DESEO
            </div>
          )}
          {/* Title overlay on image */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px" }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "white", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {item.title}
            </div>
          </div>
          {/* Granted overlay */}
          {isGranted && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}>
                <span style={{ fontSize: "3.5rem" }}>🎉</span>
              </motion.div>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#06ffa5", letterSpacing: "0.05em" }}>
                ¡DESEO CONCEDIDO!
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          width: "100%", height: "80px", position: "relative", flexShrink: 0,
          background: `linear-gradient(135deg, ${color}18, rgba(255,255,255,0.02))`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px",
        }}>
          <div>
            {!isGranted && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontSize: "0.62rem", fontWeight: 800, color,
                background: `${color}18`, border: `1px solid ${color}35`,
                padding: "3px 9px", borderRadius: "999px", marginBottom: "6px",
                letterSpacing: "0.08em",
              }}>
                ✨ DESEO
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: "0.97rem", color: "white", lineHeight: 1.3 }}>{item.title}</div>
          </div>
          <span style={{ fontSize: "2rem", flexShrink: 0 }}>🌟</span>
        </div>
      )}

      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
        {/* Description (only when no image) */}
        {item.description && !item.imageUrl && (
          <p style={{ color: "var(--neutral-500)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
        )}
        {item.description && item.imageUrl && (
          <p style={{ color: "var(--neutral-500)", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
        )}

        {/* Genie speech bubble */}
        {!isGranted && (
          <div style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            background: `${color}0E`,
            border: `1px solid ${color}22`,
            borderRadius: "14px",
            padding: "11px 14px",
          }}>
            <motion.span
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
              style={{ fontSize: "1.3rem", flexShrink: 0, lineHeight: 1, marginTop: "1px" }}
            >🧞</motion.span>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--neutral-300)", lineHeight: 1.55, fontStyle: "italic" }}>
              &ldquo;{genieMessage(pct, isGranted)}&rdquo;
            </p>
          </div>
        )}

        {/* Progress meter */}
        {hasGoal && !isGranted && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Remaining + percent */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: "0.62rem", color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>
                  Faltan para el deseo
                </div>
                <div style={{ fontSize: "1.7rem", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {formatEuros(remaining!)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.62rem", color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>
                  conseguido
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color, lineHeight: 1 }}>
                  {pct}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: "16px", borderRadius: "999px",
              background: "rgba(255,255,255,0.05)",
              overflow: "hidden",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inVw ? { width: `${Math.max(pct, 2)}%` } : {}}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                style={{
                  height: "100%", borderRadius: "999px",
                  background: `linear-gradient(90deg, ${color}, #FFB300)`,
                  boxShadow: `0 0 16px ${color}70`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                  }}
                />
              </motion.div>
            </div>

            {/* Collected / goal */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--neutral-500)" }}>
              <span>
                <strong style={{ color: "var(--neutral-300)" }}>{formatEuros(item.collectedAmount)}</strong> aportados
              </span>
              <span>
                objetivo <strong style={{ color: "var(--neutral-300)" }}>{formatEuros(item.price!)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* No goal → price as reference */}
        {!hasGoal && item.price && (
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}>
            {formatEuros(item.price)}
          </div>
        )}

        {/* Contributor avatars */}
        {item.contributorCount > 0 && !isGranted && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex" }}>
              {Array.from({ length: Math.min(item.contributorCount, 5) }).map((_, i) => (
                <div key={i} style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: `hsl(${(i * 55 + 200) % 360}, 55%, 48%)`,
                  border: "2px solid var(--surface-bg)",
                  marginLeft: i > 0 ? "-9px" : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem",
                }}>
                  👤
                </div>
              ))}
            </div>
            <span style={{ fontSize: "0.73rem", color: "var(--neutral-400)" }}>
              <strong style={{ color: "white" }}>{item.contributorCount}</strong>{" "}
              {item.contributorCount === 1 ? "persona ha" : "personas han"} aportado ya
            </span>
          </div>
        )}

        {/* Hint when no contributors */}
        {item.contributorCount === 0 && !isGranted && item.isAvailable && (
          <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", fontStyle: "italic" }}>
            Aporta la cantidad que quieras — cada euro cuenta
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: "2px" }}>
          {!unavailable ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/e/${slug}/regalo?item=${item.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  width: "100%", padding: "14px 20px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${color} 0%, #FFB300 100%)`,
                  color: "white", fontSize: "0.9rem",
                  textDecoration: "none", fontWeight: 800,
                  letterSpacing: "0.02em",
                  boxShadow: `0 6px 24px ${color}45`,
                }}
              >
                🧞 Aportar al deseo
              </Link>
            </motion.div>
          ) : isGranted ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "14px",
              fontSize: "0.88rem", fontWeight: 700, color: "#06ffa5",
              background: "rgba(6,255,165,0.08)",
              borderRadius: "14px", border: "1px solid rgba(6,255,165,0.2)",
            }}>
              🎉 ¡Deseo concedido!
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "12px",
              fontSize: "0.8rem", color: "var(--neutral-600)",
            }}>
              No disponible
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── RSVP FORM ───────────────────────────────────────────────────────────────

type RsvpStatus = "attending" | "not_attending" | "maybe";

function RsvpForm({ eventId, color }: { eventId: string; color: string }) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/rsvp/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId, name: name.trim(),
          email: email.trim() || undefined,
          status, adults, children,
          dietaryRestrictions: dietary.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setStep("done");
    } catch {
      setError("Ha ocurrido un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    const config: Record<RsvpStatus, { emoji: string; title: string; body: string }> = {
      attending:     { emoji: "🎉", title: "¡Nos vemos en la fiesta!", body: "Tu confirmación ha sido registrada. ¡Va a ser una noche increíble!" },
      not_attending: { emoji: "💌", title: "Gracias por avisarnos", body: "Lamentamos que no puedas venir. ¡Te echaremos de menos!" },
      maybe:         { emoji: "🤔", title: "¡Entendido!", body: "Hemos apuntado tu respuesta. ¡Esperamos verte allí!" },
    };
    const c = config[status];
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>{c.emoji}</div>
        <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{c.title}</h3>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.88rem" }}>{c.body}</p>
      </div>
    );
  }

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "white", fontSize: "0.92rem", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const lblSt: React.CSSProperties = {
    display: "block", marginBottom: "6px",
    fontSize: "0.72rem", fontWeight: 700,
    color: "var(--neutral-500)",
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Status */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {([
          { v: "attending" as const,     label: "Sí, asistiré",       icon: CheckCircle, c: "#06ffa5" },
          { v: "not_attending" as const, label: "No podré asistir",   icon: XCircle,     c: "#ef4444" },
          { v: "maybe" as const,         label: "Quizás pueda ir",    icon: HelpCircle,  c: "#f59e0b" },
        ] as const).map(({ v, label, icon: Icon, c }) => (
          <button
            key={v} type="button"
            onClick={() => setStatus(v)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "13px 18px", borderRadius: "12px",
              border: status === v ? `2px solid ${c}` : "1px solid rgba(255,255,255,0.08)",
              background: status === v ? `${c}10` : "rgba(255,255,255,0.03)",
              color: status === v ? c : "var(--neutral-400)",
              cursor: "pointer", fontWeight: status === v ? 700 : 500,
              fontSize: "0.92rem", transition: "all 0.2s",
              textAlign: "left", fontFamily: "inherit",
            }}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {/* Name + Email */}
      <div className="rsvp-two-col">
        <div>
          <label style={lblSt}>Nombre *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required style={inputSt} />
        </div>
        <div>
          <label style={lblSt}>Email (opcional)</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@email.com" style={inputSt} />
        </div>
      </div>

      {/* Adults + Children */}
      {status !== "not_attending" && (
        <div className="rsvp-two-col">
          {([
            { label: "Adultos", value: adults, set: setAdults, min: 1 },
            { label: "Niños",   value: children, set: setChildren, min: 0 },
          ] as const).map(({ label, value, set, min }) => (
            <div key={label}>
              <label style={lblSt}>{label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button type="button" onClick={() => set(Math.max(min, value - 1))} style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white", cursor: "pointer", fontSize: "1.1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>−</button>
                <span style={{ fontWeight: 700, fontSize: "1rem", minWidth: "20px", textAlign: "center" }}>{value}</span>
                <button type="button" onClick={() => set(Math.min(20, value + 1))} style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white", cursor: "pointer", fontSize: "1.1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dietary */}
      {status !== "not_attending" && (
        <div>
          <label style={lblSt}>Alergias / dieta (opcional)</label>
          <input value={dietary} onChange={e => setDietary(e.target.value)} placeholder="Sin gluten, vegetariano, alérgico a..." style={inputSt} />
        </div>
      )}

      {/* Note */}
      <div>
        <label style={lblSt}>Mensaje para el organizador (opcional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="¡Allí estaremos! / Llegaremos un poco tarde..."
          style={{ ...inputSt, resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{
          padding: "14px 24px", borderRadius: "12px", border: "none",
          background: loading || !name.trim() ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${color}, #FFB300)`,
          color: "white", fontWeight: 700, fontSize: "0.95rem",
          cursor: loading || !name.trim() ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          transition: "all 0.2s", fontFamily: "inherit",
        }}
      >
        {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</> : "Confirmar asistencia"}
      </button>
    </form>
  );
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({ icon, title, subtitle, color }: {
  icon: React.ReactNode; title: string; subtitle?: string; color: string;
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: subtitle ? "6px" : 0 }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "11px",
          background: `${color}18`, border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center", color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "white", margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ color: "var(--neutral-500)", fontSize: "0.84rem", paddingLeft: "50px", margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

// ─── ITINERARY ────────────────────────────────────────────────────────────────

function ItineraryTimeline({ items, color }: { items: ItineraryItem[]; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {items.map((item, i) => {
        const IconComp = ITINERARY_ICONS[item.type] ?? Star;
        const isLast = i === items.length - 1;
        return (
          <div key={item.id} style={{ display: "flex", gap: "16px" }}>
            {/* Left: time */}
            <div style={{ width: "52px", flexShrink: 0, textAlign: "right", paddingTop: "2px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: color, fontVariantNumeric: "tabular-nums" }}>
                {item.time}
              </span>
            </div>

            {/* Center: line + dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: `${color}18`, border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.icon ? (
                  <span style={{ fontSize: "0.75rem" }}>{item.icon}</span>
                ) : (
                  <IconComp size={12} style={{ color }} />
                )}
              </div>
              {!isLast && (
                <div style={{
                  width: "2px", flex: 1, minHeight: "28px",
                  background: `linear-gradient(to bottom, ${color}40, ${color}10)`,
                  marginTop: "4px", marginBottom: "4px",
                }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : "24px", paddingTop: "2px" }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "white", marginBottom: item.description ? "4px" : 0 }}>
                {item.title}
              </div>
              {item.description && (
                <p style={{ color: "var(--neutral-500)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EVENT STORE ─────────────────────────────────────────────────────────────

const PRODUCT_TYPE_EMOJI: Record<string, string> = {
  POD_2D_APPAREL:   "👕",
  POD_2D_ACCESSORY: "☕",
  POD_2D_PRINT:     "🖼️",
  POD_3D_DECOR:     "🎨",
  POD_3D_FIGURE:    "🏆",
  POD_3D_GIFT:      "🎁",
  CUSTOM_ONE_OFF:   "✨",
};

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  POD_2D_APPAREL:   "Ropa personalizada",
  POD_2D_ACCESSORY: "Accesorio",
  POD_2D_PRINT:     "Impresión",
  POD_3D_DECOR:     "Decoración 3D",
  POD_3D_FIGURE:    "Figura 3D exclusiva",
  POD_3D_GIFT:      "Regalo 3D",
  CUSTOM_ONE_OFF:   "Exclusivo",
};

// ─── VIEWER COUNT HOOK ────────────────────────────────────────────────────────

function useViewerCount(base: number) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(Math.max(1, base + Math.floor(Math.random() * 5) - 2));
    }, Math.floor(Math.random() * 20_000) + 15_000);
    return () => clearInterval(id);
  }, [base]);
  return count;
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  color,
  isBestseller,
  soldCount,
  onClick,
}: {
  product: StoreProduct;
  color: string;
  isBestseller: boolean;
  soldCount: number;
  onClick: () => void;
}) {
  const baseViewers = useRef(Math.floor(Math.random() * 8) + 2).current;
  const viewers = useViewerCount(baseViewers);
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true });

  const cover = product.assets.find((a) => a.type === "preview" || a.type === "mockup")?.url;
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;
  const is3D = product.type.startsWith("POD_3D");
  const priceLabel = minPrice !== null
    ? (product.variants.length > 1 ? `Desde ${formatEuros(minPrice)}` : formatEuros(minPrice))
    : "Consultar precio";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      onClick={onClick}
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: `0 0 0 0 ${color}00`,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${color}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top glow line */}
      {isBestseller && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px", zIndex: 3,
          background: `linear-gradient(90deg, transparent, #FFB300, ${color}, transparent)`,
        }} />
      )}

      {/* Badges top-left */}
      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, display: "flex", flexDirection: "column", gap: "5px" }}>
        {isBestseller && (
          <div style={{
            padding: "3px 9px", borderRadius: "999px",
            background: "linear-gradient(135deg, #FFB300, #ff8c00)",
            color: "black", fontSize: "0.6rem", fontWeight: 800,
            letterSpacing: "0.06em", backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(255,176,0,0.4)",
          }}>🔥 MÁS PEDIDO</div>
        )}
        {is3D && (
          <div style={{
            padding: "3px 9px", borderRadius: "999px",
            background: `${color}DD`,
            color: "white", fontSize: "0.6rem", fontWeight: 800,
            letterSpacing: "0.04em",
            boxShadow: `0 2px 8px ${color}50`,
          }}>🏆 EXCLUSIVO 3D</div>
        )}
      </div>

      {/* Live viewers badge top-right */}
      <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "3px 9px", borderRadius: "999px",
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.85)", fontSize: "0.62rem", fontWeight: 700,
        }}>
          <span style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: "#06ffa5", display: "inline-block",
            boxShadow: "0 0 6px #06ffa5",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          {viewers} mirando
        </div>
      </div>

      {/* Image — square aspect ratio */}
      <div style={{
        width: "100%", aspectRatio: "1/1",
        background: `radial-gradient(ellipse at 50% 50%, ${color}12 0%, rgba(10,10,20,0.6) 100%)`,
        overflow: "hidden", position: "relative",
      }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "4rem",
          }}>
            {PRODUCT_TYPE_EMOJI[product.type] ?? "📦"}
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(8,8,20,0.98) 0%, rgba(8,8,20,0.4) 60%, transparent 100%)",
        }} />

        {/* Price + name overlay on image */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
          <div style={{
            fontWeight: 800, fontSize: "0.88rem", color: "white",
            lineHeight: 1.25, marginBottom: "4px",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            {product.name}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 900, color }}>
            {priceLabel}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.75rem" }}>{PRODUCT_TYPE_EMOJI[product.type]}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--neutral-500)", fontWeight: 600 }}>
            {PRODUCT_TYPE_LABEL[product.type] ?? product.type}
          </span>
        </div>

        {soldCount > 0 && (
          <span style={{
            fontSize: "0.67rem", color: "var(--neutral-500)", fontWeight: 600,
          }}>
            {soldCount} pedidos
          </span>
        )}

        <motion.span
          whileHover={{ scale: 1.05 }}
          style={{
            fontSize: "0.7rem", padding: "4px 10px", borderRadius: "99px",
            background: `linear-gradient(135deg, ${color}CC, #FFB300CC)`,
            color: "white", fontWeight: 700, cursor: "pointer",
          }}
        >
          Ver →
        </motion.span>
      </div>
    </motion.div>
  );
}

// ─── MOMENTOS ÉPICOS ──────────────────────────────────────────────────────────

interface EventPhoto {
  id: string;
  url: string;
  guestName: string | null;
  caption: string | null;
  likes: number;
  status: "pending" | "approved" | "rejected";
}

function MomentosEpicos({
  color, celebrantName, eventId,
}: { color: string; celebrantName: string; eventId: string }) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [justLiked, setJustLiked] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const ref = useRef(null);
  const inVw = useInView(ref, { once: true });

  // Load photos on mount, then poll every 30s to pick up moderation changes
  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch(`/api/eventos/${eventId}/momentos`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled || !d.photos) return;
          // Merge: keep locally-uploaded pending photos that aren't on server yet
          setPhotos((prev) => {
            const serverIds = new Set(d.photos.map((p: EventPhoto) => p.id));
            const localOnly = prev.filter((p) => !serverIds.has(p.id));
            return [...localOnly, ...d.photos];
          });
        })
        .catch(() => {});
    }
    load();
    const timer = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [eventId]);

  async function uploadFiles(files: File[], name: string) {
    setUploading(true);
    const uploaded: EventPhoto[] = [];

    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (name.trim()) fd.append("guestName", name.trim());

        const res = await fetch(`/api/eventos/${eventId}/momentos`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) continue;
        const { photo } = await res.json();
        uploaded.push(photo);
      } catch {
        // skip failed uploads silently
      }
    }

    setPhotos((prev) => [...uploaded, ...prev].slice(0, 50));
    setUploading(false);
    setShowNameInput(false);
    setPendingFiles([]);

    if (uploaded.length > 0 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("partymaker:toast", {
        detail: {
          message: `¡${uploaded.length > 1 ? `${uploaded.length} momentos épicos` : "Tu momento épico"} ya en el evento! 🌟`,
          emoji: "📸", accent: "#00C2D1",
        },
      }));
    }
  }

  function handleFiles(files: FileList) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 5);
    if (arr.length === 0) return;
    setPendingFiles(arr);
    setShowNameInput(true);
  }

  async function handleLike(photo: EventPhoto) {
    if (likedIds.has(photo.id)) return;
    setLikedIds((prev) => new Set([...prev, photo.id]));
    setJustLiked(photo.id);
    setTimeout(() => setJustLiked(null), 600);

    // Optimistic update
    setPhotos((prev) =>
      prev.map((p) => p.id === photo.id ? { ...p, likes: p.likes + 1 } : p)
    );
    await fetch(`/api/eventos/${eventId}/momentos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    }).catch(() => {});
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inVw ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <SectionHeader
        icon={<Camera size={17} />}
        title="Momentos épicos"
        subtitle="Sube tus fotos favoritas — las más votadas se convertirán en recuerdos exclusivos"
        color={color}
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className="momentos-upload-zone"
        style={{
          border: `2px dashed ${dragOver ? color : "rgba(255,255,255,0.12)"}`,
          borderRadius: "20px",
          textAlign: "center",
          background: dragOver ? `${color}0A` : "rgba(255,255,255,0.02)",
          transition: "all 0.25s",
          marginBottom: "16px",
        }}
      >
        {uploading ? (
          <div style={{ color: color, fontWeight: 700, fontSize: "0.9rem" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <div>Subiendo tu momento épico...</div>
          </div>
        ) : showNameInput ? (
          <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: "0.9rem", marginBottom: "4px" }}>
              📸 {pendingFiles.length} foto{pendingFiles.length !== 1 ? "s" : ""} lista{pendingFiles.length !== 1 ? "s" : ""}
            </div>
            <div style={{ color: "var(--neutral-500)", fontSize: "0.78rem", marginBottom: "14px" }}>
              ¿Cómo quieres aparecer? (opcional)
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Tu nombre (opcional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") uploadFiles(pendingFiles, guestName); }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                color: "white", fontSize: "0.88rem", marginBottom: "12px", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => uploadFiles(pendingFiles, guestName)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${color}, #FFB300)`,
                  color: "white", fontWeight: 700, fontSize: "0.85rem",
                }}
              >
                ¡Publicar momento! 🚀
              </button>
              <button
                onClick={() => { setShowNameInput(false); setPendingFiles([]); }}
                style={{
                  padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", color: "var(--neutral-400)", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: "2.6rem", marginBottom: "10px", lineHeight: 1 }}
            >
              📸
            </motion.div>
            <div style={{ fontWeight: 800, color: "white", fontSize: "1rem", marginBottom: "4px" }}>
              Inmortaliza este momento
            </div>
            <div style={{ color: "var(--neutral-500)", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: "4px" }}>
              Abre la cámara o elige desde tu galería
            </div>
            {/* Two-button row: camera + gallery */}
            <div className="upload-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "12px 18px", borderRadius: "14px", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${color}, #00a0ad)`,
                  color: "white", fontWeight: 700, fontSize: "0.88rem",
                  minHeight: "48px",
                }}
              >
                <Camera size={16} /> Abrir cámara
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "12px 18px", borderRadius: "14px", cursor: "pointer",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--neutral-300)", fontWeight: 600, fontSize: "0.88rem",
                  minHeight: "48px",
                }}
              >
                <ImageIcon size={16} /> Galería
              </button>
            </div>
          </>
        )}
        {/* Gallery picker (multiple) */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        {/* Camera capture (single shot, environment-facing) */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* El Genio info box */}
      <div style={{
        display: "flex", gap: "12px", alignItems: "flex-start",
        padding: "14px 18px",
        background: `${color}08`,
        border: `1px solid ${color}20`,
        borderRadius: "14px",
        marginBottom: photos.length > 0 ? "20px" : 0,
      }}>
        <motion.span
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 3 }}
          style={{ fontSize: "1.4rem", flexShrink: 0, lineHeight: 1, marginTop: "1px" }}
        >🧞</motion.span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color, marginBottom: "3px" }}>
            El Genio convierte tus fotos en productos
          </div>
          <div style={{ color: "var(--neutral-500)", fontSize: "0.76rem", lineHeight: 1.55 }}>
            Tras el evento, las fotos con más ❤️ podrán convertirse en camisetas,
            pósters, figuras 3D y más — recuerdos únicos de{" "}
            <strong style={{ color: "var(--neutral-400)" }}>{celebrantName}</strong>.
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: "20px" }}
          >
            <div style={{
              fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-600)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: "12px",
            }}>
              {photos.length} momento{photos.length !== 1 ? "s" : ""} épico{photos.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{ aspectRatio: "1/1", borderRadius: "12px", overflow: "hidden", position: "relative", cursor: "pointer" }}
                  onClick={() => handleLike(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url} alt={`Momento ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {/* Guest name overlay */}
                  {photo.guestName && (
                    <div style={{
                      position: "absolute", top: "6px", left: "6px",
                      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                      borderRadius: "999px", padding: "2px 8px",
                      fontSize: "0.62rem", color: "rgba(255,255,255,0.85)", fontWeight: 600,
                    }}>
                      {photo.guestName}
                    </div>
                  )}
                  {/* Status badge for pending */}
                  {photo.status === "pending" && (
                    <div style={{
                      position: "absolute", top: "6px", right: "6px",
                      background: "rgba(255,176,0,0.85)", backdropFilter: "blur(4px)",
                      borderRadius: "999px", padding: "2px 7px",
                      fontSize: "0.58rem", color: "white", fontWeight: 700,
                    }}>
                      En revisión
                    </div>
                  )}
                  {/* Like badge */}
                  <motion.div
                    animate={justLiked === photo.id ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute", bottom: "6px", right: "6px",
                      background: likedIds.has(photo.id) ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.75)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "999px", padding: "3px 8px",
                      fontSize: "0.7rem", color: "white", fontWeight: 700,
                      display: "flex", alignItems: "center", gap: "3px",
                      transition: "background 0.2s",
                    }}
                  >
                    ❤️ {photo.likes}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductModal({
  product,
  eventId,
  color,
  onClose,
  onAddedToCart,
}: {
  product: StoreProduct;
  eventId: string;
  color: string;
  onClose: () => void;
  onAddedToCart: (variantId: string, qty: number, personalization: Record<string, string>) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string>(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [personalization, setPersonalization] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("");

  const variant = product.variants.find((v) => v.id === selectedVariant);

  function handleAdd() {
    if (!selectedVariant) return;
    const pers: Record<string, string> = { ...personalization };
    if (customName.trim()) pers["nombre"] = customName.trim();
    onAddedToCart(selectedVariant, qty, pers);
    onClose();
  }

  const cover = product.assets.find((a) => a.type === "preview" || a.type === "mockup")?.url;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh", overflowY: "auto",
        padding: "28px 24px 40px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--neutral-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              {PRODUCT_TYPE_EMOJI[product.type]} {product.type.replace(/_/g, " ")}
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", lineHeight: 1.2 }}>
              {product.name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "var(--neutral-400)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Image */}
        {cover ? (
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "16px", overflow: "hidden", marginBottom: "20px", background: "rgba(255,255,255,0.04)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "16px", marginBottom: "20px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>
            {PRODUCT_TYPE_EMOJI[product.type] ?? "📦"}
          </div>
        )}

        {product.description && (
          <p style={{ color: "var(--neutral-400)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "20px" }}>
            {product.description}
          </p>
        )}

        {/* Variants */}
        {product.variants.length > 1 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              Variante
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px",
                    border: selectedVariant === v.id ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.12)",
                    background: selectedVariant === v.id ? `${color}15` : "rgba(255,255,255,0.04)",
                    color: selectedVariant === v.id ? color : "var(--neutral-300)",
                    fontSize: "0.85rem", fontWeight: selectedVariant === v.id ? 700 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Personalization name */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Personalización <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span>
          </div>
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="ej. nombre, fecha, mensaje..."
            style={{
              width: "100%", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
              padding: "12px 16px", color: "white", fontSize: "0.9rem",
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Qty + Add */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Qty */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", overflow: "hidden" }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "48px", background: "rgba(255,255,255,0.04)", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>−</button>
            <div style={{ width: "44px", textAlign: "center", color: "white", fontWeight: 700 }}>{qty}</div>
            <button onClick={() => setQty(Math.min(99, qty + 1))} style={{ width: "40px", height: "48px", background: "rgba(255,255,255,0.04)", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>+</button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={!selectedVariant}
            style={{
              flex: 1, padding: "14px", borderRadius: "14px", border: "none",
              background: `linear-gradient(135deg, ${color}, #FFB300)`,
              color: "white", fontSize: "0.95rem", fontWeight: 700,
              cursor: selectedVariant ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: selectedVariant ? 1 : 0.5,
            }}
          >
            <ShoppingBag size={17} />
            {variant ? `Añadir · ${formatEuros(variant.priceCents * qty)}` : "Añadir al carrito"}
          </button>
        </div>

        {product.requiresQuote && (
          <p style={{ marginTop: "12px", color: "var(--neutral-500)", fontSize: "0.78rem", textAlign: "center" }}>
            Este producto requiere confirmación de precio. Te contactaremos tras el pedido.
          </p>
        )}
      </div>
    </div>
  );
}

function EventStoreSection({ store, eventId, color }: { store: StoreData; eventId: string; color: string }) {
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [cart, setCart] = useState<Array<{ variantId: string; qty: number; productName: string; priceCents: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);

  // Assign stable bestseller + sold-count values per product (stable across renders)
  const productMeta = useRef<Map<string, { isBestseller: boolean; soldCount: number }>>(new Map()).current;
  store.products.forEach((p, i) => {
    if (!productMeta.has(p.id)) {
      productMeta.set(p.id, {
        isBestseller: i === 0 || Math.random() < 0.3,
        soldCount: Math.floor(Math.random() * 22) + 3,
      });
    }
  });

  function handleAddToCart(variantId: string, qty: number, _personalization: Record<string, string>) {
    const product = store.products.find((p) => p.variants.some((v) => v.id === variantId));
    if (!product) return;
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    const label = product.name + (variant.name !== "Único" ? ` · ${variant.name}` : "");
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.variantId === variantId);
      if (existing >= 0) {
        return prev.map((i, idx) => idx === existing ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { variantId, qty, productName: label, priceCents: variant.priceCents }];
    });
    setCartOpen(true);
    // 🔔 Notify ElAnimador
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("partymaker:toast", {
        detail: {
          message: `¡${label} añadido al carrito! 🛍️`,
          emoji: "🛒",
          accent: color,
        },
      }));
    }
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const has3D = store.products.some((p) => p.type.startsWith("POD_3D"));

  if (store.products.length === 0) return null;

  return (
    <>
      {/* ── Section header ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "11px",
                background: `${color}18`, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center", color,
                flexShrink: 0,
              }}>
                <ShoppingBag size={17} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "white", margin: 0 }}>
                {store.title ?? "Recuerdos exclusivos"}
              </h2>
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.83rem", paddingLeft: "50px", margin: 0 }}>
              {store.description ?? `Llévate un pedazo de este momento para siempre ✨`}
            </p>
          </div>

          {cartCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCartOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "11px 18px", borderRadius: "14px", border: "none",
                background: `linear-gradient(135deg, ${color}, #FFB300)`,
                color: "white", fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 800,
                cursor: "pointer", flexShrink: 0,
                boxShadow: `0 4px 20px ${color}40`,
              }}
            >
              <ShoppingBag size={15} />
              {cartCount} · {formatEuros(cartTotal)}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Flash banner (3D launch offer) ── */}
      {has3D && flashVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "12px",
            padding: "12px 18px", marginBottom: "20px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(255,176,0,0.12), rgba(239,68,68,0.08))",
            border: "1px solid rgba(255,176,0,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontSize: "1.2rem" }}
            >⚡</motion.span>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFB300", letterSpacing: "0.05em" }}>
                OFERTA DE LANZAMIENTO
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--neutral-300)" }}>
                Las primeras figuras 3D con precio especial · Solo para invitados
              </div>
            </div>
          </div>
          <button
            onClick={() => setFlashVisible(false)}
            style={{ background: "none", border: "none", color: "var(--neutral-600)", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* ── Products grid ── */}
      <div className="gifts-grid">
        {store.products.map((product) => {
          const meta = productMeta.get(product.id) ?? { isBestseller: false, soldCount: 0 };
          return (
            <ProductCard
              key={product.id}
              product={product}
              color={color}
              isBestseller={meta.isBestseller}
              soldCount={meta.soldCount}
              onClick={() => setSelectedProduct(product)}
            />
          );
        })}
      </div>

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          eventId={eventId}
          color={color}
          onClose={() => setSelectedProduct(null)}
          onAddedToCart={handleAddToCart}
        />
      )}

      {/* Mini cart overlay */}
      <AnimatePresence>
        {cartOpen && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 150,
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "#0d0d1c",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "24px 24px 0 0",
                width: "100%", maxWidth: "520px",
                padding: "24px 18px 48px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={18} style={{ color }} /> Tu carrito ({cartCount})
                </h3>
                <button onClick={() => setCartOpen(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "var(--neutral-400)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {cart.map((item) => (
                  <div key={item.variantId} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "14px",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.88rem" }}>{item.productName}</div>
                      <div style={{ color: "var(--neutral-500)", fontSize: "0.76rem" }}>× {item.qty}</div>
                    </div>
                    <div style={{ color, fontWeight: 800, fontSize: "0.95rem" }}>{formatEuros(item.priceCents * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--neutral-400)", fontSize: "0.9rem" }}>Total (sin envío)</span>
                <span style={{ color: "white", fontWeight: 900, fontSize: "1.2rem" }}>{formatEuros(cartTotal)}</span>
              </div>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                href={`/e/${window.location.pathname.split("/e/")[1]?.split("/")[0]}/carrito?items=${encodeURIComponent(JSON.stringify(cart.map((i) => ({ variantId: i.variantId, qty: i.qty }))))}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "16px", borderRadius: "16px",
                  background: `linear-gradient(135deg, ${color}, #FFB300)`,
                  color: "white", textAlign: "center", textDecoration: "none",
                  fontWeight: 800, fontSize: "0.97rem",
                  boxShadow: `0 6px 24px ${color}40`,
                }}
              >
                <ShoppingBag size={17} /> Ir al checkout →
              </motion.a>

              <p style={{ textAlign: "center", color: "var(--neutral-600)", fontSize: "0.74rem", marginTop: "10px" }}>
                Envío gestionado por el organizador
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function EpicEventClient({ event, items, latestVideo, itinerary, store }: Props) {
  const color = event.brandingColor ?? TYPE_COLOR[event.type] ?? "#FF4D6D";
  const typeLabel = TYPE_LABEL[event.type] ?? "Celebración";
  const slug = event.slug;
  const publicUrl = typeof window !== "undefined" ? window.location.href : `https://cumplefy.com/e/${slug}`;
  const availableItems = items.filter((i) => i.isAvailable && i.quantityTaken < i.quantityWanted);
  const hasMap = !!(event.venueAddress || event.venue);
  const mapQuery = encodeURIComponent(event.venueAddress ?? event.venue ?? "");

  // cardStyle: padding handled by .event-card CSS class for responsiveness
  const cardStyle: React.CSSProperties = {
    borderRadius: "20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div style={{ background: "var(--surface-bg)", minHeight: "100dvh", overflowX: "hidden" }}>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "10px 16px",
        background: "rgba(2,4,9,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "10px",
      }}>
        <Link href="/" style={{
          fontWeight: 800, fontSize: "1rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          textDecoration: "none", flexShrink: 0,
        }}>
          Cumplefy ✨
        </Link>
        {/* Nav links — horizontal scroll on mobile, no scrollbar */}
        <div className="event-nav-links">
          {itinerary.length > 0 && (
            <a href="#programa" style={{
              padding: "7px 11px", borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--neutral-500)", fontSize: "0.74rem", fontWeight: 600,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
              whiteSpace: "nowrap", minHeight: "34px",
            }}>
              <ListOrdered size={11} /> Programa
            </a>
          )}
          {hasMap && (
            <a href="#lugar" style={{
              padding: "7px 11px", borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--neutral-500)", fontSize: "0.74rem", fontWeight: 600,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
              whiteSpace: "nowrap", minHeight: "34px",
            }}>
              <MapPin size={11} /> Lugar
            </a>
          )}
          {items.length > 0 && event.allowGifts && (
            <a href="#regalos" style={{
              padding: "7px 11px", borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--neutral-400)", fontSize: "0.74rem", fontWeight: 600,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
              whiteSpace: "nowrap", minHeight: "34px",
            }}>
              <Gift size={11} /> Regalos
            </a>
          )}
          {store && store.products.length > 0 && (
            <a href="#tienda" style={{
              padding: "7px 11px", borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--neutral-400)", fontSize: "0.74rem", fontWeight: 600,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
              whiteSpace: "nowrap", minHeight: "34px",
            }}>
              <ShoppingBag size={11} /> Tienda
            </a>
          )}
          <a href="#momentos" style={{
            padding: "7px 11px", borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--neutral-400)", fontSize: "0.74rem", fontWeight: 600,
            textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
            whiteSpace: "nowrap", minHeight: "34px",
          }}>
            <Camera size={11} /> Fotos
          </a>
          {event.allowRsvp && (
            <a href="#rsvp" style={{
              padding: "7px 14px", borderRadius: "999px",
              background: `linear-gradient(135deg, ${color}, #FFB300)`,
              color: "white", fontSize: "0.76rem", fontWeight: 700,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "5px",
              whiteSpace: "nowrap", minHeight: "34px",
            }}>
              <Users size={11} /> Confirmar
            </a>
          )}
        </div>
      </nav>

      {/* ══ STICKY MOBILE CTA (bottom bar, only on small screens) ═══════════ */}
      {event.allowRsvp && (
        <div className="event-mobile-cta">
          <a href="#momentos" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            padding: "13px 16px", borderRadius: "14px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem",
            flex: 1,
          }}>
            <Camera size={15} /> Subir foto
          </a>
          <a href="#rsvp" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            padding: "13px 16px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${color}, #FFB300)`,
            color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem",
            flex: 1,
            boxShadow: `0 4px 20px ${color}40`,
          }}>
            <Users size={15} /> Confirmar asistencia
          </a>
        </div>
      )}

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "90dvh",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
        paddingTop: "72px",
      }}>
        {event.coverUrl ? (
          <>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${event.coverUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "brightness(0.28) saturate(1.3)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse 70% 55% at 50% 40%, ${color}22 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />
          </>
        ) : (
          <HeroCanvas />
        )}

        <div style={{
          position: "absolute", inset: 0,
          background: event.coverUrl
            ? undefined
            : `radial-gradient(ellipse 65% 50% at 50% 38%, ${color}16 0%, transparent 68%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "280px",
          background: "linear-gradient(to top, var(--surface-bg) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: "100%", maxWidth: "760px", margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          position: "relative", zIndex: 1,
          padding: "clamp(24px, 6vw, 48px) 20px clamp(60px, 10vw, 80px)",
          gap: "20px",
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: "5rem", lineHeight: 1, animation: "float-slow 7s ease-in-out infinite" }}
          >
            {TYPE_EMOJI[event.type] ?? "🎉"}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 16px", borderRadius: "999px",
              background: `${color}16`, border: `1px solid ${color}38`,
              color, fontWeight: 700, fontSize: "0.78rem",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {TYPE_LABEL[event.type] ?? "Celebración"}
              {event.celebrantAge ? ` · ${event.celebrantAge} años` : ""}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
              lineHeight: 1.05, letterSpacing: "-0.04em",
              color: "white", maxWidth: "680px", margin: 0,
            }}
          >
            ¡Estás invitado/a a la{" "}
            <span style={{
              background: `linear-gradient(135deg, ${color}, #FFB300)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              fiesta de {event.celebrantName}
            </span>!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6 }}
            style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}
          >
            {event.eventDate && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-300)", fontSize: "0.9rem" }}>
                <Calendar size={15} style={{ color }} />
                {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-ES", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                {event.eventTime && (
                  event.endTime
                    ? ` · ${event.eventTime} – ${event.endTime}h`
                    : ` · ${event.eventTime}h`
                )}
              </div>
            )}
            {event.venue && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neutral-300)", fontSize: "0.9rem" }}>
                <MapPin size={15} style={{ color: "#FFB300" }} />
                {event.venue}
              </div>
            )}
          </motion.div>

          {event.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              style={{ color: "var(--neutral-400)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "520px", margin: 0 }}
            >
              {event.description}
            </motion.p>
          )}

          {event.dressCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "999px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--neutral-300)", fontSize: "0.82rem",
              }}
            >
              👔 Dress code: {event.dressCode}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}
          >
            {latestVideo && (
              <a href="#videoinvitacion" style={{
                padding: "12px 24px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${color}, #FFB300)`,
                color: "white", textDecoration: "none", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem",
              }}>
                <Video size={17} /> Ver videoinvitación
              </a>
            )}
            {event.allowRsvp && (
              <a href="#rsvp" style={{
                padding: "12px 24px", borderRadius: "12px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "white", textDecoration: "none", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem",
              }}>
                <Users size={17} /> Confirmar asistencia
              </a>
            )}
          </motion.div>

          {event.eventDate && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                <Clock size={11} /> Cuenta atrás
              </div>
              <Countdown date={event.eventDate} color={color} />
            </motion.div>
          )}

          {/* Share + Calendar row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}
          >
            <ShareButton url={publicUrl} title={`${typeLabel} de ${event.celebrantName}`} color={color} />
            <AddToCalendarButton event={event} typeLabel={typeLabel} color={color} />
          </motion.div>
        </div>
      </section>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: "760px", margin: "0 auto" }} className="event-sections">

        {/* VIDEO INVITATION */}
        {latestVideo && (
          <Section id="videoinvitacion">
            <SectionHeader icon={<Video size={17} />} title="Videoinvitación" color={color} />
            <div style={{
              ...cardStyle,
              padding: 0,
              overflow: "hidden",
              border: `1px solid ${color}25`,
            }}>
              {latestVideo.status === "ready" && latestVideo.videoUrlHorizontal ? (
                <video
                  controls
                  poster={latestVideo.thumbnailUrl ?? undefined}
                  style={{ width: "100%", display: "block", borderRadius: "20px" }}
                >
                  <source src={latestVideo.videoUrlHorizontal} type="video/mp4" />
                </video>
              ) : (
                <div style={{
                  aspectRatio: "16/9",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "16px", position: "relative",
                  background: `radial-gradient(ellipse at 50% 50%, ${color}12 0%, transparent 70%)`,
                }}>
                  <div style={{ fontSize: "3.5rem" }}>🎬</div>
                  <p style={{ color: "var(--neutral-400)", fontSize: "0.9rem", margin: 0 }}>
                    {latestVideo.status === "rendering" ? "⏳ El vídeo se está generando..." : "La videoinvitación estará disponible próximamente"}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* RSVP */}
        {event.allowRsvp && (
          <Section id="rsvp">
            <SectionHeader
              icon={<Users size={17} />}
              title="¿Vendrás a la fiesta?"
              subtitle="Confirma tu asistencia en menos de un minuto"
              color={color}
            />
            {event.rsvpDeadline && (() => {
              const deadline = new Date(event.rsvpDeadline!);
              const isPast = deadline < new Date();
              return (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "5px 13px", borderRadius: "999px",
                  background: isPast ? "rgba(239,68,68,0.1)" : `${color}12`,
                  border: `1px solid ${isPast ? "rgba(239,68,68,0.3)" : color + "35"}`,
                  color: isPast ? "#ef4444" : color,
                  fontSize: "0.76rem", fontWeight: 700,
                  marginBottom: "16px",
                }}>
                  <Clock size={12} />
                  {isPast ? "Plazo de confirmación cerrado" : `Confirma antes del ${deadline.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`}
                </div>
              );
            })()}
            <div style={cardStyle} className="event-card">
              <RsvpForm eventId={event.id} color={color} />
            </div>
          </Section>
        )}

        {/* GIFTS */}
        {items.length > 0 && event.allowGifts && (
          <Section id="regalos">
            <SectionHeader
              icon={<Gift size={17} />}
              title="Lista de regalos"
              subtitle={`${availableItems.length} ${availableItems.length === 1 ? "regalo disponible" : "regalos disponibles"}`}
              color={color}
            />
            <div className="gifts-grid">
              {items.map((item) => (
                <WishCard key={item.id} item={item} slug={slug} color={color} />
              ))}
            </div>
          </Section>
        )}

        {/* STORE */}
        {store && store.products.length > 0 && (
          <Section id="tienda">
            <EventStoreSection store={store} eventId={event.id} color={color} />
          </Section>
        )}

        {/* MOMENTOS ÉPICOS */}
        <Section id="momentos">
          <MomentosEpicos color={color} celebrantName={event.celebrantName} eventId={event.id} />
        </Section>

        {/* ITINERARY */}
        {itinerary.length > 0 && (
          <Section id="programa">
            <SectionHeader
              icon={<Clock size={17} />}
              title="Programa del evento"
              subtitle={`${itinerary.length} momentos especiales`}
              color={color}
            />
            <div style={cardStyle}>
              <ItineraryTimeline items={itinerary} color={color} />
            </div>
          </Section>
        )}

        {/* MAP */}
        {hasMap && (
          <Section id="lugar">
            <SectionHeader
              icon={<MapPin size={17} />}
              title="Cómo llegar"
              subtitle={event.venueAddress ?? event.venue ?? ""}
              color="#FFB300"
            />
            <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "16/7" }}>
              <iframe
                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=15`}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación: ${event.venue ?? ""}`}
              />
            </div>
            {event.venueAddress && (
              <a
                href={`https://maps.google.com/?q=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  marginTop: "12px", color: "var(--neutral-500)",
                  fontSize: "0.8rem", textDecoration: "none",
                }}
              >
                <ExternalLink size={12} /> Abrir en Google Maps
              </a>
            )}
          </Section>
        )}

        {/* ORGANIZER */}
        <Section id="organizador">
          <div style={{
            display: "flex", alignItems: "center", gap: "20px",
            padding: "24px 28px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {event.ownerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.ownerAvatarUrl}
                alt={event.ownerName ?? "Organizador"}
                style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: `${color}20`, border: `2px solid ${color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", flexShrink: 0,
              }}>
                {TYPE_EMOJI[event.type] ?? "🎉"}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                Organizado por
              </div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>
                {event.ownerName ?? "El organizador"}
              </div>
            </div>
            <div style={{
              padding: "5px 12px", borderRadius: "999px",
              background: `${color}12`, border: `1px solid ${color}30`,
              color, fontSize: "0.72rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Cumplefy ✨
            </div>
          </div>
        </Section>

      </div>

      {/* ══ EL ANIMADOR ════════════════════════════════════════════════════ */}
      <ElAnimador
        celebrantName={event.celebrantName}
        eventType={event.type}
        color={color}
        productNames={store?.products.map((p) => p.name) ?? []}
      />

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 24px 80px",
        textAlign: "center",
        color: "var(--neutral-600)",
        fontSize: "0.76rem",
      }}>
        Celebración gestionada con{" "}
        <Link href="/" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Cumplefy</Link>
        {" "}✨ —{" "}
        <Link href="/sign-up" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Crea tu propia celebración gratis</Link>
      </footer>

      {/* ══ MOBILE STICKY CTA ═══════════════════════════════════════════════ */}
      {event.allowRsvp && (
        <div className="mobile-rsvp-bar" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
          padding: "12px 16px",
          background: "rgba(2,4,9,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <a href="#rsvp" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            width: "100%", padding: "14px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${color}, #FFB300)`,
            color: "white", fontSize: "0.95rem", fontWeight: 800,
            textDecoration: "none",
            boxShadow: `0 4px 24px ${color}50`,
            letterSpacing: "0.01em",
          }}>
            <Users size={17} /> Confirmar asistencia
          </a>
        </div>
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        @media (max-width: 580px) {
          .gifts-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) {
          .mobile-rsvp-bar { display: none !important; }
        }
        .nav-links::-webkit-scrollbar { display: none; }
        .nav-links { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
