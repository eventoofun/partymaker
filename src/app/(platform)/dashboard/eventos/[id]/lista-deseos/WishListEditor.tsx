"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Link2, ExternalLink, Trash2, Check, Gift, Zap, AlertTriangle, ArrowLeft } from "lucide-react";
import { formatEuros, fundingPercent } from "@/lib/utils";
import type { Event, WishList, WishItem } from "@/db/schema";

type WishListWithItems = WishList & { items: WishItem[] };
type EventWithWishList = Event & { wishList: WishListWithItems | null };

interface Props {
  event: EventWithWishList;
  wishList: WishListWithItems;
}

const CATEGORIES = [
  { value: "juguete", label: "Juguete" },
  { value: "ropa", label: "Ropa" },
  { value: "libro", label: "Libro" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "experiencia", label: "Experiencia" },
  { value: "deporte", label: "Deporte" },
  { value: "otro", label: "Otro" },
];

const PRIORITIES = [
  { value: "alta", label: "⭐ Alta" },
  { value: "media", label: "Normal" },
  { value: "baja", label: "Baja" },
];

const STATUS_DOT: Record<string, string> = {
  available: "#06ffa5",
  partially_funded: "#f59e0b",
  funded: "#f59e0b",
  purchased: "#94a3b8",
  reserved: "#94a3b8",
};

// ─── Genie SVG Component ──────────────────────────────────────────────────────

type GenieMood = "cool" | "happy" | "warning" | "angry";

