"use client";

/**
 * ElAnimador — Sistema de notificaciones "hype" para la página pública del evento.
 * Actúa como animador digital: muestra toasts con actividad social, urgencia
 * y mensajes motivacionales que estimulan la participación y la monetización.
 *
 * Escucha el CustomEvent "partymaker:toast" para toasts externos (ej. añadir al carrito).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "purchase" | "view" | "hype" | "photo" | "flash" | "external";

interface Toast {
  id: string;
  message: string;
  emoji: string;
  type: ToastType;
  accent: string;
}

interface ElAnimadorProps {
  celebrantName: string;
  eventType: string;
  color: string;
  productNames?: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAMES_ES = [
  "María", "Carlos", "Ana", "Pedro", "Laura",
  "Javier", "Sara", "Miguel", "Elena", "Pablo",
  "Sofía", "Diego", "Lucía", "Marcos", "Nuria",
  "Álvaro", "Cristina", "Alejandro", "Irene", "Rubén",
];

const TYPE_HYPE: Record<string, string[]> = {
  birthday:   ["¡Esta fiesta va a ser legendaria!", "El cumpleaños del año está aquí"],
  wedding:    ["El amor está en el aire ✨", "¡La boda más bonita del año!"],
  graduation: ["¡A por el mundo! Gran logro", "¡Graduados y listos para volar!"],
  bachelor:   ["¡La última noche épica!", "¡La despedida más salvaje del año!"],
  communion:  ["Un día que nunca se olvida", "¡Momentos únicos para siempre!"],
  baptism:    ["¡Bienvenido al mundo!", "Un día lleno de amor y alegría"],
  christmas:  ["¡La magia de la Navidad está aquí!", "¡Felices fiestas a todos!"],
  corporate:  ["¡El equipo unido!", "Celebrando grandes logros juntos"],
  other:      ["¡La fiesta del año!", "¡Momentos que duran para siempre!"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildRandomToast(
  celebrantName: string,
  eventType: string,
  color: string,
  productNames: string[],
): Toast {
  const name = pick(NAMES_ES);
  const product = productNames.length > 0 ? pick(productNames) : "un recuerdo del evento";
  const hype = pick(TYPE_HYPE[eventType] ?? TYPE_HYPE.other);
  const viewers = rnd(3, 14);
  const orders = rnd(2, 18);

  const pool: Omit<Toast, "id">[] = [
    // Purchase/activity
    {
      emoji: "🔥",
      message: `${name} acaba de pedir ${product}`,
      type: "purchase",
      accent: color,
    },
    {
      emoji: "💫",
      message: `¡${name} ya tiene su recuerdo del evento!`,
      type: "purchase",
      accent: "#FFB300",
    },
    {
      emoji: "🛍️",
      message: `${orders} invitados han pedido en la tienda hoy`,
      type: "purchase",
      accent: color,
    },
    {
      emoji: "✨",
      message: `${name} está personalizando su pedido ahora mismo`,
      type: "purchase",
      accent: color,
    },
    // View/presence
    {
      emoji: "👀",
      message: `${viewers} personas están mirando la tienda ahora`,
      type: "view",
      accent: "#00C2D1",
    },
    {
      emoji: "🔴",
      message: `${rnd(8, 35)} invitados están online en este evento`,
      type: "view",
      accent: "#06ffa5",
    },
    {
      emoji: "💬",
      message: `${name} y ${rnd(2, 5)} personas más están aquí ahora`,
      type: "view",
      accent: "#00C2D1",
    },
    // Hype/motivational
    {
      emoji: "⚡",
      message: `¡Los recuerdos vuelan! No te quedes sin el tuyo`,
      type: "hype",
      accent: "#FFB300",
    },
    {
      emoji: "🧞",
      message: `El Genio dice: ¡no dejes para mañana lo que puedes llevarte hoy!`,
      type: "hype",
      accent: color,
    },
    {
      emoji: "🎊",
      message: hype,
      type: "hype",
      accent: color,
    },
    {
      emoji: "💎",
      message: `Productos únicos, solo para los invitados de ${celebrantName}`,
      type: "hype",
      accent: color,
    },
    // Photo encouragement
    {
      emoji: "📸",
      message: `¡Sube tu momento épico y aparece en la historia del evento!`,
      type: "photo",
      accent: "#00C2D1",
    },
    {
      emoji: "🌟",
      message: `${name} acaba de subir una foto increíble del evento`,
      type: "photo",
      accent: "#00C2D1",
    },
    {
      emoji: "🎬",
      message: `Las mejores fotos se convertirán en productos exclusivos`,
      type: "photo",
      accent: "#00C2D1",
    },
    // Flash/urgency
    {
      emoji: "⏱️",
      message: `ÚLTIMAS UNIDADES · ¡Consigue tu recuerdo antes de que se agoten!`,
      type: "flash",
      accent: "#ef4444",
    },
    {
      emoji: "🔔",
      message: `Varios invitados tienen productos en el carrito ahora mismo`,
      type: "flash",
      accent: "#FFB300",
    },
  ];

  const t = pick(pool);
  return { ...t, id: Math.random().toString(36).slice(2, 10) };
}

// ─── Accent colors per type ───────────────────────────────────────────────────

const TYPE_BG: Record<ToastType, string> = {
  purchase: "rgba(255,255,255,0.03)",
  view:     "rgba(0,194,209,0.06)",
  hype:     "rgba(255,176,0,0.06)",
  photo:    "rgba(0,194,209,0.06)",
  flash:    "rgba(239,68,68,0.06)",
  external: "rgba(255,255,255,0.05)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ElAnimador({
  celebrantName,
  eventType,
  color,
  productNames = [],
}: ElAnimadorProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((prev) => [...prev, toast].slice(-3)); // max 3 visible
      // Auto-dismiss after 5.5s
      setTimeout(() => removeToast(toast.id), 5500);
    },
    [removeToast],
  );

  // Listen for external toasts via CustomEvent (e.g., "added to cart")
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ message: string; emoji: string; accent?: string }>).detail;
      addToast({
        id: Math.random().toString(36).slice(2, 10),
        message: detail.message,
        emoji: detail.emoji,
        type: "external",
        accent: detail.accent ?? color,
      });
    }
    window.addEventListener("partymaker:toast", handler);
    return () => window.removeEventListener("partymaker:toast", handler);
  }, [addToast, color]);

  // Auto-generate random toasts
  useEffect(() => {
    let cancelled = false;

    function scheduleNext() {
      const delay = rnd(12_000, 22_000);
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        addToast(buildRandomToast(celebrantName, eventType, color, productNames));
        scheduleNext();
      }, delay);
    }

    // First toast after a 7-second warmup
    const warmup = setTimeout(() => {
      if (cancelled) return;
      addToast(buildRandomToast(celebrantName, eventType, color, productNames));
      scheduleNext();
    }, 7_000);

    return () => {
      cancelled = true;
      clearTimeout(warmup);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [celebrantName, eventType, color, productNames, addToast]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "20px",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
        maxWidth: "300px",
        width: "calc(100vw - 40px)",
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: -48, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, scale: 0.92, transition: { duration: 0.25 } }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: TYPE_BG[toast.type],
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${toast.accent}28`,
              borderLeft: `3px solid ${toast.accent}`,
              borderRadius: "14px",
              padding: "10px 14px 10px 12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
              pointerEvents: "auto",
              cursor: "default",
              /* glass dark bg */
              backgroundColor: "rgba(8,8,18,0.88)",
            }}
          >
            {/* Emoji */}
            <span style={{ fontSize: "1.15rem", flexShrink: 0, lineHeight: 1 }}>
              {toast.emoji}
            </span>

            {/* Message */}
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.45,
                flex: 1,
                fontWeight: 500,
              }}
            >
              {toast.message}
            </p>

            {/* Close */}
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.28)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              <X size={11} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