function GenieSVG({ mood, size = 120 }: { mood: GenieMood; size?: number }) {
  const colors: Record<GenieMood, { body: string; glow: string }> = {
    cool:    { body: "#8338ec", glow: "rgba(131,56,236,0.3)" },
    happy:   { body: "#06ffa5", glow: "rgba(6,255,165,0.3)" },
    warning: { body: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
    angry:   { body: "#ff3366", glow: "rgba(255,51,102,0.35)" },
  };
  const c = colors[mood];

  return (
    <div style={{
      width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
      filter: `drop-shadow(0 0 12px ${c.glow})`,
      transition: "filter 0.4s ease",
      flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Smoke/body trail */}
        <path d="M60 115 Q42 98 48 80 Q54 62 60 70 Q66 78 72 62 Q78 46 60 38"
          stroke={c.body} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.35"/>
        <path d="M60 115 Q42 98 48 80 Q54 62 60 70 Q66 78 72 62 Q78 46 60 38"
          stroke={c.body} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>

        {/* Head */}
        <ellipse cx="60" cy="34" rx="22" ry="26" fill="#1a1a2e"/>
        <ellipse cx="60" cy="34" rx="16" ry="20" fill="#12122a"/>

        {/* Leather jacket collar */}
        <path d="M38 48 Q45 55 60 52 Q75 55 82 48" stroke="#2a1a3e" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M50 52 L46 60" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round"/>
        <path d="M70 52 L74 60" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round"/>

        {/* Eyes — sunglasses */}
        {mood === "cool" && (
          <>
            <rect x="38" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <rect x="64" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <line x1="56" y1="31" x2="64" y2="31" stroke={c.body} strokeWidth="1.5"/>
            {/* Cool shine */}
            <ellipse cx="43" cy="29" rx="3" ry="2" fill="white" opacity="0.3"/>
            <ellipse cx="69" cy="29" rx="3" ry="2" fill="white" opacity="0.3"/>
          </>
        )}
        {mood === "happy" && (
          <>
            <rect x="38" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <rect x="64" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <line x1="56" y1="31" x2="64" y2="31" stroke={c.body} strokeWidth="1.5"/>
            {/* Stars in glasses */}
            <text x="44" y="34" fontSize="7" fill={c.body} textAnchor="middle">★</text>
            <text x="73" y="34" fontSize="7" fill={c.body} textAnchor="middle">★</text>
          </>
        )}
        {mood === "warning" && (
          <>
            <rect x="38" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <rect x="64" y="26" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <line x1="56" y1="31" x2="64" y2="31" stroke={c.body} strokeWidth="1.5"/>
            {/* Sideways glare */}
            <line x1="39" y1="24" x2="55" y2="26" stroke={c.body} strokeWidth="2" strokeLinecap="round"/>
            <line x1="65" y1="26" x2="81" y2="24" stroke={c.body} strokeWidth="2" strokeLinecap="round"/>
          </>
        )}
        {mood === "angry" && (
          <>
            <rect x="38" y="27" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <rect x="64" y="27" width="18" height="11" rx="5" fill="#0a0a1a" stroke={c.body} strokeWidth="1.5"/>
            <line x1="56" y1="32" x2="64" y2="32" stroke={c.body} strokeWidth="1.5"/>
            {/* Angry eyebrows */}
            <line x1="38" y1="23" x2="56" y2="27" stroke={c.body} strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="64" y1="27" x2="82" y2="23" stroke={c.body} strokeWidth="2.5" strokeLinecap="round"/>
            {/* Red tint in glasses */}
            <rect x="39" y="28" width="16" height="9" rx="4" fill="#ff336622"/>
            <rect x="65" y="28" width="16" height="9" rx="4" fill="#ff336622"/>
          </>
        )}

        {/* Mouth */}
        {mood === "cool" && <path d="M50 46 Q60 50 70 46" stroke="#4a4a6a" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {mood === "happy" && <path d="M49 45 Q60 52 71 45" stroke={c.body} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
        {mood === "warning" && <path d="M50 47 Q60 45 70 47" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {mood === "angry" && <path d="M49 49 Q60 44 71 49" stroke={c.body} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}

        {/* Vapor particles */}
        <circle cx="30" cy="90" r="4" fill={c.body} opacity="0.2"/>
        <circle cx="90" cy="75" r="3" fill={c.body} opacity="0.15"/>
        <circle cx="25" cy="65" r="2" fill={c.body} opacity="0.1"/>
      </svg>
    </div>
  );
}

// ─── Genie Speech Bubble ──────────────────────────────────────────────────────

function GenieBubble({ mood, count }: { mood: GenieMood; count: number }) {
  const messages: Record<GenieMood, { title: string; body: string }> = {
    cool: {
      title: "El Genio está zen 😎",
      body: count === 0
        ? "Añade de 3 a 5 regalos. Yo me encargo de que sean perfectos."
        : `Perfecto. ${count} ${count === 1 ? "regalo" : "regalos"} bien elegido${count === 1 ? "" : "s"}. Los niños os lo agradecerán.`,
    },
    happy: {
      title: "¡Combinación ideal! ✨",
      body: "Esto es exactamente lo que necesitaban. Sencillo, claro, sin dramas. Así me gustan las listas.",
    },
    warning: {
      title: "Ojo... 👀",
      body: `${count} regalos. Vas a dejar a ese niño sepultado en papel de regalo. Te lo digo yo que llevo siglos viendo esto.`,
    },
    angry: {
      title: "¡¿Pero qué haces?! 😤",
      body: `¡${count} regalos! ¿En serio? Soy el Genio del S.XXI, no tu cómplice. Este niño va a flipar sin saber qué abrir. ¡Quita alguno YA!`,
    },
  };

  const colors: Record<GenieMood, { bg: string; border: string; title: string }> = {
    cool:    { bg: "rgba(131,56,236,0.08)", border: "rgba(131,56,236,0.25)", title: "#c084fc" },
    happy:   { bg: "rgba(6,255,165,0.08)",  border: "rgba(6,255,165,0.25)",  title: "#06ffa5" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)",  title: "#f59e0b" },
    angry:   { bg: "rgba(255,51,102,0.1)",  border: "rgba(255,51,102,0.35)", title: "#ff3366" },
  };

  const c = colors[mood];
  const m = messages[mood];

  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: "16px",
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      flex: 1,
      transition: "all 0.4s ease",
    }}>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: c.title, marginBottom: "6px" }}>
        {m.title}
      </div>
      <div style={{ fontSize: "0.82rem", color: "var(--neutral-400)", lineHeight: 1.5 }}>
        {m.body}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WishListEditor({ event, wishList }: Props) {
  const [items, setItems] = useState<WishItem[]>(wishList.items);
  const [showForm, setShowForm] = useState(items.length === 0);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    url: "", title: "", description: "", price: "",
    category: "juguete", priority: "media",
    isCollective: false, targetAmount: "",
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/e/${event.slug}`;

  // ─── Genie mood logic ─────────────────────────────────────────────────────
  const count = items.length;
  const genieMood: GenieMood =
    count === 0 ? "cool" :
    count <= 3  ? "cool" :
    count <= 5  ? "happy" :
    count <= 7  ? "warning" :
    "angry";

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function handleImportUrl() {
    if (!form.url) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/wish-items/fetch-url?url=${encodeURIComponent(form.url)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(f => ({
        ...f,
        title: data.title ?? f.title,
        price: data.price ? String(data.price) : f.price,
        description: data.description ?? f.description,
      }));
      toast.success("Producto importado");
    } catch {
      toast.error("No se pudo importar el producto. Rellena los datos manualmente.");
    } finally {
      setImporting(false);
    }
  }

  async function handleAddItem() {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    try {
      const body = {
        wishListId: wishList.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        price: form.price ? Math.round(parseFloat(form.price) * 100) : undefined,
        category: form.category,
        priority: form.priority,
        isCollective: form.isCollective,
        targetAmount: form.isCollective && form.targetAmount
          ? Math.round(parseFloat(form.targetAmount) * 100) : undefined,
        position: items.length,
      };
      const res = await fetch("/api/wish-items", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const { item } = await res.json();
      setItems(prev => [...prev, item]);
      setForm({ url: "", title: "", description: "", price: "", category: "juguete", priority: "media", isCollective: false, targetAmount: "" });
      setShowForm(false);
      toast.success("¡Regalo añadido!");
    } catch {
      toast.error("Error al añadir el regalo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/wish-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Regalo eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface-bg)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "var(--radius-md)", padding: "10px 14px",
    color: "white", fontSize: "0.9rem", outline: "none",
    fontFamily: "var(--font-body)", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "6px", fontSize: "0.8rem",
    fontWeight: 600, color: "var(--neutral-400)",
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "28px" }}>
        <Link href={`/dashboard/eventos/${event.id}`} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--neutral-500)", textDecoration: "none",
          fontSize: "0.82rem", marginBottom: "16px",
        }}>
          <ArrowLeft size={14} /> {event.celebrantName}
        </Link>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "6px" }}>Lista de regalos</h1>
        <p style={{ color: "var(--neutral-400)", marginBottom: "20px" }}>
          {items.length} {items.length === 1 ? "regalo" : "regalos"}
        </p>

        {/* Share bar */}
        <div style={{
          display: "flex", gap: "10px", padding: "12px 16px",
          background: "var(--surface-card)", borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.06)", alignItems: "center",
        }}>
          <div style={{ flex: 1, fontSize: "0.8rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {publicUrl}
          </div>
          <button onClick={handleCopy} className="btn btn--ghost" style={{ flexShrink: 0, fontSize: "0.8rem", padding: "7px 12px", gap: "5px" }}>
            {copied ? <Check size={13} style={{ color: "var(--color-success)" }} /> : <Link2 size={13} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn--ghost" style={{ flexShrink: 0, fontSize: "0.8rem", padding: "7px 12px", gap: "5px", textDecoration: "none" }}>
            <ExternalLink size={13} /> Ver
          </a>
        </div>
      </div>

      {/* ── GENIO DEL S.XXI ── */}
      <div style={{
        display: "flex", gap: "16px", alignItems: "center",
        padding: "20px",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: "28px",
        transition: "all 0.4s ease",
      }}>
        <GenieSVG mood={genieMood} size={100} />
        <GenieBubble mood={genieMood} count={count} />
      </div>

      {/* ── GIFT PROGRESS ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "0.78rem", color: "var(--neutral-500)", marginBottom: "6px",
        }}>
          <span>Regalos añadidos</span>
          <span style={{
            color: count > 5 ? "#ff3366" : count >= 3 ? "#06ffa5" : "var(--neutral-500)",
            fontWeight: 700,
          }}>
            {count} / 5 {count > 5 ? "⚠️ Demasiados" : count >= 3 ? "✓ Ideal" : "recomendado"}
          </span>
        </div>
        <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            background: count > 5 ? "linear-gradient(90deg,#ff3366,#ff6b6b)" :
                        count >= 3 ? "linear-gradient(90deg,#06ffa5,#00d4a0)" :
                        "var(--gradient-brand)",
            width: `${Math.min(100, (count / 5) * 100)}%`,
            transition: "width 0.5s ease, background 0.4s ease",
          }} />
        </div>
      </div>

      {/* ── ITEMS LIST ── */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {items.map((item) => {
            const pct = item.isCollective && item.targetAmount
              ? fundingPercent(item.collectedAmount ?? 0, item.targetAmount) : null;
            return (
              <div key={item.id} className="pm-card" style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                {/* Status dot */}
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: STATUS_DOT[item.status] ?? "#94a3b8",
                  flexShrink: 0, marginTop: "5px",
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.title}</span>
                    {item.priority === "alta" && (
                      <span style={{ fontSize: "0.68rem", color: "#f59e0b", fontWeight: 700, background: "rgba(245,158,11,0.12)", padding: "2px 7px", borderRadius: "999px" }}>
                        ★ Alta prioridad
                      </span>
                    )}
                    {item.isCollective && (
                      <span style={{ fontSize: "0.68rem", color: "#8338ec", fontWeight: 600, background: "rgba(131,56,236,0.12)", padding: "2px 7px", borderRadius: "999px" }}>
                        Colectivo
                      </span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "var(--neutral-600)", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: "999px" }}>
                      {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                    </span>
                  </div>

                  {item.price && (
                    <div style={{ fontSize: "0.88rem", color: "var(--neutral-400)", marginTop: "2px" }}>
                      {formatEuros(item.price)}
                    </div>
                  )}

                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.76rem", color: "var(--brand-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <ExternalLink size={11} /> Ver producto
                    </a>
                  )}

                  {item.isCollective && item.targetAmount && pct !== null && (
                    <div style={{ marginTop: "8px" }}>
                      <div className="funding-bar">
                        <div className="funding-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: "0.73rem", color: "var(--neutral-500)", marginTop: "3px" }}>
                        {formatEuros(item.collectedAmount ?? 0)} de {formatEuros(item.targetAmount)} · {pct}%
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  title="Eliminar regalo"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--neutral-600)", padding: "4px", flexShrink: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--neutral-600)")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {items.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: "48px 40px",
          background: "var(--surface-card)",
          border: "2px dashed rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-xl)", marginBottom: "20px",
        }}>
          <Gift size={36} style={{ margin: "0 auto 14px", color: "var(--neutral-600)" }} />
          <h3 style={{ marginBottom: "8px", color: "var(--neutral-300)" }}>El Genio espera tus regalos</h3>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", marginBottom: "20px" }}>
            Añade de 3 a 5 regalos. El Genio lleva siglos viendo niños hiperregalados y no lo tolera.
          </p>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={17} /> Añadir primer regalo
          </button>
        </div>
      )}

      {/* ── ADD BUTTON ── */}
      {items.length > 0 && !showForm && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
          <button className="btn btn--ghost" onClick={() => setShowForm(true)}>
            <Plus size={17} /> Añadir regalo
          </button>
          {items.length > 5 && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#ff3366" }}>
              <AlertTriangle size={14} /> El Genio sugiere quitar alguno
            </span>
          )}
        </div>
      )}

      {/* ── ADD FORM ── */}
      {showForm && (
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-xl)", padding: "26px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
              background: "rgba(255,51,102,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={16} style={{ color: "var(--brand-primary)" }} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Nuevo regalo</h3>
          </div>

          {/* URL import */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>URL del producto (opcional)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://www.amazon.es/..."
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleImportUrl(); } }}
              />
              <button
                type="button" onClick={handleImportUrl}
                disabled={importing || !form.url}
                className="btn btn--ghost"
                style={{ flexShrink: 0, fontSize: "0.8rem" }}
              >
                {importing ? "..." : "Importar"}
              </button>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--neutral-600)", marginTop: "4px" }}>
              Pega el enlace de Amazon, El Corte Inglés, Zara... y rellenaremos los datos automáticamente.
            </p>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nombre del regalo *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ej. LEGO City 60375"
              style={inputStyle}
            />
          </div>

          {/* Price + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Precio (€)</label>
              <input
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                type="number" min={0} step={0.01} placeholder="29.99"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Prioridad</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value} type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  style={{
                    padding: "7px 14px", borderRadius: "var(--radius-md)",
                    border: form.priority === p.value ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.1)",
                    background: form.priority === p.value ? "rgba(255,51,102,0.12)" : "var(--surface-bg)",
                    color: form.priority === p.value ? "white" : "var(--neutral-400)",
                    cursor: "pointer", fontSize: "0.82rem",
                    fontWeight: form.priority === p.value ? 600 : 400,
                    transition: "all 0.2s", fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collective toggle */}
          <div style={{ marginBottom: form.isCollective ? "14px" : "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isCollective: !f.isCollective }))}
                style={{
                  width: "44px", height: "24px", borderRadius: "999px",
                  background: form.isCollective ? "var(--brand-primary)" : "rgba(255,255,255,0.1)",
                  border: "none", cursor: "pointer", position: "relative",
                  transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: "3px",
                  left: form.isCollective ? "23px" : "3px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "white", transition: "left 0.2s",
                }} />
              </button>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Regalo colectivo</div>
                <div style={{ fontSize: "0.76rem", color: "var(--neutral-500)" }}>Varios invitados pueden contribuir juntos</div>
              </div>
            </div>
          </div>

          {form.isCollective && (
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Importe objetivo (€)</label>
              <input
                value={form.targetAmount}
                onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                type="number" min={0} step={0.01} placeholder="150.00"
                style={{ ...inputStyle, width: "180px" }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={handleAddItem} disabled={saving} className="btn btn--primary">
              {saving ? "Guardando..." : "Añadir regalo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ url: "", title: "", description: "", price: "", category: "juguete", priority: "media", isCollective: false, targetAmount: "" });
              }}
              className="btn btn--ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
